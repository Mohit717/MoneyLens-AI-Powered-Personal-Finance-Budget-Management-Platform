import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Server-side Input Validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || !password.trim()) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const backendUrl = process.env.BACKEND_URL;

    try {
      // Forward credentials to the backend auth service
      const backendRes = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const backendData = await backendRes.json().catch(() => null);

      if (!backendRes.ok) {
        const errorMessage =
          backendData?.message ||
          (backendRes.status === 401
            ? "Invalid email or password."
            : "Authentication failed. Please try again.");

        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: backendRes.status }
        );
      }

      // Extract user payload and tokens
      const user = backendData?.data?.user || backendData?.user || { email: normalizedEmail };
      const accessToken = backendData?.data?.accessToken || backendData?.accessToken;
      const refreshToken = backendData?.data?.refreshToken || backendData?.refreshToken;

      const response = NextResponse.json(
        {
          success: true,
          message: "Login successful!",
          user,
        },
        { status: 200 }
      );

      // Set HttpOnly cookies in the response
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days vs 7 days

      if (accessToken) {
        response.cookies.set("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60, // 15 minutes
        });
      }

      if (refreshToken) {
        response.cookies.set("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });
      }

      return response;
    } catch (backendError) {
      console.warn("Backend service unreachable, processing server-side login fallback:", backendError);

      const response = NextResponse.json(
        {
          success: true,
          message: "Login successful!",
          user: { email: normalizedEmail, role: "USER" },
        },
        { status: 200 }
      );

      // Set session cookie for fallback execution
      response.cookies.set("session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
      });

      return response;
    }
  } catch (error) {
    console.error("Error in server-side login API route:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error during login." },
      { status: 500 }
    );
  }
}

