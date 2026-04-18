import { redirect } from "next/navigation";

// Auth happens upstream at Traefik + Authentik. If a user hits this app,
// they're already authenticated. Go straight to the dashboard.
export default function Home() {
  redirect("/dashboard");
}
