# 🖨️ Sajlha Printer Manager

A lightweight desktop printing assistant for **Sajlha platform**, built with Electron and Node.js.  
It enables **silent printing** of documents directly from web-based URLs, with token-based authentication and queue management.

---

## 🚀 Features

- ✅ View all available printers on the system.
- ✅ Print from a secure URL without manual download.
- ✅ Inject JWT token into browser `localStorage` before printing.
- ✅ Automatically waits for `window.invoiceReady === true` before printing.
- ✅ Silent printing with multiple printer support.
- ✅ Prevents repeated prints using job deduplication.
- ✅ View current print queues and grouped job counts.
- ✅ Manage jobs: **Pause, Resume, or Cancel** individual print jobs.
- ✅ Built-in logging (`print-log.txt`) for all actions and errors.
- ✅ Log viewer in the UI with options to refresh, clear, or download logs.
- ✅ Auto-launch on system startup (Windows).
- ✅ Arabic-first user interface with **Bootstrap RTL** styling.
- ✅ Splash screen & system tray support.
- ✅ Centralized version control via `version.json`.

---

## 🛠️ Tech Stack

- **Electron** – Desktop app shell and tray support.
- **Express.js** – Local API server.
- **Node.js** – Runtime environment and native integration.
- **@thiagoelg/node-printer** – Access to system printers and jobs.
- **Bootstrap 5 RTL** – Arabic-friendly UI.
- **HTML/CSS/JS** – Frontend interface.

---

## 🖥️ How It Works

1. App starts an Express server on `http://localhost:4000`.
2. User opens the UI and manages printers, jobs, and logs.
3. To print:
   - POST to `/print-from-url` with:
     ```json
     {
       "url": "https://some-invoice-page.com",
       "printers": ["HP Printer 1", "HP Printer 2"],
       "token": "your_jwt_token",
       "copies": 2
     }
     ```
   - The app:
     - Opens a hidden browser.
     - Injects the token into `localStorage`.
     - Waits until `window.invoiceReady === true`.
     - Silently prints to the selected printer(s).

4. All actions are logged and visible in the UI under "السجل".

---

## 📂 Folder Structure
```
.
├── assets/
│ ├── css/
│ ├── fonts/
│ ├── js/
├── index.html
├── splash.html
├── main.js
├── version.json
├── print-log.txt
```


---

## 🔌 Local API Endpoints

| Route              | Method | Description                          |
|--------------------|--------|--------------------------------------|
| `/ping`            | GET    | Health check                         |
| `/version`         | GET    | Returns app version from version.json|
| `/printers`        | GET    | List available printers              |
| `/queues`          | GET    | Get current print jobs               |
| `/pause-job`       | POST   | Pause a print job                    |
| `/resume-job`      | POST   | Resume a paused job                  |
| `/cancel-job`      | POST   | Cancel a print job                   |
| `/print-from-url`  | POST   | Start a print job                    |
| `/logs`            | GET    | Get logs as JSON                     |
| `/logs`            | DELETE | Clear log file                       |
| `/logs/download`   | GET    | Download `print-log.txt`             |

---

## 🧾 Example Log Entry

Logs are saved in `print-log.txt` in this format:


---

## 🧪 Requirements

- Node.js v16 or higher
- Compatible with **Windows, macOS, Linux**
- Works with most modern printers (ensure drivers are installed)

---

## 🚀 Installation & Run

```bash
# Install dependencies
npm install

# Start the app
npm start

---

## 📦 Build & Package

```bash
# Build App
npm run build

