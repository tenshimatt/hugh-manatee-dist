// Re-export the NextAuth route handlers. Split from auth.ts so that the
// middleware file (Edge runtime) can import the lightweight `auth` function
// without pulling in all the Node-only provider code paths.
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
