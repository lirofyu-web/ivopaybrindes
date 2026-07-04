const { app, BrowserWindow } = require('electron');
const path = require('path');
const startServer = require('../server');

let mainWindow;

async function createWindow() {
  // Inicia o servidor Next.js internamente
  const port = await startServer();

  // Cria a janela do navegador
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // icon: path.join(__dirname, '../public/favicon.ico') // descomente se tiver ícone
  });

  // Carrega o servidor local
  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
