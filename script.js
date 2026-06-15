/**
 * SQLi Shield — Core Application Logic
 */

// ═══════════════════════════════════════════════════════════════════
// LAYER 1 — SQL INJECTION DETECTION ENGINE
// ═══════════════════════════════════════════════════════════════════

const SQLiDetector = (() => {
  const PATTERNS = [
    { regex: /(\bUNION\b.*\bSELECT\b)/gi,          type: "UNION SELECT",        level: "CRITICAL" },
    { regex: /(\bDROP\b.*\b(TABLE|DATABASE)\b)/gi,  type: "DROP TABLE/DATABASE", level: "CRITICAL" },
    { regex: /(\bINSERT\b.*\bINTO\b)/gi,            type: "INSERT Injection",    level: "CRITICAL" },
    { regex: /(\bDELETE\b.*\bFROM\b)/gi,            type: "DELETE Injection",    level: "CRITICAL" },
    { regex: /(\bEXEC\b|\bEXECUTE\b)\s*\(/gi,       type: "EXEC Command",        level: "CRITICAL" },
    { regex: /xp_cmdshell/gi,                        type: "xp_cmdshell",         level: "CRITICAL" },
    { regex: /'\s*(OR|AND)\s*'?\s*\d+\s*=\s*\d+/gi, type: "OR 1=1 Bypass",     level: "HIGH" },
    { regex: /'\s*(OR|AND)\s*'[^']*'\s*=\s*'/gi,    type: "OR 'a'='a' Bypass",  level: "HIGH" },
    { regex: /--\s*$/gm,                             type: "Comment Injection",   level: "HIGH" },
    { regex: /\/\*.*\*\//gs,                         type: "Block Comment",       level: "HIGH" },
    { regex: /\bINFORMATION_SCHEMA\b/gi,             type: "Schema Enumeration",  level: "HIGH" },
    { regex: /\bSYSCOLUMNS\b|\bSYSTABLES\b/gi,      type: "Syscol Enumeration",  level: "HIGH" },
    { regex: /\bCAST\s*\(/gi,                        type: "CAST Injection",      level: "HIGH" },
    { regex: /\bCONVERT\s*\(/gi,                     type: "CONVERT Injection",   level: "HIGH" },
    { regex: /\bSELECT\b.*\bFROM\b/gi,              type: "SELECT Query",        level: "MEDIUM" },
    { regex: /\bUPDATE\b.*\bSET\b/gi,               type: "UPDATE Query",        level: "MEDIUM" },
    { regex: /\bSLEEP\s*\(\d+\)/gi,                 type: "Time-Based Blind",    level: "MEDIUM" },
    { regex: /\bBENCHMARK\s*\(/gi,                  type: "Benchmark Attack",     level: "MEDIUM" },
    { regex: /\bWAITFOR\b/gi,                        type: "WAITFOR Delay",       level: "MEDIUM" },
    { regex: /\bLOAD_FILE\s*\(/gi,                  type: "File Read",            level: "MEDIUM" },
    { regex: /\bOUTFILE\b/gi,                        type: "File Write",           level: "MEDIUM" },
    { regex: /'\s*;/g,                               type: "Quote Semicolon",     level: "LOW" },
    { regex: /0x[0-9a-fA-F]{4,}/g,                  type: "Hex Encoding",        level: "LOW" },
    { regex: /CHAR\s*\(\s*\d+/gi,                   type: "CHAR() Encoding",     level: "LOW" },
    { regex: /\|\|/g,                                type: "Concat Operator",     level: "LOW" },
  ];

  function analyze(input) {
    if (!input || typeof input !== "string") return { safe: true, threats: [], highestLevel: null };
    const decoded = decodeHTMLEntities(input);
    const threats = [];
    const levelOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    for (const p of PATTERNS) {
      p.regex.lastIndex = 0;
      if (p.regex.test(decoded)) threats.push({ type: p.type, level: p.level });
    }
    const highestLevel = threats.reduce((max, t) =>
      (levelOrder[t.level] || 0) > (levelOrder[max] || 0) ? t.level : max, null);
    return { safe: threats.length === 0, threats, highestLevel };
  }

  function decodeHTMLEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  function sanitize(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  }

  return { analyze, sanitize };
})();


// ═══════════════════════════════════════════════════════════════════
// AES-256-GCM ENCRYPTION
// ═══════════════════════════════════════════════════════════════════

const CryptoLayer = (() => {
  async function deriveKey(passphrase, salt) {
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
      km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  }

  async function encrypt(plaintext, pass = "sqli-shield-key") {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv   = crypto.getRandomValues(new Uint8Array(12));
      const key  = await deriveKey(pass, btoa(String.fromCharCode(...salt)));
      const buf  = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
      const out  = new Uint8Array(28 + buf.byteLength);
      out.set(salt, 0); out.set(iv, 16); out.set(new Uint8Array(buf), 28);
      return btoa(String.fromCharCode(...out));
    } catch { return plaintext; }
  }

  return { encrypt };
})();


// ═══════════════════════════════════════════════════════════════════
// AUTH MANAGER
// ═══════════════════════════════════════════════════════════════════

const AuthManager = {
  currentUser:    null,
  currentProfile: null,

  async register(email, password, displayName) {
    const userId = appwriteID.unique();
    await appwriteAccount.create(userId, email, password, displayName);
    await appwriteAccount.createEmailSession(email, password);
    this.currentUser = await appwriteAccount.get();

    try {
      const profileDoc = await appwriteDatabases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.userProfiles,
        appwriteID.unique(),
        {
          userId:      this.currentUser.$id,
          email:       this.currentUser.email,
          displayName: displayName,
          role:        "user",
          createdAt:   new Date().toISOString(),
          lastLogin:   new Date().toISOString(),
          loginCount:  1,
        }
      );
      this.currentProfile = profileDoc;
      console.log("✅ Profile saved to Appwrite:", profileDoc.$id);
    } catch (e) {
      console.error("❌ Failed to save profile:", e.message, e);
      showToast("Account created but profile save failed: " + e.message, "warning");
    }

    return this.currentUser;
  },

  async login(email, password) {
    await appwriteAccount.createEmailSession(email, password);
    this.currentUser = await appwriteAccount.get();
    await this._loadProfile();
    await this._updateLastLogin();
    return this.currentUser;
  },

  async logout() {
    try { await appwriteAccount.deleteSession("current"); } catch { }
    this.currentUser    = null;
    this.currentProfile = null;
  },

  async getSession() {
    try {
      this.currentUser = await appwriteAccount.get();
      await this._loadProfile();
      return this.currentUser;
    } catch {
      return null;
    }
  },

  async sendPasswordRecovery(email) {
    const url = window.location.origin + "/index.html?recovery=true";
    await appwriteAccount.createRecovery(email, url);
  },

  async _loadProfile() {
    if (!this.currentUser) return;
    try {
      const res = await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.userProfiles,
        [appwriteQuery.equal("userId", this.currentUser.$id)]
      );
      this.currentProfile = res.documents[0] || null;
      console.log("✅ Profile loaded:", this.currentProfile);
    } catch (e) {
      console.error("❌ Failed to load profile:", e.message, e);
    }
  },

  async _updateLastLogin() {
    if (!this.currentProfile) return;
    try {
      await appwriteDatabases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.userProfiles,
        this.currentProfile.$id,
        {
          lastLogin:  new Date().toISOString(),
          loginCount: (this.currentProfile.loginCount || 0) + 1,
        }
      );
    } catch (e) {
      console.warn("Could not update last login:", e.message);
    }
  },

  isAdmin() { return this.currentProfile?.role === "admin"; },
};


// ═══════════════════════════════════════════════════════════════════
// SECURITY LOGGER
// ═══════════════════════════════════════════════════════════════════

const SecurityLogger = {
  _localLogs: [],

  async log({ userId, userEmail, suspiciousInput, threatLevel, attackType, blocked }) {
    const entry = {
      userId:          userId    || "anonymous",
      userEmail:       userEmail || "unknown",
      suspiciousInput: SQLiDetector.sanitize(suspiciousInput).substring(0, 500),
      threatLevel,
      attackType,
      blocked,
      timestamp:  new Date().toISOString(),
    };

    // Always mirror in memory for instant UI
    this._localLogs.unshift(entry);

    // Save to Appwrite — show exact error if it fails
    try {
      const doc = await appwriteDatabases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.securityLogs,
        appwriteID.unique(),
        entry
      );
      console.log("✅ Security log saved:", doc.$id);
    } catch (e) {
      console.error("❌ Security log save FAILED:", e.message, e);
      // Show the real error on screen so you know what to fix
      showToast("Log save failed: " + e.message, "warning");
    }

    return entry;
  },

  async fetchLogs(limit = 50) {
    try {
      const res = await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.securityLogs,
        [appwriteQuery.orderDesc("timestamp"), appwriteQuery.limit(limit)]
      );
      console.log("✅ Fetched", res.documents.length, "logs from Appwrite");
      return res.documents;
    } catch (e) {
      console.error("❌ Fetch logs failed:", e.message, e);
      return this._localLogs.slice(0, limit);
    }
  },

  getLocalLogs() { return this._localLogs; },
};


// ═══════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const icons = { success: "✓", error: "✗", warning: "⚠", info: "ℹ" };
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__icon">${icons[type] || "ℹ"}</span><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--visible"));
  setTimeout(() => {
    toast.classList.remove("toast--visible");
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.original = btn.dataset.original || btn.textContent;
  btn.textContent = loading ? "Please wait…" : btn.dataset.original;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function threatBadge(level) {
  const map = { LOW: "🟡", MEDIUM: "🟠", HIGH: "🔴", CRITICAL: "💀" };
  return `<span class="badge badge--${(level||"low").toLowerCase()}">${map[level] || "⚪"} ${level}</span>`;
}

function attachSQLiListeners() {
  document.querySelectorAll("[data-sqli-check]").forEach(input => {
    let warn = input.parentElement.querySelector(".sqli-warning");
    if (!warn) {
      warn = document.createElement("p");
      warn.className = "sqli-warning";
      input.parentElement.appendChild(warn);
    }
    input.addEventListener("input", () => {
      const r = SQLiDetector.analyze(input.value);
      if (!r.safe) {
        warn.innerHTML = `⚠ Injection pattern: <strong>${r.threats[0].type}</strong> [${r.highestLevel}]`;
        warn.style.display = "block";
        input.classList.add("input--danger");
      } else {
        warn.style.display = "none";
        input.classList.remove("input--danger");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  attachSQLiListeners();
  initParticles();
});

// ═══════════════════════════════════════════════════════════════════
// PARTICLE BACKGROUND
// ═══════════════════════════════════════════════════════════════════

function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  window.addEventListener("resize", () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
  const CHARS = "01 SELECT DROP UNION WHERE FROM INTO".split(" ");
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    speed: 0.3 + Math.random() * 0.7,
    char: CHARS[Math.floor(Math.random() * CHARS.length)],
    opacity: 0.05 + Math.random() * 0.12,
    size: 10 + Math.random() * 8,
  }));
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = "#00ff88";
      ctx.font = `${p.size}px "Courier New", monospace`;
      ctx.fillText(p.char, p.x, p.y);
      p.y += p.speed;
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; p.char = CHARS[Math.floor(Math.random() * CHARS.length)]; }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  })();
}
