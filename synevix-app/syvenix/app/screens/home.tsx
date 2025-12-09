// Update the HomeScreen.tsx with the modals
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Animated 
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/constants/Colors"
import { useEffect, useRef, useState } from "react"
import { Easing } from "react-native"
import { useRouter } from "expo-router"
import RecordPickupModal from "../components/orders/modals/recordPickUpModal"
import PaymentConfirmationModal from "../components/orders/modals/paymentConfirmationModal"
import UpdateOrderModal from "../components/orders/modals/updateOrderModel"

export default function HomeScreen() {
  const waveAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const statCardsAnim = useRef(new Animated.Value(0)).current
  const actionCardsAnim = useRef(new Animated.Value(0)).current
  const router = useRouter()

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUpdateOrder, setSelectedUpdateOrder] = useState<any>(null);
  
  const [showPickupModal, setShowPickupModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  useEffect(() => {
    // Animated wave effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Fade in header content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()

    // Stagger animations for stats and actions
    Animated.sequence([
      Animated.timing(statCardsAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
        delay: 300,
      }),
      Animated.timing(actionCardsAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
        delay: 100,
      }),
    ]).start()
  }, [])

  const translateY = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  })

  const opacity = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  })

  const handleSelectUpdateOrder = (order: any) => {
    setSelectedUpdateOrder(order);
    setShowUpdateModal(false);
    
    // Navigate to order details page with the selected order
    router.push({
      pathname: "/components/orders/orderDetails",
      params: { 
        orderData: JSON.stringify(order),
        fromUpdateModal: 'true'
      }
    });
  };

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order)
    setShowPickupModal(false)
    
    // Check payment status and show appropriate modal
    if (order.paymentStatus === 'pending' || order.paymentStatus === 'deposit') {
      setShowPaymentModal(true)
    } else {
      // If payment is already full, redirect to order details
      router.push({
        pathname: "/screens/home",
        params: { orderId: order.id }
      })
    }
  }

  const handleCompletePayment = (paymentDetails: any) => {
    console.log('Payment completed:', paymentDetails)
    // Here you would make an API call to record the payment
    // After successful payment, redirect to order details
    setShowPaymentModal(false)
    router.push({
      pathname: "/screens/home",
      params: { 
        orderId: selectedOrder.id,
        paymentCompleted: 'true'
      }
    })
  }

  const quickActions = [
    {
      id: 1,
      title: "Record Walk-in Sale",
      icon: "cart",
      color: "#4CAF50",
      action: () => router.push("/components/forms/orders/walkinSale"),
    },
    {
      id: 2,
      title: "Record Pick Up",
      icon: "cube",
      color: "#2196F3",
      action: () => setShowPickupModal(true), // Updated to show modal
    },
    {
      id: 3,
      title: "View Orders",
      icon: "list",
      color: "#9C27B0",
      action: () => router.push("/screens/orders"),
    },
    {
      id: 4,
      title: "Update Order",
      icon: "checkmark-circle",
      color: "#00BCD4",
      action: () => setShowUpdateModal(true),
    },
    {
      id: 5,
      title: "Update Stock",
      icon: "layers",
      color: "#FF9800",
      action: () => router.push("/components/forms/orders/walkinSale"),
    },
    {
      id: 6,
      title: "Manage Shelves",
      icon: "grid",
      color: "#FF6B6B",
      action: () => router.push("/components/forms/orders/walkinSale"),
    },
  ]

  const stats = [
    { 
      label: "Orders to pack", 
      value: "52", 
      icon: require("../../assets/images/home/Checking boxes-cuate.png"),
      color: "#FF6B6B",
      trend: "+12%"
    },
    { 
      label: "Ready", 
      value: "35", 
      icon: require("../../assets/images/home/Shopping bag-amico.png"),
      color: "#4CAF50",
      trend: "+8%"
    },
    { 
      label: "To deliver", 
      value: "16", 
      icon: require("../../assets/images/home/Delivery-amico.png"),
      color: "#2196F3",
      trend: "+5%"
    },
    { 
      label: "Walkin Sales", 
      value: "12", 
      icon: require("../../assets/images/home/Shopping bag-pana.png"),
      color: "#FF9800",
      trend: "+23%"
    },
  ]

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: "#f5f5f5",
    }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{
        flex: 1,
      }}>
        {/* Your existing HomeScreen content remains the same... */}
        {/* Modern Animated Header */}
        <View style={{
          position: "relative",
          marginBottom: 10,
        }}>
          {/* Background Gradient with Wave */}
          <LinearGradient
            colors={[COLORS.primary, "#9b48b3ff", COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: 220,
              borderBottomRightRadius: 30,
              borderBottomLeftRadius: 30,
              overflow: "hidden",
            }}
          >
            {/* Animated Wave Overlay */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "100%",
                },
                {
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)", "transparent"]}
                style={{
                  height: "200%",
                  width: "200%",
                }}
              />
            </Animated.View>

            {/* Header Content with Fade Animation */}
            <Animated.View style={[{
              paddingHorizontal: 20,
              paddingTop: 50,
              paddingBottom: 30,
            }, { opacity: fadeAnim }]}>
              {/* User Info with Avatar */}
              <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}>
                  <LinearGradient
                    colors={["#ff9ac9ff", "#FAD0C4"]}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: COLORS.white,
                    }}>M</Text>
                  </LinearGradient>
                  <View style={{
                    flexDirection: "column",
                  }}>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: COLORS.white,
                      marginBottom: 4,
                    }}>Good Morning, Maggy! 👋</Text>
                    <Text style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.8)",
                    }}>Your store is doing great today</Text>
                  </View>
                </View>

                {/* Notifications with Badge */}
                <TouchableOpacity style={{
                  position: "relative",
                  padding: 10,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <Ionicons name="notifications-outline" size={26} color={COLORS.white} />
                  <View style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    backgroundColor: "#FF4757",
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{
                      color: COLORS.white,
                      fontSize: 10,
                      fontWeight: "bold",
                    }}>3</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Store Stats Mini Cards */}
              <View style={{
                flexDirection: "row",
                marginBottom: 20,
              }}>
                
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  marginRight: 10,
                }}>
                  <Ionicons name="time-outline" size={16} color={COLORS.white} />
                  <Text style={{
                    color: COLORS.white,
                    fontSize: 12,
                    marginLeft: 5,
                    fontWeight: "500",
                  }}>Active 8h</Text>
                </View>
              </View>

              {/* Current Time & Date */}
              <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <Text style={{
                  fontSize: 32,
                  // fontWeight: "bold",
                  color: COLORS.white,
                  fontFamily: "Montserrat",
                }}>9:42 AM</Text>
                <Text style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "Montserrat-Regular",
                }}>Monday, Nov 25</Text>
              </View>
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Stats Grid with Animation */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 20,
          marginTop: 20,
        }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: "bold",
              color: COLORS.text,
              fontFamily: "Montserrat-Bold",
            }}>Today's Overview</Text>
          </View>
          
          <Animated.View 
            style={[
              {
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "space-between",
              },
              {
                opacity: statCardsAnim,
                transform: [{
                  translateY: statCardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }],
              },
            ]}
          >
            {stats.map((stat, index) => (
              <View key={index} style={{
                width: "48%",
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: 18,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 5,
                marginBottom: 12,
                
              }}>
                
                  <View style={[{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                  }, { backgroundColor: `${stat.color}15` }]}>
                    <Image source={stat.icon} style={{
                      width: 80,
                      height: 62,
                    }} />
                  </View>
                  
                <Text style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: COLORS.text,
                  marginBottom: 4,
                  fontFamily: "Montserrat-Bold",
                  paddingTop: 10,
                }}>{stat.value}</Text>
                <Text style={{
                  fontSize: 13,
                  color: COLORS.text,
                  fontFamily: "Montserrat-ExtraLight",
                }}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Quick Actions with Animation */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: "bold",
              color: COLORS.text,
              fontFamily: "Montserrat-Bold",
            }}>Quick Actions</Text>
            <Text style={{
              fontSize: 14,
              color: COLORS.textLight,
              fontFamily: "Montserrat-Regular",
            }}>Frequent tasks at a glance</Text>
          </View>
          
          <Animated.View 
            style={[
              {
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "space-between",
              },
              {
                opacity: actionCardsAnim,
                transform: [{
                  translateY: actionCardsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                }],
              },
            ]}
          >
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={{
                  width: "48%",
                  borderRadius: 16,
                  overflow: "hidden",
                  marginBottom: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  // elevation: 5,
                }} 
                onPress={action.action}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[`${action.color}20`, `${action.color}10`]}
                  style={{
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <View style={{
                    marginBottom: 12,
                  }}>
                    <View style={[{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      justifyContent: "center",
                      alignItems: "center",
                    }, { backgroundColor: action.color }]}>
                      <Ionicons name={action.icon} size={22} color={COLORS.white} />
                    </View>
                  </View>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: COLORS.text,
                    textAlign: "center",
                    fontFamily: "Montserrat-SemiBold",
                    lineHeight: 18,
                  }}>{action.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>

        {/* Recent Activity Section */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: "bold",
              color: COLORS.text,
              fontFamily: "Montserrat-Bold",
            }}>Recent Activity</Text>
            <TouchableOpacity style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}>
              <Text style={{
                fontSize: 14,
                color: COLORS.primary,
                fontWeight: "600",
                fontFamily: "Montserrat-SemiBold",
              }}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 5,
          }}>
            {[
              { id: 1, title: "Order #1234 processed", time: "10 min ago", icon: "checkmark-circle", color: COLORS.success },
              { id: 2, title: "Stock updated for Apples", time: "25 min ago", icon: "refresh", color: COLORS.primary },
              { id: 3, title: "New walk-in sale recorded", time: "1 hour ago", icon: "cart", color: "#9C27B0" },
              { id: 4, title: "Shelf #3 needs restocking", time: "2 hours ago", icon: "warning", color: COLORS.warning },
            ].map((activity) => (
              <View key={activity.id} style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
              }}>
                <View style={[{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }, { backgroundColor: `${activity.color}15` }]}>
                  <Ionicons name={activity.icon} size={18} color={activity.color} />
                </View>
                <View style={{
                  flex: 1,
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: COLORS.text,
                    marginBottom: 4,
                    fontFamily: "Montserrat-SemiBold",
                  }}>{activity.title}</Text>
                  <Text style={{
                    fontSize: 12,
                    color: COLORS.textLight,
                    fontFamily: "Montserrat-Regular",
                  }}>{activity.time}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
              </View>
            ))}
          </View>
        </View>
        
        {/* Bottom Spacing */}
        <View style={{
          height: 30,
        }} />
      </ScrollView>

      {/* Record Pickup Modal */}
      <RecordPickupModal
        visible={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        onSelectOrder={handleSelectOrder}
      />

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        order={selectedOrder}
        onComplete={handleCompletePayment}
      />

      {/* Update Order Modal */}
      <UpdateOrderModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSelectOrder={handleSelectUpdateOrder}
      />
      
    </SafeAreaView>
  )
}