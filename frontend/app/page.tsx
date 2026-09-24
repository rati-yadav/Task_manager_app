import { redirect } from "next/navigation";

// Root route should not bypass auth.
// Middleware handles the real redirect logic for signed-in and signed-out users.
export default function RootPage() {
  redirect("/login");
}
