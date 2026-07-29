import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { credentialManager } from './credential-manager';
import { ollamaManager } from './ollama-manager';
import { browserViewManager } from './browser-view-manager';
import { initDatabase } from './db/database';

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  const hasCredentials = await credentialManager.init();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    title: 'CrewCircle Admin',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  browserViewManager.setWindow(mainWindow);

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  if (!hasCredentials) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow?.webContents.send('navigate', '/setup');
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    browserViewManager.destroyAll();
  });
}

app.whenReady().then(async () => {
  await initDatabase();
  registerIpcHandlers();
  ollamaManager.ensureRunning().catch(() => {});
  await createWindow();
});

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
