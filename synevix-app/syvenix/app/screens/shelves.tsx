import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { COLORS } from "@/constants/Colors"

export default function ShelvesScreen() {
  const shelves = [
    { id: "1", name: "Shelf A-01", items: 45, status: "Full" },
    { id: "2", name: "Shelf A-02", items: 32, status: "Available" },
    { id: "3", name: "Shelf B-01", items: 28, status: "Available" },
    { id: "4", name: "Shelf B-02", items: 10, status: "Low" },
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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Shelves</Text>
            <TouchableOpacity>
              <Ionicons name="add-circle" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Shelves List */}
        <View style={styles.shelvesContainer}>
          {shelves.map((shelf) => (
            <TouchableOpacity key={shelf.id} style={styles.shelfCard}>
              <View style={styles.shelfInfo}>
                <Text style={styles.shelfName}>{shelf.name}</Text>
                <Text style={styles.shelfItems}>{shelf.items} items</Text>
              </View>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        shelf.status === "Full" ? "#FFE0E0" : shelf.status === "Low" ? "#FFF8E0" : "#E0F0FF",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          shelf.status === "Full"
                            ? COLORS.error
                            : shelf.status === "Low"
                              ? COLORS.warning
                              : COLORS.primary,
                      },
                    ]}
                  >
                    {shelf.status}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
              </View>
            </TouchableOpacity>
          ))}
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
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  shelvesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  shelfCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shelfInfo: {
    flex: 1,
  },
  shelfName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  shelfItems: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
})
