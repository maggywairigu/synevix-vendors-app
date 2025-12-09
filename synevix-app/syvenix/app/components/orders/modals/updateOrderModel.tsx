// app/components/modals/UpdateOrderModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
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
  orderType: 'walkin' | 'pickup' | 'delivery';
  status: string;
  statusLabel: string;
  amount: string;
  paymentStatus: 'full' | 'deposit' | 'pending';
  pendingAmount?: string;
  paymentMethod?: string;
  items?: Array<{ name: string; qty: string; }>;
  createdAt: string;
  priority: 'High' | 'Medium' | 'Low';
  statusColor: string;
  statusBg: string;
}

interface UpdateOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

// Enhanced dummy data for all order types
const allOrders: Order[] = [
  // Walk-in Orders
  {
    id: '#W001',
    customerName: 'John Kamau',
    customerPhone: '+254 712 345 678',
    shelfId: '#120',
    businessName: 'TechStore Kenya',
    orderType: 'walkin',
    status: 'pending',
    statusLabel: 'Payment Pending',
    amount: 'KES 3,400',
    paymentStatus: 'pending',
    paymentMethod: 'Pending',
    items: [
      { name: 'Packaging Boxes', qty: '30' },
      { name: 'Bubble Wrap', qty: '5' },
    ],
    createdAt: '2 hours ago',
    priority: 'High',
    statusColor: '#FF9800',
    statusBg: 'rgba(255, 152, 0, 0.1)'
  },
  {
    id: '#W002',
    customerName: 'Sarah Mwangi',
    customerPhone: '+254 723 456 789',
    shelfId: '#08',
    businessName: 'Home Essentials',
    orderType: 'walkin',
    status: 'payment_confirmed',
    statusLabel: 'Ready for Pickup',
    amount: 'KES 450',
    paymentStatus: 'full',
    paymentMethod: 'Cash',
    items: [{ name: 'Plastic Containers', qty: '20' }],
    createdAt: '1 hour ago',
    priority: 'Medium',
    statusColor: '#4CAF50',
    statusBg: 'rgba(76, 175, 80, 0.1)'
  },
  
  // Pickup Orders
  {
    id: '#P001',
    customerName: 'Michael Ochieng',
    customerPhone: '+254 734 567 890',
    shelfId: '#45',
    businessName: 'Fashion Hub',
    orderType: 'pickup',
    status: 'topack',
    statusLabel: 'To Pack',
    amount: 'KES 1,250',
    paymentStatus: 'deposit',
    pendingAmount: 'KES 625',
    paymentMethod: 'Deposit Paid',
    items: [{ name: 'T-Shirts', qty: '15' }],
    createdAt: '30 min ago',
    priority: 'Low',
    statusColor: '#FF9800',
    statusBg: 'rgba(255, 152, 0, 0.1)'
  },
  {
    id: '#P002',
    customerName: 'Jane Wambui',
    customerPhone: '+254 745 678 901',
    shelfId: '#89',
    businessName: 'Gadget World',
    orderType: 'pickup',
    status: 'packed',
    statusLabel: 'Ready for Pickup',
    amount: 'KES 5,800',
    paymentStatus: 'deposit',
    pendingAmount: 'KES 2,900',
    paymentMethod: 'Deposit Paid',
    items: [
      { name: 'Smartphones', qty: '2' },
      { name: 'Cases', qty: '4' },
    ],
    createdAt: 'Just now',
    priority: 'High',
    statusColor: '#4CAF50',
    statusBg: 'rgba(76, 175, 80, 0.1)'
  },
  {
    id: '#P003',
    customerName: 'David Kiprop',
    customerPhone: '+254 756 789 012',
    shelfId: '#32',
    businessName: 'Book Palace',
    orderType: 'pickup',
    status: 'pickup_recorded',
    statusLabel: 'Pickup Recorded',
    amount: 'KES 2,300',
    paymentStatus: 'deposit',
    pendingAmount: 'KES 1,150',
    paymentMethod: 'Balance Due',
    items: [{ name: 'Novels', qty: '12' }],
    createdAt: 'Yesterday',
    priority: 'Medium',
    statusColor: '#2196F3',
    statusBg: 'rgba(33, 150, 243, 0.1)'
  },
  
  // Delivery Orders
  {
    id: '#D001',
    customerName: 'Grace Akinyi',
    customerPhone: '+254 767 890 123',
    shelfId: '#75',
    businessName: 'ElectroMart',
    orderType: 'delivery',
    status: 'topack',
    statusLabel: 'To Pack',
    amount: 'KES 8,500',
    paymentStatus: 'full',
    paymentMethod: 'Credit Card',
    items: [
      { name: 'Headphones', qty: '3' },
      { name: 'Chargers', qty: '5' },
    ],
    createdAt: '2 days ago',
    priority: 'Low',
    statusColor: '#FF9800',
    statusBg: 'rgba(255, 152, 0, 0.1)'
  },
  {
    id: '#D002',
    customerName: 'Peter Maina',
    customerPhone: '+254 778 901 234',
    shelfId: '#99',
    businessName: 'Furniture City',
    orderType: 'delivery',
    status: 'packed',
    statusLabel: 'Packed',
    amount: 'KES 15,000',
    paymentStatus: 'pending',
    paymentMethod: 'After Delivery',
    items: [{ name: 'Office Chair', qty: '1' }],
    createdAt: '1 week ago',
    priority: 'Medium',
    statusColor: '#4CAF50',
    statusBg: 'rgba(76, 175, 80, 0.1)'
  },
  {
    id: '#D003',
    customerName: 'Mercy Achieng',
    customerPhone: '+254 789 012 345',
    shelfId: '#42',
    businessName: 'Super Foods',
    orderType: 'delivery',
    status: 'dispatched',
    statusLabel: 'Dispatched',
    amount: 'KES 1,800',
    paymentStatus: 'pending',
    paymentMethod: 'After Delivery',
    items: [
      { name: 'Groceries', qty: '15' },
      { name: 'Beverages', qty: '8' },
    ],
    createdAt: '3 days ago',
    priority: 'Low',
    statusColor: '#2196F3',
    statusBg: 'rgba(33, 150, 243, 0.1)'
  },
  
  // Completed Orders
  {
    id: '#C001',
    customerName: 'Brian Omollo',
    customerPhone: '+254 790 123 456',
    shelfId: '#120',
    businessName: 'TechStore Kenya',
    orderType: 'walkin',
    status: 'completed',
    statusLabel: 'Completed',
    amount: 'KES 3,400',
    paymentStatus: 'full',
    paymentMethod: 'Full Payment',
    items: [{ name: 'Packaging Boxes', qty: '30' }],
    createdAt: '1 day ago',
    priority: 'Medium',
    statusColor: '#607D8B',
    statusBg: 'rgba(96, 125, 139, 0.1)'
  },
  {
    id: '#C002',
    customerName: 'Susan Njeri',
    customerPhone: '+254 701 234 567',
    shelfId: '#45',
    businessName: 'Fashion Hub',
    orderType: 'pickup',
    status: 'completed',
    statusLabel: 'Completed',
    amount: 'KES 1,250',
    paymentStatus: 'full',
    paymentMethod: 'Deposit Paid',
    items: [{ name: 'T-Shirts', qty: '15' }],
    createdAt: '2 days ago',
    priority: 'Low',
    statusColor: '#607D8B',
    statusBg: 'rgba(96, 125, 139, 0.1)'
  },
];

