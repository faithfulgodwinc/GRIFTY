import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// Validate environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client with enhanced error handling
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Handle app state for token refresh with error handling
let appStateSubscription: any;

try {
  appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh().catch((error) => {
        console.warn('Failed to start auto refresh:', error);
      });
    } else {
      supabase.auth.stopAutoRefresh().catch((error) => {
        console.warn('Failed to stop auto refresh:', error);
      });
    }
  });
} catch (error) {
  console.warn('Failed to set up app state listener:', error);
}

// Cleanup function for app state listener
export const cleanupSupabaseListeners = () => {
  if (appStateSubscription?.remove) {
    appStateSubscription.remove();
  }
};
