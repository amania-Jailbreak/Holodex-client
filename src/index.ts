import { app, BrowserWindow } from 'electron';
import fetch from 'cross-fetch';
import { readFileSync, writeFileSync } from 'fs';
import { Titlebar, TitlebarColor } from 'custom-electron-titlebar'
import { ElectronBlocker, fullLists, Request } from '@cliqz/adblocker-electron';
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');
import * as path from 'path';
import * as url from 'url';
function getUrlToLoad(): string {
  let url = 'https://google.com';
  if (process.argv[process.argv.length - 1].endsWith('.js') === false) {
    url = process.argv[process.argv.length - 1];
  }

  return url;
}
let mainWindow: BrowserWindow | null = null;
setupTitlebar();
async function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      nodeIntegrationInSubFrames: true,
    },
    height: 600,
    width: 800,
  });

  const blocker = await ElectronBlocker.fromLists(
    fetch,
    fullLists,
    {
      enableCompression: true,
    },
    {
      path: 'engine.bin',
      read: async (...args) => readFileSync(...args),
      write: async (...args) => writeFileSync(...args),
    },
  );
  blocker.enableBlockingInSession(mainWindow.webContents.session);

  blocker.on('request-blocked', (request: Request) => {
    console.log('blocked', request.tabId, request.url);
  });

  blocker.on('request-redirected', (request: Request) => {
    console.log('redirected', request.tabId, request.url);
  });

  blocker.on('request-whitelisted', (request: Request) => {
    console.log('whitelisted', request.tabId, request.url);
  });

  blocker.on('csp-injected', (request: Request) => {
    console.log('csp', request.url);
  });

  blocker.on('script-injected', (script: string, url: string) => {
    console.log('script', script.length, url);
  });

  blocker.on('style-injected', (style: string, url: string) => {
    console.log('style', style.length, url);
  });
  attachTitlebarToWindow(mainWindow);
  mainWindow.loadURL('https://holodex.net');
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
