const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const printer = require("@thiagoelg/node-printer");
const { appendLog, notify } = require("../utils/logger");
const { printFromWebView, isDuplicateJob } = require("../utils/printer");

const logFilePath = path.join(__dirname, "../../print-log.txt");

module.exports = function setupRoutes(app) {
  app.get("/ping", (_, res) => res.send({ status: "ok" }));

  app.get("/version", (_, res) => {
    const version = require("../../version.json").version;
    res.send({ version });
  });

  app.get("/printers", (_, res) => {
    try {
      const printers = printer.getPrinters().map((p) => ({ name: p.name }));
      res.json(printers);
    } catch (err) {
      appendLog(`❌ فشل في قراءة الطابعات: ${err.message}`);
      res.status(500).send({ error: err.message });
    }
  });

  app.get("/queues", (_, res) => {
    try {
      const printersList = printer.getPrinters();
      const allJobs = [];

      printersList.forEach((p) => {
        const jobs = printer.getPrinter(p.name).jobs || {};
        Object.values(jobs).forEach((job) => {
          allJobs.push({
            printerName: p.name,
            jobName: job.document || "",
            user: job.user || "",
            pages: job.totalPages || "",
            status: Array.isArray(job.status)
              ? job.status.includes("PAUSED")
                ? "مُعلّقة"
                : job.status.join("، ") || "قيد الانتظار"
              : job.status === "Paused"
              ? "مُعلّقة"
              : job.status || "قيد الانتظار",
          });
        });
      });

      res.json(allJobs);
    } catch (err) {
      appendLog(`❌ فشل في قراءة الوظائف: ${err.message}`);
      res.status(500).send({ error: "فشل في قراءة الوظائف." });
    }
  });

  app.get("/logs", (_, res) => {
    fs.readFile(logFilePath, "utf8", (err, data) => {
      if (err) {
        appendLog(`❌ فشل في قراءة ملف السجل: ${err.message}`);
        return res.status(500).send({ error: "فشل في قراءة سجل الطباعة." });
      }
      const lines = data.trim().split("\n").reverse();
      res.json(lines);
    });
  });

  app.delete("/logs", (_, res) => {
    fs.writeFile(logFilePath, "", (err) => {
      if (err) {
        appendLog(`❌ فشل في مسح السجل: ${err.message}`);
        return res.status(500).send({ error: "فشل في مسح سجل الطباعة." });
      }
      appendLog("🗑️ تم مسح سجل الطباعة من قبل المستخدم.");
      res.send({ status: "cleared" });
    });
  });

  app.get("/logs/download", (_, res) => {
    res.download(logFilePath, "print-log.txt", (err) => {
      if (err) {
        appendLog(`❌ فشل في تحميل سجل الطباعة: ${err.message}`);
        res.status(500).send("فشل في تحميل الملف.");
      }
    });
  });

  app.post("/print-from-url", async (req, res) => {
    const { url, printers, token, copies = 1 } = req.body;

    if (!url || !Array.isArray(printers) || printers.length === 0) {
      return res.status(400).send({ error: "URL and printers are required." });
    }

    appendLog(`📥 استقبل طلب طباعة: URL = ${url}, Printers = ${printers.join(", ")}, Copies = ${copies}`);
    const results = [];

    for (const printerName of [...new Set(printers)]) {
      if (isDuplicateJob(url, printerName)) {
        results.push({ printer: printerName, status: "ignored-duplicate" });
        continue;
      }

      try {
        for (let i = 0; i < copies; i++) {
          await printFromWebView(url, printerName, token);
          appendLog(`🖨️ تم تنفيذ نسخة ${i + 1} من الطابعة ${printerName}`);
        }
        notify("Print Completed", `Printed ${copies} copies on ${printerName}`);
        results.push({ printer: printerName, status: "printed", copies });
      } catch (err) {
        notify("Print Error", `Failed to print on ${printerName}: ${err.message}`);
        results.push({ printer: printerName, status: "error", error: err.message });
      }
    }

    res.send({ results });
  });

  app.post("/pause-job", (req, res) => {
    const { printerName, jobName } = req.body;
    const command = `powershell -Command "Get-PrintJob -PrinterName '${printerName}' | Where-Object { $_.DocumentName -eq '${jobName}' } | Suspend-PrintJob"`;

    exec(command, (err) => {
      if (err) {
        console.error("❌ فشل في إيقاف المهمة:", err.message);
        return res.status(500).send({ error: "فشل في إيقاف المهمة." });
      }
      res.send({ message: "تم الإيقاف المؤقت بنجاح" });
    });
  });

  app.post("/resume-job", (req, res) => {
    const { printerName, jobName } = req.body;
    const command = `powershell -Command "Get-PrintJob -PrinterName '${printerName}' | Where-Object { $_.DocumentName -eq '${jobName}' } | Resume-PrintJob"`;

    exec(command, (err) => {
      if (err) {
        console.error("❌ فشل في الاستئناف:", err.message);
        return res.status(500).send({ error: "فشل في الاستئناف." });
      }
      res.send({ message: "تم استئناف الطباعة بنجاح" });
    });
  });

  app.post("/cancel-job", (req, res) => {
    const { printerName, jobName } = req.body;
    const command = `powershell -Command "Get-PrintJob -PrinterName '${printerName}' | Where-Object { $_.DocumentName -eq '${jobName}' } | Remove-PrintJob"`;

    exec(command, (err) => {
      if (err) {
        console.error("❌ فشل في الإلغاء:", err.message);
        return res.status(500).send({ error: "فشل في الإلغاء." });
      }
      res.send({ message: "تم إلغاء الطباعة بنجاح" });
    });
  });
};
