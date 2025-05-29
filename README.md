# 🖨️ Sajlha Printer Manager

A lightweight cross-platform desktop printing agent built with Electron and Node.js.  
It allows automatic printing of web-based invoices (or documents) silently to a specified printer.

---

## 🚀 Features

- List all available printers on the host machine.
- Automatically open and print documents from a secure URL.
- Inject authentication token (JWT) into `localStorage` before printing.
- Silent printing with support for multiple printers.
- Print job deduplication to prevent repeated prints.
- Logging system (saved to `print-log.txt`).
- View, refresh, clear, and download logs from the UI.
- Auto-launch on system startup.
- RTL UI with Arabic language support.

---

## 🛠️ Tech Stack

- **Electron** – For desktop app window & tray.
- **Express.js** – For local API server.
- **Node.js** – Core runtime and system integrations.
- **@thiagoelg/node-printer** – Native printer access.
- **Bootstrap 5 RTL** – Responsive UI styling.
- **HTML/CSS/JS** – Frontend interface.

---

## 📂 Folder Structure

```
.
├── assets/
│   ├── css/
│   ├── fonts/
│   ├── js/
├── index.html
├── splash.html
├── main.js (or index.js)
├── print-log.txt
```

---

## 🖥️ How It Works

1. The app launches a local Express server on `http://localhost:4000`.
2. `/printers` returns available printers.
3. `/print-from-url` accepts:
   ```json
   {
     "url": "https://invoice-page.com",
     "printers": ["HP LaserJet 1020"],
     "token": "JWT_TOKEN"
   }
   ```
4. Electron opens the URL, injects the token, waits for `window.invoiceReady === true`, and silently prints.
5. All actions are logged to `print-log.txt`.

---

## 🧪 Local Endpoints

| Route               | Method | Description                          |
|--------------------|--------|--------------------------------------|
| `/ping`            | GET    | Health check                         |
| `/printers`        | GET    | List available printers              |
| `/print-from-url`  | POST   | Start a print job                    |
| `/logs`            | GET    | Get logs as JSON                     |
| `/logs`            | DELETE | Clear log file                       |
| `/logs/download`   | GET    | Download `print-log.txt`             |

---

## 📋 Requirements

- Node.js v16+
- Electron 25+
- Windows/macOS/Linux with printer drivers installed

---

## 🧾 Installation & Run

```bash
# Install dependencies
npm install

# Run the app
npm start
```

> Note: Electron will launch the tray app and open the UI in a browser window.

---

## 📝 Logging Format

All logs are stored in `print-log.txt` in this format:

```
[29-05-2025 04:42] ✅ Printed successfully on HP LaserJet
```

---

## 📦 Packaging (Optional)

To package the app as an executable:

```bash
npm install electron-packager -g

electron-packager . sajlha-printer --platform=win32 --arch=x64 --icon=assets/icon.ico
```

---

## 👤 Author

**Sajlha Team**  
For internal printing automation solutions.

---

## 📃 License

MIT License – Feel free to use and customize.
