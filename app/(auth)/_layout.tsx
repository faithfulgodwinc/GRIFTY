import { Stack } from 'expo-router';
import { GuestLayout } from '@fastshot/auth';

export default function AuthLayout() {
  return (
    <GuestLayout redirectTo="/(tabs)">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </GuestLayout>
  );
}
