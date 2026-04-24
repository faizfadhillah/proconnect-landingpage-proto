// ============================================================
// ProConnect — Minimal API client for static Netlify pages
// ============================================================
// Wraps fetch() to mirror the CMS's useApi.js composable:
//   - Attaches `Authorization: Bearer <Firebase ID token>` when available
//   - Targets the same NestJS backend the CMS uses
//   - Parses NestJS error responses the same way (message | error)
//
// Base URL is the prod API by default. Override per-env with:
//   window.PC_API_BASE = "https://stg.api.proconnectcareer.com";
// inside a <script> tag BEFORE importing this module.
//
// NOTE: The API's CORS allowlist (src/main.ts) currently includes
//   proconnectcareer.com + www.proconnectcareer.com
// but NOT the Netlify preview domain. If requests from a preview URL
// get blocked, add that domain to the API's enableCors() list and
// redeploy the API.
// ============================================================

const DEFAULT_API_BASE = "https://api.proconnectcareer.com";

export function getApiBase() {
  return (typeof window !== "undefined" && window.PC_API_BASE) || DEFAULT_API_BASE;
}

/**
 * Call a NestJS endpoint. Mirrors CMS $apiFetch:
 *   - prepends apiBase
 *   - sends JSON
 *   - attaches Firebase ID token if `auth.currentUser` is truthy
 *   - throws { status, code, message, data } on non-2xx
 *
 * @param {string} path   e.g. "/users/me" or "/users"
 * @param {object} opts   { method, body, headers, auth, signal, skipAuth }
 */
export async function pcApiFetch(path, opts = {}) {
  const base = getApiBase();
  const url = `${base}${path}`;

  const headers = Object.assign(
    { "Content-Type": "application/json", Accept: "application/json" },
    opts.headers || {},
  );

  // Attach Firebase ID token
  if (!opts.skipAuth && opts.auth && opts.auth.currentUser) {
    try {
      const token = await opts.auth.currentUser.getIdToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch (e) {
      console.warn("[pcApiFetch] Failed to read Firebase ID token:", e);
    }
  }

  const init = {
    method: opts.method || "GET",
    headers,
    signal: opts.signal,
  };
  if (opts.body !== undefined && opts.body !== null) {
    init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch (networkErr) {
    const err = new Error("Network error. Please check your connection.");
    err.code = "NETWORK";
    err.cause = networkErr;
    throw err;
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const err = new Error(extractErrorMessage(data) || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = (data && data.error) || `HTTP_${res.status}`;
    err.data = data;
    throw err;
  }

  return data;
}

/** Pull the human-friendly message out of a NestJS error body. */
export function extractErrorMessage(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.message) {
    return Array.isArray(data.message) ? data.message.join(", ") : data.message;
  }
  if (data.error) {
    return typeof data.error === "string" ? data.error : JSON.stringify(data.error);
  }
  return null;
}

// ---- Thin wrappers for the endpoints login/signup actually hit ----

/** GET /users/me — with the current Firebase user's ID token. */
export function getMe(auth) {
  return pcApiFetch("/users/me", { method: "GET", auth });
}

/** POST /users — registers a backend row for a Firebase user (used on Google SSO signup). */
export function createUser(auth, payload) {
  return pcApiFetch("/users", { method: "POST", auth, body: payload });
}

/** POST /users/public-request-otp — emails a 6-digit OTP to the prospect. Public. */
export function publicRequestOtp(email) {
  return pcApiFetch("/users/public-request-otp", {
    method: "POST",
    skipAuth: true,
    body: { email },
  });
}

/** DELETE /firebase/orphan-user/:uid — clean up a Firebase user that has no backend row. Public. */
export function deleteOrphanFirebaseUser(uid) {
  return pcApiFetch(`/firebase/orphan-user/${encodeURIComponent(uid)}`, {
    method: "DELETE",
    skipAuth: true,
  });
}
