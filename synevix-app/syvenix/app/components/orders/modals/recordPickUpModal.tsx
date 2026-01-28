// app/components/modals/RecordPickupModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { useGetAllSaleOrders } from '@/queries/saleQueries';

interface Order {
  id: string;
  saleId: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  status: string;
  orderType: string;
  totalAmount: string;
  amountPaid: string;
  amountPending: string;
  paymentTerms: string;
  createdAt: any;
  updatedAt: any;
  items: any[];
  shelf?: string;
  salesPerson?: string;
  note?: string;
  payments?: any[];
}

interface RecordPickupModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

interface PaymentRow {
  amount: string;
  method: 'cash' | 'mpesa';
  transactionCode?: string;
}

// Helper functions (copied from OrderDetailsScreen)
const getTimeAgo = (timestamp: any) => {
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
};

const getPaymentDetails = (order: any) => {
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
};

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
};

const getWorkflowDetails = (order: any) => {
  const workflow = ORDER_TYPE_WORKFLOWS[order.orderType as keyof typeof ORDER_TYPE_WORKFLOWS] || ORDER_TYPE_WORKFLOWS.walkin;
  const status = order.status || "topack";
  const statusFlow = workflow.statusFlow;
  const currentStep = statusFlow.indexOf(status);
  
  return {
    workflow,
    currentStep: currentStep >= 0 ? currentStep : 0,
    totalSteps: statusFlow.length - 1,
    statusColor: workflow.statusColors[status as keyof typeof workflow.statusColors] || "#FF9800",
    statusLabel: workflow.statusLabels[status as keyof typeof workflow.statusLabels] || "To Pack",
    statusBg: `rgba(${parseInt(workflow.statusColors[status as keyof typeof workflow.statusColors]?.slice(1, 3) || "255", 16)}, ${parseInt(workflow.statusColors[status as keyof typeof workflow.statusColors]?.slice(3, 5) || "152", 16)}, ${parseInt(workflow.statusColors[status as keyof typeof workflow.statusColors]?.slice(5, 7) || "0", 16)}, 0.1)`
  };
};

