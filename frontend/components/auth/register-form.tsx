"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { registerUserAction } from "@/app/actions/auth";
import { registerSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPasswordStrength } from "@/utils/constants";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationResult = registerSchema.safeParse(formData);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message;
      setError(firstError || "Invalid registration input");
      return;
    }

    startTransition(async () => {
      const res = await registerUserAction({
        name: validationResult.data.name,
        email: validationResult.data.email,
        password: validationResult.data.password,
      });
      if (res.success) {
        setSuccess(
          "Account created successfully! Redirecting to email verification...",
        );
        setTimeout(() => {
          router.push(
            `/verify-otp?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`,
          );
        }, 1500);
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <Card className="w-full border-border/60 shadow-xl backdrop-blur-xs bg-card/95">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t("createAccount")}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t("registerSubtitle")}
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
          <div className="space-y-2">
            <Label htmlFor="name">{t("fullName")}</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t("fullNamePlaceholder")}
                value={formData.name}
                onChange={handleChange}
                className="pl-9 h-10 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={formData.email}
                onChange={handleChange}
                className="pl-9 h-10 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
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
            {formData.password && (
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
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-9 pr-9 h-10 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-1">
            <Checkbox
              id="terms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, agreeTerms: !!checked })
              }
              className="mt-0.5"
            />
            <label
              htmlFor="terms"
              className="text-xs text-muted-foreground leading-snug cursor-pointer"
            >
              {t("agreeToTerms")}
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="w-full h-10 text-sm font-semibold cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("creatingAccount")}
              </>
            ) : (
              t("signUp")
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            type="button"
            className="w-full h-9 text-xs cursor-pointer"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </Button>

          <Button
            variant="outline"
            type="button"
            className="w-full h-9 text-xs cursor-pointer"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            GitHub
          </Button>
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t border-border/40 pt-4 pb-6">
        <p className="text-xs text-muted-foreground text-center">
          {t("alreadyHaveAccount")}{" "}
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
