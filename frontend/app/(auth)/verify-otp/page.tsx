import React, { Suspense } from "react";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { Loader2 } from "lucide-react";

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OtpVerificationForm />
    </Suspense>
  );
}

