# 🛡 SQLi Shield
### SQL Injection Detection & Data Leak Prevention System
**CodeAlpha Cloud Computing Internship — Task 2**

---

## 📖 Project Overview

**SQLi Shield** is a cloud-based web application that detects, blocks, and logs SQL injection attacks in real-time. It demonstrates secure cloud application design using a free-tier tech stack — no paid services required.

Built for the CodeAlpha Cloud Computing Internship, it fulfills all Task 2 requirements:
✅ SQL injection detection • ✅ Data leak prevention • ✅ Cloud architecture  
✅ Double-layer security • ✅ Access control • ✅ Internet accessible • ✅ AES-256 encryption

---

## ✨ Features

| Feature | Description |
|--------|------------|
| 🔐 Authentication | Register, login, logout, password recovery via Appwrite |
| 🔬 Injection Lab | Interactive tool to test SQL injection patterns |
| 🛡 Layer 1 Security | Client-side regex detection of 24+ injection patterns |
| 🔒 Layer 2 Security | JWT session management + role-based access control |
| 📊 Dashboard | Real-time stats: blocked attacks, threats, user activity |
| 🗂 Security Logs | Full audit trail stored in Appwrite Database |
| 👥 User Roles | Admin (full access) and User (own data only) |
| 🔑 AES-256 Encryption | Sensitive data encrypted via Web Crypto API before storage |
| 📡 Cloud Ready | Netlify + Appwrite Cloud — fully free tier |
| 📱 Responsive | Works on mobile, tablet, and desktop |

---

## 🏗 Security Architecture

```
User Input
    │
    ▼
┌─────────────────────────────┐
│  LAYER 1: Input Security    │
│  • Regex pattern matching   │
│  • 24+ SQLi patterns        │
│  • HTML entity decoding     │
│  • Real-time blocking       │
└──────────┬──────────────────┘
           │ (if clean)
           ▼
┌─────────────────────────────┐
│  LAYER 2: Access Security   │
│  • JWT authentication       │
│  • Role-based access        │
│  • Session verification     │
│  • Admin route protection   │
└──────────┬──────────────────┘
           │ (if authorized)
           ▼
┌─────────────────────────────┐
│  AES-256-GCM Encryption     │
│  • PBKDF2 key derivation    │
│  • Unique salt + IV         │
│  • Web Crypto API (native)  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Appwrite Cloud Database    │
│  • Encrypted storage        │
│  • No raw credentials       │
│  • Audit logging            │
└─────────────────────────────┘
```

### Detected Attack Patterns

| Level | Examples |
|-------|---------|
| 💀 CRITICAL | DROP TABLE, EXEC xp_cmdshell, INSERT INTO, DELETE FROM |
| 🔴 HIGH | OR 1=1 bypass, Comment injection, UNION SELECT, Schema enum |
| 🟠 MEDIUM | SELECT FROM, SLEEP(), BENCHMARK, WAITFOR, LOAD_FILE |
| 🟡 LOW | Quote injection, Hex encoding, CHAR() encoding |

---

## ☁️ Appwrite Setup (Free)

### Step 1 — Create Account
1. Go to **https://cloud.appwrite.io** and sign up (free, no credit card)
2. Click **Create Project** → name it `sqli-shield`
3. Copy the **Project ID**

### Step 2 — Enable Authentication
1. In your project → **Auth** → **Settings**
2. Enable **Email/Password** provider
3. Add your domain to **Platforms**: `http://localhost` (dev) and your Netlify URL (prod)

### Step 3 — Create Database
1. Go to **Databases** → **Create Database**
2. Name it `sqli-shield-db` → copy the **Database ID**

### Step 4 — Create Collections

#### `security_logs` collection:
| Attribute | Type | Required |
|-----------|------|----------|
| userId | String (255) | ✅ |
| userEmail | String (255) | ✅ |
| suspiciousInput | String (500) | ✅ |
| threatLevel | String (20) | ✅ |
| attackType | String (100) | ✅ |
| blocked | Boolean | ✅ |
| timestamp | String (50) | ✅ |
| ipAddress | String (50) | ❌ |

**Permissions:** Any (create), Users (read own), Admin role (read all)

#### `user_profiles` collection:
| Attribute | Type | Required |
|-----------|------|----------|
| userId | String (255) | ✅ |
| email | String (255) | ✅ |
| displayName | String (100) | ✅ |
| role | String (20) | ✅ |
| createdAt | String (50) | ✅ |
| lastLogin | String (50) | ✅ |
| loginCount | Integer | ✅ |

### Step 5 — Update Config
Open `appwrite-config.js` and replace the placeholder values:
```javascript
const APPWRITE_CONFIG = {
  endpoint: "https://cloud.appwrite.io/v1",
  projectId: "YOUR_PROJECT_ID",        // ← paste here
  databaseId: "YOUR_DATABASE_ID",      // ← paste here
  collections: {
    securityLogs: "YOUR_LOGS_ID",      // ← paste here
    userProfiles: "YOUR_PROFILES_ID",  // ← paste here
  },
};
```

