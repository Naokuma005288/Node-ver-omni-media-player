const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('omni', {
  // 既存
  openFiles: () => ipcRenderer.invoke('picker:open'),
  openSub: () => ipcRenderer.invoke('picker:sub'),
  openFolder: () => ipcRenderer.invoke('picker:folder'),
  revealInExplorer: (p) => ipcRenderer.invoke('os:reveal', p),
  readMeta: (paths) => ipcRenderer.invoke('meta:read', paths),
  get: (k, d) => ipcRenderer.invoke('settings:get', k, d),
  set: (k, v) => ipcRenderer.invoke('settings:set', k, v),
  savePng: (base64, fileName) => ipcRenderer.invoke('image:save', { base64, fileName }),
  onMedia: (cb) => {
    ipcRenderer.on('media:toggle', () => cb('toggle'));
    ipcRenderer.on('media:next', () => cb('next'));
    ipcRenderer.on('media:prev', () => cb('prev'));
  },
  // 埋め込み字幕
  listEmbeddedSubs: (p) => ipcRenderer.invoke('subs:listEmbedded', p),
  extractEmbeddedSub: (p, idx) => ipcRenderer.invoke('subs:extract', p, idx),

  // 先読み：ローカルファイル読み出し(ArrayBuffer)
  readFileArrayBuffer: (p) => ipcRenderer.invoke('audio:readFile', p),

  // 監視
  addWatchDir: (dir) => ipcRenderer.invoke('watch:addDir', dir),
  removeWatchDir: (dir) => ipcRenderer.invoke('watch:removeDir', dir),
  listWatchDirs: () => ipcRenderer.invoke('watch:list'),
  onWatchFile: (cb) => ipcRenderer.on('watch:file', (_e, payload) => cb(payload))
});
