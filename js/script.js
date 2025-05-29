let printers = [];

async function loadPrinters() {
  try {
    const res = await fetch("http://localhost:4000/printers");
    printers = await res.json();
    renderPrinters();
  } catch (e) {
    alert("Failed to load printers");
  }
}

function renderPrinters() {
  const tbody = document.querySelector("#printersTable tbody");
  tbody.innerHTML = "";
  printers.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.name}</td><td>Allowed</td>`;
    tbody.appendChild(tr);
  });
}

window.onload = () => {
  loadPrinters();
};
