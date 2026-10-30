/* Cloudflare Pages Function — GET /api/status
   Replaces the old Worker route from src/worker.js. */
export const onRequest = () =>
  Response.json({
    message: "MSKDevHub: HTML, CSS, JavaScript and Cloudflare Pages connected!",
  });
