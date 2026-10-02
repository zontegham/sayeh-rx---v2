// =====================================================================
// سامانه امن فرستنده سایه (شرکت ژئوتک) - راه‌انداز دسکتاپ ویندوز
// =====================================================================
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    title: 'سامانه فرستنده امن یکسویه سایه - شرکت ژئوتک',
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  // لود مستقیم سامانه فرستنده
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadURL(`file://${distIndex}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
