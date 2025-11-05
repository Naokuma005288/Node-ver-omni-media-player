// Spectrum module: Bars/Line/Scope/Sunburst + Bars Pro
// New: Mid/Side stereo width, Mono toggle, Freeze, adjustable smoothing
// Fix: DPI sizing, overlay anchoring, waterfall row painting, grid/labels
// ++ New (2025-11-04):
//    - L/R RMS & Peak HUD with peak-hold, correlation, clip indicator
//    - Limiter gain reduction readout (if supported)
//    - API: setHudLR(on), setHudPos(pos), getLRStats()

const Spectrum = (() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ema = (prev, next, k) => prev + (next - prev) * k;

  function makeLogMap(binCount, bars, minHz = 32, maxHz = 20000, sampleRate = 48000, fftSize = 2048) {
    const hzPerBin = sampleRate / fftSize;
    const map = [];
    const minLog = Math.log10(minHz);
    const maxLog = Math.log10(maxHz);
    for (let i = 0; i < bars; i++) {
      const t0 = i / bars, t1 = (i + 1) / bars;
      const f0 = Math.pow(10, minLog + (maxLog - minLog) * t0);
      const f1 = Math.pow(10, minLog + (maxLog - minLog) * t1);
      const b0 = Math.max(0, Math.floor(f0 / hzPerBin));
      const b1 = Math.min(binCount - 1, Math.ceil(f1 / hzPerBin));
      map.push([b0, b1, f0, f1]);
    }
    return map;
  }

  function attach(video, overlayCanvas, panelCanvas, config = {}) {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = window.__omni_ac || new AC({ latencyHint: 'interactive' });
    window.__omni_ac = ac;

    // ==== WebAudio chain ====
    const src = ac.createMediaElementSource(video);

    // Preamp
    const preamp = ac.createGain(); preamp.gain.value = 1;

    // 10-band EQ (peaking)
    const eqBands = [31,62,125,250,500,1000,2000,4000,8000,16000].map(f=>{
      const b = ac.createBiquadFilter(); b.type='peaking'; b.frequency.value=f; b.Q.value=0.9; b.gain.value=0; return b;
    });

    // Mid/Side stage (width/mono)
    const splitter = ac.createChannelSplitter(2);
    const gMidL = ac.createGain(); gMidL.gain.value = 0.5;
    const gMidR = ac.createGain(); gMidR.gain.value = 0.5;
    const midGain = ac.createGain(); midGain.gain.value = 1.0;

    const gSideL = ac.createGain(); gSideL.gain.value = 0.5;
    const gSideR = ac.createGain(); gSideR.gain.value = -0.5; // invert R for L-R
    const sidePre = ac.createGain(); sidePre.gain.value = 1.0; // sum before width
    const sideWidth = ac.createGain(); sideWidth.gain.value = clamp(Number(config.width ?? 1.0), 0, 2); // width

    const leftSum = ac.createGain();  leftSum.gain.value = 1.0;
    const rightSum = ac.createGain(); rightSum.gain.value = 1.0;
    const sideToLeft = ac.createGain();  sideToLeft.gain.value = 1.0;
    const sideToRightNeg = ac.createGain(); sideToRightNeg.gain.value = -1.0;

    const merger = ac.createChannelMerger(2);

    // Limiter & Out
    const limiter = ac.createDynamicsCompressor();
    limiter.attack.value=0.003; limiter.release.value=0.25; limiter.knee.value=9; limiter.ratio.value=12; limiter.threshold.value=-8;

    const outGain = ac.createGain(); // final output = userGain * agcGain
    outGain.gain.value = 1;

    // --- Wire EQ chain ---
    src.connect(preamp);
    let node = preamp;
    eqBands.forEach(b=>{ node.connect(b); node=b; });

    // --- Into M/S ---
    node.connect(splitter);
    splitter.connect(gMidL, 0);
    splitter.connect(gMidR, 1);
    gMidL.connect(midGain);
    gMidR.connect(midGain);

    splitter.connect(gSideL, 0);
    splitter.connect(gSideR, 1);
    gSideL.connect(sidePre);
    gSideR.connect(sidePre);
    sidePre.connect(sideWidth); // width control

    // Reconstruct L/R: L = Mid + Side, R = Mid - Side
    midGain.connect(leftSum);
    midGain.connect(rightSum);
    sideWidth.connect(sideToLeft);
    sideWidth.connect(sideToRightNeg);
    sideToLeft.connect(leftSum);
    sideToRightNeg.connect(rightSum);

    // Merge stereo
    leftSum.connect(merger, 0, 0);
    rightSum.connect(merger, 0, 1);

    // --- Analyser taps (post M/S, pre-limiter) ---
    const analyser = ac.createAnalyser();
    const analyserWave = ac.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = Number(config.smooth ?? 0.78);
    analyserWave.fftSize = 1024;
    analyserWave.smoothingTimeConstant = 0.2;

    // NEW: L/R time-domain analysers for HUD
    const analyserL = ac.createAnalyser();
    const analyserR = ac.createAnalyser();
    analyserL.fftSize = 1024;
    analyserR.fftSize = 1024;
    analyserL.smoothingTimeConstant = 0.06;
    analyserR.smoothingTimeConstant = 0.06;
    leftSum.connect(analyserL);
    rightSum.connect(analyserR);

    merger.connect(analyser);
    merger.connect(analyserWave);

    // --- Limiter path (can bypass) ---
    function wireLimiter(on){
      try { merger.disconnect(limiter); } catch {}
      try { limiter.disconnect(outGain); } catch {}
      try { merger.disconnect(outGain); } catch {}
      if (on) { merger.connect(limiter); limiter.connect(outGain); }
      else { merger.connect(outGain); }
    }
    wireLimiter(config.limiter !== false);

    // --- Destination ---
    outGain.connect(ac.destination);

    // ==== state ====
    let mode = config.mode || 'barsPro';
    let alpha = Number(config.alpha ?? 0.95);
    let heightPct = Number(config.heightPct ?? config.hPct ?? 22);
    let bars = clamp(Math.floor(config.bars ?? 72), 8, 256);
    let caps = config.caps ?? true;
    let gradient = config.grad || 'accent';
    let quant = Number(config.quant ?? 2);
    let hiVis = !!config.hiVis;
    let waterfall = !!config.waterfall;
    let smoothing = Number(config.smooth ?? 0.78);

    // New
    let anchor = config.anchor || 'bottom'; // bottom/center/top
    let bottomPadPx = Number(config.bottomPadPx ?? 0);
    let mirror = !!config.mirror;
    let showGrid = !!config.grid;
    let showLabels = !!config.labels;

    let theme = [102,170,255];

    // Stereo
    let width = clamp(Number(config.width ?? 1.0), 0, 2);
    let mono = false;

    // Auto Gain Control
    let autoGain = false;
    let userGain = 1.0;
    let agcGain  = 1.0;
    const AGC_MIN = 0.35, AGC_MAX = 1.8, AGC_TARGET = 0.055, AGC_K = 0.020;

    // Freeze
    let frozen = false;

    // Bars Pro state
    const binCount = analyser.frequencyBinCount;
    let logMap = makeLogMap(binCount, bars, 32, 20000, ac.sampleRate, analyser.fftSize);
    let peaks = new Float32Array(bars);
    let fall = new Float32Array(bars).fill(0.005);
    let lastBars = new Float32Array(bars);
    const freqData = new Uint8Array(binCount);
    const timeData = new Float32Array(analyserWave.fftSize);

    // NEW: L/R HUD stats
    const timeL = new Float32Array(analyserL.fftSize);
    const timeR = new Float32Array(analyserR.fftSize);
    let rmsL = 0, rmsR = 0;
    let instPeakL = 0, instPeakR = 0;
    let peakHoldL = 0, peakHoldR = 0;
    const peakFall = 0.007; // hold decay per frame (tweakable)
    let corr = 0; // -1..+1

    function rebuildBars(n) {
      bars = n;
      peaks = new Float32Array(bars);
      fall = new Float32Array(bars).fill(0.005);
      logMap = makeLogMap(binCount, bars, 32, 20000, ac.sampleRate, analyser.fftSize);
      lastBars = new Float32Array(bars);
    }

    // ==== Canvas ====
    const ov = overlayCanvas?.getContext('2d', { alpha: true });
    const pv = panelCanvas?.getContext('2d', { alpha: true });

    function fitOverlay() {
      if (!overlayCanvas) return;
      const r = overlayCanvas.parentElement.getBoundingClientRect();
      const dpi = devicePixelRatio || 1;
      overlayCanvas.width = Math.max(4, Math.floor(r.width * dpi));
      overlayCanvas.height = Math.max(4, Math.floor(r.height * dpi));
    }
    function fitPanel() {
      if (!panelCanvas) return;
      const r = panelCanvas.getBoundingClientRect();
      const dpi = devicePixelRatio || 1;
      panelCanvas.width = Math.max(4, Math.floor(r.width * dpi));
      panelCanvas.height = Math.max(4, Math.floor(r.height * dpi));
    }
    fitOverlay(); fitPanel();
    addEventListener('resize', () => { fitOverlay(); fitPanel(); });

    function makeGrad(ctx, w, h) {
      const g = ctx.createLinearGradient(0, h, 0, 0);
      const c = `rgb(${theme[0]},${theme[1]},${theme[2]})`;
      if (gradient === 'accent' || gradient === 'auto') {
        g.addColorStop(0, c); g.addColorStop(1, 'white');
      } else if (gradient === 'flat') {
        g.addColorStop(0, c); g.addColorStop(1, c);
      } else if (gradient === 'rainbow') {
        // handled per-bar
        g.addColorStop(0, c); g.addColorStop(1, c);
      }
      return g;
    }

    function getBarValues() {
      if (!frozen) analyser.getByteFrequencyData(freqData);
      const vals = new Float32Array(bars);
      for (let i = 0; i < bars; i++) {
        const [b0, b1] = logMap[i];
        let s = 0, c = 0;
        for (let b = b0; b <= b1; b++) { s += freqData[b]; c++; }
        vals[i] = c ? s / (c * 255) : 0;
      }
      const pro = (mode === 'barsPro' || mode === 'hybrid');
      const kRise = pro ? 0.35 : 0.25;
      const kFall = pro ? 0.15 : 0.12;
      const out = new Float32Array(bars);
      for (let i = 0; i < bars; i++) {
        let v = vals[i];
        if (quant > 0) v = Math.round(v * (quant + 4)) / (quant + 4);
        const prev = lastBars[i] || 0;
        const nv = v >= prev ? ema(prev, v, kRise) : ema(prev, v, kFall);
        out[i] = nv;
        if (caps) {
          if (nv > peaks[i]) peaks[i] = nv;
          else peaks[i] = Math.max(0, peaks[i] - fall[i]);
          fall[i] = 0.004 + Math.max(0, peaks[i] - nv) * 0.02;
        }
      }
      lastBars = out;
      return out;
    }

    function drawGridAndLabels(ctx, W, H, y0) {
      if (!showGrid && !showLabels) return;
      ctx.save();
      ctx.translate(0, y0);
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        [0.25, 0.5, 0.75].forEach(p => {
          const y = Math.floor(H - p * (H - 6)) + 0.5;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        });
        const ticks = [50,100,200,500,1000,2000,5000,10000,20000];
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ticks.forEach(f=>{
          const ratio = (Math.log10(f) - Math.log10(32)) / (Math.log10(20000) - Math.log10(32));
          const x = Math.floor(ratio * W) + 0.5;
          ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x, H-2); ctx.stroke();
        });
      }
      if (showLabels) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '12px system-ui, Segoe UI, Meiryo, Arial';
        ctx.textAlign = 'right';
        ctx.fillText('0', W - 4, H - 4);
        ctx.fillText('50%', W - 4, Math.floor(H * 0.5) + 4);
        ctx.fillText('100%', W - 4, 12);
        const labels = ['50','100','200','500','1k','2k','5k','10k','20k'];
        ctx.textAlign = 'center';
        const freqs = [50,100,200,500,1000,2000,5000,10000,20000];
        freqs.forEach((f,i)=>{
          const ratio = (Math.log10(f) - Math.log10(32)) / (Math.log10(20000) - Math.log10(32));
          const x = Math.floor(ratio * W);
          ctx.fillText(labels[i], x, 12);
        });
      }
      ctx.restore();
    }

    function computeYOffset(totalH, H) {
      if (anchor === 'top') return 0;
      if (anchor === 'center') return Math.max(0, Math.floor((totalH - H) / 2));
      return Math.max(0, totalH - H - bottomPadPx); // bottom
    }

    // === Pulse / RMS (for AGC & CSS beat) ===
    let rms = 0, pulse = 0;

    function drawBars(ctx, W, H, y0) {
      const vals = getBarValues();
      const pad = hiVis ? 2 : 1;
      const gap = hiVis ? 1 : 0.5;
      const barW = Math.max(1, Math.floor((W - pad * 2 - (bars - 1) * gap) / bars));
      const baseY = y0 + H - 2;
      const grad = makeGrad(ctx, W, H);

      drawGridAndLabels(ctx, W, H, y0);

      for (let i = 0; i < bars; i++) {
        const x = pad + i * (barW + gap);
        const v = vals[i];
        const vh = Math.max(1, Math.floor(v * (H - 6)));
        if (gradient === 'rainbow') {
          ctx.fillStyle = `hsl(${(i / bars) * 360} 85% ${hiVis ? 60 : 55}%)`;
          ctx.globalAlpha = alpha;
        } else {
          ctx.fillStyle = grad;
          ctx.globalAlpha = alpha;
        }
        if (mirror) {
          const cy = y0 + Math.floor(H * 0.5);
          const hh = Math.floor(vh * 0.5);
          ctx.fillRect(x, cy - hh, barW, hh);
          ctx.fillRect(x, cy, barW, hh);
        } else {
          const y = baseY - vh;
          if (hiVis) {
            ctx.fillRect(x, y, barW, vh);
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, barW - 1, vh - 1);
            ctx.globalAlpha = 1;
          } else {
            ctx.fillRect(x, y, barW, vh);
          }
        }
        if (caps && !mirror) {
          const cy = baseY - Math.max(2, Math.floor(peaks[i] * (H - 6)));
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillRect(x, cy - 2, barW, 2);
          ctx.globalAlpha = 1;
        }
      }
    }

    function drawLine(ctx, W, H, y0) {
      if (!frozen) analyser.getByteFrequencyData(freqData);
      drawGridAndLabels(ctx, W, H, y0);
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgb(${theme[0]},${theme[1]},${theme[2]})`;
      ctx.beginPath();
      const N = freqData.length;
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * W;
        const y = y0 + H - (freqData[i] / 255) * (H - 6) - 2;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function drawScope(ctx, W, H, y0) {
      if (!frozen) analyserWave.getFloatTimeDomainData(timeData);
      ctx.lineWidth = hiVis ? 2.2 : 1.5;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgb(${theme[0]},${theme[1]},${theme[2]})`;
      ctx.beginPath();
      const N = timeData.length;
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * W;
        const y = y0 + H * 0.5 - timeData[i] * (H * 0.45);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function drawSunburst(ctx, W, H, y0) {
      if (!frozen) analyser.getByteFrequencyData(freqData);
      const cx = W / 2, cy = y0 + H / 2, R = Math.min(W, H) * 0.45;
      const N = bars;
      for (let i = 0; i < N; i++) {
        const [b0, b1] = logMap[i]; let s = 0, c = 0;
        for (let b = b0; b <= b1; b++) { s += freqData[b]; c++; }
        const v = (c ? s / (c * 255) : 0) ** 0.9;
        const a0 = (i / N) * Math.PI * 2;
        const a1 = ((i + 1) / N) * Math.PI * 2;
        const r = R * (0.15 + 0.85 * v);
        const fill = gradient === 'rainbow'
          ? `hsl(${(i / N) * 360} 85% ${hiVis ? 60 : 55}% / ${alpha})`
          : `rgba(${theme[0]},${theme[1]},${theme[2]},${alpha})`;
        const path = new Path2D();
        path.moveTo(cx, cy); path.arc(cx, cy, r, a0, a1); path.closePath();
        ctx.fillStyle = fill; ctx.fill(path);
      }
    }

    // Waterfall row painter
    function paintWaterfallRow(ctx, W, H) {
      const vals = getBarValues();
      const rowH = 2;
      const img = ctx.getImageData(0, 0, W, H - rowH);
      ctx.putImageData(img, 0, rowH);
      const pad = hiVis ? 2 : 1;
      const gap = hiVis ? 1 : 0.5;
      const barW = Math.max(1, Math.floor((W - pad * 2 - (bars - 1) * gap) / bars));
      for (let i = 0; i < bars; i++) {
        const x = pad + i * (barW + gap);
        const v = vals[i];
        let fill;
        if (gradient === 'rainbow') {
          fill = `hsl(${(i / bars) * 360} 85% ${hiVis ? 60 : 55}% / ${Math.max(0.2, alpha)})`;
        } else {
          fill = `rgba(${theme[0]},${theme[1]},${theme[2]},${Math.max(0.2, alpha)})`;
        }
        ctx.fillStyle = fill;
        const w = Math.max(1, barW);
        const a = Math.max(0.2, Math.min(1, v * 1.2));
        ctx.globalAlpha = a;
        ctx.fillRect(x, 0, w, rowH);
        ctx.globalAlpha = 1;
      }
    }

    function applyOutputGain() {
      outGain.gain.value = clamp(userGain * agcGain, 0, 3);
    }

    // === HUD (L/R RMS + Peak + Corr + GR) ===
    let hudLR = !!config.hudLR;
    let hudPos = config.hudPos || 'top-right'; // 'top-right'|'top-left'|'bottom-right'|'bottom-left'

    function roundRect(ctx, x, y, w, h, r=10){
      ctx.beginPath();
      ctx.moveTo(x+r, y);
      ctx.arcTo(x+w, y,   x+w, y+h, r);
      ctx.arcTo(x+w, y+h, x,   y+h, r);
      ctx.arcTo(x,   y+h, x,   y,   r);
      ctx.arcTo(x,   y,   x+w, y,   r);
      ctx.closePath();
    }

    function drawLRHud(ctx, W, Htot){
      const scale = 1; // そのまま
      const boxW = Math.floor(180*scale), boxH = Math.floor(110*scale);
      let x = 12, y = 12;
      if (hudPos === 'top-right') { x = W - boxW - 12; y = 12; }
      else if (hudPos === 'bottom-right') { x = W - boxW - 12; y = Htot - boxH - 12; }
      else if (hudPos === 'bottom-left') { x = 12; y = Htot - boxH - 12; }

      ctx.save();

      // background
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = 'rgba(8,12,20,0.75)';
      roundRect(ctx, x, y, boxW, boxH, 12);
      ctx.fill();
      ctx.globalAlpha = 1;

      // titles
      ctx.font = '12px system-ui, Segoe UI, Meiryo, Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('L/R Level', x+12, y+16);

      // meters
      const meterPad = 10;
      const meterW = Math.floor((boxW - meterPad*3)/2);
      const meterH = boxH - 40;
      const mBaseY = y + 24 + meterH;

      // helper to draw one vertical meter
      function drawMeter(vRms, vPeak, label, mx){
        // track
        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        ctx.fillRect(mx, y+24, meterW, meterH);

        // rms bar
        const h = clamp(vRms,0,1) * meterH;
        const c = `rgba(${theme[0]},${theme[1]},${theme[2]},0.95)`;
        ctx.fillStyle = c;
        ctx.fillRect(mx, mBaseY - h, meterW, h);

        // peak-hold line
        const ph = clamp(vPeak,0,1) * meterH;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(mx, mBaseY - ph - 2, meterW, 2);

        // label + dB
        const db = (vRms>0.0000001) ? (20*Math.log10(vRms)).toFixed(1) : '-inf';
        ctx.fillStyle = 'rgba(255,255,255,0.80)';
        ctx.textAlign = 'center';
        ctx.fillText(`${label}  ${db} dBFS`, mx + meterW/2, y + boxH - 8);
      }

      // normalize: time-domain rmsは0..1（1=0dBFSのクリップ近傍）。少し持ち上げて視覚化
      const nRmsL = clamp(rmsL*1.6, 0, 1);
      const nRmsR = clamp(rmsR*1.6, 0, 1);
      drawMeter(nRmsL, peakHoldL, 'L', x + meterPad);
      drawMeter(nRmsR, peakHoldR, 'R', x + meterPad*2 + meterW);

      // correlation bar
      const corrY = y + 20;
      const corrX = x + 12;
      const corrW = boxW - 24;
      const corrH = 8;
      // track
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(corrX, y + 6, corrW, corrH);
      // zero line
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(corrX + Math.floor(corrW/2)-1, y + 6, 2, corrH);
      // value
      const half = Math.floor(corrW/2);
      const len = Math.floor(half * clamp(corr, -1, 1));
      ctx.fillStyle = corr >= 0 ? 'rgba(120,255,160,0.9)' : 'rgba(255,120,120,0.9)';
      if (len >= 0) ctx.fillRect(corrX + half, y + 6, len, corrH);
      else ctx.fillRect(corrX + half + len, y + 6, Math.abs(len), corrH);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'right';
      ctx.fillText(`Corr ${corr.toFixed(2)}`, x + boxW - 10, y + 5);

      // clip dots (瞬間ピークの閾値超え)
      if (instPeakL >= 0.995) {
        ctx.beginPath(); ctx.arc(x + 10, y + 10, 5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,80,80,0.95)'; ctx.fill();
      }
      if (instPeakR >= 0.995) {
        ctx.beginPath(); ctx.arc(x + 26, y + 10, 5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,80,80,0.95)'; ctx.fill();
      }

      // gain reduction (limiter)
      const gr = (typeof limiter.reduction === 'number') ? Math.max(0, -limiter.reduction) : 0;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(`GR: ${gr.toFixed(1)} dB`, x + 42, y + 12);

      ctx.restore();
    }

    function render() {
      // update RMS / pulse for AGC (mix)
      if (!frozen) analyserWave.getFloatTimeDomainData(timeData);
      let s = 0; for (let i = 0; i < timeData.length; i++) s += timeData[i] * timeData[i];
      const r = Math.sqrt(s / timeData.length);
      rms = ema(rms, r, 0.1);
      const pp = clamp((rms - 0.03) * 8, 0, 1);
      pulse = ema(pulse, pp, 0.15);

      // AGC
      if (autoGain) {
        const err = AGC_TARGET - rms;
        agcGain = agcGain + err * AGC_K;
        agcGain = clamp(agcGain, AGC_MIN, AGC_MAX);
        applyOutputGain();
      }

      // update L/R HUD stats
      if (!frozen) {
        analyserL.getFloatTimeDomainData(timeL);
        analyserR.getFloatTimeDomainData(timeR);
        let sL=0, sR=0, dot=0;
        let pkL=0, pkR=0;
        for (let i=0;i<timeL.length;i++){
          const l=timeL[i], r=timeR[i];
          sL += l*l; sR += r*r;
          dot += l*r;
          const al = Math.abs(l), ar = Math.abs(r);
          if (al>pkL) pkL=al;
          if (ar>pkR) pkR=ar;
        }
        const n = timeL.length || 1;
        const rL = Math.sqrt(sL/n);
        const rR = Math.sqrt(sR/n);
        rmsL = ema(rmsL, rL, 0.15);
        rmsR = ema(rmsR, rR, 0.15);
        instPeakL = pkL; instPeakR = pkR;

        // peak-hold decay
        peakHoldL = Math.max(instPeakL, Math.max(0, peakHoldL - peakFall));
        peakHoldR = Math.max(instPeakR, Math.max(0, peakHoldR - peakFall));

        // correlation
        const denom = Math.sqrt(sL*sR) || 1e-9;
        corr = clamp(dot/denom, -1, 1);
      }

      // overlay
      if (ov && overlayCanvas) {
        const totalH = overlayCanvas.height, W = overlayCanvas.width;
        const H = Math.floor(totalH * (heightPct / 100));
        const y0 = (anchor==='top')?0:(anchor==='center'?Math.max(0, Math.floor((totalH - H) / 2)):Math.max(0, totalH - H - bottomPadPx));
        ov.clearRect(0, 0, W, totalH);
        if (mode === 'bars' || mode === 'barsPro') drawBars(ov, W, H, y0);
        else if (mode === 'line') drawLine(ov, W, H, y0);
        else if (mode === 'hybrid') { drawBars(ov, W, H, y0); ov.globalAlpha = 0.6; drawLine(ov, W, H, y0); ov.globalAlpha = 1; }
        else if (mode === 'scope') drawScope(ov, W, H, y0);
        else if (mode === 'sunburst') {
          const h2 = Math.min(H * 1.5, totalH);
          drawSunburst(ov, W, h2, Math.max(0, Math.floor((totalH - h2)/2)));
        }

        if (hudLR) drawLRHud(ov, W, totalH);
      }

      // panel
      if (pv && panelCanvas) {
        const W = panelCanvas.width, H = panelCanvas.height;
        if (waterfall) paintWaterfallRow(pv, W, H);
        else { pv.clearRect(0, 0, W, H); drawBars(pv, W, H, 0); }
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // === API ===
    function setOpacity(a){ alpha = clamp(Number(a), 0, 1); overlayCanvas && (overlayCanvas.style.opacity = String(alpha;)) }
    function setHeightPct(p){ heightPct = clamp(Number(p), 5, 90); }
    function setBars(n){ n = clamp(Math.floor(n), 8, 256); rebuildBars(n); }
    function setCaps(c){ caps = !!c; }
    function setGradient(g){ gradient = g; }
    function setQuantize(q){ quant = clamp(Number(q), 0, 40); }
    function setWaterfall(w){ waterfall = !!w; }
    function setHiVis(v){ hiVis = !!v; }
    function setMode(m){ mode = m; }
    function setThemeColor(rgb){ theme = rgb.map(v=>Math.round(v)); }
    function setSmoothing(v){ smoothing = clamp(Number(v), 0, 0.95); analyser.smoothingTimeConstant = smoothing; }

    function setOutputGain(g){ userGain = clamp(Number(g), 0, 2); applyOutputGain(); }
    function setEQEnabled(on){
      const target = on ? null : 0;
      if (target===0) { eqBands.forEach(b=> b.gain.value = 0); }
    }
    function setLimiter(on){ wireLimiter(!!on); }
    function setAutoGain(on){ autoGain = !!on; if (!autoGain) { agcGain = 1.0; applyOutputGain(); } }
    function setPreamp(db){ preamp.gain.value = Math.pow(10, db / 20); }
    function setBandGain(i, db){ if (eqBands[i]) eqBands[i].gain.value = db; }

    function setAnchor(a){ anchor = (a==='top'||a==='center')?a:'bottom'; }
    function setBottomPad(px){ bottomPadPx = Math.max(0, Math.floor(px)); }
    function setMirror(on){ mirror = !!on; }
    function setGrid(on){ showGrid = !!on; }
    function setLabels(on){ showLabels = !!on; }

    function setStereoWidth(w){ width = clamp(Number(w), 0, 2); sideWidth.gain.value = width; }
    function setMono(on){
      mono = !!on;
      sideToLeft.gain.value   = mono ? 0 : 1;
      sideToRightNeg.gain.value = mono ? 0 : -1;
    }
    function setFreeze(on){ frozen = !!on; }

    // NEW: HUD API + stats
    function setHudLR(on){ hudLR = !!on; }
    function setHudPos(pos){ hudPos = (['top-right','top-left','bottom-right','bottom-left'].includes(pos)) ? pos : 'top-right'; }
    function getLRStats(){ return { rmsL, rmsR, peakL: peakHoldL, instPeakL, peakR: peakHoldR, instPeakR, corr,
      gr: (typeof limiter.reduction === 'number') ? Math.max(0, -limiter.reduction) : 0 }; }

    function getPulse(){ return pulse; }
    function getLevel(){
      if (!frozen) analyser.getByteFrequencyData(freqData);
      let s=0; for (let i=0;i<freqData.length;i++) s+=freqData[i];
      return s/(freqData.length*255);
    }

    return {
      setMode, setOpacity, setHeightPct, setBars, setCaps, setGradient, setQuantize,
      setWaterfall, setHiVis, setThemeColor, setOutputGain, setEQEnabled, setLimiter,
      setAutoGain, setPreamp, setBandGain, getPulse, getLevel,
      setAnchor, setBottomPad, setMirror, setGrid, setLabels,
      setStereoWidth, setMono, setFreeze, setSmoothing,
      // NEW
      setHudLR, setHudPos, getLRStats
    };
  }

  return { attach };
})();
