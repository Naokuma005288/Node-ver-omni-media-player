// ==== i18n ===========================================================
const I18N = {
  ja: {
    open: '開く', open_url:'URL', search_ph:'検索...',
    subs:'字幕', subs_toggle:'字幕 視/非', subs_next:'字幕 次', subs_add:'字幕+',
    visualizer:'Visualizer', eq_title:'イコライザー / 音質', marks_loop:'マーカー / ループ',
    smart:'スマート再生', others:'その他',
    start_btn:'開始 / Start',
    toast_saved:'設定を保存しました', toast_loaded:'設定を読み込みました（再起動推奨）',
    gate_msg:'再生・可視化を開始するには下のボタンを押してください。',
    gate_hint:'※Autoplay規制により、ボタン操作後にAudioContextを開始します。',
    confirm_glow:'Glow（発光）は描画負荷が高い場合があります。オンにしますか？'
  },
  en: {
    open:'Open', open_url:'Open URL', search_ph:'Search...',
    subs:'Subtitles', subs_toggle:'CC Show/Hide', subs_next:'CC Next', subs_add:'Add CC',
    visualizer:'Visualizer', eq_title:'Equalizer / Audio', marks_loop:'Markers / Loop',
    smart:'Smart Playback', others:'Others',
    start_btn:'Start',
    toast_saved:'Settings saved', toast_loaded:'Settings loaded (restart recommended)',
    gate_msg:'Press the button below to start playback & visualization.',
    gate_hint:'AudioContext will start after your gesture due to autoplay policy.',
    confirm_glow:'Glow effect may be heavy. Enable it?'
  }
};
let LANG = 'ja';
function t(key){
  if (I18N[LANG] && I18N[LANG][key]) return I18N[LANG][key];
  if (I18N['ja'][key]) return I18N['ja'][key];
  return key;
}
function applyI18n(){
  var i, list1=document.querySelectorAll('[data-i18n]');
  for(i=0;i<list1.length;i++){
    var el=list1[i], k=el.getAttribute('data-i18n'); el.textContent=t(k);
  }
  var list2=document.querySelectorAll('[data-i18n-ph]');
  for(i=0;i<list2.length;i++){
    var el2=list2[i], k2=el2.getAttribute('data-i18n-ph'); el2.setAttribute('placeholder', t(k2));
  }
  var m=document.getElementById('i_gate_msg'); if(m) m.textContent=t('gate_msg');
  var h=document.getElementById('i_gate_hint'); if(h) h.textContent=t('gate_hint');
}
async function setLang(newLang){
  LANG = (newLang==='en') ? 'en' : 'ja';
  await window.omni.set('lang', LANG);
  applyI18n();
}

