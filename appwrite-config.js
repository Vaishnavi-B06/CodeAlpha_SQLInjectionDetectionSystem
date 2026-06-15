/**
 * SQLi Shield — Appwrite Configuration
 * SDK global: window.Appwrite (set by the IIFE build)
 * Exports: window.Appwrite.Client, .Account, .Databases, .ID, .Query …
 */

const APPWRITE_CONFIG = {
  endpoint:   "https://cloud.appwrite.io/v1",
  projectId:  "6a2ec72d002312946371",
  databaseId: "6a2ec833001aee3734e1",
  collections: {
    securityLogs: "security_logs",
    userProfiles:  "user_profiles",
  },
};

// ── Pull named exports from the IIFE global ───────────────────────
const { Client, Account, Databases, ID, Query } = window.Appwrite;

// ── Initialise the client ─────────────────────────────────────────
const _client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// ── Expose as simple globals used everywhere in the app ───────────
const appwriteAccount    = new Account(_client);
const appwriteDatabases  = new Databases(_client);
const appwriteID         = ID;
const appwriteQuery      = Query;
