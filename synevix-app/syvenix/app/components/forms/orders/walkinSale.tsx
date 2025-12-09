import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';

// Dummy data for shelves/shops
const SHELVES_DATA = [
  { id: '1', name: 'Main Warehouse', location: 'Floor 1, Section A', itemsCount: 245 },
  { id: '2', name: 'Downtown Store', location: '123 Main Street', itemsCount: 120 },
  { id: '3', name: 'Mall Branch', location: 'Westgate Mall', itemsCount: 89 },
  { id: '4', name: 'Express Shop', location: 'Airport Road', itemsCount: 65 },
  { id: '5', name: 'Online Warehouse', location: 'Virtual', itemsCount: 312 },
];

// Dummy data for products
const PRODUCTS_DATA = [
  { id: '1', sku: 'SKU001', name: 'iPhone 15 Pro', price: 1299.99, stock: 15, shelfId: '1', image: 'https://via.placeholder.com/150' },
  { id: '2', sku: 'SKU002', name: 'Samsung Galaxy S24', price: 1099.99, stock: 8, shelfId: '1', image: 'https://via.placeholder.com/150' },
  { id: '3', sku: 'SKU003', name: 'MacBook Pro 16"', price: 2499.99, stock: 5, shelfId: '2', image: 'https://via.placeholder.com/150' },
  { id: '4', sku: 'SKU004', name: 'iPad Air', price: 599.99, stock: 22, shelfId: '2', image: 'https://via.placeholder.com/150' },
  { id: '5', sku: 'SKU005', name: 'Sony Headphones', price: 299.99, stock: 30, shelfId: '3', image: 'https://via.placeholder.com/150' },
  { id: '6', sku: 'SKU006', name: 'Apple Watch Series 9', price: 399.99, stock: 18, shelfId: '4', image: 'https://via.placeholder.com/150' },
];

// Dummy data for collections
const COLLECTIONS_DATA = [
  { id: '1', name: 'Starter Office Kit', description: 'Basic office setup', itemsCount: 4, discount: 10, price: 1999.99 },
  { id: '2', name: 'Gaming Bundle', description: 'Complete gaming setup', itemsCount: 5, discount: 15, price: 2999.99 },
  { id: '3', name: 'Home Office Pro', description: 'Professional home office', itemsCount: 6, discount: 12, price: 3499.99 },
];

// Dummy data for payment accounts
const PAYMENT_ACCOUNTS = [
  { id: '1', name: 'M-Pesa', type: 'mobile', accountNumber: '0712345678', isPrimary: true },
  { id: '2', name: 'Bank - KCB', type: 'bank', accountNumber: '1234567890', isPrimary: false },
  { id: '3', name: 'Cash', type: 'cash', accountNumber: '', isPrimary: false },
  { id: '4', name: 'Credit Card', type: 'card', accountNumber: '**** **** **** 1234', isPrimary: false },
];

