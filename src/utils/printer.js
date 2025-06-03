const { BrowserWindow } = require("electron");
const { appendLog } = require("./logger");

const recentJobs = new Map();

/**
 * @author Kareem Badawy
 * Prevents duplicate print jobs within 5 seconds for the same printer + URL.
 */
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

/**
 * Waits until `window.invoiceReady === true` before printing.
 * @param {BrowserWindow} win
 */
async function waitForInvoiceReady(win) {
  while (true) {
    const isReady = await win.webContents
      .executeJavaScript(`window.invoiceReady === true`)
      .catch(() => false);

    if (isReady) return true;

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Opens a hidden browser window, injects token, waits for readiness, then prints.
 * @param {string} url
 * @param {string} printerName
 * @param {string} token
 */
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

      await win.webContents.executeJavaScript(
        `localStorage.setItem("id_token", "${token}");`
      );

      await waitForInvoiceReady(win);

      win.webContents.print(
        { silent: true, deviceName: printerName },
        (success, error) => {
          win.close();
          if (success) {
            appendLog(`✅ تم الطباعة بنجاح على ${printerName}`);
            resolve();
          } else {
            appendLog(`❌ فشل الطباعة على ${printerName}: ${error}`);
            reject(new Error(error));
          }
        }
      );
    } catch (err) {
      win.close();
      appendLog(
        `❌ خطأ أثناء تحميل صفحة الطباعة للطابعة ${printerName}: ${err.message}`
      );
      reject(err);
    }
  });
}

module.exports = { printFromWebView, isDuplicateJob };
