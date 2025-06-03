const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "../../print-log.txt");

/**
 * @author Kareem Badawy
 * Log a message with timestamp into print-log.txt
 * @param {string} message
 */
function appendLog(message) {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const formatted = `${day}-${month}-${year} ${hours}:${minutes}`;
  const fullMessage = `[${formatted}] ${message}\n`;

  fs.appendFile(logFilePath, fullMessage, (err) => {
    if (err) console.error("❌ Error writing to log file:", err);
  });
}

/**
 * Show system notification or log fallback
 * @param {string} title
 * @param {string} body
 */
function notify(title, body) {
  const { Notification } = require("electron");

  if (Notification.isSupported()) {
    const notification = new Notification({ title, body });
    notification.show();
  } else {
    console.log(`[Notification] ${title}: ${body}`);
  }
}

module.exports = { appendLog, notify };
