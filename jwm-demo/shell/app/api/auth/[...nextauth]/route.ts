/**
 * NextAuth v5 catch-all route. Exposes:
 *   GET/POST /api/auth/signin
 *   GET/POST /api/auth/signin/authentik  (starts OIDC flow)
 *   GET       /api/auth/callback/authentik (OIDC callback)
 *   GET/POST /api/auth/signout
 *   GET       /api/auth/session
 *   GET       /api/auth/providers
 *
 * The stub at /api/auth/stub remains for demo-resilience fallback.
 */
export { GET, POST } from "@/auth-handlers";
