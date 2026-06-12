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
import { login as loginUser, storeTokens } from "@/lib/auth";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { ApiStatus } from "@/components/ui/ApiStatus";

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const tokens = await loginUser(values);
      storeTokens(tokens);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(
          err.status === 401
            ? "Incorrect email or password."
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
              Welcome back
            </h1>
            <p className="font-body text-subtle">
              Sign in to pick up where you left off.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
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
              autoComplete="current-password"
              placeholder="Your password"
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
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="font-body text-sm text-subtle text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-bold text-primary underline-offset-2 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
      <ApiStatus />
    </main>
  );
}