export default function RecordPickupModal({ visible, onClose, onSelectOrder }: RecordPickupModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [payments, setPayments] = useState<PaymentRow[]>([
    { amount: '', method: 'cash', transactionCode: '' },
  ]);

  const [paymentError, setPaymentError] = useState<string | null>(null);

  const pendingAmount = selectedOrder
  ? parseFloat(selectedOrder.amountPending || '0')
  : 0;

const totalPaid = payments.reduce(
  (sum, p) => sum + (parseFloat(p.amount) || 0),
  0
);

const addPaymentRow = () => {
  setPayments([...payments, { amount: '', method: 'cash', transactionCode: '' }]);
};

const removePaymentRow = (index: number) => {
  setPayments(payments.filter((_, i) => i !== index));
};

const updatePayment = (
  index: number,
  field: keyof PaymentRow,
  value: string
) => {
  const copy = [...payments];
  copy[index] = { ...copy[index], [field]: value };
  setPayments(copy);
};

const validatePayments = () => {
  if (!selectedOrder) return false;

  for (const payment of payments) {
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      setPaymentError('Each payment must have a valid amount.');
      return false;
    }

    if (payment.method === 'mpesa' && !payment.transactionCode) {
      setPaymentError('MPESA payments require a transaction code.');
      return false;
    }
  }

  if (totalPaid !== pendingAmount) {
    setPaymentError(
      `Total paid (KES ${totalPaid.toFixed(2)}) must equal pending amount (KES ${pendingAmount.toFixed(2)}).`
    );
    return false;
  }

  setPaymentError(null);
  return true;
};
  
  // Use existing query from orders page
  const { data: ordersData, isLoading, isError, refetch } = useGetAllSaleOrders({
    searchText: '', // Empty for initial load, we'll filter locally
    pageLimit: 100 // Get more orders to filter from
  });

  
  // Transform order data
  const transformOrderForModal = (sale: any) => {
    if (!sale) return null;
    
    const paymentDetails = getPaymentDetails(sale);
    const workflowDetails = getWorkflowDetails(sale);
    const timeAgo = getTimeAgo(sale.createdAt);
    
    return {
      id: sale.saleId || sale.id,
      saleId: sale.saleId || sale.id,
      customerName: sale.customerName || "Customer",
      phoneNumber: sale.phoneNumber || "N/A",
      email: sale.email || "N/A",
      status: sale.status || "topack",
      orderType: sale.orderType || "walkin",
      totalAmount: sale.totalAmount || "0",
      amountPaid: sale.amountPaid || "0",
      amountPending: sale.amountPending || "0",
      paymentTerms: sale.paymentTerms || "full",
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      items: sale.items || [],
      shelf: sale.shelf || "#" + (Math.floor(Math.random() * 200) + 1),
      salesPerson: sale.salesPerson || "Sales Agent",
      note: sale.note || "",
      payments: sale.payments || [],
      amount: `KES ${parseFloat(sale.totalAmount || "0").toLocaleString('en-KE', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`,
      paymentStatus: paymentDetails.paymentStatus,
      statusLabel: workflowDetails.statusLabel,
      timeAgo: timeAgo,
      paymentDetails: paymentDetails,
      workflowDetails: workflowDetails
    };
  };

  // Transform all orders and filter pickup orders
  const allOrders = ordersData?.pages?.[0]?.sales ?? [];


  // Filter pickup orders that are packed or payment_confirmed
  const pickupOrders = allOrders?.filter(order => 
    order && order.orderType === "pickup"
    // order.orderType === "pickup" && 
    // (order.status === "packed" || order.status === "payment_confirmed")
  );

  // Filter orders based on search query
  const filteredOrders = pickupOrders.filter(order => {
    if (!order) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.phoneNumber?.includes(searchQuery) ||
      order.id?.toLowerCase().includes(searchLower) ||
      order.saleId?.toLowerCase().includes(searchLower) ||
      // order.shelf?.toLowerCase().includes(searchLower) ||
      order.email?.toLowerCase().includes(searchLower)
    );
  });

  const getPaymentStatusColor = (order: Order) => {
    const paymentDetails = getPaymentDetails(order);
    switch (paymentDetails.paymentStatus) {
      case 'confirmed': return '#4CAF50';
      case 'deposit_paid': return '#FF9800';
      case 'balance_due': return '#F44336';
      case 'pending': return '#F44336';
      default: return COLORS.textLight;
    }
  };

  const getPaymentStatusText = (order: Order) => {
    const paymentDetails = getPaymentDetails(order);
    return paymentDetails.payment;
  };

  const getOrderStatusColor = (order: Order) => {
    const workflowDetails = getWorkflowDetails(order);
    return workflowDetails.statusColor;
  };

  const getOrderStatusText = (order: Order) => {
    const workflowDetails = getWorkflowDetails(order);
    return workflowDetails.statusLabel;
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleConfirmSelection = () => {
  if (!selectedOrder) return;

  if (pendingAmount > 0) {
    setShowPaymentModal(true);
    return;
  }

  onSelectOrder(selectedOrder);
  setSelectedOrder(null);
  setSearchQuery('');
};

  const renderOrderItem = ({ item }: { item: Order }) => {
  const payment = getPaymentDetails(item);
  const workflow = getWorkflowDetails(item);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => handleOrderSelect(item)}
      style={[
        styles.orderCard,
        selectedOrder?.id === item.id && styles.orderCardSelected,
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <View style={styles.orderIdRow}>
            <Ionicons name="bag-handle" size={18} color={COLORS.primary} />
            <Text style={styles.orderId}>{item.saleId}</Text>
          </View>

          <Text style={styles.businessName}>La Luna Jewellery</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: workflow.statusBg },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: workflow.statusColor },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: workflow.statusColor },
            ]}
          >
            {workflow.statusLabel}
          </Text>
        </View>
      </View>

      {/* Customer */}
      <Text style={styles.customerName}>{item.customerName}</Text>

      {/* Meta */}
      <View style={styles.metaRow}>
        <Ionicons name="call-outline" size={14} color={COLORS.textLight} />
        <Text style={styles.metaText}>{item.phoneNumber}</Text>

        <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
        <Text style={styles.metaText}>{item.shelf || "#300"}</Text>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View
          style={[
            styles.paymentBadge,
            { backgroundColor: `${payment.color}20` },
          ]}
        >
          <Ionicons
            name={payment.icon as any}
            size={14}
            color={payment.color}
          />
          <Text
            style={[
              styles.paymentText,
              { color: payment.color },
            ]}
          >
            {payment.payment}
          </Text>
        </View>

        <Text style={styles.amount}>
          KES{" "}
          {parseFloat(item.totalAmount).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      {/* Pending */}
      {parseFloat(item.amountPending) > 0 && (
        <View style={styles.pendingRow}>
          <Ionicons name="alert-circle" size={14} color="#F44336" />
          <Text style={styles.pendingText}>
            Pending KES{" "}
            {parseFloat(item.amountPending).toLocaleString("en-KE")}
          </Text>
        </View>
      )}

      {/* Selected */}
      {selectedOrder?.id === item.id && (
        <View style={styles.selectedIcon}>
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={COLORS.primary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};


  return (
    <>
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={styles.modalContent}>
          <LinearGradient
            colors={[COLORS.primary, '#D663F6']}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity 
                onPress={() => {
                  onClose();
                  setSelectedOrder(null);
                  setSearchQuery('');
                }} 
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.confirmButtonText}>
                  {!selectedOrder
                    ? 'Select an Order to Continue'
                    : pendingAmount > 0
                    ? `Confirm Payment of KES ${pendingAmount.toLocaleString('en-KE')}`
                    : `Record Pickup for ${selectedOrder.saleId}`}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isLoading ? 'Loading orders...' : `${filteredOrders.length} orders ready for pickup`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
                <Ionicons name="refresh" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, phone, shelf, or order ID..."
                placeholderTextColor={COLORS.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Loading State */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading pickup orders...</Text>
            </View>
          ) : isError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
              <Text style={styles.errorTitle}>Failed to load orders</Text>
              <Text style={styles.errorText}>Please try again</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => refetch()}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Orders List */
            <FlatList
              data={filteredOrders}
              renderItem={renderOrderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={refetch}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="cube-outline" size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyStateTitle}>No pickup orders available</Text>
                  <Text style={styles.emptyStateText}>
                    {searchQuery 
                      ? 'No orders match your search' 
                      : 'All pickup orders have been processed or no pickup orders found'}
                  </Text>
                </View>
              }
            />
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedOrder && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmSelection}
              disabled={!selectedOrder}
            >
              <LinearGradient
                colors={selectedOrder ? [COLORS.primary, '#D663F6'] : ['#CCCCCC', '#BBBBBB']}
                style={styles.confirmButtonGradient}
              >
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
                <Text style={styles.confirmButtonText}>
                  {selectedOrder 
                    ? `Record Pickup for ${selectedOrder.id}`
                    : 'Select an Order to Continue'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>

    <Modal visible={showPaymentModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.paymentModal}>
      <Text style={styles.paymentTitle}>Confirm Payment</Text>

      <Text style={styles.paymentSubtitle}>
        Pending Amount: KES {pendingAmount.toLocaleString('en-KE')}
      </Text>

      {payments.map((payment, index) => (
        <View key={index} style={styles.paymentRow}>
          <View style={styles.paymentHeader}>
            <Text style={styles.paymentRowTitle}>Payment {index + 1}</Text>
            {payments.length > 1 && (
              <TouchableOpacity onPress={() => removePaymentRow(index)}>
                <Ionicons name="trash" size={18} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="decimal-pad"
            value={payment.amount}
            onChangeText={(v) => updatePayment(index, 'amount', v)}
          />

          <View style={styles.methodRow}>
            <TouchableOpacity
              onPress={() => updatePayment(index, 'method', 'cash')}
              style={[
                styles.methodChip,
                payment.method === 'cash' && styles.methodChipActive,
              ]}
            >
              <Text>Cash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updatePayment(index, 'method', 'mpesa')}
              style={[
                styles.methodChip,
                payment.method === 'mpesa' && styles.methodChipActive,
              ]}
            >
              <Text>MPESA</Text>
            </TouchableOpacity>
          </View>

          {payment.method === 'mpesa' && (
            <TextInput
              style={styles.input}
              placeholder="MPESA Transaction Code"
              value={payment.transactionCode}
              onChangeText={(v) =>
                updatePayment(index, 'transactionCode', v)
              }
            />
          )}
        </View>
      ))}

      <TouchableOpacity onPress={addPaymentRow} style={styles.addPaymentBtn}>
        <Ionicons name="add-circle" size={22} color={COLORS.primary} />
        <Text>Add Payment</Text>
      </TouchableOpacity>

      {paymentError && (
        <Text style={styles.paymentError}>{paymentError}</Text>
      )}

      <Text style={styles.paymentSummary}>
        Total Paid: KES {totalPaid.toLocaleString('en-KE')}
      </Text>

      <View style={styles.paymentActions}>
        <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (!validatePayments()) return;

            // 🔗 submit payment later
            onSelectOrder(selectedOrder!);
            setShowPaymentModal(false);
            setSelectedOrder(null);
            setSearchQuery('');
          }}
          style={styles.confirmBtn}
        >
          <Text style={styles.confirmText}>Confirm Payment & Pickup</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Montserrat-Regular',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Montserrat-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 12,
    fontFamily: 'Montserrat-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Montserrat-Bold',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Montserrat-Regular',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  orderItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedOrderItem: {
    borderColor: COLORS.primary,
    // backgroundColor: 'rgba(201, 70, 238, 0.05)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Montserrat-Bold',
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Regular',
    marginTop: 2,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginLeft: 8,
  },
  paymentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 12,
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Montserrat-Regular',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Montserrat-Bold',
  },
  pendingAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pendingAmountText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Montserrat-Bold',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  orderCard: {
  backgroundColor: COLORS.white,
  borderRadius: 18,
  padding: 16,
  marginBottom: 12,
  borderWidth: 2,
  borderColor: "transparent",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 4,
},
orderCardSelected: {
  borderColor: COLORS.primary,
  // backgroundColor: "rgba(201, 70, 238, 0.05)",
},
cardHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
},
orderIdRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},
orderId: {
  fontSize: 18,
  fontFamily: "Montserrat-Bold",
  color: COLORS.text,
},
statusBadge: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 12,
},
statusDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
},
statusText: {
  fontSize: 13,
  fontFamily: "Montserrat-SemiBold",
},
metaRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
},
metaText: {
  fontSize: 14,
  color: COLORS.textLight,
  fontFamily: "Montserrat-Regular",
},
cardFooter: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},
paymentBadge: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 8,
},
paymentText: {
  fontSize: 13,
  fontFamily: "Montserrat-SemiBold",
},
amount: {
  fontSize: 16,
  fontFamily: "Montserrat-Bold",
  color: COLORS.text,
},
pendingRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  marginTop: 8,
},
pendingText: {
  fontSize: 12,
  color: "#F44336",
  fontFamily: "Montserrat-SemiBold",
},
selectedIcon: {
  position: "absolute",
  top: 14,
  right: 14,
},
businessName: {
  fontSize: 13,
  color: COLORS.textLight,
  fontFamily: "Montserrat-SemiBold",
  marginTop: 2,
},
paymentModal: {
  backgroundColor: COLORS.white,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 20,
},
paymentTitle: {
  fontSize: 20,
  fontFamily: 'Montserrat-Bold',
},
paymentSubtitle: {
  color: COLORS.textLight,
  marginBottom: 16,
},
paymentRow: {
  backgroundColor: '#f9f9f9',
  padding: 14,
  borderRadius: 12,
  marginBottom: 12,
},
paymentHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 8,
},
paymentRowTitle: {
  fontFamily: 'Montserrat-SemiBold',
},
methodRow: {
  flexDirection: 'row',
  gap: 10,
  marginTop: 8,
},
methodChip: {
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: '#eee',
},
methodChipActive: {
  backgroundColor: 'rgba(201,70,238,0.2)',
},
addPaymentBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginVertical: 10,
},
paymentError: {
  color: '#F44336',
  marginTop: 8,
  fontFamily: 'Montserrat-SemiBold',
},
paymentSummary: {
  marginTop: 8,
  fontFamily: 'Montserrat-Bold',
},
paymentActions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
},
cancelText: {
  color: COLORS.textLight,
},
confirmBtn: {
  backgroundColor: COLORS.primary,
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 10,
},
confirmText: {
  color: COLORS.white,
  fontFamily: 'Montserrat-SemiBold',
},


});