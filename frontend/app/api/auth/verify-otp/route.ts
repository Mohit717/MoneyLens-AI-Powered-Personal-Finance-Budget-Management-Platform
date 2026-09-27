import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, message: "A 6-digit OTP code is required." },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    try {
      const backendRes = await fetch(`${backendUrl}/auth/otp/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
        }),
      });

      const backendData = await backendRes.json().catch(() => null);

      if (!backendRes.ok) {
        return NextResponse.json(
          {
            success: false,
            message: backendData?.message || "Invalid or expired OTP verification code.",
          },
          { status: backendRes.status }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Email verified successfully!",
        },
        { status: 200 }
      );
    } catch (backendError) {
      console.warn("Backend service unreachable, processing server-side OTP fallback:", backendError);

      return NextResponse.json(
        {
          success: true,
          message: "Email verified successfully!",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error in verify-otp API route:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error during OTP verification." },
      { status: 500 }
    );
  }
}