export default function UpdateOrderModal({ visible, onClose, onSelectOrder }: UpdateOrderModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(allOrders);
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | Order['orderType']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');

  useEffect(() => {
    let filtered = allOrders;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query) ||
        order.shelfId.toLowerCase().includes(query) ||
        order.businessName.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    }
    
    // Apply order type filter
    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.orderType === orderTypeFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [searchQuery, orderTypeFilter, statusFilter]);

  const getOrderTypeIcon = (type: Order['orderType']) => {
    switch (type) {
      case 'walkin': return 'walk';
      case 'pickup': return 'bag-handle';
      case 'delivery': return 'bicycle';
      default: return 'cart';
    }
  };

  const getOrderTypeColor = (type: Order['orderType']) => {
    switch (type) {
      case 'walkin': return '#4CAF50';
      case 'pickup': return '#2196F3';
      case 'delivery': return '#9C27B0';
      default: return COLORS.text;
    }
  };

  const getPriorityColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'High': return '#FF6B6B';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return COLORS.textLight;
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
          <View style={[
            styles.orderTypeIcon,
            { backgroundColor: `${getOrderTypeColor(item.orderType)}15` }
          ]}>
            <Ionicons 
              name={getOrderTypeIcon(item.orderType)} 
              size={16} 
              color={getOrderTypeColor(item.orderType)} 
            />
          </View>
          <View>
            <Text style={styles.orderId}>{item.id}</Text>
            <Text style={styles.orderTypeText}>
              {item.orderType.charAt(0).toUpperCase() + item.orderType.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: `${getPriorityColor(item.priority)}15` }
          ]}>
            <View style={[
              styles.priorityDot,
              { backgroundColor: getPriorityColor(item.priority) }
            ]} />
            <Text style={[
              styles.priorityText,
              { color: getPriorityColor(item.priority) }
            ]}>
              {item.priority}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: item.statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
            <Text style={[styles.statusText, { color: item.statusColor }]}>
              {item.statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customerName}</Text>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.detailText}>{item.customerPhone}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="business-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.detailText}>{item.businessName}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.detailText}>{item.shelfId}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.detailText}>{item.createdAt}</Text>
          </View>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <Text style={styles.amountText}>{item.amount}</Text>
        </View>
        
        <View style={styles.paymentContainer}>
          <Ionicons 
            name={
              item.paymentStatus === 'full' ? 'checkmark-circle' :
              item.paymentStatus === 'deposit' ? 'time' : 'close-circle'
            } 
            size={16} 
            color={
              item.paymentStatus === 'full' ? '#4CAF50' :
              item.paymentStatus === 'deposit' ? '#FF9800' : '#F44336'
            } 
          />
          <Text style={styles.paymentText}>{item.paymentMethod}</Text>
        </View>
      </View>

      {selectedOrder?.id === item.id && (
        <View style={styles.selectionIndicator}>
          <LinearGradient
            colors={[COLORS.primary, '#D663F6']}
            style={styles.selectionGradient}
          >
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </LinearGradient>
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
        <View style={styles.modalContent}>
          <LinearGradient
            colors={[COLORS.primary, '#D663F6']}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Update Order</Text>
                <Text style={styles.modalSubtitle}>Select order to update details</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.primary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search orders by ID, name, phone, or business..."
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

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              {/* Order Type Filters */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Type:</Text>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    orderTypeFilter === 'all' && styles.filterChipActive,
                  ]}
                  onPress={() => setOrderTypeFilter('all')}
                >
                  <Text style={[
                    styles.filterChipText,
                    orderTypeFilter === 'all' && styles.filterChipTextActive,
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    orderTypeFilter === 'walkin' && styles.filterChipActive,
                  ]}
                  onPress={() => setOrderTypeFilter('walkin')}
                >
                  <Ionicons 
                    name="walk" 
                    size={14} 
                    color={orderTypeFilter === 'walkin' ? COLORS.white : '#4CAF50'} 
                  />
                  <Text style={[
                    styles.filterChipText,
                    orderTypeFilter === 'walkin' && styles.filterChipTextActive,
                  ]}>
                    Walk-in
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    orderTypeFilter === 'pickup' && styles.filterChipActive,
                  ]}
                  onPress={() => setOrderTypeFilter('pickup')}
                >
                  <Ionicons 
                    name="bag-handle" 
                    size={14} 
                    color={orderTypeFilter === 'pickup' ? COLORS.white : '#2196F3'} 
                  />
                  <Text style={[
                    styles.filterChipText,
                    orderTypeFilter === 'pickup' && styles.filterChipTextActive,
                  ]}>
                    Pickup
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    orderTypeFilter === 'delivery' && styles.filterChipActive,
                  ]}
                  onPress={() => setOrderTypeFilter('delivery')}
                >
                  <Ionicons 
                    name="bicycle" 
                    size={14} 
                    color={orderTypeFilter === 'delivery' ? COLORS.white : '#9C27B0'} 
                  />
                  <Text style={[
                    styles.filterChipText,
                    orderTypeFilter === 'delivery' && styles.filterChipTextActive,
                  ]}>
                    Delivery
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Status Filters */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status:</Text>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    statusFilter === 'all' && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter('all')}
                >
                  <Text style={[
                    styles.filterChipText,
                    statusFilter === 'all' && styles.filterChipTextActive,
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    statusFilter === 'pending' && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter('pending')}
                >
                  <View style={[styles.statusFilterDot, { backgroundColor: '#FF9800' }]} />
                  <Text style={[
                    styles.filterChipText,
                    statusFilter === 'pending' && styles.filterChipTextActive,
                  ]}>
                    Pending
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    statusFilter === 'packed' && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter('packed')}
                >
                  <View style={[styles.statusFilterDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={[
                    styles.filterChipText,
                    statusFilter === 'packed' && styles.filterChipTextActive,
                  ]}>
                    Packed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    statusFilter === 'completed' && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter('completed')}
                >
                  <View style={[styles.statusFilterDot, { backgroundColor: '#607D8B' }]} />
                  <Text style={[
                    styles.filterChipText,
                    statusFilter === 'completed' && styles.filterChipTextActive,
                  ]}>
                    Completed
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Results Count */}
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {filteredOrders.length} orders found
              {(searchQuery || orderTypeFilter !== 'all' || statusFilter !== 'all') && (
                <Text style={styles.resultsFilterText}>
                  {searchQuery && ` for "${searchQuery}"`}
                  {orderTypeFilter !== 'all' && ` • ${orderTypeFilter}`}
                  {statusFilter !== 'all' && ` • ${statusFilter}`}
                </Text>
              )}
            </Text>
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
                <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyStateTitle}>No orders found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery || orderTypeFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or search term'
                    : 'No orders available to update'}
                </Text>
                {(searchQuery || orderTypeFilter !== 'all' || statusFilter !== 'all') && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setSearchQuery('');
                      setOrderTypeFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.updateButton,
                !selectedOrder && styles.updateButtonDisabled,
              ]}
              onPress={() => {
                if (selectedOrder) {
                  onSelectOrder(selectedOrder);
                  setSelectedOrder(null);
                  setSearchQuery('');
                  setOrderTypeFilter('all');
                  setStatusFilter('all');
                }
              }}
              disabled={!selectedOrder}
            >
              <LinearGradient
                colors={selectedOrder ? [COLORS.primary, '#D663F6'] : ['#CCCCCC', '#BBBBBB']}
                style={styles.updateButtonGradient}
              >
                <Ionicons name="create" size={20} color={COLORS.white} />
                <Text style={styles.updateButtonText}>
                  {selectedOrder ? `Update ${selectedOrder.id}` : 'Select an Order'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  filtersContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-SemiBold',
    marginRight: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: 'Montserrat-Regular',
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontFamily: 'Montserrat-SemiBold',
  },
  statusFilterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Montserrat-Regular',
  },
  resultsFilterText: {
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Italic',
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
    position: 'relative',
  },
  selectedOrderItem: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(201, 70, 238, 0.05)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 2,
  },
  orderTypeText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Regular',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
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
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Regular',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'Montserrat-Bold',
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Regular',
  },
  selectionIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionGradient: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  clearFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(201, 70, 238, 0.1)',
    borderRadius: 12,
  },
  clearFiltersText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  updateButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  updateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
});