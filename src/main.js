const { app, BrowserWindow, Tray, Menu } = require("electron");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const AutoLaunch = require("auto-launch");
const version = require("../version.json").version;

const setupRoutes = require("./server/routes");

// Express setup
const localApp = express();
localApp.use(cors());
localApp.use(bodyParser.json());

// Globals
let isQuiting = false;
let tray = null;
let win = null;
let splash = null;

/**
 * Creates the splash screen, main window, and system tray
 */
function createTrayAndWindow() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    show: true,
  });
  splash.loadFile(path.join(__dirname, "../view/splash.html"));

  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadFile(path.join(__dirname, "./ui/index.html"));

  win.once("ready-to-show", () => {
    setTimeout(() => {
      splash.destroy();
      win.show();
    }, 1500);
  });

  tray = new Tray(path.join(__dirname, "../icon.ico"));
  tray.setToolTip(`Sajlha Print Manager v${version}`);

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Exit",
        click: () => {
          isQuiting = true;
          app.quit();
        },
      },
    ])
  );

  tray.on("click", () => win.show());

  win.on("close", (event) => {
    if (!isQuiting) {
      event.preventDefault();
      win.hide();
    }
  });
}

/**
 * Enables auto-launch on system startup
 */
function setupAutoLaunch() {
  const launcher = new AutoLaunch({
    name: "Sajlha Printer v" + version,
    path: app.getPath("exe"),
    isHidden: true,
  });

  launcher
    .isEnabled()
    .then((enabled) => {
      if (!enabled) launcher.enable();
    })
    .catch((err) => console.error("Auto-launch error:", err));
}

// App lifecycle
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
    }
  });

  app.on("before-quit", () => (isQuiting = true));

  app.whenReady().then(() => {
    setupRoutes(localApp); // 🧠 Use all routes from external module

    localApp.listen(4000, "127.0.0.1", () => {
      console.log("Print Agent API running at http://127.0.0.1:4000");
    });

    setupAutoLaunch();
    createTrayAndWindow();
  });
}