const AddNewOrder = () => {
  const router = useRouter();
  
  // State variables
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [orderType, setOrderType] = useState('walkin');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [errandFee, setErrandFee] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [courier, setCourier] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('full');
  const [salesPerson, setSalesPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionItems, setCollectionItems] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [collectionDiscount, setCollectionDiscount] = useState(0);
  const [payments, setPayments] = useState([{ amount: '', method: '', transactionCode: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filtered products based on selected shelf and search
  const filteredProducts = useMemo(() => {
    let products = PRODUCTS_DATA;
    
    // Filter by shelf if selected
    if (selectedShelf) {
      products = products.filter(product => product.shelfId === selectedShelf.id);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
      );
    }
    
    return products;
  }, [selectedShelf, searchQuery]);
  
  // Filtered collections
  const filteredCollections = useMemo(() => {
    return COLLECTIONS_DATA.filter(collection =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);
  
  // Calculate totals
  const calculateTotals = useMemo(() => {
    let itemsTotal = 0;
    let totalQuantity = 0;
    
    selectedItems.forEach(item => {
      const quantity = parseInt(item.quantity) || 1;
      const price = parseFloat(item.price) || 0;
      const discount = parseFloat(item.discount) || 0;
      const discountedPrice = price - (price * (discount / 100));
      
      itemsTotal += discountedPrice * quantity;
      totalQuantity += quantity;
    });
    
    const deliveryFeeNum = parseFloat(deliveryFee) || 0;
    const errandFeeNum = parseFloat(errandFee) || 0;
    const totalAmount = itemsTotal + deliveryFeeNum + errandFeeNum;
    
    const paidAmount = payments.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount) || 0);
    }, 0);
    
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    
    return {
      itemsTotal,
      totalQuantity,
      deliveryFee: deliveryFeeNum,
      errandFee: errandFeeNum,
      totalAmount,
      paidAmount,
      pendingAmount,
    };
  }, [selectedItems, deliveryFee, errandFee, payments]);
  
  // Handlers
  const handleSelectShelf = (shelf) => {
    setSelectedShelf(shelf);
    setShowShelfModal(false);
    setSearchQuery(''); // Reset search when shelf changes
  };
  
  const handleAddItem = (product) => {
    const existingItem = selectedItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setSelectedItems(prev => prev.map(item =>
        item.id === product.id
          ? { ...item, quantity: (parseInt(item.quantity) || 1) + 1 }
          : item
      ));
    } else {
      setSelectedItems(prev => [...prev, {
        ...product,
        quantity: 1,
        discount: 0,
      }]);
    }
  };
  
  const handleRemoveItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const handleItemQuantityChange = (itemId, quantity) => {
    if (quantity < 1) return;
    
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };
  
  const handleItemDiscountChange = (itemId, discount) => {
    const discountNum = Math.max(0, Math.min(100, discount));
    
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, discount: discountNum } : item
    ));
  };
  
  const handleSelectCollection = (collection) => {
    setSelectedCollection(collection);
    
    // Generate dummy collection items (in real app, fetch from API)
    const items = Array.from({ length: collection.itemsCount }, (_, i) => ({
      id: `col-${collection.id}-item-${i + 1}`,
      productId: `col-prod-${i + 1}`,
      name: `Collection Item ${i + 1}`,
      price: (collection.price / collection.itemsCount) * (1 + Math.random() * 0.5),
      variants: i % 2 === 0 ? [
        { id: 'var-1', name: 'Variant A', price: 50, stock: 10 },
        { id: 'var-2', name: 'Variant B', price: 75, stock: 5 },
      ] : [],
    }));
    
    setCollectionItems(items);
    setShowCollectionModal(false);
    setShowVariantModal(true);
    
    // Initialize selected variants
    const initialVariants = {};
    items.forEach(item => {
      if (item.variants && item.variants.length > 0) {
        initialVariants[item.productId] = null;
      } else {
        initialVariants[item.productId] = {
          ...item,
          quantity: 1,
          finalPrice: item.price,
        };
      }
    });
    setSelectedVariants(initialVariants);
  };
  
  const handleVariantSelection = (productId, variant) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variant ? {
        ...variant,
        productId,
        quantity: prev[productId]?.quantity || 1,
        finalPrice: variant.price,
      } : null,
    }));
  };
  
  const handleVariantQuantityChange = (productId, quantity) => {
    if (selectedVariants[productId]) {
      setSelectedVariants(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          quantity: Math.max(1, quantity),
        },
      }));
    }
  };
  
  const handleAddCollectionToOrder = () => {
    const selectedItemsArray = Object.values(selectedVariants)
      .filter(variant => variant && variant.quantity > 0);
    
    if (selectedItemsArray.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item from the collection.');
      return;
    }
    
    // Calculate collection totals
    const subtotal = selectedItemsArray.reduce((sum, variant) => {
      return sum + (variant.finalPrice * variant.quantity);
    }, 0);
    
    const discountAmount = subtotal * (collectionDiscount / 100);
    const finalPrice = subtotal - discountAmount;
    
    // Create collection summary
    const collectionSummary = {
      id: `collection-${selectedCollection.id}`,
      type: 'collection',
      collectionId: selectedCollection.id,
      collectionName: selectedCollection.name,
      items: selectedItemsArray,
      subtotal,
      discount: collectionDiscount,
      discountAmount,
      finalPrice,
      quantity: 1,
      isCollection: true,
    };
    
    setSelectedItems(prev => [...prev, collectionSummary]);
    setSelectedCollections(prev => [...prev, selectedCollection.id]);
    
    // Reset states
    setShowVariantModal(false);
    setSelectedCollection(null);
    setCollectionItems([]);
    setSelectedVariants({});
    setCollectionDiscount(0);
  };
  
  const handleAddPayment = () => {
    setPayments(prev => [...prev, { amount: '', method: '', transactionCode: '' }]);
  };
  
  const handleRemovePayment = (index) => {
    if (payments.length > 1) {
      setPayments(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const handlePaymentChange = (index, field, value) => {
    setPayments(prev => prev.map((payment, i) =>
      i === index ? { ...payment, [field]: value } : payment
    ));
  };
  
  const handleSubmitOrder = async () => {
    if (!selectedShelf) {
      Alert.alert('Select Shelf', 'Please select a shelf/shop first.');
      return;
    }
    
    if (selectedItems.length === 0) {
      Alert.alert('No Items', 'Please add at least one item to the order.');
      return;
    }
    
    // Validation for delivery orders
    if (orderType === 'delivery') {
      if (!deliveryMethod) {
        Alert.alert('Delivery Method', 'Please select a delivery method.');
        return;
      }
      if (!deliveryLocation) {
        Alert.alert('Delivery Location', 'Please enter delivery location.');
        return;
      }
    }
    
    // Validation for non-walkin orders
    if (orderType !== 'walkin') {
      if (!customerName.trim()) {
        Alert.alert('Customer Name', 'Please enter customer name.');
        return;
      }
      if (!customerPhone.trim()) {
        Alert.alert('Customer Phone', 'Please enter customer phone number.');
        return;
      }
    }
    
    // Validate payments
    const validPayments = payments.filter(p => p.amount && p.method);
    if (validPayments.length === 0) {
      Alert.alert('Payment Required', 'Please add at least one payment.');
      return;
    }
    
    if (paymentTerms === 'full' && calculateTotals.pendingAmount > 0) {
      Alert.alert(
        'Payment Mismatch',
        'For "Full Payment" terms, the amount paid must equal the total amount.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      
      // Prepare order data
      const orderData = {
        shelf: selectedShelf,
        orderType,
        items: selectedItems,
        customer: orderType !== 'walkin' ? {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        } : null,
        delivery: orderType === 'delivery' ? {
          method: deliveryMethod,
          location: deliveryLocation,
          courier,
          fee: parseFloat(deliveryFee) || 0,
          errandFee: parseFloat(errandFee) || 0,
        } : null,
        payments: validPayments,
        paymentTerms,
        salesPerson: salesPerson || 'Not specified',
        notes,
        totals: calculateTotals,
        createdAt: new Date().toISOString(),
      };
      
      console.log('Order data:', orderData);
      
      Alert.alert(
        'Success',
        'Order created successfully!',
        [
          {
            text: 'View Orders',
            onPress: () => router.push('/screens/orders'),
          },
          {
            text: 'Create Another',
            onPress: () => resetForm(),
            style: 'cancel',
          },
        ]
      );
    }, 2000);
  };
  
  const resetForm = () => {
    setSelectedItems([]);
    setSelectedCollections([]);
    setOrderType('walkin');
    setDeliveryFee('');
    setErrandFee('');
    setDeliveryMethod('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setDeliveryLocation('');
    setCourier('');
    setPaymentTerms('full');
    setSalesPerson('');
    setNotes('');
    setPayments([{ amount: '', method: '', transactionCode: '' }]);
  };
  
  // Render functions
  const renderShelfItem = ({ item }) => (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 12,
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: '#E5E7EB',
        },
        selectedShelf?.id === item.id && {
          backgroundColor: '#F0F9FF',
          borderColor: '#0EA5E9',
        },
      ]}
      onPress={() => handleSelectShelf(item)}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Ionicons name="business-outline" size={24} color="#4F46E5" />
      </View>
      <View style={{
        flex: 1,
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#1F2937',
          marginBottom: 2,
        }}>{item.name}</Text>
        <Text style={{
          fontSize: 14,
          color: '#6B7280',
          marginBottom: 2,
        }}>{item.location}</Text>
        <Text style={{
          fontSize: 12,
          color: '#059669',
        }}>{item.itemsCount} items available</Text>
      </View>
      {selectedShelf?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
      )}
    </TouchableOpacity>
  );
  
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
      }}
      onPress={() => handleAddItem(item)}
    >
      <Image source={{ uri: item.image }} style={{
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
      }} />
      <View style={{
        flex: 1,
        marginLeft: 12,
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          color: '#1F2937',
          marginBottom: 2,
        }} numberOfLines={1}>{item.name}</Text>
        <Text style={{
          fontSize: 14,
          color: '#6B7280',
          marginBottom: 4,
        }}>{item.sku}</Text>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#059669',
          }}>KES {item.price.toFixed(2)}</Text>
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
          }}>Stock: {item.stock}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={{
          padding: 8,
        }}
        onPress={() => handleAddItem(item)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  const renderCollectionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.collectionItem}
      onPress={() => handleSelectCollection(item)}
    >
      <View style={styles.collectionIcon}>
        <Ionicons name="grid-outline" size={24} color="#8B5CF6" />
        <Text style={styles.collectionItemCount}>{item.itemsCount}</Text>
      </View>
      <View style={styles.collectionInfo}>
        <Text style={styles.collectionName}>{item.name}</Text>
        <Text style={styles.collectionDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.collectionFooter}>
          <Text style={styles.collectionPrice}>KES {item.price.toFixed(2)}</Text>
          <View style={styles.collectionDiscountBadge}>
            <Text style={styles.collectionDiscountText}>{item.discount}% OFF</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderSelectedItem = (item, index) => (
    <View key={item.id} style={styles.selectedItem}>
      <View style={styles.selectedItemHeader}>
        <Text style={styles.selectedItemName}>
          {item.isCollection ? `${item.collectionName} (Collection)` : item.name}
        </Text>
        <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      {item.isCollection ? (
        <View style={styles.collectionSummary}>
          <Text style={styles.collectionItemsCount}>
            {item.items.length} items selected
          </Text>
          <View style={styles.collectionTotal}>
            <Text style={styles.collectionTotalText}>
              KES {item.finalPrice.toFixed(2)}
            </Text>
            <Text style={styles.collectionDiscount}>
              (Discount: {item.discount}% = -KES {item.discountAmount.toFixed(2)})
            </Text>
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.itemControls}>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleItemQuantityChange(item.id, (item.quantity || 1) - 1)}
              >
                <Ionicons name="remove-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={item.quantity?.toString()}
                onChangeText={(text) => handleItemQuantityChange(item.id, parseInt(text) || 1)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleItemQuantityChange(item.id, (item.quantity || 1) + 1)}
              >
                <Ionicons name="add-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View> 
              <Text style={styles.discountLabel}>Discount:</Text> 
              <View style={styles.discountControl}>
                <TextInput
                  style={styles.discountInput}
                  value={item.discount?.toString()}
                  onChangeText={(text) => handleItemDiscountChange(item.id, parseFloat(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
            </View>
          </View>

          <View style={styles.itemTotal}>
              <Text style={styles.itemTotalText}>
                KES {((item.price - (item.price * (item.discount || 0) / 100)) * (item.quantity || 1)).toFixed(2)}
              </Text>
            </View>
        </View>
      )}
    </View>
  );
  
  const renderVariantItem = (item) => (
    <View key={item.id} style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#1F2937',
        }}>{item.name}</Text>
        {item.variants && item.variants.length > 0 && (
          <Text style={{
            fontSize: 12,
            color: '#059669',
            fontWeight: '500',
          }}>
            {selectedVariants[item.productId] ? '✓ Selected' : 'Choose variant'}
          </Text>
        )}
      </View>
      
      {item.variants && item.variants.length > 0 ? (
        <View style={{
          gap: 8,
        }}>
          {item.variants.map(variant => (
            <TouchableOpacity
              key={variant.id}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#F9FAFB',
                },
                selectedVariants[item.productId]?.id === variant.id && {
                  backgroundColor: '#F0F9FF',
                  borderColor: '#0EA5E9',
                },
              ]}
              onPress={() => handleVariantSelection(item.productId, variant)}
            >
              <View style={{
                flex: 1,
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#1F2937',
                  marginBottom: 2,
                }}>{variant.name}</Text>
                <Text style={{
                  fontSize: 12,
                  color: '#059669',
                  marginBottom: 2,
                }}>KES {variant.price.toFixed(2)}</Text>
                <Text style={{
                  fontSize: 11,
                  color: '#6B7280',
                }}>Stock: {variant.stock}</Text>
              </View>
              {selectedVariants[item.productId]?.id === variant.id && (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 12,
          backgroundColor: '#F3F4F6',
          borderRadius: 6,
        }}>
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
          }}>No variants available</Text>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#059669',
          }}>KES {item.price.toFixed(2)}</Text>
        </View>
      )}
      
      {selectedVariants[item.productId] && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#1F2937',
          }}>Quantity:</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <TouchableOpacity
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
              }}
              onPress={() => handleVariantQuantityChange(item.productId, selectedVariants[item.productId].quantity - 1)}
            >
              <Ionicons name="remove-outline" size={14} color="#6B7280" />
            </TouchableOpacity>
            <TextInput
              style={{
                width: 40,
                height: 28,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '500',
                color: '#1F2937',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 4,
                marginHorizontal: 4,
              }}
              value={selectedVariants[item.productId].quantity?.toString()}
              onChangeText={(text) => handleVariantQuantityChange(item.productId, parseInt(text) || 1)}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
              }}
              onPress={() => handleVariantQuantityChange(item.productId, selectedVariants[item.productId].quantity + 1)}
            >
              <Ionicons name="add-outline" size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: '#F9FAFB',
    }}>
      <ScrollView 
        style={{
          flex: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, '#764ba2']}
          style={{
            height: 160,
            borderBottomRightRadius: 40,
            borderBottomLeftRadius: 40,
            paddingTop: 60,
            paddingBottom: 30,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background pattern */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.15,
          }}>
            <View style={{
              width: 200,
              height: 200,
              backgroundColor: 'white',
              borderRadius: 100,
              position: 'absolute',
              top: -50,
              right: -50,
            }} />
            <View style={{
              width: 150,
              height: 150,
              backgroundColor: 'white',
              borderRadius: 75,
              position: 'absolute',
              bottom: -30,
              left: -30,
            }} />
          </View>

          {/* Content with glass effect */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            marginHorizontal: 20,
            borderRadius: 20,
            backdropFilter: 'blur(10px)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{
                padding: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 12,
              }}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: COLORS.white,
                letterSpacing: 0.5,
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}>New Sales Order</Text>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.8)',
                marginTop: 4,
              }}>Create a new order</Text>
            </View>
            
            <TouchableOpacity style={{
              padding: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
            }}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        
        {/* Shelf Selection */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="business-outline" size={20} color={COLORS.primary} />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1F2937',
              marginLeft: 8,
            }}>Select Shelf/Shop</Text>
          </View>
          
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              backgroundColor: '#F9FAFB',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderStyle: 'dashed',
            }}
            onPress={() => setShowShelfModal(true)}
          >
            {selectedShelf ? (
              <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: '#EEF2FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="business" size={20} color={COLORS.primary} />
                </View>
                <View style={{
                  flex: 1,
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: 2,
                  }}>{selectedShelf.name}</Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                  }}>{selectedShelf.location}</Text>
                </View>
              </View>
            ) : (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}>
                <Ionicons name="business-outline" size={20} color="#9CA3AF" />
                <Text style={{
                  fontSize: 16,
                  color: '#9CA3AF',
                  marginLeft: 8,
                }}>Tap to select a shelf/shop</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          {selectedShelf && (
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              marginTop: 8,
              fontStyle: 'italic',
            }}>
              Showing items from {selectedShelf.name}
            </Text>
          )}
        </View>
        
        {/* Order Type */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="cart-outline" size={20} color={COLORS.primary} />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1F2937',
              marginLeft: 8,
            }}>Order Type</Text>
          </View>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
            <TouchableOpacity
              style={[
                {
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginHorizontal: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                },
                orderType === 'walkin' && {
                  backgroundColor: COLORS.primary,
                },
              ]}
              onPress={() => setOrderType('walkin')}
            >
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={orderType === 'walkin' ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[
                {
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#6B7280',
                  marginLeft: 4,
                },
                orderType === 'walkin' && {
                  color: '#FFFFFF',
                },
              ]}>
                Walk-in
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                {
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginHorizontal: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                },
                orderType === 'pickup' && {
                  backgroundColor: COLORS.primary,
                },
              ]}
              onPress={() => setOrderType('pickup')}
            >
              <Ionicons 
                name="car-outline" 
                size={20} 
                color={orderType === 'pickup' ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[
                {
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginHorizontal: 4,
                  borderRadius: 8,
                  backgroundColor: '#FFFFFF',
                },
                orderType === 'pickup' && {
                  backgroundColor: COLORS.primary,
                },
              ]}>
                Pickup
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                {
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginHorizontal: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                },
                orderType === 'delivery' && {
                  backgroundColor: COLORS.primary,
                },
              ]}
              onPress={() => setOrderType('delivery')}
            >
              <Ionicons 
                name="cube-outline" 
                size={20} 
                color={orderType === 'delivery' ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[
                {
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  marginHorizontal: 4,
                  
                },
                orderType === 'delivery' && {
                  backgroundColor: COLORS.primary,
                },
              ]}>
                Delivery
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Items */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="search-outline" size={20} color={COLORS.primary} />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1F2937',
              marginLeft: 8,
            }}>Add Items</Text>
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F9FAFB',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            paddingHorizontal: 12,
            marginBottom: 16,
          }}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={{
              marginRight: 8,
            }} />
            <TextInput
              style={{
                flex: 1,
                height: 44,
                fontSize: 16,
                color: '#1F2937',
              }}
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Products List */}
          {selectedShelf && (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ListHeaderComponent={
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#1F2937',
                  }}>Products</Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                  }}>{filteredProducts.length} items</Text>
                </View>
              }
              ListEmptyComponent={
                <View style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 48,
                }}>
                  <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
                  <Text style={{
                    fontSize: 16,
                    color: '#6B7280',
                    marginTop: 12,
                  }}>No products found</Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#9CA3AF',
                    marginTop: 4,
                  }}>
                    Try a different search or select another shelf
                  </Text>
                </View>
              }
            />
          )}
          
          {/* Collections Button */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              backgroundColor: '#F5F3FF',
              borderRadius: 8,
              marginTop: 16,
            }}
            onPress={() => setShowCollectionModal(true)}
          >
            <Ionicons name="grid-outline" size={20} color={COLORS.primary} />
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: COLORS.primary,
              marginHorizontal: 8,
            }}>Browse Collections</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <View style={{
            backgroundColor: '#FFFFFF',
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="list-outline" size={20} color={COLORS.primary} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#1F2937',
                marginLeft: 8,
              }}>Selected Items ({selectedItems.length})</Text>
            </View>
            
            {selectedItems.map(renderSelectedItem)}
            
            {/* Order Summary */}
            <View style={{
              backgroundColor: '#F0F9FF',
              borderRadius: 8,
              padding: 16,
              marginTop: 16,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <Text style={{
                  fontSize: 14,
                  color: '#0C4A6E',
                }}>Subtotal:</Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#0C4A6E',
                }}>
                  KES {calculateTotals.itemsTotal.toFixed(2)}
                </Text>
              </View>
              
              {orderType === 'delivery' && (
                <>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Text style={{
                      fontSize: 14,
                      color: '#0C4A6E',
                    }}>Delivery Fee:</Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#0C4A6E',
                    }}>
                      KES {calculateTotals.deliveryFee.toFixed(2)}
                    </Text>
                  </View>
                  
                  {parseFloat(errandFee) > 0 && (
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}>
                      <Text style={{
                        fontSize: 14,
                        color: '#0C4A6E',
                      }}>Errand Fee:</Text>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#0C4A6E',
                      }}>
                        KES {calculateTotals.errandFee.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </>
              )}
              
              <View style={[{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }, {
                borderTopWidth: 1,
                borderTopColor: '#BAE6FD',
                paddingTop: 12,
                marginTop: 4,
              }]}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#0C4A6E',
                }}>Total Amount:</Text>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#0C4A6E',
                }}>
                  KES {calculateTotals.totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Customer Information (only for non-walkin) */}
        {orderType !== 'walkin' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-circle-outline" size={20} color="#4F46E5" />
              <Text style={styles.cardTitle}>Customer Information</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter customer name"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={customerEmail}
                onChangeText={setCustomerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        )}
        
        {/* Delivery Information (only for delivery) */}
        {orderType === 'delivery' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube-outline" size={20} color="#4F46E5" />
              <Text style={styles.cardTitle}>Delivery Information</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Method *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={deliveryMethod}
                  onValueChange={setDeliveryMethod}
                  style={styles.picker}
                >
                  <Picker.Item label="Select method" value="" />
                  <Picker.Item label="Pick Up Mtaani" value="pickup_mtaani" />
                  <Picker.Item label="Rider" value="rider" />
                  <Picker.Item label="Errand Person" value="errand_person" />
                  <Picker.Item label="Parcel" value="parcel" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter delivery location"
                value={deliveryLocation}
                onChangeText={setDeliveryLocation}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Courier</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter courier name"
                value={courier}
                onChangeText={setCourier}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Fee</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={deliveryFee}
                onChangeText={setDeliveryFee}
                keyboardType="decimal-pad"
                prefix="KES"
              />
            </View>
            
            {deliveryMethod === 'parcel' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Errand Fee *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={errandFee}
                  onChangeText={setErrandFee}
                  keyboardType="decimal-pad"
                  prefix="KES"
                />
              </View>
            )}
          </View>
        )}
        
        {/* Payment Information */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="card-outline" size={20} color={COLORS.primary} />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1F2937',
              marginLeft: 8,
            }}>Payment Information</Text>
          </View>
          
          {payments.map((payment, index) => (
            <View key={index} style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#1F2937',
                }}>Payment {index + 1}</Text>
                {payments.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemovePayment(index)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={{
                gap: 12,
              }}>
                <View style={{
                  flex: 1,
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: 4,
                  }}>Amount *</Text>
                  <TextInput
                    style={{
                      height: 44,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1F2937',
                      backgroundColor: '#FFFFFF',
                    }}
                    placeholder="0.00"
                    value={payment.amount}
                    onChangeText={(text) => handlePaymentChange(index, 'amount', text)}
                    keyboardType="decimal-pad"
                  />
                </View>
                
                <View style={{
                  flex: 1,
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: 4,
                  }}>Payment Account *</Text>
                  <View style={{
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    borderRadius: 8,
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                  }}>
                    <Picker
                      selectedValue={payment.method}
                      onValueChange={(value) => handlePaymentChange(index, 'method', value)}
                      style={{
                        height: 54,
                      }}
                    >
                      <Picker.Item label="Select account" value="" />
                      {PAYMENT_ACCOUNTS.map(account => (
                        <Picker.Item 
                          key={account.id} 
                          label={`${account.name} ${account.isPrimary ? '(Primary)' : ''}`} 
                          value={account.id} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={{
                  flex: 1,
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: 4,
                  }}>Transaction Code</Text>
                  <TextInput
                    style={{
                      height: 44,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1F2937',
                      backgroundColor: '#FFFFFF',
                    }}
                    placeholder="Optional"
                    value={payment.transactionCode}
                    onChangeText={(text) => handlePaymentChange(index, 'transactionCode', text)}
                  />
                </View>
              </View>
            </View>
          ))}
          
          <TouchableOpacity style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderStyle: 'dashed',
            borderRadius: 8,
            backgroundColor: '#F9FAFB',
            marginBottom: 16,
          }} onPress={handleAddPayment}>
            <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: COLORS.primary,
              marginLeft: 8,
            }}>Add Another Payment</Text>
          </TouchableOpacity>
          
          {/* Payment Summary */}
          <View style={{
            backgroundColor: '#F0F9FF',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Text style={{
                fontSize: 14,
                color: '#0C4A6E',
              }}>Total Paid:</Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#0C4A6E',
              }}>
                KES {calculateTotals.paidAmount.toFixed(2)}
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Text style={{
                fontSize: 14,
                color: '#0C4A6E',
              }}>Amount Pending:</Text>
              <Text style={[{
                fontSize: 14,
                fontWeight: '600',
                color: '#0C4A6E',
              }, styles.pendingAmount]}>
                KES {calculateTotals.pendingAmount.toFixed(2)}
              </Text>
            </View>
          </View>
          
          {/* Payment Terms and Sales Person */}
          <View style={{
            marginBottom: 16,
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#374151',
              marginBottom: 4,
            }}>Payment Terms *</Text>
            <View style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}>
              <Picker
                selectedValue={paymentTerms}
                onValueChange={setPaymentTerms}
                style={{
                  height: 54,
                }}
              >
                <Picker.Item label="Full Payment" value="full" />
                {orderType !== 'walkin' && <Picker.Item label="Deposit Pay" value="deposit" />}
                {orderType === 'delivery' && <Picker.Item label="Pay After Delivery" value="after_delivery" />}
              </Picker>
            </View>
          </View>
          
          <View style={{
            marginBottom: 16,
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#374151',
              marginBottom: 4,
            }}>Sales Person</Text>
            <TextInput
              style={{
                height: 44,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                paddingHorizontal: 12,
                fontSize: 16,
                color: '#1F2937',
                backgroundColor: '#FFFFFF',
              }}
              placeholder="Enter sales person name"
              value={salesPerson}
              onChangeText={setSalesPerson}
            />
          </View>
          
          <View style={{
            marginBottom: 16,
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#374151',
              marginBottom: 4,
            }}>Additional Notes</Text>
            <TextInput
              style={[{
                height: 44,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                paddingHorizontal: 12,
                fontSize: 16,
                color: '#1F2937',
                backgroundColor: '#FFFFFF',
              }, {
                height: 100,
                paddingTop: 12,
                paddingBottom: 12,
                textAlignVertical: 'top',
              }]}
              placeholder="Any additional notes for this order..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[{
            marginHorizontal: 16,
            marginTop: 24,
            marginBottom: 16,
            borderRadius: 12,
            overflow: 'hidden',
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }, isSubmitting && {
            opacity: 0.6,
          }]}
          onPress={handleSubmitOrder}
          disabled={isSubmitting || !selectedShelf || selectedItems.length === 0}
        >
          <LinearGradient
            colors={[COLORS.primary, '#7C3AED']}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              paddingHorizontal: 24,
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <Ionicons name="sync" size={24} color="#FFFFFF" style={styles.spinner} />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
            )}
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FFFFFF',
              marginLeft: 8,
            }}>
              {isSubmitting ? 'Creating Order...' : 'Create Sales Order'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{
          height: 32,
        }} />
      </ScrollView>
      
      {/* Shelf Selection Modal */}
      <Modal
        visible={showShelfModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#1F2937',
            }}>Select Shelf/Shop</Text>
            <TouchableOpacity onPress={() => setShowShelfModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={SHELVES_DATA}
            renderItem={renderShelfItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </Modal>
      
      {/* Collections Modal */}
      <Modal
        visible={showCollectionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#1F2937',
            }}>Select Collection</Text>
            <TouchableOpacity onPress={() => setShowCollectionModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F9FAFB',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            paddingHorizontal: 12,
            marginBottom: 16,
          }}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={{
                flex: 1,
                height: 44,
                fontSize: 16,
                color: '#1F2937',
              }}
              placeholder="Search collections..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={filteredCollections}
            renderItem={renderCollectionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{
              padding: 16,
            }}
            ListEmptyComponent={
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 48,
              }}>
                <Ionicons name="grid-outline" size={48} color="#9CA3AF" />
                <Text style={{
                  fontSize: 16,
                  color: '#6B7280',
                  marginTop: 12,
                }}>No collections found</Text>
              </View>
            }
          />
        </View>
      </Modal>
      
      {/* Collection Variants Modal */}
      <Modal
        visible={showVariantModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#1F2937',
            }}>Select Items from Collection</Text>
            <TouchableOpacity onPress={() => setShowVariantModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {selectedCollection && (
            <>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 20,
                backgroundColor: '#F5F3FF',
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
              }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons name="grid" size={24} color="#8B5CF6" />
                </View>
                <View style={{
                  flex: 1,
                }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#1F2937',
                    marginBottom: 4,
                  }}>{selectedCollection.name}</Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                    marginBottom: 4,
                  }}>
                    {selectedCollection.description}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: COLORS.primary,
                    fontWeight: '500',
                  }}>
                    {collectionItems.length} items • {selectedCollection.discount}% discount
                  </Text>
                </View>
              </View>
              
              {/* Collection Discount Input */}
              <View style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#FEF3C7',
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#92400E',
                  marginBottom: 4,
                }}>Collection Discount (%)</Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <TextInput
                    style={{
                      flex: 1,
                      height: 44,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#F59E0B',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#1F2937',
                      marginRight: 8,
                    }}
                    value={collectionDiscount.toString()}
                    onChangeText={(text) => setCollectionDiscount(parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                    marginLeft: 4,
                  }}>%</Text>
                </View>
              </View>
              
              <ScrollView style={{
                flex: 1,
                paddingHorizontal: 16,
              }}>
                {collectionItems.map(renderVariantItem)}
              </ScrollView>
              
              {/* Add to Order Button */}
              <View style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: '#E5E7EB',
                backgroundColor: '#FFFFFF',
              }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#8B5CF6',
                    paddingVertical: 16,
                    borderRadius: 12,
                  }}
                  onPress={handleAddCollectionToOrder}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginHorizontal: 8,
                  }}>Add to Order</Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#FFFFFF',
                    opacity: 0.9,
                  }}>
                    ({Object.values(selectedVariants).filter(v => v && v.quantity > 0).length} items)
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  headerRight: {
    width: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  shelfSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  selectedShelfInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedShelfIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedShelfDetails: {
    flex: 1,
  },
  selectedShelfName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedShelfLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  shelfSelectorPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shelfSelectorText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  shelfNote: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  orderTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  orderTypeButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  orderTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  orderTypeTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1F2937',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  productSku: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  productStock: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    padding: 8,
  },
  collectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    marginTop: 16,
  },
  collectionsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8B5CF6',
    marginHorizontal: 8,
  },
  selectedItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  collectionSummary: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
  },
  collectionItemsCount: {
    fontSize: 14,
    color: '#0C4A6E',
    marginBottom: 4,
  },
  collectionTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectionTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
  },
  collectionDiscount: {
    fontSize: 12,
    color: '#DC2626',
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    height: 30,
    marginTop: 20,
  },
  quantityButton: {
    width: 32,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  quantityInput: {
    width: 50,
    height: 48,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  discountControl: {
    flexDirection: 'row',
    alignItems: "flex-start",
    justifyContent:"space-evenly",
    width: 90,
    textAlign: "center",
    paddingVertical: 4,
  },
  discountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
    
  },
  discountInput: {
    width: 90,
    height: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  percentSymbol: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  orderSummary: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#0C4A6E',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0C4A6E',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#BAE6FD',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C4A6E',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  paymentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentInputs: {
    gap: 12,
  },
  paymentInputGroup: {
    flex: 1,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 8,
  },
  paymentSummary: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: '#0C4A6E',
  },
  paymentSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
  },
  pendingAmount: {
    color: '#DC2626',
  },
  submitButton: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  spinner: {
    animationKeyframes: {
      '0%': { transform: [{ rotate: '0deg' }] },
      '100%': { transform: [{ rotate: '360deg' }] },
    },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  spacer: {
    height: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalList: {
    padding: 16,
  },
  shelfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shelfItemSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0EA5E9',
  },
  shelfIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shelfInfo: {
    flex: 1,
  },
  shelfName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  shelfLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  shelfItemsCount: {
    fontSize: 12,
    color: '#059669',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyListText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  collectionItemCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#8B5CF6',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  collectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  collectionDiscountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  collectionDiscountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#F5F3FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  collectionHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  collectionHeaderInfo: {
    flex: 1,
  },
  collectionHeaderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  collectionHeaderDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  collectionHeaderItems: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  discountInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  discountInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
    marginBottom: 4,
  },
  discountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
    marginRight: 8,
  },
  variantsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  variantItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  variantItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  variantCount: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  variantOptions: {
    gap: 8,
  },
  variantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  variantOptionSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0EA5E9',
  },
  variantOptionInfo: {
    flex: 1,
  },
  variantOptionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  variantOptionPrice: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 2,
  },
  variantOptionStock: {
    fontSize: 11,
    color: '#6B7280',
  },
  singleProduct: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  singleProductText: {
    fontSize: 14,
    color: '#6B7280',
  },
  singleProductPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  variantQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  quantityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  quantityInputSmall: {
    width: 40,
    height: 28,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  addToOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addToOrderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
  addToOrderCount: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

export default AddNewOrder;