---

## 🚀 Deployment (Netlify — Free)

### Option A: Drag & Drop (Easiest)
1. Go to **https://netlify.com** → sign up free
2. Drag your project folder onto the Netlify dashboard
3. Your app is live at `https://random-name.netlify.app`
4. Add that URL to Appwrite → Auth → Platforms

### Option B: GitHub + Auto-deploy
```bash
# 1. Push to GitHub
git init
git add .
git commit -m "SQLi Shield - CodeAlpha Task 2"
git remote add origin https://github.com/YOUR_USERNAME/sqli-shield.git
git push -u origin main

# 2. In Netlify → New site from Git → connect your repo
# 3. Build command: (leave empty — pure HTML)
# 4. Publish directory: . (root)
```

### Option C: Run Locally
```bash
# Using Python (no install needed)
cd sqli-shield
python -m http.server 8080
# Open http://localhost:8080
```

---

## 📁 Project Structure

```
sqli-shield/
├── index.html          # Login / Register / Password Recovery
├── dashboard.html      # User Dashboard (overview, lab, logs, architecture)
├── admin.html          # Admin Panel (all logs, user management, alerts)
├── style.css           # Complete cybersecurity dark theme
├── script.js           # Core logic: SQLi detection, auth, encryption
├── appwrite-config.js  # Appwrite credentials + SDK initialization
└── README.md           # This file
```

---

## 🔑 First Admin Account

After deploying and configuring Appwrite:

1. Register an account normally via the app
2. Go to **Appwrite Console → Databases → user_profiles**
3. Find your user document → click Edit
4. Change `role` from `"user"` to `"admin"`
5. The Admin Panel link will appear in your dashboard sidebar

---

## 📸 Screenshots Section

<img width="1883" height="907" alt="Screenshot 2026-06-14 212710" src="https://github.com/user-attachments/assets/8ea3a773-22ca-4405-b05d-b6b45ee5ac4d" />
<img width="1890" height="905" alt="Screenshot 2026-06-14 222227" src="https://github.com/user-attachments/assets/57e79ecc-7e66-49f8-a2c0-76bcc59cd0ed" />
<img width="1350" height="432" alt="Screenshot 2026-06-14 222338" src="https://github.com/user-attachments/assets/c49d9e26-d6d4-4c09-8633-f2f9774e31ba" />
<img width="1207" height="827" alt="Screenshot 2026-06-14 222526" src="https://github.com/user-attachments/assets/364b1673-6f7e-412d-8cd6-2f6c0ac6f9d5" />
<img width="1725" height="760" alt="Screenshot 2026-06-15 105850" src="https://github.com/user-attachments/assets/6ce9a8db-430d-4251-89b1-ef16efa121f8" />
<img width="1887" height="567" alt="Screenshot 2026-06-15 105907" src="https://github.com/user-attachments/assets/b86f1684-d7b0-468e-862e-3cfe722e1558" />
<img width="1902" height="801" alt="Screenshot 2026-06-15 110401" src="https://github.com/user-attachments/assets/b47e0e92-a410-4010-b656-e1f1febb1846" />
<img width="1890" height="481" alt="Screenshot 2026-06-15 122240" src="https://github.com/user-attachments/assets/6c3e0c7d-4398-432b-aaa0-ca671008ecac" />
<img width="1902" height="585" alt="Screenshot 2026-06-15 122456" src="https://github.com/user-attachments/assets/98a67d02-c04a-45d2-8dcb-7b6b1a368f03" />
<img width="1902" height="571" alt="Screenshot 2026-06-15 122534" src="https://github.com/user-attachments/assets/4da7a550-c647-4d92-b16d-aa18dd47bdde" />


---

## 🛠 Tech Stack

| Technology | Purpose | Cost |
|-----------|---------|------|
| HTML5 + CSS3 + JS | Frontend (pure, no framework) | Free |
| Appwrite Cloud | Auth + Database + Backend | Free (500MB) |
| Web Crypto API | AES-256-GCM encryption | Browser native |
| Netlify | Static hosting + CDN | Free |

---

## ✅ CodeAlpha Compliance Checklist

- [x] **Detection of SQL injection attempts** — 24+ pattern regex engine
- [x] **Protection against data leaks** — AES-256 encryption + input blocking
- [x] **Cloud-based architecture** — Appwrite Cloud backend + Netlify hosting
- [x] **Access control mechanisms** — Role-based (admin/user) + session auth
- [x] **Double-layer security protocol** — Input validation + Auth/RBAC
- [x] **Internet accessibility** — Netlify CDN, works in any browser
- [x] **Secure storage of user information** — Encrypted fields, bcrypt passwords

---

*Built for CodeAlpha Cloud Computing Internship — Task 2*  
*© 2026 — Free to use and modify*
