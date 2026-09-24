import { redirect } from "next/navigation";

// Root "/" redirects to the dashboard.
// Middleware handles auth — unauthenticated users get sent to /login.
export default function RootPage() {
  redirect("/dashboard");
}
