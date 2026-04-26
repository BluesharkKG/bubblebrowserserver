/**
 * Cloudflare Worker entrypoint.
 * Uses native Workers APIs only (no Express/frameworks).
 */

// Restrict cross-origin access to the requested frontend origin.
const ALLOWED_ORIGIN = "https://bubblebrowser.netlify.app";

// Shared CORS headers for all API responses.
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Helper to return JSON responses with consistent headers.
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}

export default {
  /**
   * Modern Cloudflare Workers fetch handler.
   */
  async fetch(request) {
    const url = new URL(request.url);

    // Handle CORS preflight requests.
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // GET /api/health -> basic health check.
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ status: "ok" });
    }

    // GET /api/data -> sample JSON payload.
    if (request.method === "GET" && url.pathname === "/api/data") {
      return json({
        message: "Sample data from Cloudflare Worker",
        items: ["alpha", "beta", "gamma"],
        timestamp: new Date().toISOString(),
      });
    }

    // POST /api/data -> parse JSON body and echo it back.
    if (request.method === "POST" && url.pathname === "/api/data") {
      try {
        const body = await request.json();
        return json({
          received: body,
          echoedAt: new Date().toISOString(),
        });
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }
    }

    // Fallback for unknown routes.
    return json({ error: "Not found" }, 404);
  },
};
