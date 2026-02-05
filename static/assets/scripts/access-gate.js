const overlay = document.getElementById("access-overlay");
const creditStatus = document.getElementById("credit-status");
const requestTimeButton = document.getElementById("request-time");
const unlockLogo = document.getElementById("unlock-logo");
const pinModal = document.getElementById("pin-modal");
const pinInput = document.getElementById("user-pin-input");
const pinSubmit = document.getElementById("pin-submit");
const pinCancel = document.getElementById("pin-cancel");

let heartbeatTimer = null;
let tapCount = 0;
let tapResetTimer = null;
let currentFingerprint = "";

function setProxyEnabled(enabled) {
  const frame = document.getElementById("ifra");
  if (frame) {
    frame.style.pointerEvents = enabled ? "auto" : "none";
    frame.style.filter = enabled ? "none" : "blur(2px) grayscale(0.7)";
  }
  overlay.style.display = enabled ? "none" : "flex";
}

function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

async function updateStatusFromHeartbeat() {
  if (!currentFingerprint) return;

  const response = await fetch("/api/access/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint: currentFingerprint }),
  });

  if (!response.ok) return;
  const data = await response.json();

  if (data.openAccess) {
    creditStatus.textContent = "Open access mode is active for all devices.";
    setProxyEnabled(true);
    return;
  }

  if (!data.allowed) {
    creditStatus.textContent =
      "No time credit left. Request more time from admin.";
    setProxyEnabled(false);
    stopHeartbeat();
    return;
  }

  creditStatus.textContent = `Credit remaining: ${formatSeconds(data.remainingSeconds)}`;
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    updateStatusFromHeartbeat().catch(() => null);
  }, 30000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function showPinModal() {
  pinModal.classList.remove("hidden");
  pinInput.value = "";
  pinInput.focus();
}

function hidePinModal() {
  pinModal.classList.add("hidden");
}

async function unlockWithPin() {
  const pin = pinInput.value.trim();

  const response = await fetch("/api/access/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint: currentFingerprint, pin }),
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Invalid PIN");
    return;
  }

  if (!data.allowed) {
    creditStatus.textContent =
      "PIN accepted, but no credit available. Request time from admin.";
    setProxyEnabled(false);
    return;
  }

  setProxyEnabled(true);
  hidePinModal();
  creditStatus.textContent = data.openAccess
    ? "Open access mode is active for all devices."
    : `Credit remaining: ${formatSeconds(data.remainingSeconds)}`;
  startHeartbeat();
}

unlockLogo?.addEventListener("click", () => {
  tapCount += 1;

  clearTimeout(tapResetTimer);
  tapResetTimer = setTimeout(() => {
    tapCount = 0;
  }, 2500);

  if (tapCount >= 5) {
    tapCount = 0;
    showPinModal();
  }
});

pinSubmit?.addEventListener("click", () => {
  unlockWithPin().catch(() => alert("Unable to unlock right now."));
});

pinCancel?.addEventListener("click", hidePinModal);
pinInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    unlockWithPin().catch(() => alert("Unable to unlock right now."));
  }
});

requestTimeButton?.addEventListener("click", async () => {
  if (!currentFingerprint) return;
  const response = await fetch("/api/device/request-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fingerprint: currentFingerprint,
      message: "Request from proxy gate",
    }),
  });

  if (response.ok) {
    creditStatus.textContent =
      "Request sent. Ask admin to approve your time credit.";
  }
});

window.addEventListener("beforeunload", async () => {
  if (!currentFingerprint) return;
  navigator.sendBeacon(
    "/api/access/stop",
    JSON.stringify({ fingerprint: currentFingerprint }),
  );
});
(async () => {
  setProxyEnabled(false);
  if (!window.AccessControl) return;

  const register = await window.AccessControl.registerDevice();
  currentFingerprint = await window.AccessControl.getDeviceFingerprint();

  if (register.openAccess) {
    setProxyEnabled(true);
    creditStatus.textContent = "Open access mode is active for all devices.";
    return;
  }

  const remaining = register.device?.remainingSeconds || 0;
  creditStatus.textContent =
    remaining > 0
      ? `Device has ${formatSeconds(remaining)} available. Tap logo 5x and enter PIN 9767.`
      : "No credit available. Tap logo 5x and enter PIN 9767 after admin adds time.";
})().catch(() => {
  creditStatus.textContent = "Access system failed to initialize.";
});
