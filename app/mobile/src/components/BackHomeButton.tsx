import { useRouter } from 'expo-router';

import { Button, type ButtonProps } from '@/components/ui/Button';

type BackHomeButtonProps = Omit<ButtonProps, 'children' | 'onPress'>;

export function BackHomeButton(props: BackHomeButtonProps) {
  const router = useRouter();

  return (
    <Button variant="secondary" {...props} onPress={() => router.replace('/')}>
      Back home
    </Button>
  );
}
