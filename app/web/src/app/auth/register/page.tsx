"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { register as registerUser, storeTokens } from "@/lib/auth";
import { registerSchema, type RegisterValues } from "@/lib/validation";
import { ApiStatus } from "@/components/ui/ApiStatus";

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      const tokens = await registerUser(values);
      storeTokens(tokens);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(
          err.status === 409
            ? "This email or username is already taken."
            : err.message,
        );
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 sm:px-7 py-10 sm:py-12">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 p-7">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-display font-bold text-ink">
              Create an account
            </h1>
            <p className="font-body text-subtle">
              Join Spinout and spin your first wheel.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <Input
              label="Username"
              type="text"
              autoComplete="username"
              placeholder="your_username"
              error={errors.username?.message}
              {...register("username")}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="8 characters minimum"
              error={errors.password?.message}
              {...register("password")}
            />

            {formError && (
              <p
                role="alert"
                className="bg-primary/10 border-[2.5px] border-primary rounded-lg px-4 py-2 font-body font-bold text-sm text-primary"
              >
                {formError}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Create my account"}
            </Button>
          </form>

          <p className="font-body text-sm text-subtle text-center">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-bold text-primary underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
      <ApiStatus />
    </main>
  );
}
