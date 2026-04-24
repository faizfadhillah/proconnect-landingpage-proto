// ============================================================
// ProConnect — Public API helpers (no-auth endpoints)
// ============================================================
// Classic <script>-loadable. Attaches helpers to window.PcApi.
// Usage:
//   <script src="assets/api/public-api.js"></script>
//   <script>
//     PcApi.fetchPublicJobs({ page: 1, limit: 20 }).then(console.log);
//   </script>
//
// Override API base per-environment by setting window.PC_API_BASE
// BEFORE loading this script.
// ============================================================
(function () {
  "use strict";

  var DEFAULT_API_BASE = "https://api.proconnectcareer.com";

  function getApiBase() {
    return (typeof window !== "undefined" && window.PC_API_BASE) || DEFAULT_API_BASE;
  }

  function extractErrorMessage(data) {
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

  /**
   * Low-level fetch wrapper. No auth. Throws { status, code, message, data } on non-2xx.
   */
  async function pcPublicFetch(path, opts) {
    opts = opts || {};
    var url = getApiBase() + path;
    var headers = Object.assign(
      { "Content-Type": "application/json", Accept: "application/json" },
      opts.headers || {}
    );
    var init = { method: opts.method || "GET", headers, signal: opts.signal };
    if (opts.body !== undefined && opts.body !== null) {
      init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
    }

    var res;
    try {
      res = await fetch(url, init);
    } catch (networkErr) {
      var err = new Error("Network error. Please check your connection.");
      err.code = "NETWORK";
      err.cause = networkErr;
      throw err;
    }

    var data = null;
    var text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = text; }
    }

    if (!res.ok) {
      var apiErr = new Error(extractErrorMessage(data) || ("HTTP " + res.status));
      apiErr.status = res.status;
      apiErr.code = (data && data.error) || ("HTTP_" + res.status);
      apiErr.data = data;
      throw apiErr;
    }

    return data;
  }

  // ---- Jobs ----

  /** GET /jobs/public/all — paginated list of published jobs across all companies. */
  function fetchPublicJobs(params) {
    params = params || {};
    var q = [];
    if (params.status) q.push("status=" + encodeURIComponent(params.status));
    if (params.page) q.push("page=" + encodeURIComponent(params.page));
    if (params.limit) q.push("limit=" + encodeURIComponent(params.limit));
    var qs = q.length ? ("?" + q.join("&")) : "";
    return pcPublicFetch("/jobs/public/all" + qs);
  }

  /** GET /jobs/public/slug/:slug — single job by slug. */
  function fetchPublicJobBySlug(slug) {
    return pcPublicFetch("/jobs/public/slug/" + encodeURIComponent(slug));
  }

  // ---- Countries ----

  /** GET /mst-country/search — list of countries (paginated). */
  function fetchCountries(params) {
    params = params || {};
    var q = [];
    q.push("page=" + encodeURIComponent(params.page || 1));
    q.push("limit=" + encodeURIComponent(params.limit || 100));
    return pcPublicFetch("/mst-country/search?" + q.join("&"));
  }

  // ---- Feedback / demo requests ----

  /** POST /feedbacks — submit a public feedback / demo-request entry. */
  function submitFeedback(payload) {
    return pcPublicFetch("/feedbacks", { method: "POST", body: payload });
  }

  // ---- Companies ----

  /** GET /public/mst-companies/:id — public company details. */
  function fetchPublicCompany(id) {
    return pcPublicFetch("/public/mst-companies/" + encodeURIComponent(id));
  }

  // ---- Utilities for UI rendering ----

  /** Build an absolute media URL from company_logo_url (which may be relative). */
  function resolveMediaUrl(urlOrPath) {
    if (!urlOrPath) return "";
    if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
    var base = getApiBase();
    if (urlOrPath[0] === "/") return base + urlOrPath;
    return base + "/" + urlOrPath;
  }

  /** "3 days ago" style relative time from an ISO date string. */
  function timeAgo(isoDate) {
    if (!isoDate) return "";
    var then = new Date(isoDate).getTime();
    if (!then) return "";
    var diffMs = Date.now() - then;
    var sec = Math.max(1, Math.floor(diffMs / 1000));
    if (sec < 60) return "just now";
    var min = Math.floor(sec / 60);
    if (min < 60) return min + " min ago";
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + " hr ago";
    var d = Math.floor(hr / 24);
    if (d < 7) return d + " day" + (d === 1 ? "" : "s") + " ago";
    var w = Math.floor(d / 7);
    if (w < 5) return w + " wk" + (w === 1 ? "" : "s") + " ago";
    var mo = Math.floor(d / 30);
    if (mo < 12) return mo + " mo ago";
    var y = Math.floor(d / 365);
    return y + " yr" + (y === 1 ? "" : "s") + " ago";
  }

  /** Stable initials (max 2 chars) from a company name. */
  function initials(name) {
    if (!name) return "?";
    var parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(function (p) { return p[0] || ""; }).join("").toUpperCase() || "?";
  }

  /** Deterministic brand-family gradient pair seeded by an ID — keeps cards colorful + consistent. */
  function gradientForId(id) {
    var palette = [
      ["#1E4BA8", "#3A66D1"],
      ["#0F2352", "#1E4BA8"],
      ["#3A66D1", "#22C55E"],
      ["#EA580C", "#F97316"],
      ["#7C3AED", "#A78BFA"],
      ["#0D9488", "#22C55E"],
      ["#B91C1C", "#F97316"],
      ["#1E3A8A", "#3A66D1"],
    ];
    var s = String(id || "");
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  }

  // Expose
  window.PcApi = {
    getApiBase: getApiBase,
    pcPublicFetch: pcPublicFetch,
    extractErrorMessage: extractErrorMessage,
    fetchPublicJobs: fetchPublicJobs,
    fetchPublicJobBySlug: fetchPublicJobBySlug,
    fetchCountries: fetchCountries,
    submitFeedback: submitFeedback,
    fetchPublicCompany: fetchPublicCompany,
    resolveMediaUrl: resolveMediaUrl,
    timeAgo: timeAgo,
    initials: initials,
    gradientForId: gradientForId,
  };
})();
