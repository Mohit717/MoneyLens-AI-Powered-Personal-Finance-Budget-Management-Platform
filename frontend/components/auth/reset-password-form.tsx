"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import { resetPasswordUserAction } from "@/app/actions/auth";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPasswordStrength } from "@/utils/constants";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    email: initialEmail,
    newPassword: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const strength = getPasswordStrength(formData.newPassword);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleChangeData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const code = otp.join("");
    const validationResult = resetPasswordSchema.safeParse({
      ...formData,
      code,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message;
      setError(firstError || "Invalid password reset data");
      return;
    }

    startTransition(async () => {
      const res = await resetPasswordUserAction({
        email: validationResult.data.email,
        code: validationResult.data.code,
        newPassword: validationResult.data.newPassword,
      });
      if (res.success) {
        setSuccess(t("resetSuccess"));
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <Card className="w-full border-border/60 shadow-xl backdrop-blur-xs bg-card/95">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t("resetPasswordTitle")}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t("resetPasswordSubtitle")}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-10 text-sm"
                required
              />
            </div>
          </div> */}

          {/* 6 Digit OTP Input */}
          <div className="space-y-2">
            <Label>6-Digit Reset Code</Label>
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
                  className="h-11 text-center text-lg font-bold shadow-xs focus:ring-2 focus:ring-primary"
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("newPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={handleChangeData}
                className="pl-9 pr-9 h-10 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password Strength Meter */}
            {formData.newPassword && (
              <div className="space-y-1 pt-1">
                <div className="flex h-1.5 w-full gap-1">
                  <div
                    className={`h-full flex-1 rounded-full transition-all ${
                      strength >= 1 ? "bg-red-500" : "bg-muted"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full transition-all ${
                      strength >= 2 ? "bg-yellow-500" : "bg-muted"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full transition-all ${
                      strength >= 3 ? "bg-emerald-500" : "bg-muted"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChangeData}
                className="pl-9 pr-9 h-10 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
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
                {t("resettingPassword")}
              </>
            ) : (
              t("resetPasswordButton")
            )}
          </Button>
        </form>
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
