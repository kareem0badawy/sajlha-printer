// Modules
const { app, BrowserWindow, Notification, Tray, Menu } = require("electron");
const printer = require("@thiagoelg/node-printer");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const AutoLaunch = require("auto-launch");

// Express setup
const localApp = express();
localApp.use(cors());
localApp.use(bodyParser.json());

// Globals
const recentJobs = new Map();
let isQuiting = false;
let tray = null;
let win = null;
let splash = null;

// Log file path
const logFilePath = path.join(__dirname, 'print-log.txt');

function appendLog(message) {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const formatted = `${day}-${month}-${year} ${hours}:${minutes}`;
  const fullMessage = `[${formatted}] ${message}\n`;

  fs.appendFile(logFilePath, fullMessage, (err) => {
    if (err) console.error("فشل في كتابة اللوج:", err);
  });
}


// Routes
localApp.get("/ping", (_, res) => res.send({ status: "ok" }));

localApp.get("/printers", (_, res) => {
  try {
    const printers = printer.getPrinters().map(p => ({ name: p.name }));
    appendLog("📡 تم جلب قائمة الطابعات.");
    res.json(printers);
  } catch (err) {
    appendLog(`❌ فشل في قراءة الطابعات: ${err.message}`);
    res.status(500).send({ error: err.message });
  }
});

localApp.get("/logs", (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      appendLog(`❌ فشل في قراءة ملف السجل: ${err.message}`);
      return res.status(500).send({ error: "فشل في قراءة سجل الطباعة." });
    }
    const lines = data.trim().split('\n').reverse();
    res.json(lines);
  });
});

localApp.delete("/logs", (req, res) => {
  fs.writeFile(logFilePath, '', (err) => {
    if (err) {
      appendLog(`❌ فشل في مسح السجل: ${err.message}`);
      return res.status(500).send({ error: "فشل في مسح سجل الطباعة." });
    }
    appendLog("🗑️ تم مسح سجل الطباعة من قبل المستخدم.");
    res.send({ status: "cleared" });
  });
});

localApp.get("/logs/download", (req, res) => {
  res.download(logFilePath, "print-log.txt", (err) => {
    if (err) {
      appendLog(`❌ فشل في تحميل سجل الطباعة: ${err.message}`);
      res.status(500).send("فشل في تحميل الملف.");
    }
  });
});

function isDuplicateJob(url, printerName) {
  const key = `${printerName}:${url}`;
  const now = Date.now();
  if (recentJobs.has(key) && now - recentJobs.get(key) < 5000) {
    appendLog(`⏭️ تم تجاهل طباعة مكررة للطابعة ${printerName}`);
    return true;
  }
  recentJobs.set(key, now);
  return false;
}

async function waitForInvoiceReady(win) {
  while (true) {
    const isReady = await win.webContents
      .executeJavaScript(`window.invoiceReady === true`)
      .catch(() => false);
    if (isReady) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function printFromWebView(url, printerName, token) {
  return new Promise(async (resolve, reject) => {
    const win = new BrowserWindow({
      show: false,
      width: 600,
      height: 600,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: false,
      },
    });

    try {
      appendLog(`📄 بدء تحميل صفحة الطباعة للطابعة: ${printerName}`);
      await win.loadURL(url);

      await win.webContents.executeJavaScript(`localStorage.setItem("id_token", "${token}");`);

      await waitForInvoiceReady(win);
      console.log("Page ready, printing...");

      win.webContents.print({ silent: true, deviceName: printerName }, (success, error) => {
        win.close();
        if (success) {
          appendLog(`✅ تم الطباعة بنجاح على ${printerName}`);
          resolve();
        } else {
          appendLog(`❌ فشل الطباعة على ${printerName}: ${error}`);
          reject(new Error(error));
        }
      });
    } catch (err) {
      win.close();
      appendLog(`❌ خطأ أثناء تحميل صفحة الطباعة للطابعة ${printerName}: ${err.message}`);
      reject(err);
    }
  });
}

localApp.post("/print-from-url", async (req, res) => {
  const { url, printers, token } = req.body;
  console.log(`[${new Date().toISOString()}] Print request received`, { url, printers });

  if (!url || !Array.isArray(printers) || printers.length === 0) {
    return res.status(400).send({ error: "URL and printers are required." });
  }

  appendLog(`📥 استقبل طلب طباعة: URL = ${url}, Printers = ${printers.join(', ')}`);
  const results = [];

  for (const printerName of [...new Set(printers)]) {
    if (isDuplicateJob(url, printerName)) {
      results.push({ printer: printerName, status: "ignored-duplicate" });
      continue;
    }

    try {
      await printFromWebView(url, printerName, token);
      notify("Print Completed", `Printed successfully on ${printerName}`);
      results.push({ printer: printerName, status: "printed" });
    } catch (err) {
      notify("Print Error", `Failed to print on ${printerName}: ${err.message}`);
      results.push({ printer: printerName, status: "error", error: err.message });
    }
  }

  res.send({ results });
});

// Electron App
function createTrayAndWindow() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    show: true,
  });
  splash.loadFile(path.join(__dirname, "splash.html"));

  win = new BrowserWindow({
    width: 600,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));

  win.once("ready-to-show", () => {
    setTimeout(() => {
      splash.destroy();
      win.show();
    }, 1500);
  });

  tray = new Tray(path.join(__dirname, "icon.ico"));
  tray.setToolTip("Sajlha Printer Manager v1.1.0");

  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: "Exit",
      click: () => {
        isQuiting = true;
        app.quit();
      },
    },
  ]));

  tray.on("click", () => win.show());

  win.on("close", (event) => {
    if (!isQuiting) {
      event.preventDefault();
      win.hide();
    }
  });
}

function setupAutoLaunch() {
  const launcher = new AutoLaunch({
    name: "Sajlha Printer v1.1.0",
    path: app.getPath("exe"),
    isHidden: true,
  });

  launcher.isEnabled()
    .then(enabled => {
      if (!enabled) launcher.enable();
    })
    .catch(err => console.error("Auto-launch error:", err));
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

  app.on("before-quit", () => isQuiting = true);

  app.whenReady().then(() => {
    localApp.listen(4000, "127.0.0.1", () => {
      console.log("Print Agent API running at http://127.0.0.1:4000");
    });

    setupAutoLaunch();
    createTrayAndWindow();
  });
}
