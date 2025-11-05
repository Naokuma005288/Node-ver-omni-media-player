// ==== 初期ロード ======================================================
(async function(){
  try {
    await loadInitialSettings();
  } catch (err) {
    console.error('Failed to load initial settings', err);
  }
})();
