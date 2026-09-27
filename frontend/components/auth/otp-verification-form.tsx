"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { verifyOtpUserAction, resendOtpUserAction } from "@/app/actions/auth";
import { verifyOtpSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OtpVerificationForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [isPending, startTransition] = useTransition();
  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer for Resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first input box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric digit
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Take the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input box on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const code = otp.join("");
    const validationResult = verifyOtpSchema.safeParse({ email, code });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message;
      setError(firstError || "Invalid OTP verification code");
      return;
    }

    startTransition(async () => {
      const res = await verifyOtpUserAction(validationResult.data);
      if (res.success) {
        setSuccess(t("otpSuccess"));
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setError(res.message);
      }
    });
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setError(null);
    setSuccess(null);
    setIsResending(true);

    try {
      const res = await resendOtpUserAction(email);
      if (res.success) {
        setSuccess("A new 6-digit OTP verification code has been sent to your email.");
        setResendCooldown(60);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "Could not resend OTP code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full border-border/60 shadow-xl backdrop-blur-xs bg-card/95">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t("verifyEmailTitle")}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t("verifyEmailSubtitle")}
          {email && (
            <span className="block font-medium text-foreground mt-0.5">{email}</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive font-medium border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Input Boxes */}
          <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-12 text-center text-lg font-bold shadow-xs focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isPending || otp.join("").length !== 6}
            className="w-full h-10 text-sm font-semibold cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("verifying")}
              </>
            ) : (
              t("verifyButton")
            )}
          </Button>
        </form>

        {/* Resend OTP Section */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <span>{t("didNotReceiveCode")}{" "}</span>
          {resendCooldown > 0 ? (
            <span className="font-medium text-foreground">
              {t("resendIn")} {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isResending && <RefreshCw className="h-3 w-3 animate-spin" />}
              {t("resendCode")}
            </button>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t border-border/40 pt-4 pb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("backToLogin")}
        </Link>
      </CardFooter>
    </Card>
  );
}

