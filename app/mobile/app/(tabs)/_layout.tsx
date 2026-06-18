import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

import { GameProvider } from '@/contexts/GameContext';
import { LobbyProvider } from '@/contexts/LobbyContext';

export default function TabLayout() {
  return (
    <LobbyProvider>
      <GameProvider>
      <NativeTabs tintColor="#E8643C" labelStyle={{ color: '#6B5B54' }}>
      <NativeTabs.Trigger name="lobby">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Lobby</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="spin">
        <Icon sf={{ default: 'arrow.triangle.2.circlepath', selected: 'arrow.triangle.2.circlepath' }} />
        <Label>Spin</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="recap">
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <Label>Recap</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
      </GameProvider>
    </LobbyProvider>
  );
}
