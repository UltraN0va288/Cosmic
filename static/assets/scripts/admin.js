const loginCard = document.getElementById("admin-login-card");
const adminPanel = document.getElementById("admin-panel");
const pinInput = document.getElementById("admin-pin");
const unlockButton = document.getElementById("admin-unlock");
const refreshButton = document.getElementById("refresh-admin");
const toggleOpenAccessButton = document.getElementById("toggle-open-access");

const revenueValue = document.getElementById("revenue-value");
const openAccessState = document.getElementById("open-access-state");
const deviceCount = document.getElementById("device-count");
const tableBody = document.getElementById("device-table-body");

let adminPin = "";
let currentOpenAccess = false;

function formatCredit(seconds) {
  const mins = Math.floor((seconds || 0) / 60);
  return `${mins} min`;
}

function rowTemplate(device) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="inline-input" value="${device.username || ""}" data-kind="username" /></td>
    <td><code>${device.fingerprint.slice(0, 14)}…</code></td>
    <td>${formatCredit(device.remainingSeconds)}</td>
    <td>${device.requests || 0}</td>
    <td>
      <div class="inline-controls">
        <input class="inline-input" type="number" min="1" value="30" data-kind="minutes" />
        <input class="inline-input" type="number" min="0" step="0.01" value="0" data-kind="amount" placeholder="$" />
        <button class="grant-btn">Grant</button>
      </div>
    </td>
  `;

  tr.querySelector(".grant-btn").addEventListener("click", async () => {
    const minutes = Number(tr.querySelector('[data-kind="minutes"]').value);
    const amountPaid = Number(tr.querySelector('[data-kind="amount"]').value);
    const username = tr.querySelector('[data-kind="username"]').value;

    const response = await fetch("/api/admin/device-credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin: adminPin,
        fingerprint: device.fingerprint,
        minutes,
        amountPaid,
        username,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || "Unable to grant credit");
      return;
    }

    await loadSummary();
  });

  return tr;
}

async function loadSummary() {
  const response = await fetch(
    `/api/admin/summary?pin=${encodeURIComponent(adminPin)}`,
  );
  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Admin access denied");
    return;
  }

  currentOpenAccess = data.openAccess;
  revenueValue.textContent = `$${Number(data.totalRevenue || 0).toFixed(2)}`;
  openAccessState.textContent = data.openAccess ? "ON" : "OFF";
  deviceCount.textContent = String(data.devices.length);

  tableBody.innerHTML = "";
  data.devices.forEach((device) => {
    tableBody.appendChild(rowTemplate(device));
  });
}

unlockButton.addEventListener("click", async () => {
  adminPin = pinInput.value.trim();
  if (!adminPin) return;

  await loadSummary();
  loginCard.classList.add("hidden");
  adminPanel.classList.remove("hidden");
});

refreshButton.addEventListener("click", () => {
  loadSummary().catch(() => alert("Unable to refresh right now"));
});

toggleOpenAccessButton.addEventListener("click", async () => {
  const response = await fetch("/api/admin/open-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: adminPin, enabled: !currentOpenAccess }),
  });

  const data = await response.json();
  if (!response.ok) {
    alert(data.error || "Unable to toggle open access");
    return;
  }

  currentOpenAccess = data.openAccess;
  await loadSummary();
});
