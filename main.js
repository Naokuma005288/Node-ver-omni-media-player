const { app, BrowserWindow, dialog, ipcMain, globalShortcut, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const Store = require('electron-store');
const mm = require('music-metadata');

const ffmpegPath  = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

const store = new Store({ name: 'settings' });

let mainWin, tray;
const tmpSubsDir = path.join(os.tmpdir(), 'omni-embedded-subs');
try { fs.mkdirSync(tmpSubsDir, { recursive: true }); } catch {}

function createWindow() {
  const win = new BrowserWindow({
    width: store.get('win.width', 1200),
    height: store.get('win.height', 760),
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.on('resize', () => {
    const [w, h] = win.getSize();
    store.set('win', { width: w, height: h });
  });
  return win;
}

function createTray() {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAEklEQVQoka3NsQkAMAwEwR8mI2Yy4i8eQF0i3a1m1w+oQz1m4w0QmQq8Qk7gAAAABJRU5ErkJggg==';
  const icon = nativeImage.createFromBuffer(Buffer.from(pngBase64, 'base64'));
  tray = new Tray(icon);
  tray.setToolTip('Omni Player');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '表示/非表示', click: () => mainWin.isVisible()? mainWin.hide(): mainWin.show() },
    { type: 'separator' },
    { label: '再生/一時停止', click: () => mainWin.webContents.send('media:toggle') },
    { label: '次へ', click: () => mainWin.webContents.send('media:next') },
    { label: '前へ', click: () => mainWin.webContents.send('media:prev') },
    { type: 'separator' },
    { role: 'quit', label: '終了' }
  ]));
}

app.whenReady().then(() => {
  mainWin = createWindow();
  createTray();
  globalShortcut.register('MediaPlayPause', () => mainWin.webContents.send('media:toggle'));
  globalShortcut.register('MediaNextTrack', () => mainWin.webContents.send('media:next'));
  globalShortcut.register('MediaPreviousTrack', () => mainWin.webContents.send('media:prev'));
  app.on('activate', () => BrowserWindow.getAllWindows().length || createWindow());
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());

/* -------------------- ファイル/メタ/保存 -------------------- */
ipcMain.handle('picker:open', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Media', extensions: ['mp3','wav','flac','ogg','mp4','mkv','mov','webm','m3u8'] }]
  });
  return canceled ? [] : filePaths;
});
ipcMain.handle('picker:sub', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Subtitles', extensions: ['srt','vtt','ass','ssa'] }]
  });
  return canceled || !filePaths.length ? null : filePaths[0];
});
ipcMain.handle('picker:folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return canceled || !filePaths.length ? null : filePaths[0];
});
ipcMain.handle('os:reveal', (_e, p) => shell.showItemInFolder(p));
ipcMain.handle('settings:get', (_e, k, d) => store.get(k, d));
ipcMain.handle('settings:set', (_e, k, v) => { store.set(k, v); return true; });

ipcMain.handle('meta:read', async (_e, paths) => {
  const jobs = paths.map(async p => {
    try {
      const meta = await mm.parseFile(p, { duration: true });
      const pic = meta.common.picture?.[0];
      const cover = pic ? `data:${pic.format};base64,${pic.data.toString('base64')}` : null;
      return { path: p, title: meta.common.title || path.parse(p).name, artist: meta.common.artist || '', album: meta.common.album || '', duration: meta.format.duration || 0, cover };
    } catch {
      return { path: p, title: path.parse(p).name, artist: '', album: '', duration: 0, cover: null };
    }
  });
  return Promise.all(jobs);
});

ipcMain.handle('image:save', async (_e, { base64, fileName }) => {
  const dir = path.join(app.getPath('pictures'), 'OmniShots');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, fileName || `omni_${Date.now()}.png`);
  const data = base64.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(file, data, 'base64');
  return file;
});

