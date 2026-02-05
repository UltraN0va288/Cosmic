import express from "express";
import basicAuth from "express-basic-auth";
import http from "node:http";
import { createBareServer } from "@tomphttp/bare-server-node";
import path from "node:path";
import fs from "node:fs";
import cors from "cors";
import config from "./config.js";

const __dirname = process.cwd();
const server = http.createServer();
const app = express(server);
const bareServer = createBareServer("/o/");
const PORT = process.env.PORT || 8080;

const accessDataPath = path.join(__dirname, "data", "access-control.json");

function ensureAccessDataFile() {
  const dir = path.dirname(accessDataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(accessDataPath)) {
    fs.writeFileSync(
      accessDataPath,
      JSON.stringify(
        {
          openAccess: false,
          totalRevenue: 0,
          devices: {},
        },
        null,
        2,
      ),
    );
  }
}

function readAccessData() {
  ensureAccessDataFile();
  const raw = fs.readFileSync(accessDataPath, "utf-8");
  return JSON.parse(raw);
}

function writeAccessData(data) {
  fs.writeFileSync(accessDataPath, JSON.stringify(data, null, 2));
}

function sanitizeDevice(device) {
  return {
    fingerprint: device.fingerprint,
    username: device.username,
    remainingSeconds: Math.max(0, Math.floor(device.remainingSeconds || 0)),
    totalGrantedSeconds: Math.max(
      0,
      Math.floor(device.totalGrantedSeconds || 0),
    ),
    requests: device.requests || 0,
    lastSeen: device.lastSeen || null,
    createdAt: device.createdAt || null,
    hasActiveSession: Boolean(device.activeSession),
  };
}

function getOrCreateDevice(data, fingerprint, username = "") {
  const now = new Date().toISOString();
  if (!data.devices[fingerprint]) {
    data.devices[fingerprint] = {
      fingerprint,
      username: username || `Device-${fingerprint.slice(0, 6)}`,
      remainingSeconds: 0,
      totalGrantedSeconds: 0,
      requests: 0,
      requestMessages: [],
      activeSession: false,
      lastHeartbeat: null,
      lastSeen: now,
      createdAt: now,
    };
  }

  if (username && username.trim()) {
    data.devices[fingerprint].username = username.trim().slice(0, 40);
  }

  data.devices[fingerprint].lastSeen = now;
  return data.devices[fingerprint];
}

function deductElapsedCredit(device, openAccess) {
  if (!device.activeSession || !device.lastHeartbeat || openAccess) {
    return;
  }

  const nowMs = Date.now();
  const elapsedSeconds = Math.floor(
    (nowMs - Date.parse(device.lastHeartbeat)) / 1000,
  );

  if (elapsedSeconds > 0) {
    device.remainingSeconds = Math.max(
      0,
      device.remainingSeconds - elapsedSeconds,
    );
    device.lastHeartbeat = new Date(nowMs).toISOString();

    if (device.remainingSeconds <= 0) {
      device.activeSession = false;
    }
  }
}

if (config.challenge) {
  console.log(
    "Password protection is enabled. Usernames are: " +
      Object.keys(config.users),
  );
  console.log("Passwords are: " + Object.values(config.users));

  app.use(
    basicAuth({
      users: config.users,
      challenge: true,
    }),
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "static")));

const ACCESS_PIN = "9767";
const ADMIN_PIN = "AbdullahAhmer0850";

app.post("/api/device/register", (req, res) => {
  const { fingerprint, username } = req.body;

  if (!fingerprint || typeof fingerprint !== "string") {
    return res.status(400).json({ error: "Fingerprint is required." });
  }

  const data = readAccessData();
  const device = getOrCreateDevice(data, fingerprint, username);
  writeAccessData(data);

  return res.json({
    ok: true,
    device: sanitizeDevice(device),
    openAccess: Boolean(data.openAccess),
  });
});

app.post("/api/device/request-time", (req, res) => {
  const { fingerprint, message } = req.body;

  if (!fingerprint || typeof fingerprint !== "string") {
    return res.status(400).json({ error: "Fingerprint is required." });
  }

  const data = readAccessData();
  const device = getOrCreateDevice(data, fingerprint);

  device.requests += 1;
  if (message && typeof message === "string" && message.trim()) {
    device.requestMessages.push({
      message: message.trim().slice(0, 140),
      at: new Date().toISOString(),
    });
    device.requestMessages = device.requestMessages.slice(-10);
  }

  writeAccessData(data);
  return res.json({ ok: true, requests: device.requests });
});

app.post("/api/access/start", (req, res) => {
  const { fingerprint, pin } = req.body;

  if (!fingerprint || typeof fingerprint !== "string") {
    return res.status(400).json({ error: "Fingerprint is required." });
  }

  if (pin !== ACCESS_PIN) {
    return res.status(401).json({ error: "Invalid user pin." });
  }

  const data = readAccessData();
  const device = getOrCreateDevice(data, fingerprint);
  deductElapsedCredit(device, data.openAccess);

  const allowed = Boolean(data.openAccess) || device.remainingSeconds > 0;
  if (allowed) {
    device.activeSession = true;
    device.lastHeartbeat = new Date().toISOString();
  }

  writeAccessData(data);

  return res.json({
    allowed,
    remainingSeconds: device.remainingSeconds,
    openAccess: Boolean(data.openAccess),
    username: device.username,
  });
});

