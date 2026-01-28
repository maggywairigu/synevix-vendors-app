import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { COLORS } from "@/constants/Colors"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { useLocalSearchParams } from "expo-router"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"
import { useGetSaleById } from "@/queries/saleQueries"
import { useState, useEffect } from "react"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

// Define workflows for each order type (same as OrdersScreen)
const ORDER_TYPE_WORKFLOWS = {
  walkin: {
    label: "Walk-in",
    icon: "walk",
    description: "Customer collects in-store",
    statusFlow: ["topack", "packed", "payment_confirmed", "completed"],
    statusLabels: {
      topack: "To Pack",
      packed: "Packed",
      payment_confirmed: "Ready for Pickup",
      completed: "Completed"
    },
    statusColors: {
      topack: "#FF9800",
      packed: "#4CAF50",
      payment_confirmed: "#2196F3",
      completed: "#607D8B"
    }
  },
  pickup: {
    label: "Pickup",
    icon: "bag-handle",
    description: "Customer collects after packing",
    statusFlow: ["topack", "packed", "pickup_ready", "payment_confirmed", "completed"],
    statusLabels: {
      topack: "To Pack",
      packed: "Packed",
      pickup_ready: "Ready for Pickup",
      payment_confirmed: "Payment Confirmed",
      completed: "Completed"
    },
    statusColors: {
      topack: "#FF9800",
      packed: "#4CAF50",
      pickup_ready: "#2196F3",
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

// Helper functions (same as OrdersScreen)
const getTimeAgo = (timestamp) => {
  if (!timestamp || !timestamp._seconds) return "Unknown time";
  
  const now = Date.now() / 1000;
  const seconds = timestamp._seconds;
  const diffInSeconds = now - seconds;
  
  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return new Date(seconds * 1000).toLocaleDateString();
  }
}

const getPriority = (timestamp) => {
  if (!timestamp || !timestamp._seconds) return "Low";
  
  const now = Date.now() / 1000;
  const seconds = timestamp._seconds;
  const diffInHours = (now - seconds) / 3600;
  
  if (diffInHours > 3) return "High";
  if (diffInHours > 1) return "Medium";
  return "Low";
}

const getPaymentDetails = (order) => {
  const amountPending = parseFloat(order.amountPending || "0");
  const amountPaid = parseFloat(order.amountPaid || "0");
  const totalAmount = parseFloat(order.totalAmount || "0");
  
  switch(order.paymentTerms) {
    case "full":
      if (amountPaid >= totalAmount) {
        return {
          paymentId: "full",
          payment: "Full Payment",
          paymentStatus: "confirmed",
          icon: "checkmark-circle",
          color: "#4CAF50"
        };
      } else {
        return {
          paymentId: "full",
          payment: "Payment Pending",
          paymentStatus: "pending",
          icon: "close-circle",
          color: "#F44336"
        };
      }
    case "deposit":
      if (amountPending === 0) {
        return {
          paymentId: "deposit",
          payment: "Deposit Paid",
          paymentStatus: "deposit_paid",
          icon: "time",
          color: "#FF9800"
        };
      } else {
        return {
          paymentId: "deposit",
          payment: `Balance Due (KES ${amountPending.toFixed(2)})`,
          paymentStatus: "balance_due",
          icon: "alert-circle",
          color: "#F44336"
        };
      }
    case "after":
      if (amountPending === 0) {
        return {
          paymentId: "after",
          payment: "Payment Completed",
          paymentStatus: "confirmed",
          icon: "checkmark-circle",
          color: "#4CAF50"
        };
      } else {
        return {
          paymentId: "after",
          payment: `Balance Due (KES ${amountPending.toFixed(2)})`,
          paymentStatus: "balance_due",
          icon: "alert-circle",
          color: "#F44336"
        };
      }
    default:
      return {
        paymentId: "full",
        payment: "Payment Pending",
        paymentStatus: "pending",
        icon: "close-circle",
        color: "#9E9E9E"
      };
  }
}

const getWorkflowDetails = (order) => {
  const workflow = ORDER_TYPE_WORKFLOWS[order.orderType] || ORDER_TYPE_WORKFLOWS.walkin;
  const status = order.status || "topack";
  const statusFlow = workflow.statusFlow;
  const currentStep = statusFlow.indexOf(status);
  
  return {
    workflow,
    currentStep: currentStep >= 0 ? currentStep : 0,
    totalSteps: statusFlow.length - 1,
    statusColor: workflow.statusColors[status] || "#FF9800",
    statusLabel: workflow.statusLabels[status] || "To Pack",
    statusBg: `rgba(${parseInt(workflow.statusColors[status]?.slice(1, 3) || "255", 16)}, ${parseInt(workflow.statusColors[status]?.slice(3, 5) || "152", 16)}, ${parseInt(workflow.statusColors[status]?.slice(5, 7) || "0", 16)}, 0.1)`
  };
}

const getNextAction = (order) => {
  const workflow = ORDER_TYPE_WORKFLOWS[order.orderType] || ORDER_TYPE_WORKFLOWS.walkin;
  const status = order.status || "topack";
  const statusFlow = workflow.statusFlow;
  const currentIndex = statusFlow.indexOf(status);
  
  if (currentIndex < statusFlow.length - 1) {
    const nextStatus = statusFlow[currentIndex + 1];
    
    switch(nextStatus) {
      case "packed":
        return "Mark as Packed";
      case "payment_confirmed":
        return "Confirm Payment";
      case "pickup_ready":
        return "Ready for Pickup";
      case "dispatched":
        return "Dispatch Order";
      case "delivered":
        return "Mark as Delivered";
      case "completed":
        return "Complete Order";
      default:
        return "Next Step";
    }
  }
  
  // Default actions based on status
  switch(status) {
    case "completed":
      return "View Details";
    case "delivered":
      return order.paymentTerms === "after" && parseFloat(order.amountPending || "0") > 0 
        ? "Collect Payment" 
        : "Complete Order";
    case "payment_confirmed":
      return "Complete Order";
    default:
      return "View Details";
  }
}

const formatDate = (timestamp) => {
  if (!timestamp || !timestamp._seconds) return "Unknown date";
  const date = new Date(timestamp._seconds * 1000);
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const formatTime = (timestamp) => {
  if (!timestamp || !timestamp._seconds) return "Unknown time";
  const date = new Date(timestamp._seconds * 1000);
  return date.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function OrderDetailsScreen() {
  const navigation = useNavigation()
  const params = useLocalSearchParams()
  const orderId = params.orderId as string
  
  // Fetch order data by ID
  const { data: orderData, isLoading, isError } = useGetSaleById(orderId)
  //console.log("Order data: ", JSON.parse(orderData?.pages[0]))
  
  // Transform API data
  const transformOrderData = (sale) => {
    if (!sale) return null;
    
    const workflowDetails = getWorkflowDetails(sale);
    const paymentDetails = getPaymentDetails(sale);
    const priority = getPriority(sale.createdAt);
    
    // Create timeline from order events
    const timeline = [
      { 
        time: formatTime(sale.createdAt), 
        date: formatDate(sale.createdAt), 
        action: "Order placed", 
        icon: "add-circle", 
        color: COLORS.primary 
      }
    ];
    
    // Add payment event if payment exists
    if (sale.payments && sale.payments.length > 0) {
      timeline.push({
        time: formatTime(sale.updatedAt || sale.createdAt),
        date: formatDate(sale.updatedAt || sale.createdAt),
        action: paymentDetails.paymentStatus === "confirmed" ? "Payment confirmed" : "Payment initiated",
        icon: paymentDetails.paymentStatus === "confirmed" ? "checkmark-circle" : "time",
        color: paymentDetails.paymentStatus === "confirmed" ? "#4CAF50" : "#FF9800"
      });
    }
    
    // Add status events
    if (sale.status !== "topack") {
      timeline.push({
        time: formatTime(sale.updatedAt || sale.createdAt),
        date: formatDate(sale.updatedAt || sale.createdAt),
        action: workflowDetails.statusLabel,
        icon: workflowDetails.statusLabel.includes("Packed") ? "cube" : 
               workflowDetails.statusLabel.includes("Dispatched") ? "car" :
               workflowDetails.statusLabel.includes("Delivered") ? "checkmark-done" :
               workflowDetails.statusLabel.includes("Completed") ? "checkmark-done-circle" : "time",
        color: workflowDetails.statusColor
      });
    }
    
    return {
      id: sale.saleId || sale.id,
      store: "La Luna Jewellery",
      status: sale.status || "topack",
      statusLabel: workflowDetails.statusLabel,
      statusColor: workflowDetails.statusColor,
      statusBg: workflowDetails.statusBg,
      amount: `KES ${parseFloat(sale.totalAmount || "0").toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      time: getTimeAgo(sale.createdAt),
      items: (sale.items || []).map((item, index) => ({
        name: item.label || "Item",
        sku: item.sku || `ITEM-${index + 1}`,
        qty: item.quantity || 1,
        price: `KES ${(parseFloat(item.price || "0")).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        total: `KES ${(parseFloat(item.total || "0")).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      })),
      shelf: "#" + (Math.floor(Math.random() * 200) + 1), // Generate random shelf for now
      payment: paymentDetails.payment,
      paymentMethod: sale.payments?.[0]?.method || "N/A",
      transactionCode: sale.payments?.[0]?.transactionCode || "N/A",
      paymentStatus: paymentDetails.paymentStatus,
      orderType: sale.orderType || "walkin",
      action: getNextAction(sale),
      priority: priority,
      progress: Math.round((workflowDetails.currentStep / workflowDetails.totalSteps) * 100),
      workflow: workflowDetails.workflow,
      currentStep: workflowDetails.currentStep,
      totalSteps: workflowDetails.totalSteps,
      completed: sale.status === "completed",
      
      // Additional fields from API
      customerName: sale.customerName || "Customer",
      phoneNumber: sale.phoneNumber || "N/A",
      email: sale.email || "N/A",
      deliveryAddress: sale.deliveryAddress || "N/A",
      deliveryMethod: "Standard Delivery", // Default
      deliveryFee: `KES ${parseFloat(sale.deliveryFee || "0").toFixed(2)}`,
      errandFee: `KES ${parseFloat(sale.errandFee || "0").toFixed(2)}`,
      salesPerson: sale.salesPerson || "Sales Agent",
      orderDate: formatDate(sale.createdAt),
      orderTime: formatTime(sale.createdAt),
      completedDate: sale.status === "completed" ? formatDate(sale.updatedAt) : "Not completed",
      completedTime: sale.status === "completed" ? formatTime(sale.updatedAt) : "Not completed",
      note: sale.note || "No special instructions",
      
      // Payment details
      subTotal: `KES ${parseFloat(sale.totalAmount || "0").toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      tax: `KES ${(parseFloat(sale.totalAmount || "0") * 0.15).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Assuming 15% tax
      discount: `KES ${(parseFloat(sale.discount || "0")).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalAmount: `KES ${(parseFloat(sale.saleTotal || sale.totalAmount || "0")).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      amountPaid: `KES ${parseFloat(sale.amountPaid || "0").toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      amountPending: `KES ${parseFloat(sale.amountPending || "0").toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      
      // Customer info
      customerId: sale.customerId || "N/A",
      customerEmail: sale.email || "N/A",
      customerPhone: sale.phoneNumber || "N/A",
      
      // Timeline
      timeline: timeline,
      
      // Original sale data
      saleData: sale
    };
  };

  const order = transformOrderData(orderData?.pages[0]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh-circle" size={80} color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Order Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={80} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Failed to load order</Text>
          <Text style={styles.errorText}>
            Order #{orderId} could not be found
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const InfoItem = ({ label, value, icon = null }: { label: string; value: string; icon?: string | null }) => (
    <Animated.View 
      entering={FadeInDown.delay(200).springify()}
      style={styles.infoItem}
    >
      <View style={styles.infoItemHeader}>
        {icon && (
          <Ionicons name={icon} size={16} color={COLORS.primary} style={styles.infoItemIcon} />
        )}
        <Text style={styles.infoItemLabel}>{label}</Text>
      </View>
      <Text style={styles.infoItemValue}>{value || 'N/A'}</Text>
    </Animated.View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Gradient */}
        <LinearGradient
          colors={[COLORS.primary, "#D663F6"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={28} color={COLORS.white} />
              </TouchableOpacity>
              
              <View style={styles.headerTitleContainer}>
                <Animated.Text 
                  entering={FadeInUp.duration(600)}
                  style={styles.headerTitle}
                >
                  Order Details
                </Animated.Text>
                <Animated.Text 
                  entering={FadeInUp.delay(100)}
                  style={styles.headerSubtitle}
                >
                  Track and manage order #{order.id}
                </Animated.Text>
              </View>
              
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerActionButton}>
                  <Ionicons name="share-outline" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionButton}>
                  <Ionicons name="ellipsis-vertical" size={22} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Order Overview Card */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(200)}
          style={styles.overviewCard}
        >
          <View style={styles.overviewHeader}>
            <View style={styles.orderIdContainer}>
              <Ionicons name={order.workflow.icon} size={24} color={COLORS.primary} />
              <Text style={styles.orderId}>{order.id}</Text>
              <View style={[
                styles.priorityBadge,
                { 
                  backgroundColor: 
                    order.priority === "High" ? "#FF6B6B20" :
                    order.priority === "Medium" ? "#FF980020" : "#4CAF5020"
                }
              ]}>
                <Text style={[
                  styles.priorityText,
                  { 
                    color: 
                      order.priority === "High" ? "#FF6B6B" :
                      order.priority === "Medium" ? "#FF9800" : "#4CAF50"
                  }
                ]}>
                  {order.priority} Priority
                </Text>
              </View>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: order.statusBg }]}>
              <View style={[styles.statusDot, { backgroundColor: order.statusColor }]} />
              <Text style={[styles.statusText, { color: order.statusColor }]}>
                {order.statusLabel}
              </Text>
            </View>
          </View>
          
          <Text style={styles.storeName}>{order.store}</Text>
          <Text style={styles.orderDescription}>{order.workflow.description}</Text>
          
          {/* Order Workflow Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Order Progress</Text>
              <Text style={styles.progressPercentage}>{order.progress}%</Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${order.progress}%`,
                    backgroundColor: order.statusColor
                  }
                ]} 
              />
            </View>
            
            {/* Workflow Steps */}
            <View style={styles.workflowSteps}>
              {order.workflow.statusFlow.map((status, index) => {
                const isCompleted = order.workflow.statusFlow.indexOf(order.status) >= index
                const isCurrent = order.status === status
                return (
                  <View key={status} style={styles.workflowStep}>
                    <View style={[
                      styles.stepDot,
                      isCompleted && { backgroundColor: order.workflow.statusColors[status] },
                      isCurrent && styles.currentStepDot
                    ]}>
                      {isCompleted && (
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      )}
                    </View>
                    {index < order.workflow.statusFlow.length - 1 && (
                      <View style={[
                        styles.stepLine,
                        isCompleted && { backgroundColor: order.workflow.statusColors[status] }
                      ]} />
                    )}
                  </View>
                )
              })}
            </View>
            
            <View style={styles.workflowLabels}>
              {order.workflow.statusFlow.map((status) => (
                <Text 
                  key={status} 
                  style={[
                    styles.workflowLabel,
                    order.status === status && { 
                      color: order.workflow.statusColors[status], 
                      fontWeight: 'bold' 
                    }
                  ]}
                  numberOfLines={1}
                >
                  {order.workflow.statusLabels[status]}
                </Text>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Order Summary */}
        <Animated.View 
          entering={FadeInDown.delay(300)}
          style={styles.sectionCard}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <InfoItem label="Order Type" value={order.workflow.label} icon="cart" />
            <InfoItem label="Order Date" value={`${order.orderDate} at ${order.orderTime}`} icon="calendar" />
            <InfoItem label="Customer" value={order.customerName} icon="person" />
            <InfoItem label="Contact" value={order.phoneNumber} icon="call" />
            <InfoItem label="Location" value={order.shelf} icon="location" />
            <InfoItem label="Sales Agent" value={order.salesPerson} icon="person-circle" />
          </View>
        </Animated.View>

        {/* Items List */}
        <Animated.View 
          entering={FadeInDown.delay(400)}
          style={styles.sectionCard}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Order Items ({order.items.length})</Text>
          </View>
          
          {order.items.map((item, index) => (
            <Animated.View 
              key={index}
              entering={FadeInDown.delay(500 + index * 100)}
              style={styles.itemCard}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemIcon}>
                  <Ionicons name="cube-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                </View>
                <Text style={styles.itemQty}>×{item.qty}</Text>
              </View>
              
              <View style={styles.itemFooter}>
                <Text style={styles.itemPrice}>{item.price} each</Text>
                <Text style={styles.itemTotal}>{item.total}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Payment Details */}
        <Animated.View 
          entering={FadeInDown.delay(600)}
          style={styles.sectionCard}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Payment Details</Text>
          </View>
          
          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Subtotal</Text>
              <Text style={styles.paymentValue}>{order.subTotal}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tax (15%)</Text>
              <Text style={styles.paymentValue}>{order.tax}</Text>
            </View>
            {parseFloat(order.discount.replace('KES ', '').replace(',', '')) > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Discount</Text>
                <Text style={[styles.paymentValue, styles.discountText]}>-{order.discount}</Text>
              </View>
            )}
            {parseFloat(order.deliveryFee.replace('KES ', '').replace(',', '')) > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Delivery Fee</Text>
                <Text style={styles.paymentValue}>{order.deliveryFee}</Text>
              </View>
            )}
            {parseFloat(order.errandFee.replace('KES ', '').replace(',', '')) > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Errand Fee</Text>
                <Text style={styles.paymentValue}>{order.errandFee}</Text>
              </View>
            )}
            
            <View style={styles.totalDivider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{order.totalAmount}</Text>
            </View>
            
            <View style={styles.paymentMethod}>
              <View style={[
                styles.paymentStatusBadge,
                { 
                  backgroundColor: order.paymentStatus === "confirmed" ? "rgba(76, 175, 80, 0.1)" :
                                  order.paymentStatus === "deposit_paid" ? "rgba(255, 152, 0, 0.1)" :
                                  order.paymentStatus === "balance_due" ? "rgba(244, 67, 54, 0.1)" :
                                  "rgba(158, 158, 158, 0.1)"
                }
              ]}>
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
                <Text style={[
                  styles.paymentStatusText,
                  { 
                    color: order.paymentStatus === "confirmed" ? "#4CAF50" :
                           order.paymentStatus === "deposit_paid" ? "#FF9800" :
                           order.paymentStatus === "balance_due" ? "#F44336" : "#9E9E9E"
                  }
                ]}>
                  {order.payment}
                </Text>
              </View>
              <View style={styles.paymentDetails}>
                {order.paymentMethod !== "N/A" && (
                  <Text style={styles.paymentDetailLabel}>Method: {order.paymentMethod}</Text>
                )}
                {order.transactionCode !== "N/A" && (
                  <Text style={styles.paymentDetailLabel}>Reference: {order.transactionCode}</Text>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Order Timeline */}
        <Animated.View 
          entering={FadeInDown.delay(700)}
          style={styles.sectionCard}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Order Timeline</Text>
          </View>
          
          {order.timeline.map((event, index) => (
            <Animated.View 
              key={index}
              entering={FadeInDown.delay(800 + index * 100)}
              style={styles.timelineItem}
            >
              <View style={styles.timelineIcon}>
                <Ionicons name={event.icon} size={20} color={event.color} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineAction}>{event.action}</Text>
                <Text style={styles.timelineTime}>{event.time} • {event.date}</Text>
              </View>
              {index < order.timeline.length - 1 && (
                <View style={styles.timelineConnector} />
              )}
            </Animated.View>
          ))}
        </Animated.View>

        {/* Customer Notes */}
        {order.note && order.note !== "No special instructions" && (
          <Animated.View 
            entering={FadeInDown.delay(900)}
            style={styles.sectionCard}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Customer Notes</Text>
            </View>
            
            <View style={styles.noteContainer}>
              <Ionicons name="chatbubble-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.noteText}>{order.note}</Text>
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInDown.delay(1000)}
          style={styles.actionContainer}
        >
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => {}}
          >
            <Ionicons name="download" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Download Invoice</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: order.statusColor }]}
            onPress={() => {}}
          >
            <Text style={styles.primaryButtonText}>{order.action}</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 20,
    fontFamily: "Montserrat-SemiBold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: "Montserrat-Bold",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Montserrat-Regular",
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    height: 160,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 10,
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
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: -25,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderId: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Montserrat-Bold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  storeName: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
    marginBottom: 4,
  },
  orderDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
    marginBottom: 20,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  progressPercentage: {
    fontSize: 14,
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
    marginTop: 4,
  },
  workflowLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  infoItem: {
    width: "48%",
    marginBottom: 16,
  },
  infoItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoItemIcon: {
    marginRight: 4,
  },
  infoItemLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  infoItemValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
    fontFamily: "Montserrat-SemiBold",
  },
  itemCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 2,
  },
  itemSku: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  itemQty: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Montserrat-SemiBold",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  paymentInfo: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  paymentValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
    fontFamily: "Montserrat-SemiBold",
  },
  discountText: {
    color: "#4CAF50",
  },
  totalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    fontFamily: "Montserrat-Bold",
  },
  paymentMethod: {
    marginTop: 8,
  },
  paymentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  paymentDetails: {
    flexDirection: "row",
    gap: 16,
  },
  paymentDetailLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    position: "relative",
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    zIndex: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineAction: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  timelineConnector: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 1,
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    height: 52,
    gap: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    height: 52,
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  bottomSpacing: {
    height: 30,
  },
})