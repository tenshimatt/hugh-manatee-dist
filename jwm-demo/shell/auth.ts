/**
 * NextAuth v5 configuration — Authentik OIDC integration.
 *
 * Flow:
 *   Landing page "Sign in with sovereign.ai"
 *     → /api/auth/signin/authentik
 *     → redirects to https://auth.beyondpandora.com/application/o/authorize/...
 *     → user authenticates against Authentik (PCT 105)
 *     → callback to /api/auth/callback/authentik
 *     → JWT session cookie set
 *     → redirect to /dashboard (configured in authorized() below)
 *
 * Env vars required (see .env.local):
 *   AUTH_SECRET               — session JWT secret (openssl rand -base64 32)
 *   AUTH_TRUST_HOST           — "true" when running behind Traefik / proxy
 *   AUTHENTIK_ISSUER          — OIDC issuer URL (trailing slash)
 *   AUTHENTIK_CLIENT_ID       — confidential client id
 *   AUTHENTIK_CLIENT_SECRET   — confidential client secret
 *
 * Stub fallback: the existing /api/auth/stub POST endpoint still works and
 * sets a legacy `jwm_session` cookie. Middleware honours either the NextAuth
 * session or the stub cookie so the demo cannot fail closed on Authentik.
 */
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

const issuer = process.env.AUTHENTIK_ISSUER ?? "";

export const authConfig: NextAuthConfig = {
  // NextAuth v5 reads AUTH_SECRET automatically, but we set it explicitly so
  // TypeScript users can see the contract.
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  // Intentionally NOT setting pages.signIn — the client calls
  // signIn("authentik") directly, which handles CSRF + POST. Overriding
  // signIn to "/" made NextAuth redirect GET /api/auth/signin/authentik
  // back to "/" instead of starting the OIDC flow → Configuration error.
  providers: [
    {
      id: "authentik",
      name: "sovereign.ai (Authentik)",
      type: "oidc",
      issuer,
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
      checks: ["pkce", "state"],
      // Authentik returns `name` (full name), `preferred_username`, `email`,
      // `sub`, `groups`. Map to the canonical NextAuth user shape.
      profile(profile: Record<string, unknown>) {
        return {
          id: String(profile.sub ?? ""),
          name: (profile.name as string) || (profile.preferred_username as string) || "",
          email: (profile.email as string) || "",
          image: (profile.picture as string) || null,
          // Stash groups on the user object so JWT callback can persist them.
          groups: (profile.groups as string[]) || [],
          username: (profile.preferred_username as string) || "",
        } as unknown as import("next-auth").User;
      },
    },
  ],
  callbacks: {
    async jwt({ token, user, profile }) {
      const t = token as Record<string, unknown>;
      if (user) {
        t.name = user.name;
        t.email = user.email;
        t.picture = user.image ?? null;
        t.groups = (user as { groups?: string[] }).groups ?? [];
        t.username = (user as { username?: string }).username ?? "";
      }
      if (profile) {
        t.groups = (profile as { groups?: string[] }).groups ?? t.groups ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as Record<string, unknown>;
      if (session.user) {
        const u = session.user as typeof session.user & {
          groups?: string[];
          username?: string;
        };
        u.name = (t.name as string | undefined) ?? session.user.name;
        u.email = (t.email as string | undefined) ?? session.user.email;
        u.image = (t.picture as string | null | undefined) ?? null;
        u.groups = (t.groups as string[] | undefined) ?? [];
        u.username = (t.username as string | undefined) ?? "";
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
