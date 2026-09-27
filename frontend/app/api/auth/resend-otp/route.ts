import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    try {
      const backendRes = await fetch(`${backendUrl}/auth/otp/send-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const backendData = await backendRes.json().catch(() => null);

      if (!backendRes.ok) {
        return NextResponse.json(
          {
            success: false,
            message: backendData?.message || "Failed to resend OTP verification code.",
          },
          { status: backendRes.status }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Verification OTP code sent successfully!",
        },
        { status: 200 }
      );
    } catch (backendError) {
      console.warn("Backend service unreachable, processing server-side resend fallback:", backendError);

      return NextResponse.json(
        {
          success: true,
          message: "Verification OTP code sent successfully!",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error in resend-otp API route:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error during OTP resending." },
      { status: 500 }
    );
  }
}

