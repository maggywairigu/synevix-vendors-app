import { View, Text, StyleSheet, Image, Animated, Easing } from "react-native"
import { useEffect, useRef } from "react"
import { COLORS } from "@/constants/Colors"

export default function SplashScreen() {
  const progressWidth = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Animate loading bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressWidth, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressWidth, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start()
  }, [])

  const widthInterpolate = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["10%", "90%"],
  })

  return (
    <View style={styles.container}>
      {/* App Logo */}
      <View style={styles.logoContainer}>
        {/* <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        /> */}
        <Text style={styles.appName}>Syvenix</Text>
        <Text style={styles.tagline}>Inventory Management</Text>
      </View>

      {/* Animated Loading Indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              { width: widthInterpolate },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Initializing your dashboard...</Text>
      </View>

      {/* Company Info */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>v1.0.0</Text>
        <Text style={styles.companyText}>© 2024 Syvenix Inc.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textLight,
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 280,
  },
  loadingBar: {
    width: "100%",
    height: 4,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  loadingProgress: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textLight,
    opacity: 0.6,
    marginBottom: 4,
  },
  companyText: {
    fontSize: 12,
    color: COLORS.textLight,
    opacity: 0.5,
  },
})