app.post("/api/access/heartbeat", (req, res) => {
  const { fingerprint } = req.body;

  if (!fingerprint || typeof fingerprint !== "string") {
    return res.status(400).json({ error: "Fingerprint is required." });
  }

  const data = readAccessData();
  const device = getOrCreateDevice(data, fingerprint);
  deductElapsedCredit(device, data.openAccess);

  const allowed = Boolean(data.openAccess) || device.remainingSeconds > 0;
  if (allowed && device.activeSession) {
    device.lastHeartbeat = new Date().toISOString();
  }

  writeAccessData(data);

  return res.json({
    allowed,
    remainingSeconds: device.remainingSeconds,
    openAccess: Boolean(data.openAccess),
  });
});

app.post("/api/access/stop", (req, res) => {
  const { fingerprint } = req.body;

  if (!fingerprint || typeof fingerprint !== "string") {
    return res.status(400).json({ error: "Fingerprint is required." });
  }

  const data = readAccessData();
  const device = getOrCreateDevice(data, fingerprint);
  deductElapsedCredit(device, data.openAccess);
  device.activeSession = false;
  device.lastHeartbeat = null;
  writeAccessData(data);

  return res.json({ ok: true, remainingSeconds: device.remainingSeconds });
});

app.get("/api/admin/summary", (req, res) => {
  if (req.query.pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Invalid admin pin." });
  }

  const data = readAccessData();

  Object.values(data.devices).forEach((device) =>
    deductElapsedCredit(device, data.openAccess),
  );
  writeAccessData(data);

  const devices = Object.values(data.devices).map((device) =>
    sanitizeDevice(device),
  );

  return res.json({
    openAccess: Boolean(data.openAccess),
    totalRevenue: Number(data.totalRevenue || 0),
    devices,
  });
});

app.post("/api/admin/device-credit", (req, res) => {
  const { pin, fingerprint, minutes, amountPaid = 0, username } = req.body;

  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Invalid admin pin." });
  }

  if (!fingerprint || typeof fingerprint !== "string") {
    return res.status(400).json({ error: "Fingerprint is required." });
  }

  const parsedMinutes = Number(minutes);
  const parsedAmount = Number(amountPaid);

  if (Number.isNaN(parsedMinutes) || parsedMinutes <= 0) {
    return res
      .status(400)
      .json({ error: "Minutes must be a number greater than 0." });
  }

  const data = readAccessData();
  const device = getOrCreateDevice(data, fingerprint, username);

  const addSeconds = Math.floor(parsedMinutes * 60);
  device.remainingSeconds += addSeconds;
  device.totalGrantedSeconds += addSeconds;

  if (!Number.isNaN(parsedAmount) && parsedAmount > 0) {
    data.totalRevenue = Number(data.totalRevenue || 0) + parsedAmount;
  }

  writeAccessData(data);

  return res.json({
    ok: true,
    device: sanitizeDevice(device),
    totalRevenue: Number(data.totalRevenue || 0),
  });
});

app.post("/api/admin/open-access", (req, res) => {
  const { pin, enabled } = req.body;

  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Invalid admin pin." });
  }

  const data = readAccessData();
  data.openAccess = Boolean(enabled);
  writeAccessData(data);

  return res.json({ ok: true, openAccess: data.openAccess });
});

if (config.routes !== false) {
  const routes = [
    { path: "/ap", file: "apps.html" },
    { path: "/g", file: "games.html" },
    { path: "/s", file: "settings.html" },
    { path: "/admin", file: "admin.html" },
    { path: "/t", file: "tabs.html" },
    { path: "/p", file: "go.html" },
    { path: "/", file: "index.html" },
    { path: "/tos", file: "tos.html" },
  ];

  routes.forEach((route) => {
    app.get(route.path, (req, res) => {
      res.sendFile(path.join(__dirname, "static", route.file));
    });
  });
}

if (config.local !== false) {
  app.get("/e/*", (req, res, next) => {
    const baseUrls = [
      "https://raw.githubusercontent.com/v-5x/x/fixy",
      "https://raw.githubusercontent.com/ypxa/y/main",
      "https://raw.githubusercontent.com/ypxa/w/master",
    ];
    fetchData(req, res, next, baseUrls);
  });
}

const fetchData = async (req, res, next, baseUrls) => {
  try {
    const reqTarget = baseUrls.map((baseUrl) => `${baseUrl}/${req.params[0]}`);
    let data;
    let asset;

    for (const target of reqTarget) {
      asset = await fetch(target);
      if (asset.ok) {
        data = await asset.arrayBuffer();
        break;
      }
    }

    if (data) {
      res.end(Buffer.from(data));
    } else {
      next();
    }
  } catch (error) {
    console.error("Error fetching:", error);
    next(error);
  }
};

server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

server.on("listening", () => {
  console.log(`Running at http://localhost:${PORT}`);
});

server.listen({
  port: PORT,
});
