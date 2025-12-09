"use client"

import React from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { COLORS } from "@/constants/Colors"

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(false)

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: "person", label: "Profile", action: () => {} },
        { icon: "lock-closed", label: "Change Password", action: () => {} },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "notifications",
          label: "Notifications",
          toggle: true,
          value: notifications,
          onChange: setNotifications,
        },
        {
          icon: "moon",
          label: "Dark Mode",
          toggle: true,
          value: darkMode,
          onChange: setDarkMode,
        },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle", label: "Help & Support", action: () => {} },
        { icon: "document-text", label: "Terms & Conditions", action: () => {} },
      ],
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Settings</Text>
        </LinearGradient>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[styles.settingItem, itemIndex !== section.items.length - 1 && styles.settingItemBorder]}
                  onPress={item.action}
                >
                  <View style={styles.settingItemLeft}>
                    <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                    <Text style={styles.settingItemLabel}>{item.label}</Text>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onChange}
                      trackColor={{ false: COLORS.border, true: COLORS.primary }}
                      thumbColor={COLORS.white}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton}>
            <Ionicons name="log-out" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textLight,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingItemLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginVertical: 24,
  },
  logoutButton: {
    backgroundColor: `${COLORS.error}20`,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.error,
  },
})
