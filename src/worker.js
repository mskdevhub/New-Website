export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/status") {
            return Response.json({
                message: "DevLab: HTML, CSS, JavaScript and Cloudflare Worker connected!"
            });
        }

        return env.ASSETS.fetch(request);
    }
};