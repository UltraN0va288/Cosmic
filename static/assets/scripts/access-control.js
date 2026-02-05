async function hashFingerprint(source) {
  const data = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = [...new Uint8Array(digest)];
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getDeviceFingerprint() {
  const cached = localStorage.getItem("deviceFingerprint");
  if (cached) return cached;

  const seed = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  const fingerprint = await hashFingerprint(seed);
  localStorage.setItem("deviceFingerprint", fingerprint);
  return fingerprint;
}

function getDeviceUsername() {
  return localStorage.getItem("deviceUsername") || "";
}

function setDeviceUsername(username) {
  if (username && username.trim()) {
    localStorage.setItem("deviceUsername", username.trim().slice(0, 40));
  }
}

async function registerDevice() {
  const fingerprint = await getDeviceFingerprint();
  const username = getDeviceUsername();

  const response = await fetch("/api/device/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint, username }),
  });

  if (!response.ok) {
    throw new Error("Failed to register device.");
  }

  const data = await response.json();
  if (data?.device?.username) {
    setDeviceUsername(data.device.username);
  }

  return data;
}

window.AccessControl = {
  getDeviceFingerprint,
  getDeviceUsername,
  setDeviceUsername,
  registerDevice,
};
