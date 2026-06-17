import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/Screen';
import { ApiStatus } from '@/components/ui/ApiStatus';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { ApiError } from '@/lib/api';
import { login as loginUser, storeTokens } from '@/lib/auth';
import { loginSchema, type LoginValues } from '@/lib/validation';

export default function LoginScreen() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const tokens = await loginUser(values);
      await storeTokens(tokens);
      await refresh();
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(
          err.status === 401 ? 'Incorrect email or password.' : err.message,
        );
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <Screen scroll centered contentClassName="gap-5">
      <Card className="w-full max-w-md self-center">
        <CardContent className="gap-6 p-7">
          <View className="gap-1">
            <Text variant="display" weight="bold" className="text-3xl text-ink">
              Welcome back
            </Text>
            <Text variant="body" className="text-subtle">
              Sign in to pick up where you left off.
            </Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="john@example.com"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  secureTextEntry
                  autoComplete="password"
                  placeholder="Your password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            {formError ? (
              <View className="rounded-lg border-[2.5px] border-primary bg-primary/10 px-4 py-2">
                <Text variant="body" weight="bold" className="text-sm text-primary">
                  {formError}
                </Text>
              </View>
            ) : null}

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              className="w-full"
            >
              Sign in
            </Button>
          </View>

          <Text variant="body" className="text-center text-sm text-subtle">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register">
              <Text variant="body" weight="bold" className="text-primary">
                Create an account
              </Text>
            </Link>
          </Text>
        </CardContent>
      </Card>

      <ApiStatus />
    </Screen>
  );
}
