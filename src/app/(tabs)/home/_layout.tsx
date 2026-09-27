import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function HomeStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bgApp } }} />;
}
