"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Mail, AlertCircle, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
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
import { forgotPasswordUserAction } from "@/app/actions/auth";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationResult = forgotPasswordSchema.safeParse({ email });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message;
      setError(firstError || "Invalid email address");
      return;
    }

    startTransition(async () => {
      const res = await forgotPasswordUserAction(validationResult.data.email);
      if (res.success) {
        setSuccess("Reset code sent! Redirecting to reset password page...");
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
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
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t("forgotPasswordTitle")}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t("forgotPasswordSubtitle")}
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
                {t("sendingCode")}
              </>
            ) : (
              t("sendResetCode")
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
