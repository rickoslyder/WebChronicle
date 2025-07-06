export default {
  async fetch(request, env) {
    // This will be handled by Cloudflare's static asset serving
    // The worker is just a placeholder
    return env.ASSETS.fetch(request);
  },
};