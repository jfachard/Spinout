import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import { FerrisWheel } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { parseJoinCode } from '@/lib/join';

export default function JoinScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const scanned = useRef(false);

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scanned.current) return;
      const code = parseJoinCode(data);
      if (!code) {
        setError('Invalid QR code. Scan a Spinout session link.');
        return;
      }
      scanned.current = true;
      router.replace({ pathname: '/', params: { join: code } });
    },
    [router],
  );

  return (
    <View className="flex-1 bg-[#1B1410]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Stack.Screen options={{ title: 'Scan QR', headerShown: false }} />

      <View className="flex-1 items-center justify-center px-8">
        <Text variant="display" weight="extrabold" className="mb-8 text-center text-xl text-paper">
          Scan a Spinout code
        </Text>

        {!permission ? (
          <Text variant="body" weight="semibold" className="text-paper">
            Checking camera permission…
          </Text>
        ) : !permission.granted ? (
          <View className="w-full max-w-xs gap-4">
            <Text variant="body" weight="semibold" className="text-center text-paper">
              Camera access is needed to scan session QR codes.
            </Text>
            <Pressable
              onPress={requestPermission}
              className="items-center rounded-[13px] border-[2.5px] border-paper bg-amber px-5 py-3"
            >
              <Text variant="display" weight="bold" className="text-ink">
                Allow camera
              </Text>
            </Pressable>
            <Pressable onPress={() => router.back()} className="items-center py-2">
              <Text variant="body" weight="extrabold" className="text-[#9A8876]">
                Cancel
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="relative h-[230px] w-[230px] overflow-hidden rounded-3xl bg-[#2A2018]">
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcode}
              />
              <View className="pointer-events-none absolute left-0 top-[8%] h-[3px] w-[84%] self-center bg-amber" style={{ left: '8%' }} />
              <View className="absolute inset-0 items-center justify-center">
                <View className="h-[60px] w-[60px] items-center justify-center rounded-xl bg-paper">
                  <FerrisWheel size={28} color="#3A2A24" strokeWidth={2.5} />
                </View>
              </View>
              <View className="pointer-events-none absolute left-0 top-0 h-[38px] w-[38px] rounded-tl-[18px] border-l-[5px] border-t-[5px] border-amber" />
              <View className="pointer-events-none absolute right-0 top-0 h-[38px] w-[38px] rounded-tr-[18px] border-r-[5px] border-t-[5px] border-amber" />
              <View className="pointer-events-none absolute bottom-0 left-0 h-[38px] w-[38px] rounded-bl-[18px] border-b-[5px] border-l-[5px] border-amber" />
              <View className="pointer-events-none absolute bottom-0 right-0 h-[38px] w-[38px] rounded-br-[18px] border-b-[5px] border-r-[5px] border-amber" />
            </View>

            <Text variant="body" weight="bold" className="mt-5 text-center text-[13.5px] text-[#C9B6A1]">
              Point at a friend&apos;s QR to join…
            </Text>

            {error ? (
              <Text variant="body" weight="bold" className="mt-3 text-center text-primary">
                {error}
              </Text>
            ) : null}

            <Pressable onPress={() => router.back()} className="mt-5 py-2">
              <Text variant="body" weight="extrabold" className="text-[#9A8876]">
                Cancel
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
