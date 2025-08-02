import React, { useEffect } from 'react';
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StatusBar, Platform } from "react-native";
import { useAuth } from '../(auth)/context/AuthContext';
import { router } from 'expo-router';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();

  useEffect(() => {
    if (!loading && role !== "customer") {
      router.replace("/(auth)/login");
    }
  }, [role, loading]);

  if (loading || role !== "customer") return null; // or loading spinner

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Optionally force status bar to dark content */}
        <StatusBar
          barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
          backgroundColor="#fff"
        />
        <Stack />
      </View>
    </SafeAreaProvider>
  );
}
function ScreenContentWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


