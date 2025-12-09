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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  shelfId: string;
  businessName: string;
  orderType: 'pickup';
  status: string;
  amount: string;
  paymentStatus: 'full' | 'deposit' | 'pending';
  pendingAmount?: string;
}

interface RecordPickupModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

const mockOrders: Order[] = [
  {
    id: '#P001',
    customerName: 'John Doe',
    customerPhone: '+254 712 345 678',
    shelfId: '#A-12',
    businessName: 'ElectroMart',
    orderType: 'pickup',
    status: 'packed',
    amount: 'KES 8,500',
    paymentStatus: 'full',
  },
  {
    id: '#P002',
    customerName: 'Jane Smith',
    customerPhone: '+254 723 456 789',
    shelfId: '#B-08',
    businessName: 'Fashion Hub',
    orderType: 'pickup',
    status: 'packed',
    amount: 'KES 12,300',
    paymentStatus: 'deposit',
    pendingAmount: 'KES 6,150',
  },
  {
    id: '#P003',
    customerName: 'Robert Johnson',
    customerPhone: '+254 734 567 890',
    shelfId: '#C-15',
    businessName: 'Tech Store',
    orderType: 'pickup',
    status: 'packed',
    amount: 'KES 5,800',
    paymentStatus: 'pending',
    pendingAmount: 'KES 5,800',
  },
  {
    id: '#P004',
    customerName: 'Sarah Williams',
    customerPhone: '+254 745 678 901',
    shelfId: '#D-22',
    businessName: 'Home Essentials',
    orderType: 'pickup',
    status: 'packed',
    amount: 'KES 3,200',
    paymentStatus: 'full',
  },
  {
    id: '#P005',
    customerName: 'Michael Brown',
    customerPhone: '+254 756 789 012',
    shelfId: '#E-09',
    businessName: 'Book Palace',
    orderType: 'pickup',
    status: 'packed',
    amount: 'KES 9,500',
    paymentStatus: 'deposit',
    pendingAmount: 'KES 4,750',
  },
];

export default function RecordPickupModal({ visible, onClose, onSelectOrder }: RecordPickupModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = mockOrders.filter(order =>
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerPhone.includes(searchQuery) ||
    order.shelfId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'full': return '#4CAF50';
      case 'deposit': return '#FF9800';
      case 'pending': return '#F44336';
      default: return COLORS.textLight;
    }
  };

  const getPaymentStatusText = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'full': return 'Paid in Full';
      case 'deposit': return 'Deposit Paid';
      case 'pending': return 'Payment Pending';
      default: return '';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={[
        styles.orderItem,
        selectedOrder?.id === item.id && styles.selectedOrderItem,
      ]}
      onPress={() => setSelectedOrder(item)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="cube" size={16} color={COLORS.primary} />
          <Text style={styles.orderId}>{item.id}</Text>
        </View>
        <View style={[
          styles.paymentStatusBadge,
          { backgroundColor: `${getPaymentStatusColor(item.paymentStatus)}15` }
        ]}>
          <View style={[
            styles.paymentStatusDot,
            { backgroundColor: getPaymentStatusColor(item.paymentStatus) }
          ]} />
          <Text style={[
            styles.paymentStatusText,
            { color: getPaymentStatusColor(item.paymentStatus) }
          ]}>
            {getPaymentStatusText(item.paymentStatus)}
          </Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customerName}</Text>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.detailText}>{item.customerPhone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.detailText}>{item.businessName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.detailText}>{item.shelfId}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.amountText}>{item.amount}</Text>
        {item.pendingAmount && (
          <Text style={styles.pendingAmountText}>Pending: {item.pendingAmount}</Text>
        )}
      </View>

      {selectedOrder?.id === item.id && (
        <View style={styles.selectionIndicator}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
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
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Record Pickup</Text>
                <Text style={styles.modalSubtitle}>Select order to record pickup</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, phone, shelf, or business..."
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

          {/* Orders List */}
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyStateTitle}>No orders found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'Try a different search term' : 'No pickup orders available'}
                </Text>
              </View>
            }
          />

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedOrder && styles.confirmButtonDisabled,
              ]}
              onPress={() => selectedOrder && onSelectOrder(selectedOrder)}
              disabled={!selectedOrder}
            >
              <LinearGradient
                colors={selectedOrder ? [COLORS.primary, '#D663F6'] : ['#CCCCCC', '#BBBBBB']}
                style={styles.confirmButtonGradient}
              >
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
                <Text style={styles.confirmButtonText}>
                  {selectedOrder ? 'Confirm Selection' : 'Select an Order'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Montserrat-Bold',
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
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
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Montserrat-Bold',
  },
  pendingAmountText: {
    fontSize: 14,
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
});