/* ------------------ 埋め込み字幕（ffprobe/ffmpeg） ------------------ */
function probeStreams(file) {
  return new Promise((resolve) => {
    execFile(ffprobePath, ['-v','error','-print_format','json','-show_streams', file], (err, stdout) => {
      if (err) return resolve({ streams: [] });
      try { resolve(JSON.parse(stdout)); } catch { resolve({ streams: [] }); }
    });
  });
}
ipcMain.handle('subs:listEmbedded', async (_e, file) => {
  const info = await probeStreams(file);
  return (info.streams || [])
    .filter(s => s.codec_type === 'subtitle')
    .map(s => ({
      index: s.index,
      codec: s.codec_name || '',
      lang:  s.tags?.language || 'und',
      title: s.tags?.title || ''
    }));
});
ipcMain.handle('subs:extract', async (_e, file, streamIndex) => {
  const out = path.join(tmpSubsDir, path.basename(file) + `.sub${streamIndex}.vtt`);
  return await new Promise((resolve) => {
    const args = ['-y', '-i', file, '-map', `0:${streamIndex}`, '-c:s', 'webvtt', out];
    execFile(ffmpegPath, args, (err) => resolve(err ? null : out));
  });
});

/* ------------------ 先読み用: ローカルファイル読み出し ------------------ */
ipcMain.handle('audio:readFile', async (_e, filePath) => {
  try {
    const stat = fs.statSync(filePath);
    // 60MBまで（巨大ファイルは無視して安全側）
    if (stat.size > 60 * 1024 * 1024) return null;
    return fs.readFileSync(filePath).buffer; // ArrayBuffer
  } catch {
    return null;
  }
});

/* ------------------ ディレクトリ監視（自動取り込み） ------------------ */
const watchers = new Map(); // dir -> FSWatcher
function isMediaFile(p){
  return /\.(mp3|wav|flac|ogg|mp4|mkv|mov|webm|m3u8)$/i.test(p);
}
async function emitMetaIfFile(full){
  try{
    const st = fs.statSync(full);
    if (!st.isFile()) return;
    if (!isMediaFile(full)) return;
    const meta = await mm.parseFile(full, { duration:true }).catch(()=>null);
    const pic = meta?.common?.picture?.[0];
    const cover = pic ? `data:${pic.format};base64,${pic.data.toString('base64')}` : null;
    const payload = {
      path: full,
      title: meta?.common?.title || path.parse(full).name,
      artist: meta?.common?.artist || '',
      album:  meta?.common?.album || '',
      duration: meta?.format?.duration || 0,
      cover
    };
    mainWin?.webContents.send('watch:file', { type:'add', item: payload });
  }catch{}
}
function watchDir(dir){
  if (watchers.has(dir)) return;
  const w = fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    const full = path.join(dir, filename.toString());
    if (eventType === 'rename') {
      // 追加/削除の可能性がある
      if (fs.existsSync(full)) emitMetaIfFile(full);
      else mainWin?.webContents.send('watch:file', { type:'remove', path: full });
    } else if (eventType === 'change') {
      // 変更（上書きなど）は追加扱いで更新
      if (fs.existsSync(full)) emitMetaIfFile(full);
    }
  });
  watchers.set(dir, w);
}
function unwatchDir(dir){
  const w = watchers.get(dir);
  if (w){ try{ w.close(); }catch{}; watchers.delete(dir); }
}

ipcMain.handle('watch:addDir', async (_e, dir) => {
  if (!dir) return false;
  const list = new Set(store.get('watch.dirs', []));
  list.add(dir);
  store.set('watch.dirs', Array.from(list));
  watchDir(dir);
  return true;
});
ipcMain.handle('watch:removeDir', async (_e, dir) => {
  const list = new Set(store.get('watch.dirs', []));
  list.delete(dir);
  store.set('watch.dirs', Array.from(list));
  unwatchDir(dir);
  return true;
});
ipcMain.handle('watch:list', async ()=> store.get('watch.dirs', []));

// 起動時に復元
app.whenReady().then(()=>{
  const dirs = store.get('watch.dirs', []);
  dirs.forEach(d => { try{ if (fs.existsSync(d)) watchDir(d); }catch{} });
});
