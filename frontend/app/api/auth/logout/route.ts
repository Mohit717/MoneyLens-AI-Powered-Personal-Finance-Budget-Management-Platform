import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    const accessToken = cookieStore.get("accessToken")?.value;

    const backendUrl = process.env.BACKEND_URL;

    try {
      // Forward logout request to backend service to revoke token family
      await fetch(`${backendUrl}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Cookie: `refreshToken=${refreshToken || ""}; accessToken=${accessToken || ""}`,
        },
      });
    } catch (backendError) {
      console.warn("Backend logout endpoint unreachable, clearing client cookies:", backendError);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully.",
      },
      { status: 200 }
    );

    // Clear all auth cookies
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    response.cookies.delete("session");

    return response;
  } catch (error) {
    console.error("Error in logout API route:", error);

    const response = NextResponse.json(
      { success: false, message: "Internal Server Error during logout." },
      { status: 500 }
    );

    // Ensure cookies are cleared even on error
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    response.cookies.delete("session");

    return response;
  }
}
