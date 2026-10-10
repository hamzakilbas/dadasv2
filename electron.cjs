const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Dadaş Tatlıcı POS Sistemi',
    autoHideMenuBar: true,
    show: false, // Sayfa hazır olunca göster (beyaz ekran parlamasını önler)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Sayfa yüklendiğinde pencereyi zarifçe göster
  win.once('ready-to-show', () => {
    win.show();
  });

  // İndirme işlemlerini (Excel & JSON yedek) sorunsuz yönet
  win.webContents.session.on('will-download', (event, item) => {
    item.on('done', (e, state) => {
      if (state === 'completed') {
        console.log('Dosya başarıyla indirildi:', item.getFilename());
      }
    });
  });

  // Derlenmiş dist klasörünü bağımsız masaüstü penceresi olarak aç
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

// Tekil oturum kontrolü (Uygulamanın iki kez açılmasını engeller)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      if (wins[0].isMinimized()) wins[0].restore();
      wins[0].focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
