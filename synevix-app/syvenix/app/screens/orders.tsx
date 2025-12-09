"use client"

import { useState, useRef, useEffect } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Animated,
  Dimensions,
  Modal
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { COLORS } from "@/constants/Colors"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { router } from "expo-router"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

// Define workflows for each order type
const ORDER_TYPE_WORKFLOWS = {
  walkin: {
    label: "Walk-in",
    icon: "walk",
    description: "Customer collects in-store",
    statusFlow: ["pending", "payment_confirmed", "completed"],
    statusLabels: {
      pending: "Payment Pending",
      payment_confirmed: "Ready for Pickup",
      completed: "Completed"
    },
    statusColors: {
      pending: "#FF9800",
      payment_confirmed: "#4CAF50",
      completed: "#607D8B"
    }
  },
  pickup: {
    label: "Pickup",
    icon: "bag-handle",
    description: "Customer collects after packing",
    statusFlow: ["topack", "packed", "pickup_recorded", "payment_confirmed", "completed"],
    statusLabels: {
      topack: "To Pack",
      packed: "Ready for Pickup",
      pickup_recorded: "Pickup Recorded",
      payment_confirmed: "Payment Confirmed",
      completed: "Completed"
    },
    statusColors: {
      topack: "#FF9800",
      packed: "#4CAF50",
      pickup_recorded: "#2196F3",
      payment_confirmed: "#9C27B0",
      completed: "#607D8B"
    }
  },
  delivery: {
    label: "Delivery",
    icon: "bicycle",
    description: "Delivered to customer address",
    statusFlow: ["topack", "packed", "dispatched", "delivered", "completed"],
    statusLabels: {
      topack: "To Pack",
      packed: "Packed",
      dispatched: "Dispatched",
      delivered: "Delivered",
      completed: "Completed"
    },
    statusColors: {
      topack: "#FF9800",
      packed: "#4CAF50",
      dispatched: "#2196F3",
      delivered: "#9C27B0",
      completed: "#607D8B"
    }
  }
}

// Status categories that apply to all orders
const STATUS_CATEGORIES = [
  { id: "all", label: "All", color: COLORS.primary, icon: "list" },
  { id: "topack", label: "To Pack", color: "#FF9800", icon: "cube" },
  { id: "packed", label: "Packed", color: "#4CAF50", icon: "cube-outline" },
  { id: "pickup_ready", label: "Ready for Pickup", color: "#2196F3", icon: "bag-check" },
  { id: "dispatched", label: "Dispatched", color: "#9C27B0", icon: "car" },
  { id: "delivered", label: "Delivered", color: "#607D8B", icon: "checkmark-done" },
  { id: "completed", label: "Completed", color: "#4CAF50", icon: "checkmark-done-circle" },
]

const ORDER_TYPES = [
  { id: "all", label: "All Orders", icon: "list" },
  { id: "walkin", label: "Walk-in", icon: "walk" },
  { id: "pickup", label: "Pickup", icon: "bag-handle" },
  { id: "delivery", label: "Delivery", icon: "bicycle" },
]

const PAYMENT_TYPES = [
  { id: "all", label: "All Payments" },
  { id: "full", label: "Full Payment", color: "#4CAF50", icon: "checkmark-circle" },
  { id: "deposit", label: "Deposit", color: "#FF9800", icon: "time" },
  { id: "after", label: "After Delivery", color: "#F44336", icon: "alert-circle" },
]

