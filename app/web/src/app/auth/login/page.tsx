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
            ? "Email ou mot de passe incorrect."
            : err.message,
        );
      } else {
        setFormError("Une erreur est survenue. Réessaie.");
      }
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-7 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 p-7">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-display font-bold text-ink">
              Bon retour
            </h1>
            <p className="font-body text-subtle">
              Connecte-toi pour reprendre la partie.
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
              placeholder="toi@exemple.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              placeholder="Ton mot de passe"
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
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="font-body text-sm text-subtle text-center">
            Pas encore de compte ?{" "}
            <Link
              href="/auth/register"
              className="font-bold text-primary underline-offset-2 hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
