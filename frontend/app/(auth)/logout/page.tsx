import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function LogoutPage() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  const accessToken = cookieStore.get("accessToken")?.value;

  const backendUrl = process.env.BACKEND_URL;

  try {
    // Revoke token session on backend
    await fetch(`${backendUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken || ""}; accessToken=${accessToken || ""}`,
      },
    });
  } catch (error) {
    console.warn("Direct URL logout backend fallback:", error);
  }

  // Clear client cookies
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("session");

  // Server-side redirect to login
  redirect("/login");
}