export default function OrdersScreen() {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeOrderType, setActiveOrderType] = useState("all")
  const [activePaymentType, setActivePaymentType] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  
  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current
  const searchAnim = useRef(new Animated.Value(0)).current
  const cardAnim = useRef(new Animated.Value(0)).current
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === "active" ? 0 : 1,
      useNativeDriver: true,
      tension: 150,
      friction: 20,
    }).start()
  }, [activeTab])

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const orders = [
    // Walk-in Orders
    {
      id: "#W001",
      store: "TechStore Kenya",
      status: "pending",
      statusLabel: "Payment Pending",
      statusColor: "#FF9800",
      statusBg: "rgba(255, 152, 0, 0.1)",
      amount: "KES 3,400",
      time: "2 hours ago",
      items: [
        { name: "Packaging Boxes", qty: "30" },
        { name: "Bubble Wrap", qty: "5" },
      ],
      shelf: "#120",
      payment: "Full Payment",
      paymentId: "full",
      paymentStatus: "pending",
      orderType: "walkin",
      action: "Confirm Payment",
      priority: "High",
      progress: 30,
      workflow: ORDER_TYPE_WORKFLOWS.walkin,
      currentStep: 0,
      totalSteps: 2
    },
    {
      id: "#W002",
      store: "Home Essentials",
      status: "payment_confirmed",
      statusLabel: "Ready for Pickup",
      statusColor: "#4CAF50",
      statusBg: "rgba(76, 175, 80, 0.1)",
      amount: "KES 450",
      time: "1 hour ago",
      items: [{ name: "Plastic Containers", qty: "20" }],
      shelf: "#08",
      payment: "Full Payment",
      paymentId: "full",
      paymentStatus: "confirmed",
      orderType: "walkin",
      action: "Mark as Completed",
      priority: "Medium",
      progress: 70,
      workflow: ORDER_TYPE_WORKFLOWS.walkin,
      currentStep: 1,
      totalSteps: 2
    },
    // Pickup Orders
    {
      id: "#P001",
      store: "Fashion Hub",
      status: "topack",
      statusLabel: "To Pack",
      statusColor: "#FF9800",
      statusBg: "rgba(255, 152, 0, 0.1)",
      amount: "KES 1,250",
      time: "30 min ago",
      items: [{ name: "T-Shirts", qty: "15" }],
      shelf: "#45",
      payment: "Deposit Paid",
      paymentId: "deposit",
      paymentStatus: "deposit_paid",
      orderType: "pickup",
      action: "Mark as Packed",
      priority: "Low",
      progress: 20,
      workflow: ORDER_TYPE_WORKFLOWS.pickup,
      currentStep: 0,
      totalSteps: 4
    },
    {
      id: "#P002",
      store: "Gadget World",
      status: "packed",
      statusLabel: "Ready for Pickup",
      statusColor: "#4CAF50",
      statusBg: "rgba(76, 175, 80, 0.1)",
      amount: "KES 5,800",
      time: "Just now",
      items: [
        { name: "Smartphones", qty: "2" },
        { name: "Cases", qty: "4" },
      ],
      shelf: "#89",
      payment: "Deposit Paid",
      paymentId: "deposit",
      paymentStatus: "deposit_paid",
      orderType: "pickup",
      action: "Record Pickup",
      priority: "High",
      progress: 50,
      workflow: ORDER_TYPE_WORKFLOWS.pickup,
      currentStep: 1,
      totalSteps: 4
    },
    {
      id: "#P003",
      store: "Book Palace",
      status: "pickup_recorded",
      statusLabel: "Pickup Recorded",
      statusColor: "#2196F3",
      statusBg: "rgba(33, 150, 243, 0.1)",
      amount: "KES 2,300",
      time: "Yesterday",
      items: [{ name: "Novels", qty: "12" }],
      shelf: "#32",
      payment: "Balance Due (KES 1,150)",
      paymentId: "deposit",
      paymentStatus: "balance_due",
      orderType: "pickup",
      action: "Confirm Balance Payment",
      priority: "Medium",
      progress: 75,
      workflow: ORDER_TYPE_WORKFLOWS.pickup,
      currentStep: 2,
      totalSteps: 4
    },
    // Delivery Orders
    {
      id: "#D001",
      store: "ElectroMart",
      status: "topack",
      statusLabel: "To Pack",
      statusColor: "#FF9800",
      statusBg: "rgba(255, 152, 0, 0.1)",
      amount: "KES 8,500",
      time: "2 days ago",
      items: [
        { name: "Headphones", qty: "3" },
        { name: "Chargers", qty: "5" },
      ],
      shelf: "#75",
      payment: "Full Payment",
      paymentId: "full",
      paymentStatus: "confirmed",
      orderType: "delivery",
      action: "Mark as Packed",
      priority: "Low",
      progress: 20,
      workflow: ORDER_TYPE_WORKFLOWS.delivery,
      currentStep: 0,
      totalSteps: 4
    },
    {
      id: "#D002",
      store: "Furniture City",
      status: "packed",
      statusLabel: "Packed",
      statusColor: "#4CAF50",
      statusBg: "rgba(76, 175, 80, 0.1)",
      amount: "KES 15,000",
      time: "1 week ago",
      items: [{ name: "Office Chair", qty: "1" }],
      shelf: "#99",
      payment: "After Delivery",
      paymentId: "after",
      paymentStatus: "pending",
      orderType: "delivery",
      action: "Dispatch Order",
      priority: "Medium",
      progress: 50,
      workflow: ORDER_TYPE_WORKFLOWS.delivery,
      currentStep: 1,
      totalSteps: 4
    },
    {
      id: "#D003",
      store: "Super Foods",
      status: "dispatched",
      statusLabel: "Dispatched",
      statusColor: "#2196F3",
      statusBg: "rgba(33, 150, 243, 0.1)",
      amount: "KES 1,800",
      time: "3 days ago",
      items: [
        { name: "Groceries", qty: "15" },
        { name: "Beverages", qty: "8" },
      ],
      shelf: "#42",
      payment: "After Delivery",
      paymentId: "after",
      paymentStatus: "pending",
      orderType: "delivery",
      action: "Mark as Delivered",
      priority: "Low",
      progress: 75,
      workflow: ORDER_TYPE_WORKFLOWS.delivery,
      currentStep: 2,
      totalSteps: 4
    },
    // Completed Orders
    {
      id: "#C001",
      store: "TechStore Kenya",
      status: "completed",
      statusLabel: "Completed",
      statusColor: "#607D8B",
      statusBg: "rgba(96, 125, 139, 0.1)",
      amount: "KES 3,400",
      time: "1 day ago",
      items: [{ name: "Packaging Boxes", qty: "30" }],
      shelf: "#120",
      payment: "Full Payment",
      paymentId: "full",
      paymentStatus: "confirmed",
      orderType: "walkin",
      action: "View Details",
      priority: "Medium",
      progress: 100,
      completed: true,
      workflow: ORDER_TYPE_WORKFLOWS.walkin,
      currentStep: 2,
      totalSteps: 2
    },
    {
      id: "#C002",
      store: "Fashion Hub",
      status: "completed",
      statusLabel: "Completed",
      statusColor: "#607D8B",
      statusBg: "rgba(96, 125, 139, 0.1)",
      amount: "KES 1,250",
      time: "2 days ago",
      items: [{ name: "T-Shirts", qty: "15" }],
      shelf: "#45",
      payment: "Deposit Paid",
      paymentId: "deposit",
      paymentStatus: "confirmed",
      orderType: "pickup",
      action: "View Invoice",
      priority: "Low",
      progress: 100,
      completed: true,
      workflow: ORDER_TYPE_WORKFLOWS.pickup,
      currentStep: 4,
      totalSteps: 4
    },
  ]

  const filterOrders = () => {
    let filtered = orders
    
    // Filter by tab (active/completed)
    if (activeTab === "active") {
      filtered = filtered.filter(order => !order.completed)
    } else if (activeTab === "completed") {
      filtered = filtered.filter(order => order.completed)
    }
    
    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.store.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Filter by status category
    if (activeCategory !== "all") {
      if (activeCategory === "topack") {
        filtered = filtered.filter(order => order.status === "topack")
      } else if (activeCategory === "packed") {
        filtered = filtered.filter(order => order.status === "packed")
      } else if (activeCategory === "pickup_ready") {
        filtered = filtered.filter(order => 
          (order.orderType === "walkin" && order.status === "payment_confirmed") ||
          (order.orderType === "pickup" && order.status === "packed")
        )
      } else if (activeCategory === "dispatched") {
        filtered = filtered.filter(order => order.status === "dispatched")
      } else if (activeCategory === "delivered") {
        filtered = filtered.filter(order => order.status === "delivered")
      } else if (activeCategory === "completed") {
        filtered = filtered.filter(order => order.status === "completed" || order.completed)
      }
    }
    
    // Filter by order type
    if (activeOrderType !== "all") {
      filtered = filtered.filter(order => order.orderType === activeOrderType)
    }
    
    // Filter by payment type
    if (activePaymentType !== "all") {
      filtered = filtered.filter(order => order.paymentId === activePaymentType)
    }
    
    return filtered
  }

  const getOrderCountByCategory = (categoryId) => {
    const activeOrders = orders.filter(order => !order.completed)
    
    switch(categoryId) {
      case "all":
        return activeOrders.length
      case "topack":
        return activeOrders.filter(order => order.status === "topack").length
      case "packed":
        return activeOrders.filter(order => order.status === "packed").length
      case "pickup_ready":
        return activeOrders.filter(order => 
          (order.orderType === "walkin" && order.status === "payment_confirmed") ||
          (order.orderType === "pickup" && order.status === "packed")
        ).length
      case "dispatched":
        return activeOrders.filter(order => order.status === "dispatched").length
      case "delivered":
        return activeOrders.filter(order => order.status === "delivered").length
      case "completed":
        return orders.filter(order => order.completed || order.status === "completed").length
      default:
        return 0
    }
  }

  const getCompletedOrderCount = () => {
    return orders.filter(order => order.completed).length
  }

  const getActiveOrderCount = () => {
    return orders.filter(order => !order.completed).length
  }

  const getWorkflowProgress = (order) => {
    return Math.round((order.currentStep / order.totalSteps) * 100)
  }

  const getNextAction = (order) => {
    const workflow = ORDER_TYPE_WORKFLOWS[order.orderType]
    const currentIndex = workflow.statusFlow.indexOf(order.status)
    
    if (currentIndex < workflow.statusFlow.length - 1) {
      const nextStatus = workflow.statusFlow[currentIndex + 1]
      const nextLabel = workflow.statusLabels[nextStatus]
      
      switch(nextStatus) {
        case "payment_confirmed":
          return "Confirm Payment"
        case "packed":
          return "Mark as Packed"
        case "pickup_recorded":
          return "Record Pickup"
        case "dispatched":
          return "Dispatch Order"
        case "delivered":
          return "Mark as Delivered"
        case "completed":
          return "Complete Order"
        default:
          return "Next Step"
      }
    }
    return order.action
  }

  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilters}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
      }}>
        <View style={{
          backgroundColor: COLORS.white,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          maxHeight: "80%",
        }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: "bold",
              color: COLORS.text,
              fontFamily: "Montserrat-Bold",
            }}>Filter Orders</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={{
            marginBottom: 24,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: "600",
              color: COLORS.text,
              marginBottom: 12,
              fontFamily: "Montserrat-SemiBold",
            }}>Order Type</Text>
            <View style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}>
              {ORDER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: "#f5f5f5",
                      gap: 6,
                    },
                    activeOrderType === type.id && {
                      backgroundColor: COLORS.primary,
                    }
                  ]}
                  onPress={() => setActiveOrderType(type.id)}
                >
                  <Ionicons 
                    name={type.icon} 
                    size={16} 
                    color={activeOrderType === type.id ? COLORS.white : COLORS.textLight} 
                  />
                  <Text style={[
                    {
                      fontSize: 14,
                      color: COLORS.text,
                      fontFamily: "Montserrat-Regular",
                    },
                    activeOrderType === type.id && {
                      color: COLORS.white,
                    }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={{
            marginBottom: 24,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: "600",
              color: COLORS.text,
              marginBottom: 12,
              fontFamily: "Montserrat-SemiBold",
            }}>Payment Type</Text>
            <View style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}>
              {PAYMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: "#f5f5f5",
                      gap: 6,
                    },
                    activePaymentType === type.id && [{
                      backgroundColor: COLORS.primary,
                    }, { backgroundColor: type.color || COLORS.primary }]
                  ]}
                  onPress={() => setActivePaymentType(type.id)}
                >
                  <Ionicons 
                    name={type.icon} 
                    size={16} 
                    color={activePaymentType === type.id ? COLORS.white : COLORS.textLight} 
                  />
                  <Text style={[
                    {
                      fontSize: 14,
                      color: COLORS.text,
                      fontFamily: "Montserrat-Regular",
                    },
                    activePaymentType === type.id && {
                      fontSize: 14,
                      color: COLORS.text,
                      fontFamily: "Montserrat-Regular",
                    }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity 
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 8,
            }}
            onPress={() => setShowFilters(false)}
          >
            <Text style={{
              color: COLORS.white,
              fontSize: 16,
              fontWeight: "600",
              fontFamily: "Montserrat-SemiBold",
            }}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: "#f5f5f5",
    }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        {/* Header */}
        <Animated.View 
          style={[
            {
              position: "relative",
              marginBottom: 50,
            },
            {
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0]
                })
              }]
            }
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, "#D663F6"]}
            style={{
              height: 190,
              borderBottomRightRadius: 30,
              borderBottomLeftRadius: 30,
              paddingHorizontal: 20,
              paddingTop: 50,
              paddingBottom: 30,
            }}
          >
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}>
              <View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: COLORS.white,
                  fontFamily: "Montserrat-Bold",
                  marginBottom: 4,
                }}>Orders Dashboard</Text>
                <Text style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.9)",
                  fontFamily: "Montserrat-Regular",
                }}>
                  {activeTab === "active" 
                    ? `${getActiveOrderCount()} active orders` 
                    : `${getCompletedOrderCount()} completed orders`}
                </Text>
              </View>
              
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}>
                <TouchableOpacity 
                  style={styles.timeFilter}
                  onPress={() => {}}
                >
                  <Ionicons name="time" size={14} color={COLORS.white} />
                  <Text style={styles.timeFilterText}>
                    {activeTab === "active" ? "Today" : "All Time"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => setShowFilters(true)}
                >
                  <Ionicons name="filter" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <Animated.View style={{
            position: "absolute",
            bottom: -25,
            left: 20,
            right: 20,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
          }}>
            <LinearGradient
              colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.98)"]}
              style={{
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                height: 56,
                backgroundColor: COLORS.white,
              }}>
                <Ionicons 
                  name="search" 
                  size={22} 
                  color={isSearchFocused ? COLORS.primary : COLORS.textLight} 
                />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 15,
                    color: COLORS.text,
                    fontFamily: "Montserrat-ExtraLight",
                  }}
                  placeholder="Search orders, stores, IDs..."
                  placeholderTextColor={COLORS.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="mic" size={20} color={COLORS.textLight} />
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* Main Tabs */}
        <View style={{
          paddingHorizontal: 20,
          marginBottom: 15,
        }}>
          <View style={{
            flexDirection: "row",
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 4,
            position: "relative",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
              onPress={() => setActiveTab("active")}
            >
              <Text style={[
                {
                  fontSize: 14,
                  color: COLORS.textLight,
                  fontWeight: "600",
                  fontFamily: "Montserrat-SemiBold",
                },
                activeTab === "active" && {
                  color: COLORS.primary,
                }
              ]}>
                Active Orders
              </Text>
              {activeTab === "active" && (
                <View style={{
                  position: "absolute",
                  top: -5,
                  right: 10,
                  backgroundColor: COLORS.primary,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Text style={{
                    color: COLORS.white,
                    fontSize: 10,
                    fontWeight: "bold",
                  }}>{getActiveOrderCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
              onPress={() => setActiveTab("completed")}
            >
              <Text style={[
                {
                  fontSize: 14,
                  color: COLORS.textLight,
                  fontWeight: "600",
                  fontFamily: "Montserrat-ExtraLight",
                },
                activeTab === "completed" && {
                  color: COLORS.primary,
                }
              ]}>
                Completed
              </Text>
              {activeTab === "completed" && (
                <View style={{
                  position: "absolute",
                  top: -5,
                  right: 10,
                  backgroundColor: COLORS.primary,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Text style={{
                    color: COLORS.white,
                    fontSize: 10,
                    fontWeight: "bold",
                  }}>{getCompletedOrderCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <Animated.View 
              style={[
                {
                  position: "absolute",
                  top: 4,
                  left: 4,
                  width: "50%",
                  height: "calc(100% - 8px)",
                  backgroundColor: "rgba(201, 70, 238, 0.1)",
                  borderRadius: 8,
                  zIndex: 1,
                },
                { transform: [{ translateX: tabIndicatorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_WIDTH / 2 - 40]
                })}] }
              ]}
            />
          </View>
        </View>

        {/* Status Categories */}
        <View style={{
          paddingHorizontal: 20,
          marginBottom: 20,
        }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {STATUS_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  activeCategory === category.id && styles.categoryItemActive
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <View style={[
                  styles.categoryIcon,
                  { backgroundColor: activeCategory === category.id ? category.color : "rgba(0,0,0,0.05)" }
                ]}>
                  <Ionicons 
                    name={category.icon} 
                    size={20} 
                    color={activeCategory === category.id ? COLORS.white : category.color} 
                  />
                </View>
                <Text style={[
                  styles.categoryLabel,
                  activeCategory === category.id && { color: category.color, fontWeight: "bold" }
                ]}>
                  {category.label}
                </Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {getOrderCountByCategory(category.id)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Active Filters */}
        {(activeOrderType !== "all" || activePaymentType !== "all") && (
          <View style={{
            paddingHorizontal: 20,
            marginBottom: 16,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{
                flexDirection: "row",
                gap: 8,
              }}>
                {activeOrderType !== "all" && (
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(201, 70, 238, 0.1)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    gap: 6,
                  }}>
                    <Ionicons 
                      name={ORDER_TYPES.find(t => t.id === activeOrderType)?.icon} 
                      size={14} 
                      color={COLORS.primary} 
                    />
                    <Text style={{
                      fontSize: 13,
                      color: COLORS.primary,
                      fontFamily: "Montserrat-SemiBold",
                    }}>
                      {ORDER_TYPES.find(t => t.id === activeOrderType)?.label}
                    </Text>
                    <TouchableOpacity onPress={() => setActiveOrderType("all")}>
                      <Ionicons name="close" size={14} color={COLORS.textLight} />
                    </TouchableOpacity>
                  </View>
                )}
                {activePaymentType !== "all" && (
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(201, 70, 238, 0.1)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    gap: 6,
                  }}>
                    <Ionicons 
                      name={PAYMENT_TYPES.find(p => p.id === activePaymentType)?.icon} 
                      size={14} 
                      color={PAYMENT_TYPES.find(p => p.id === activePaymentType)?.color || COLORS.primary} 
                    />
                    <Text style={{
                      fontSize: 13,
                      color: COLORS.primary,
                      fontFamily: "Montserrat-SemiBold",
                    }}>
                      {PAYMENT_TYPES.find(p => p.id === activePaymentType)?.label}
                    </Text>
                    <TouchableOpacity onPress={() => setActivePaymentType("all")}>
                      <Ionicons name="close" size={14} color={COLORS.textLight} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Orders Grid */}
        <View style={{
          paddingHorizontal: 20,
          gap: 12,
        }}>
          {filterOrders().map((order, index) => (
            <Animated.View
              key={order.id}
              style={[
                {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.08,
                  shadowRadius: 16,
                  elevation: 5,
                },
                {
                  opacity: cardAnim,
                  transform: [{
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50 + index * 20, 0]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 20,
                  overflow: "hidden",
                }}
                onPress={() => router.push("/components/orders/orderDetails")}
                activeOpacity={0.9}
              >
                {/* Card Header */}
                <View style={{
                  padding: 16,
                  paddingBottom: 12,
                }}>
                  <View style={{
                    flex: 1,
                  }}>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}>
                      <Ionicons name={order.workflow.icon} size={20} color={COLORS.primary} />
                      <Text style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        color: COLORS.text,
                        fontFamily: "Montserrat-Bold",
                      }}>{order.id}</Text>
                      <View style={[
                        {
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 4,
                        },
                        { 
                          backgroundColor: 
                            order.priority === "High" ? "#FF6B6B20" :
                            order.priority === "Medium" ? "#FF980020" : "#4CAF5020"
                        }
                      ]}>
                        <Text style={[
                          {
                            fontSize: 10,
                            fontWeight: "bold",
                            fontFamily: "Montserrat-Bold",
                          },
                          { 
                            color: 
                              order.priority === "High" ? "#FF6B6B" :
                              order.priority === "Medium" ? "#FF9800" : "#4CAF50"
                          }
                        ]}>
                          {order.priority}
                        </Text>
                      </View>
                    </View>
                    <Text style={{
                      fontSize: 16,
                      color: COLORS.text,
                      fontFamily: "Montserrat-ExtraLight",
                      marginBottom: 6,
                    }}>{order.store}</Text>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      <Text style={{
                        fontSize: 13,
                        color: COLORS.primary,
                        fontWeight: "600",
                        fontFamily: "Montserrat-SemiBold",
                      }}>{order.workflow.label}</Text>
                      <Text style={{
                        fontSize: 13,
                        color: COLORS.textLight,
                        fontFamily: "Montserrat-ExtraLight",
                      }}>{order.workflow.description}</Text>
                    </View>
                  </View>
                  
                  <View style={[{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 12,
                    gap: 6,
                  }, { backgroundColor: order.statusBg }]}>
                    <View style={[{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                    }, { backgroundColor: order.statusColor }]} />
                    <Text style={[{
                      fontSize: 14,
                      fontWeight: "600",
                      fontFamily: "Montserrat-ExtraLight",
                    }, { color: order.statusColor }]}>
                      {order.statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Order Workflow Progress */}
                <View style={{
                  paddingHorizontal: 16,
                  paddingBottom: 12,
                }}>
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}>
                    <Text style={{
                      fontSize: 14,
                      color: COLORS.textLight,
                      fontFamily: "Montserrat-ExtraLight",
                    }}>
                      Step {order.currentStep + 1} of {order.totalSteps + 1}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: COLORS.text,
                      fontWeight: "600",
                      fontFamily: "Montserrat-SemiBold",
                    }}>
                      {getWorkflowProgress(order)}%
                    </Text>
                  </View>
                  <View style={{
                    height: 4,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 2,
                    overflow: "hidden",
                    marginBottom: 12,
                  }}>
                    <View 
                      style={[
                        {
                          height: "100%",
                          borderRadius: 2,
                        },
                        { 
                          width: `${getWorkflowProgress(order)}%`,
                          backgroundColor: order.statusColor
                        }
                      ]} 
                    />
                  </View>
                  
                  {/* Workflow Steps */}
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}>
                    {order.workflow.statusFlow.map((status, index) => {
                      const isCompleted = order.workflow.statusFlow.indexOf(order.status) >= index
                      const isCurrent = order.status === status
                      return (
                        <View key={status} style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}>
                          <View style={[
                            {
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: "#E0E0E0",
                              justifyContent: "center",
                              alignItems: "center",
                              zIndex: 2,
                            },
                            isCompleted && { backgroundColor: order.workflow.statusColors[status] },
                            isCurrent && {
                              borderWidth: 2,
                              borderColor: "#fff",
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: 3,
                            }
                          ]}>
                            {isCompleted && (
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            )}
                          </View>
                          {index < order.workflow.statusFlow.length - 1 && (
                            <View style={[
                              {
                                flex: 1,
                                height: 2,
                                backgroundColor: "#E0E0E0",
                                marginHorizontal: -1,
                              },
                              isCompleted && { backgroundColor: order.workflow.statusColors[status] }
                            ]} />
                          )}
                        </View>
                      )
                    })}
                  </View>
                  
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}>
                    {order.workflow.statusFlow.map((status, index) => (
                      <Text 
                        key={status} 
                        style={[
                          {
                            fontSize: 12,
                            color: COLORS.textLight,
                            fontFamily: "Montserrat-ExtraLight",
                            flex: 1,
                            textAlign: "center",
                            paddingHorizontal: 2,
                          },
                          order.status === status && { color: order.workflow.statusColors[status], fontWeight: 'bold' }
                        ]}
                        numberOfLines={1}
                      >
                        {order.workflow.statusLabels[status]}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Order Details */}
                <View style={{
                  paddingHorizontal: 16,
                  paddingBottom: 16,
                }}>
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <Ionicons name="cash" size={18} color={COLORS.textLight} />
                      <Text style={{
                        fontSize: 15,
                        color: COLORS.text,
                        fontWeight: "500",
                        fontFamily: "Montserrat-SemiBold",
                      }}>{order.amount}</Text>
                    </View>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <Ionicons name="time" size={18} color={COLORS.textLight} />
                      <Text style={{
                        fontSize: 15,
                        color: COLORS.text,
                        fontWeight: "500",
                        fontFamily: "Montserrat-ExtraLight",
                      }}>{order.time}</Text>
                    </View>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <Ionicons name="location" size={18} color={COLORS.textLight} />
                      <Text style={{
                        fontSize: 15,
                        color: COLORS.text,
                        fontWeight: "500",
                        fontFamily: "Montserrat-SemiBold",
                      }}>{order.shelf}</Text>
                    </View>
                  </View>
                  
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 8,
                    alignSelf: "flex-start",
                  }}>
                    <Ionicons 
                      name={
                        order.paymentStatus === "confirmed" ? "checkmark-circle" :
                        order.paymentStatus === "deposit_paid" ? "time" :
                        order.paymentStatus === "balance_due" ? "alert-circle" : "close-circle"
                      } 
                      size={16} 
                      color={
                        order.paymentStatus === "confirmed" ? "#4CAF50" :
                        order.paymentStatus === "deposit_paid" ? "#FF9800" :
                        order.paymentStatus === "balance_due" ? "#F44336" : "#9E9E9E"
                      } 
                    />
                    <Text style={{
                      fontSize: 14,
                      color: COLORS.text,
                      fontFamily: "Montserrat-ExtraLight",
                      fontWeight: 600,
                    }}>{order.payment}</Text>
                  </View>
                  
                  {/* Items Preview */}
                  <View style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                  }}>
                    {order.items.slice(0, 2).map((item, idx) => (
                      <View key={idx} style={{
                        backgroundColor: "#f5f5f5",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}>
                        <Text style={{
                          fontSize: 13,
                          color: COLORS.text,
                          fontFamily: "Montserrat-ExtraLight",
                        }}>
                          {item.name} ×{item.qty}
                        </Text>
                      </View>
                    ))}
                    {order.items.length > 2 && (
                      <View style={{
                        backgroundColor: "rgba(201, 70, 238, 0.1)",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}>
                        <Text style={{
                          fontSize: 13,
                          color: COLORS.primary,
                          fontWeight: "600",
                          fontFamily: "Montserrat-SemiBold",
                        }}>
                          +{order.items.length - 2} more
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Footer */}
                <LinearGradient
                  colors={["rgba(249, 249, 249, 0.8)", "rgba(249, 249, 249, 1)"]}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    borderTopWidth: 1,
                    borderTopColor: "#f0f0f0",
                  }}
                >
                  <View style={{
                    flex: 1,
                    alignItems: "flex-end",
                  }}>
                    <TouchableOpacity 
                      style={[{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 12,
                        gap: 8,
                        minWidth: 120,
                        justifyContent: "center",
                      }, { backgroundColor: order.statusColor }]}
                      activeOpacity={0.8}
                    >
                      <Text style={{
                        color: COLORS.white,
                        fontSize: 15,
                        fontWeight: "600",
                        fontFamily: "Montserrat-ExtraLight",
                      }}>{getNextAction(order)}</Text>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Empty State */}
        {filterOrders().length === 0 && (
          <View style={{
            alignItems: "center",
            paddingVertical: 60,
            paddingHorizontal: 40,
          }}>
            <Ionicons 
              name={activeTab === "active" ? "document-text" : "checkmark-done-circle"} 
              size={80} 
              color={COLORS.textLight} 
            />
            <Text style={{
              fontSize: 18,
              fontWeight: "bold",
              color: COLORS.text,
              marginTop: 16,
              marginBottom: 8,
              fontFamily: "Montserrat-Bold",
            }}>
              {activeTab === "active" ? "No active orders found" : "No completed orders found"}
            </Text>
            <Text style={{
              fontSize: 14,
              color: COLORS.textLight,
              textAlign: "center",
              fontFamily: "Montserrat-Regular",
            }}>
              {searchQuery ? "Try a different search term" : 
               activeTab === "active" ? "No orders match your current filters" : 
               "All clear! No completed orders to show"}
            </Text>
            {(activeOrderType !== "all" || activePaymentType !== "all") && (
              <TouchableOpacity 
                style={{
                  marginTop: 16,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: "rgba(201, 70, 238, 0.1)",
                  borderRadius: 12,
                }}
                onPress={() => {
                  setActiveOrderType("all")
                  setActivePaymentType("all")
                  setActiveCategory("all")
                }}
              >
                <Text style={{
                  color: COLORS.primary,
                  fontSize: 14,
                  fontFamily: "Montserrat-SemiBold",
                }}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={{
          height: 30,
        }} />
      </ScrollView>
      
      {renderFilterModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
  },
  animatedHeader: {
    position: "relative",
    marginBottom: 50,
  },
  headerGradient: {
    height: 190,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    fontFamily: "Montserrat-Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Montserrat-Regular",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  timeFilterText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    position: "absolute",
    bottom: -25,
    left: 20,
    right: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  searchGradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "Montserrat-ExtraLight",
  },
  mainTabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  mainTabs: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  mainTabText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  mainTabTextActive: {
    color: COLORS.primary,
  },
  tabBadge: {
    position: "absolute",
    top: -5,
    right: 10,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: "50%",
    height: "calc(100% - 8px)",
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    borderRadius: 8,
    zIndex: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoriesScrollContent: {
    paddingRight: 20,
    gap: 12,
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    width: 150,
    minWidth: 80,
    position: "relative",
  },
  categoryItemActive: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
    marginBottom: 4,
  },
  categoryBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  activeFiltersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  activeFilters: {
    flexDirection: "row",
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: "Montserrat-SemiBold",
  },
  ordersGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  orderCardContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "Montserrat-Bold",
  },
  storeName: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "Montserrat-ExtraLight",
    marginBottom: 4,
  },
  orderTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderTypeLabel: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  orderTypeDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  workflowInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  workflowText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  progressPercentage: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  workflowSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  workflowStep: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  currentStepDot: {
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E0E0E0",
    marginHorizontal: -1,
  },
  workflowLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  workflowLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  orderDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
    fontFamily: "Montserrat-SemiBold",
  },
  paymentStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  paymentStatusText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
  },
  itemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  itemChip: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemText: {
    fontSize: 13,
    color: COLORS.text,
    fontFamily: "Montserrat-ExtraLight",
  },
  moreItemsChip: {
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moreItemsText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  actionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionContent: {
    flex: 1,
    alignItems: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Montserrat-ExtraLight",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Montserrat-Bold",
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    fontFamily: "Montserrat-Regular",
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    borderRadius: 12,
  },
  clearFiltersText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
  },
  bottomSpacing: {
    height: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    fontFamily: "Montserrat-SemiBold",
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
})