"use server";

import { ActionResult, LoginActionInput, RegisterActionInput, ResetPasswordActionInput, VerifyOtpActionInput } from "@/utils/types";
import { cookies } from "next/headers";
import { apiCall } from "@/lib/apiClient";
import {
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
} from "@/lib/validations/auth";
import { z } from "zod";

const serverRegisterSchema = z.object({
  name: z.string().trim().min(2, "Full Name must be at least 2 characters long."),
  email: z.string().trim().min(1, "Email is required.").email("A valid email address is required."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

/**
 * Server Action: Register User
 */
export async function registerUserAction(input: RegisterActionInput): Promise<ActionResult> {
  const validation = serverRegisterSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message || "Invalid input." };
  }

  const { name, email, password } = validation.data;

  const res = await apiCall("/auth/register", {
    method: "POST",
    body: {
      name,
      email: email.toLowerCase(),
      password,
    },
  });

  if (!res.ok) {
    return {
      success: false,
      message: res.message || "Registration failed. Email may already be registered.",
    };
  }

  return {
    success: true,
    message: "Account created successfully!",
    user: res.data?.data?.user || res.data?.user || { email, name },
  };
}

/**
 * Server Action: Login User & Set Cookies
 */
export async function loginUserAction(input: LoginActionInput): Promise<ActionResult> {
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message || "Invalid email or password." };
  }

  const { email, password, rememberMe } = input;

  const res = await apiCall("/auth/login", {
    method: "POST",
    body: {
      email: email.trim().toLowerCase(),
      password,
    },
  });

  if (!res.ok) {
    return {
      success: false,
      message: res.message || "Invalid email or password.",
    };
  }

  const cookieStore = await cookies();
  const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
  const refreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;
  const userObj = res.data?.data?.user || res.data?.user || { email };

  const name = userObj.name || email.split("@")[0];
  const userEmail = userObj.email || email;

  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

  if (accessToken) {
    cookieStore.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
  }

  if (refreshToken) {
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  }

  cookieStore.set("userProfile", JSON.stringify({ name, email: userEmail }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return {
    success: true,
    message: "Login successful!",
    user: { name, email: userEmail },
  };
}

/**
 * Server Action: Get Current Logged-in User Profile
 */
export async function getCurrentUserAction(): Promise<{ name: string; email: string; avatarFallback: string } | null> {
  const cookieStore = await cookies();
  const userProfileRaw = cookieStore.get("userProfile")?.value;

  if (userProfileRaw) {
    try {
      const parsed = JSON.parse(userProfileRaw);
      const name = parsed.name || parsed.email?.split("@")[0] || "User";
      const email = parsed.email || "";
      const avatarFallback = (name.charAt(0) || email.charAt(0) || "U").toUpperCase();
      return { name, email, avatarFallback };
    } catch {
      // fallback if parse fails
    }
  }

  const accessToken = cookieStore.get("accessToken")?.value;
  if (accessToken) {
    const res = await apiCall("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok && res.data?.data?.user) {
      const user = res.data.data.user;
      const name = user.name || user.email?.split("@")[0] || "User";
      const email = user.email || "";
      const avatarFallback = (name.charAt(0) || email.charAt(0) || "U").toUpperCase();

      cookieStore.set("userProfile", JSON.stringify({ name, email }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return { name, email, avatarFallback };
    }
  }

  return null;
}

/**
 * Server Action: Verify OTP Code
 */
export async function verifyOtpUserAction(input: VerifyOtpActionInput): Promise<ActionResult> {
  const validation = verifyOtpSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message || "Invalid verification input." };
  }

  const { email, code } = validation.data;

  const res = await apiCall("/auth/otp/verify-email", {
    method: "POST",
    body: {
      email: email.toLowerCase(),
      code,
    },
  });

  if (!res.ok) {
    return {
      success: false,
      message: res.message || "Invalid or expired verification code.",
    };
  }

  return {
    success: true,
    message: "Email verified successfully!",
  };
}

/**
 * Server Action: Resend Verification OTP
 */
export async function resendOtpUserAction(email: string): Promise<ActionResult> {
  const validation = resendOtpSchema.safeParse({ email });
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message || "Invalid email address." };
  }

  const res = await apiCall("/auth/otp/send-verification", {
    method: "POST",
    body: {
      email: email.trim().toLowerCase(),
    },
  });

  if (!res.ok) {
    return {
      success: false,
      message: res.message || "Failed to resend verification code.",
    };
  }

  return {
    success: true,
    message: "Verification code sent!",
  };
}

/**
 * Server Action: Forgot Password
 */
export async function forgotPasswordUserAction(email: string): Promise<ActionResult> {
  const validation = forgotPasswordSchema.safeParse({ email });
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message || "Invalid email address." };
  }

  const res = await apiCall("/auth/otp/forgot-password", {
    method: "POST",
    body: {
      email: email.trim().toLowerCase(),
    },
  });

  if (!res.ok) {
    return {
      success: false,
      message: res.message || "Failed to request password reset code.",
    };
  }

  return {
    success: true,
    message: "Password reset code sent!",
  };
}

/**
 * Server Action: Reset Password
 */
export async function resetPasswordUserAction(input: ResetPasswordActionInput): Promise<ActionResult> {
  const serverResetPasswordSchema = z.object({
    email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
    code: z.string().trim().length(6, "Reset code must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  });

  const validation = serverResetPasswordSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message || "Invalid reset input." };
  }

  const { email, code, newPassword } = validation.data;

  const res = await apiCall("/auth/otp/reset-password", {
    method: "POST",
    body: {
      email: email.toLowerCase(),
      code,
      newPassword,
    },
  });

  if (!res.ok) {
    return {
      success: false,
      message: res.message || "Password reset failed. Please check your code.",
    };
  }

  return {
    success: true,
    message: "Password reset successfully!",
  };
}

/**
 * Server Action: Logout User & Delete Cookies
 */
export async function logoutUserAction(): Promise<ActionResult> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  const accessToken = cookieStore.get("accessToken")?.value;

  await apiCall("/auth/logout", {
    method: "POST",
    headers: {
      Cookie: `refreshToken=${refreshToken || ""}; accessToken=${accessToken || ""}`,
    },
  });

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("userProfile");
  cookieStore.delete("session");

  return {
    success: true,
    message: "Logged out successfully.",
  };
}

