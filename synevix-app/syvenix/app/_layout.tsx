import { Stack } from "expo-router";
import { useEffect, useState, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { View, Animated, StyleSheet } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

SplashScreen.preventAutoHideAsync();

// Create a single client instance
const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function prepareApp() {
      try {
        await Font.loadAsync({
          "Montserrat-Light": require("../assets/fonts/Montserrat-Light.ttf"),
          "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
          "Montserrat-Bold": require("../assets/fonts/Montserrat-Bold.ttf"),
          "Montserrat-SemiBold": require("../assets/fonts/Montserrat-SemiBold.ttf"),
        });
        await new Promise((res) => setTimeout(res, 1000));
        setFontsLoaded(true);
        Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 1800, 
          useNativeDriver: true 
        }).start();
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    prepareApp();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.splashContainer}>
        <Animated.Image
          source={require("../assets/images/synevix-logo.png")}
          style={[styles.splashImage, { opacity: fadeAnim }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {!isLoggedIn ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth/SignInScreen" />
        </Stack>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="screens" />
        </Stack>
      )}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#fff",
  },
  splashImage: { 
    width: 250, 
    height: 250 
  },
});