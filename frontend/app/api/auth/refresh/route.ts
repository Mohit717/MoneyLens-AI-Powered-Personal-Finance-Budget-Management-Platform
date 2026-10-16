import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "No refresh token available" },
        { status: 401 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${backendUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken}`,
        "x-refresh-token": refreshToken,
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.data?.accessToken) {
      const response = NextResponse.json(
        { success: false, message: data?.message || "Refresh failed" },
        { status: 401 }
      );
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      response.cookies.delete("userProfile");
      response.cookies.delete("session");
      return response;
    }

    const newAccessToken = data.data.accessToken;
    const newRefreshToken = data.data.refreshToken || refreshToken;

    const response = NextResponse.json(
      {
        success: true,
        message: "Token rotated successfully",
        accessToken: newAccessToken,
      },
      { status: 200 }
    );

    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 mins
    });

    if (newRefreshToken) {
      response.cookies.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (err) {
    console.error("Refresh route error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

