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
            ? "Cet email ou nom d'utilisateur existe déjà."
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
              Créer un compte
            </h1>
            <p className="font-body text-subtle">
              Rejoins Spinout et lance ta première roulette.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <Input
              label="Nom d'utilisateur"
              type="text"
              autoComplete="username"
              placeholder="ton_pseudo"
              error={errors.username?.message}
              {...register("username")}
            />
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
              autoComplete="new-password"
              placeholder="8 caractères minimum"
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
              {isSubmitting ? "Création..." : "Créer mon compte"}
            </Button>
          </form>

          <p className="font-body text-sm text-subtle text-center">
            Déjà un compte ?{" "}
            <Link
              href="/auth/login"
              className="font-bold text-primary underline-offset-2 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
