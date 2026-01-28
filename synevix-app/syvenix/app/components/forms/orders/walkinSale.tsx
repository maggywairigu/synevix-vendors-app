import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';
import { useGetItems } from '@/queries/productQueries';
import { useGetAllCollections, useGetCollection } from '@/queries/collectionQueries';
import { useGetAllAccounts } from '@/queries/accountsQueries';
import { createSale } from '@/apis/sales/createNewSale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import convertCloudinaryUrlToPng from '@/app/utils/normalizeImages';
import InfiniteScrollView from '../../ui/InfiniteScrollView';

const { width } = Dimensions.get('window');

// Types
interface TProduct {
  sku: string;
  label: string;
  name: string;
  market_price: number;
  images: string[];
  variants?: Array<{
    sku: string;
    label: string;
    images: string[];
    attributes?: Record<string, string>;
    stock?: number;
  }>;
}

interface TCollection {
  id: string;
  name: string;
  description: string;
  items: any[];
  status: string;
  finalPrice: number;
  subtotal: number;
  discount: number;
}

interface TAccount {
  id: string;
  name: string;
  type: string;
  bankName?: string;
  accountNumber?: string;
  currency: string;
  isPrimary: boolean;
}

// Dummy data for shelves/shops (temporary until API)
const SHELVES_DATA = [
  { id: '1', name: 'Main Shop', location: 'Headquarters', itemsCount: 245 },
];

const AddNewOrder = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State variables
  const [selectedShelf, setSelectedShelf] = useState(SHELVES_DATA[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
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
  const [selectedCollection, setSelectedCollection] = useState<TCollection | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});
  const [collectionDiscount, setCollectionDiscount] = useState(0);
  const [payments, setPayments] = useState([{ amount: '', method: '', transactionCode: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'collections'>('products');
  const [refreshing, setRefreshing] = useState(false);
  
  // API Queries
  const pageLimit = 10;
  
  // Products query
  const {
    data: productsData,
    isFetching: isFetchingProducts,
    fetchNextPage: fetchNextProductsPage,
    hasNextPage: hasNextProductsPage,
    isFetchingNextPage: isFetchingNextProductsPage,
    refetch: refetchProducts,
  } = useGetItems({
    searchText: searchQuery,
    pageLimit
  });

  const allProducts = useMemo(() => {
    return productsData?.pages.flatMap((page: any) => page.items) ?? [];
  }, [productsData]);

  // Collections query
  const {
    data: collectionsData,
    isFetching: isFetchingCollections,
    fetchNextPage: fetchNextCollectionsPage,
    hasNextPage: hasNextCollectionsPage,
    isFetchingNextPage: isFetchingNextCollectionsPage,
    refetch: refetchCollections,
  } = useGetAllCollections({ searchText: searchQuery, pageLimit });

  const allCollections = useMemo(() => {
    return collectionsData?.pages.flatMap((page: any) => page.collections) ?? [];
  }, [collectionsData]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'products') {
        await refetchProducts();
      } else {
        await refetchCollections();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetchProducts, refetchCollections]);

  // Handle load more products
  const loadMoreProducts = useCallback(() => {
    if (!isFetchingNextProductsPage && hasNextProductsPage && !isFetchingProducts) {
      fetchNextProductsPage();
    }
  }, [isFetchingNextProductsPage, hasNextProductsPage, isFetchingProducts, fetchNextProductsPage]);

  // Handle load more collections
  const loadMoreCollections = useCallback(() => {
    if (!isFetchingNextCollectionsPage && hasNextCollectionsPage && !isFetchingCollections) {
      fetchNextCollectionsPage();
    }
  }, [isFetchingNextCollectionsPage, hasNextCollectionsPage, isFetchingCollections, fetchNextCollectionsPage]);

  // Render product item
  const renderProductItem = useCallback(({ item }: { item: TProduct }) => {
    const fixedUrl = convertCloudinaryUrlToPng(item.images[0]);

    return (
      <View style={styles.productCardWrapper}>
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => handleAddItem(item)}
        >
          <Image
            source={{ uri: fixedUrl }}
            style={styles.productCardImage}
          />
          <View style={styles.productCardContent}>
            <Text style={styles.productCardName} numberOfLines={1}>
              {item.label || item.name}
            </Text>
            <Text style={styles.productCardSku} numberOfLines={1}>{item.sku}</Text>
            <Text style={styles.productCardPrice}>
              KES {parseFloat(item.market_price?.toString() || '0').toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.productCardAddButton}
            onPress={() => handleAddItem(item)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  }, []);

  // Render collection item
  const renderCollectionItem = useCallback(({ item }: { item: TCollection }) => {
    return (
      <TouchableOpacity
        style={styles.collectionCard}
        onPress={() => handleSelectCollection(item)}
      >
        <View style={styles.collectionCardHeader}>
          <View style={styles.collectionCardIcon}>
            <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
            <Text style={styles.collectionCardIconText}>{item.items?.length || 0}</Text>
          </View>
          <View style={styles.collectionCardTitleContainer}>
            <Text style={styles.collectionCardName} numberOfLines={1}>{item.name}</Text>
            {item.discount > 0 && (
              <View style={styles.collectionDiscountTag}>
                <Text style={styles.collectionDiscountTagText}>{item.discount}% OFF</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.collectionCardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.collectionCardFooter}>
          <Text style={styles.collectionCardPrice}>
            KES {item.finalPrice?.toFixed(2)}
          </Text>
          <View style={styles.collectionCardBadge}>
            <Text style={styles.collectionCardBadgeText}>Collection</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, []);

  // Empty component for products
  const renderProductsEmpty = useCallback(() => (
    <View style={styles.emptyList}>
      <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyListText}>No products found</Text>
      <Text style={styles.emptyListSubtext}>
        {searchQuery ? 'Try a different search term' : 'Start by adding products'}
      </Text>
    </View>
  ), [searchQuery]);

  // Empty component for collections
  const renderCollectionsEmpty = useCallback(() => (
    <View style={styles.emptyList}>
      <Ionicons name="grid-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyListText}>No collections found</Text>
      <Text style={styles.emptyListSubtext}>
        {searchQuery ? 'Try a different search term' : 'Start by creating collections'}
      </Text>
    </View>
  ), [searchQuery]);

  // Accounts query
  const {
    data: accountsData,
    isFetching: isFetchingAccounts,
    fetchNextPage: fetchNextAccountsPage,
    hasNextPage: hasNextAccountsPage,
    isFetchingNextPage: isFetchingNextAccountsPage,
  } = useGetAllAccounts({ searchText: '', pageLimit, filters: { status: "" } });

  const allAccounts = useMemo(() => {
    return accountsData?.pages.flatMap((page: any) => page.accounts) ?? [];
  }, [accountsData]);

  // Selected collection query
  const { data: selectedCollectionData } = useGetCollection(
    selectedCollection?.id ?? "",
    {
      enabled: !!selectedCollection?.id,
      initialPageParam: undefined
    }
  );

  // Create sale mutation
  const mutation = useMutation({
    mutationFn: async (saleDetails: any) => {
      return await createSale(saleDetails);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["get-sales", "", pageLimit],
      });
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || "Failed to create sale. Please try again.");
    }
  });

  // Calculate totals
  const calculateTotals = useMemo(() => {
    let itemsTotal = 0;
    let totalQuantity = 0;
    
    selectedItems.forEach(item => {
      if (item.isCollection) {
        // Collection items
        const price = parseFloat(item.finalPrice) || 0;
        itemsTotal += price * (item.quantity || 1);
        totalQuantity += item.quantity || 1;
      } else {
        // Regular items
        const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(item.market_price) || 0;
        const discount = parseFloat(item.discount) || 0;
        const discountedPrice = price - (price * (discount / 100));
        
        itemsTotal += discountedPrice * quantity;
        totalQuantity += quantity;
      }
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

  // Initialize variants when collection data is loaded
  useEffect(() => {
    if (selectedCollectionData && showVariantModal) {
      const initialVariants: Record<string, any> = {};
      selectedCollectionData?.pages[0]?.products?.forEach((product: any) => {
        if (product.variants && product.variants.length > 0) {
          initialVariants[product.productId] = null;
        } else {
          initialVariants[product.productId] = {
            ...product,
            productId: product.productId,
            productName: product.name,
            quantity: 1
          };
        }
      });
      setSelectedVariants(initialVariants);
    }
  }, [selectedCollectionData, showVariantModal]);

  // Handlers
  const handleSelectShelf = (shelf: any) => {
    setSelectedShelf(shelf);
    setShowShelfModal(false);
  };
  
  const handleAddItem = (product: TProduct) => {
    const existingItem = selectedItems.find(item => item.sku === product.sku);
    
    if (existingItem) {
      setSelectedItems(prev => prev.map(item =>
        item.sku === product.sku
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
  
  const handleRemoveItem = (identifier: string) => {
    setSelectedItems(prev => prev.filter(item => 
      item.sku !== identifier && item.collectionId !== identifier
    ));
  };
  
  const handleItemQuantityChange = (identifier: string, quantity: number) => {
    if (quantity < 1) return;
    
    setSelectedItems(prev => prev.map(item =>
      (item.sku === identifier || item.collectionId === identifier) 
        ? { ...item, quantity } 
        : item
    ));
  };
  
  const handleItemDiscountChange = (identifier: string, discount: number) => {
    const discountNum = Math.max(0, Math.min(100, discount));
    
    setSelectedItems(prev => prev.map(item =>
      item.sku === identifier ? { ...item, discount: discountNum } : item
    ));
  };
  
  const handleSelectCollection = (collection: TCollection) => {
    setSelectedCollection(collection);
    setCollectionDiscount(collection.discount || 0);
    setShowCollectionModal(false);
    setShowVariantModal(true);
  };
  
  const handleVariantSelection = (productId: string, variant: any) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variant ? {
        ...variant,
        productId: productId,
        productName: selectedCollectionData?.items?.find((p: any) => p.id === productId)?.name,
        quantity: prev[productId]?.quantity || 1
      } : null
    }));
  };
  
  const handleVariantQuantityChange = (productId: string, quantity: number) => {
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
    
    if (!selectedCollection) return;
    
    // Calculate collection totals
    const subtotal = selectedCollection.subtotal || selectedItemsArray.reduce((sum, variant) => {
      const price = parseFloat(variant.market_price) || 0;
      const quantity = variant.quantity || 1;
      return sum + (price * quantity);
    }, 0);

    const discountAmount = subtotal * (collectionDiscount / 100);
    const finalPrice = subtotal - discountAmount;

    // Create collection summary
    const collectionSummary = {
      type: 'collection',
      collectionId: selectedCollection.id,
      collectionName: selectedCollection.name,
      items: selectedItemsArray,
      subtotal: subtotal,
      discount: collectionDiscount,
      discountAmount: discountAmount,
      finalPrice: finalPrice,
      quantity: 1,
      isCollection: true
    };

    setSelectedItems(prev => [...prev, collectionSummary]);
    setSelectedCollections(prev => [...prev, selectedCollection.id]);
    
    // Reset states
    setShowVariantModal(false);
    setSelectedCollection(null);
    setSelectedVariants({});
    setCollectionDiscount(0);
  };
  
  const handleAddPayment = () => {
    setPayments(prev => [...prev, { amount: '', method: '', transactionCode: '' }]);
  };
  
  const handleRemovePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const handlePaymentChange = (index: number, field: string, value: string) => {
    setPayments(prev => prev.map((payment, i) =>
      i === index ? { ...payment, [field]: value } : payment
    ));
  };
  
  const handleSubmitOrder = async () => {
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

    try {
      const values = {
        orderType,
        customerName: orderType !== 'walkin' ? customerName : undefined,
        phoneNumber: orderType !== 'walkin' ? customerPhone : undefined,
        email: orderType !== 'walkin' ? customerEmail : undefined,
        deliveryMethod: orderType === 'delivery' ? deliveryMethod : undefined,
        deliveryLocation: orderType === 'delivery' ? deliveryLocation : undefined,
        courier: orderType === 'delivery' ? courier : undefined,
        deliveryFee: parseFloat(deliveryFee) || 0,
        errandFee: parseFloat(errandFee) || 0,
        payments: validPayments,
        paymentTerms,
        salesPerson: salesPerson || 'Not specified',
        note: notes,
      };

      await mutation.mutateAsync({
        ...values,
        selectedItems,
        totals: {
          totalQuantity: calculateTotals.totalQuantity,
          totalRate: calculateTotals.itemsTotal.toFixed(2),
          totalAmount: calculateTotals.totalAmount.toFixed(2),
          amountPaid: calculateTotals.paidAmount,
          amountPending: calculateTotals.pendingAmount.toFixed(2)
        }
      });

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
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
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
  const renderShelfItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.shelfItem,
        selectedShelf?.id === item.id && styles.shelfItemSelected,
      ]}
      onPress={() => handleSelectShelf(item)}
    >
      <View style={styles.shelfIconContainer}>
        <Ionicons name="business-outline" size={24} color="#4F46E5" />
      </View>
      <View style={styles.shelfInfo}>
        <Text style={styles.shelfName}>{item.name}</Text>
        <Text style={styles.shelfLocation}>{item.location}</Text>
        <Text style={styles.shelfItemsCount}>{item.itemsCount} items available</Text>
      </View>
      {selectedShelf?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
      )}
    </TouchableOpacity>
  );

  const renderSelectedItem = (item: any, index: number) => (
    <View key={item.sku || item.collectionId} style={styles.selectedItemCard}>
      <View style={styles.selectedItemHeader}>
        <View style={styles.selectedItemTitleContainer}>
          <Ionicons 
            name={item.isCollection ? "grid" : "cube"} 
            size={16} 
            color={item.isCollection ? "#8B5CF6" : "#4F46E5"} 
          />
          <Text style={styles.selectedItemName}>
            {item.isCollection ? item.collectionName : item.label || item.name}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.removeItemButton}
          onPress={() => handleRemoveItem(item.sku || item.collectionId)}
        >
          <Ionicons name="close" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
      
      {item.isCollection ? (
        <View style={styles.collectionDetails}>
          <Text style={styles.collectionItemsCount}>
            {item.items?.length || 0} items selected
          </Text>
          <View style={styles.collectionPriceRow}>
            <Text style={styles.collectionPriceText}>
              KES {item.finalPrice?.toFixed(2)}
            </Text>
            <Text style={styles.collectionDiscountText}>
              Save KES {item.discountAmount?.toFixed(2)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.itemControlsContainer}>
          <View style={styles.quantitySection}>
            <Text style={styles.controlLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleItemQuantityChange(item.sku, (item.quantity || 1) - 1)}
              >
                <Ionicons name="remove" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={item.quantity?.toString()}
                onChangeText={(text) => handleItemQuantityChange(item.sku, parseInt(text) || 1)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleItemQuantityChange(item.sku, (item.quantity || 1) + 1)}
              >
                <Ionicons name="add" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.discountSection}>
            <Text style={styles.controlLabel}>Discount</Text>
            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInput}
                value={item.discount?.toString()}
                onChangeText={(text) => handleItemDiscountChange(item.sku, parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="0"
              />
              <Text style={styles.percentSymbol}>%</Text>
            </View>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.controlLabel}>Total</Text>
            <Text style={styles.itemTotalText}>
              KES {(((parseFloat(item.market_price) || 0) - 
                   (parseFloat(item.market_price) || 0) * ((parseFloat(item.discount) || 0) / 100)) * 
                   (parseInt(item.quantity) || 1)).toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderVariantItem = (item: any) => (
    <View key={item.id || item.productId} style={styles.variantCard}>
      <View style={styles.variantCardHeader}>
        <View style={styles.variantCardTitleContainer}>
          <Text style={styles.variantCardTitle}>{item.name || item.label}</Text>
          {item.variants && item.variants.length > 0 && (
            <View style={[
              styles.variantStatusBadge,
              selectedVariants[item.productId] ? styles.variantSelectedBadge : styles.variantUnselectedBadge
            ]}>
              <Text style={styles.variantStatusText}>
                {selectedVariants[item.productId] ? 'Selected' : 'Select'}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {item.variants && item.variants.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.variantScrollView}
          nestedScrollEnabled={true}
        >
          {item.variants.map((variant: any) => (
            <TouchableOpacity
              key={variant.sku}
              style={[
                styles.variantOptionCard,
                selectedVariants[item.productId]?.sku === variant.sku && styles.variantOptionCardSelected,
              ]}
              onPress={() => handleVariantSelection(item.productId, variant)}
            >
              <Image
                  source={{
                    uri:
                      convertCloudinaryUrlToPng(variant.images?.[0]) ||
                      convertCloudinaryUrlToPng(item.images?.[0]) ||
                      "https://via.placeholder.com/150",
                  }}
                  style={styles.variantOptionImage}
                />
              <Text style={styles.variantOptionName} numberOfLines={1}>{variant.label}</Text>
              <Text style={styles.variantOptionPrice}>
                KES {parseFloat(item.market_price?.toString() || '0').toFixed(2)}
              </Text>
              {selectedVariants[item.productId]?.sku === variant.sku && (
                <View style={styles.variantSelectedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noVariantsContainer}>
          <Text style={styles.noVariantsText}>No variants available</Text>
          <Text style={styles.noVariantsPrice}>
            KES {parseFloat(item.market_price?.toString() || '0').toFixed(2)}
          </Text>
        </View>
      )}
      
      {selectedVariants[item.productId] && (
        <View style={styles.variantQuantitySection}>
          <Text style={styles.variantQuantityLabel}>Quantity</Text>
          <View style={styles.variantQuantityControls}>
            <TouchableOpacity
              style={styles.variantQuantityButton}
              onPress={() => handleVariantQuantityChange(item.productId, selectedVariants[item.productId].quantity - 1)}
            >
              <Ionicons name="remove" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TextInput
              style={styles.variantQuantityInput}
              value={selectedVariants[item.productId].quantity?.toString()}
              onChangeText={(text) => handleVariantQuantityChange(item.productId, parseInt(text) || 1)}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.variantQuantityButton}
              onPress={() => handleVariantQuantityChange(item.productId, selectedVariants[item.productId].quantity + 1)}
            >
              <Ionicons name="add" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>New Sales Order</Text>
              <Text style={styles.headerSubtitle}>Add items and create order</Text>
            </View>
            
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        {/* Shelf Selection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Shop Location</Text>
          </View>
          
          <TouchableOpacity
            style={styles.shelfSelector}
            onPress={() => setShowShelfModal(true)}
          >
            {selectedShelf ? (
              <View style={styles.selectedShelfInfo}>
                <View style={styles.selectedShelfIcon}>
                  <Ionicons name="business" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.selectedShelfDetails}>
                  <Text style={styles.selectedShelfName}>{selectedShelf.name}</Text>
                  <Text style={styles.selectedShelfLocation}>{selectedShelf.location}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.shelfSelectorPlaceholder}>
                <Ionicons name="business-outline" size={20} color="#9CA3AF" />
                <Text style={styles.shelfSelectorText}>Select shop location</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        
        {/* Order Type */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Order Type</Text>
          </View>
          
          <View style={styles.orderTypeGrid}>
            <TouchableOpacity
              style={[
                styles.orderTypeCard,
                orderType === 'walkin' && styles.orderTypeCardActive,
              ]}
              onPress={() => setOrderType('walkin')}
            >
              <View style={[
                styles.orderTypeIcon,
                orderType === 'walkin' ? styles.orderTypeIconActive : styles.orderTypeIconInactive
              ]}>
                <Ionicons name="person" size={24} color={orderType === 'walkin' ? COLORS.primary : '#9CA3AF'} />
              </View>
              <Text style={[
                styles.orderTypeCardText,
                orderType === 'walkin' && styles.orderTypeCardTextActive,
              ]}>
                Walk-in
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.orderTypeCard,
                orderType === 'pickup' && styles.orderTypeCardActive,
              ]}
              onPress={() => setOrderType('pickup')}
            >
              <View style={[
                styles.orderTypeIcon,
                orderType === 'pickup' ? styles.orderTypeIconActive : styles.orderTypeIconInactive
              ]}>
                <Ionicons name="car" size={24} color={orderType === 'pickup' ? COLORS.primary : '#9CA3AF'} />
              </View>
              <Text style={[
                styles.orderTypeCardText,
                orderType === 'pickup' && styles.orderTypeCardTextActive,
              ]}>
                Pickup
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.orderTypeCard,
                orderType === 'delivery' && styles.orderTypeCardActive,
              ]}
              onPress={() => setOrderType('delivery')}
            >
              <View style={[
                styles.orderTypeIcon,
                orderType === 'delivery' ? styles.orderTypeIconActive : styles.orderTypeIconInactive
              ]}>
                <Ionicons name="cube" size={24} color={orderType === 'delivery' ? COLORS.primary : '#9CA3AF'} />
              </View>
              <Text style={[
                styles.orderTypeCardText,
                orderType === 'delivery' && styles.orderTypeCardTextActive,
              ]}>
                Delivery
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Add Items Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Add Items</Text>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products or collections..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'products' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('products')}
            >
              <Ionicons 
                name="cube-outline" 
                size={18} 
                color={activeTab === 'products' ? COLORS.primary : '#6B7280'} 
              />
              <Text style={[
                styles.tabButtonText,
                activeTab === 'products' && styles.tabButtonTextActive,
              ]}>
                Products
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'collections' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('collections')}
            >
              <Ionicons 
                name="grid-outline" 
                size={18} 
                color={activeTab === 'collections' ? COLORS.primary : '#6B7280'} 
              />
              <Text style={[
                styles.tabButtonText,
                activeTab === 'collections' && styles.tabButtonTextActive,
              ]}>
                Collections
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Items List with Infinite Scroll */}
          <View style={styles.itemsListContainer}>
            {activeTab === 'products' ? (
              <InfiniteScrollView
                data={allProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.sku}
                onLoadMore={loadMoreProducts}
                onRefresh={onRefresh}
                hasMoreData={hasNextProductsPage}
                isLoading={isFetchingNextProductsPage}
                isRefreshing={refreshing}
                loadingText="Loading more products..."
                emptyComponent={renderProductsEmpty()}
                numColumns={2}
                columnWrapperStyle={styles.productsColumnWrapper}
                contentContainerStyle={styles.productsGrid}
                nestedScrollEnabled={true}
              />
            ) : (
              <InfiniteScrollView
                data={allCollections}
                renderItem={renderCollectionItem}
                keyExtractor={(item) => item.id}
                onLoadMore={loadMoreCollections}
                onRefresh={onRefresh}
                hasMoreData={hasNextCollectionsPage}
                isLoading={isFetchingNextCollectionsPage}
                isRefreshing={refreshing}
                loadingText="Loading more collections..."
                emptyComponent={renderCollectionsEmpty()}
                contentContainerStyle={styles.collectionsList}
                nestedScrollEnabled={true}
                numColumns={2}
              />
            )}
          </View>
        </View>
        
        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="cart" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Order Items ({selectedItems.length})</Text>
              <View style={styles.selectedItemsBadge}>
                <Text style={styles.selectedItemsBadgeText}>{selectedItems.length}</Text>
              </View>
            </View>
            
            <ScrollView 
              style={styles.selectedItemsScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {selectedItems.map(renderSelectedItem)}
            </ScrollView>
            
            {/* Order Summary */}
            <View style={styles.orderSummaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Total</Text>
                <Text style={styles.summaryValue}>
                  KES {calculateTotals.itemsTotal.toFixed(2)}
                </Text>
              </View>
              
              {orderType === 'delivery' && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>
                      KES {calculateTotals.deliveryFee.toFixed(2)}
                    </Text>
                  </View>
                  
                  {parseFloat(errandFee) > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Errand Fee</Text>
                      <Text style={styles.summaryValue}>
                        KES {calculateTotals.errandFee.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </>
              )}
              
              <View style={styles.divider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>
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
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Customer Information</Text>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Customer name"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>
              
              <View style={styles.inputColumn}>
                <Text style={styles.inputLabel}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email address"
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
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Delivery Details</Text>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <Text style={styles.inputLabel}>Method *</Text>
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
              
              <View style={styles.inputColumn}>
                <Text style={styles.inputLabel}>Fee</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Delivery address"
                value={deliveryLocation}
                onChangeText={setDeliveryLocation}
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <Text style={styles.inputLabel}>Courier</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Courier name"
                  value={courier}
                  onChangeText={setCourier}
                />
              </View>
              
              {deliveryMethod === 'parcel' && (
                <View style={styles.inputColumn}>
                  <Text style={styles.inputLabel}>Errand Fee</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={errandFee}
                    onChangeText={setErrandFee}
                    keyboardType="decimal-pad"
                  />
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Payment Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="card-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Payment Information</Text>
          </View>
          
          {payments.map((payment, index) => (
            <View key={index} style={styles.paymentCard}>
              <View style={styles.paymentCardHeader}>
                <Text style={styles.paymentCardTitle}>Payment {index + 1}</Text>
                {payments.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemovePayment(index)}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.paymentInputRow}>
                <View style={styles.paymentInputColumn}>
                  <Text style={styles.inputLabel}>Amount *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={payment.amount}
                    onChangeText={(text) => handlePaymentChange(index, 'amount', text)}
                    keyboardType="decimal-pad"
                  />
                </View>
                
                <View style={styles.paymentInputColumn}>
                  <Text style={styles.inputLabel}>Account *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={payment.method}
                      onValueChange={(value) => handlePaymentChange(index, 'method', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select account" value="" />
                      {allAccounts.map((account: TAccount) => (
                        <Picker.Item 
                          key={account.id} 
                          label={`${account.name}`} 
                          value={account.id} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Transaction Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  value={payment.transactionCode}
                  onChangeText={(text) => handlePaymentChange(index, 'transactionCode', text)}
                />
              </View>
            </View>
          ))}
          
          <TouchableOpacity style={styles.addPaymentCard} onPress={handleAddPayment}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.addPaymentText}>Add Payment Method</Text>
          </TouchableOpacity>
          
          {/* Payment Summary */}
          <View style={styles.paymentSummaryCard}>
            <View style={styles.paymentSummaryRow}>
              <Text style={styles.paymentSummaryLabel}>Total Paid</Text>
              <Text style={styles.paymentSummaryValue}>
                KES {calculateTotals.paidAmount.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.paymentSummaryRow}>
              <Text style={styles.paymentSummaryLabel}>Amount Due</Text>
              <Text style={[styles.paymentSummaryValue, styles.pendingAmount]}>
                KES {calculateTotals.pendingAmount.toFixed(2)}
              </Text>
            </View>
          </View>
          
          {/* Payment Terms and Sales Person */}
          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Terms *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={paymentTerms}
                  onValueChange={setPaymentTerms}
                  style={styles.picker}
                >
                  <Picker.Item label="Full Payment" value="full" />
                  {orderType !== 'walkin' && <Picker.Item label="Deposit" value="deposit" />}
                  {orderType === 'delivery' && <Picker.Item label="After Delivery" value="after_delivery" />}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Sales Person</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={salesPerson}
                onChangeText={setSalesPerson}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes..."
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
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmitOrder}
          disabled={isSubmitting || selectedItems.length === 0}
        >
          <LinearGradient
            colors={['#4F46E5', COLORS.primary]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Creating Order...' : `Create Order • KES ${calculateTotals.totalAmount.toFixed(2)}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.spacer} />
      </ScrollView>
      
      {/* Shelf Selection Modal */}
      <Modal
        visible={showShelfModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Shop Location</Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Collection</Text>
            <TouchableOpacity onPress={() => setShowCollectionModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
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
          
          {isFetchingCollections ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={allCollections}
              renderItem={renderCollectionItem}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Ionicons name="grid-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyListText}>No collections found</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
      
      {/* Collection Variants Modal */}
      <Modal
        visible={showVariantModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Items</Text>
            <TouchableOpacity onPress={() => setShowVariantModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {selectedCollection && (
            <>
              <View style={styles.collectionModalHeader}>
                <View style={styles.collectionModalIcon}>
                  <Ionicons name="grid" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.collectionModalInfo}>
                  <Text style={styles.collectionModalName}>{selectedCollection.name}</Text>
                  <Text style={styles.collectionModalDescription}>
                    {selectedCollection.description}
                  </Text>
                  <View style={styles.collectionModalTags}>
                    <View style={styles.collectionTag}>
                      <Text style={styles.collectionTagText}>{selectedCollection.items?.length || 0} items</Text>
                    </View>
                    <View style={styles.collectionTag}>
                      <Text style={styles.collectionTagText}>{selectedCollection.discount}% off</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Collection Discount Input */}
              <View style={styles.collectionDiscountContainer}>
                <Text style={styles.collectionDiscountLabel}>Collection Discount (%)</Text>
                <View style={styles.collectionDiscountInput}>
                  <TextInput
                    style={styles.collectionDiscountTextInput}
                    value={collectionDiscount.toString()}
                    onChangeText={(text) => setCollectionDiscount(parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.collectionDiscountPercent}>%</Text>
                </View>
              </View>
              
              <ScrollView style={styles.variantsList}>
                {selectedCollectionData?.pages[0]?.products?.map(renderVariantItem)}
              </ScrollView>
              
              {/* Add to Order Button */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.addToOrderButton}
                  onPress={handleAddCollectionToOrder}
                >
                  <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.addToOrderText}>
                    Add to Order ({Object.values(selectedVariants).filter(v => v && v.quantity > 0).length} items)
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
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerGradient: {
    height: 140,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  shelfSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
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
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedShelfDetails: {
    flex: 1,
  },
  selectedShelfName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedShelfLocation: {
    fontSize: 13,
    color: '#64748B',
  },
  shelfSelectorPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shelfSelectorText: {
    fontSize: 15,
    color: '#94A3B8',
    marginLeft: 8,
  },
  orderTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderTypeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  orderTypeCardActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#4F46E5',
  },
  orderTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  orderTypeIconActive: {
    backgroundColor: '#EEF2FF',
  },
  orderTypeIconInactive: {
    backgroundColor: '#F8FAFC',
  },
  orderTypeCardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  orderTypeCardTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 6,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  itemsListContainer: {
    height: 400,
  },
  productsGrid: {
    paddingVertical: 8,
  },
  productsColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCardWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    height: 180,
  },
  productCardImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  productCardContent: {
    flex: 1,
  },
  productCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  productCardSku: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  productCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  productCardAddButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionsList: {
    paddingVertical: 8,
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  collectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  collectionCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  collectionCardIconText: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  collectionCardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectionCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  collectionDiscountTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  collectionDiscountTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  collectionCardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  collectionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectionCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  collectionCardBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  collectionCardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyListText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  selectedItemsBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  selectedItemsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedItemsScroll: {
    maxHeight: 300,
  },
  selectedItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedItemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  removeItemButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  collectionItemsCount: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  collectionPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectionPriceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  collectionDiscountText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  itemControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySection: {
    flex: 1,
  },
  discountSection: {
    flex: 1,
    alignItems: 'center',
  },
  totalSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  controlLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  quantityInput: {
    width: 40,
    height: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountInput: {
    width: 60,
    height: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  percentSymbol: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
    fontWeight: '600',
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  orderSummaryCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  inputColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    height: 50,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    fontSize: 10,
  },
  paymentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentInputRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  paymentInputColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  addPaymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addPaymentText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  paymentSummaryCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  paymentSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pendingAmount: {
    color: '#DC2626',
  },
  submitButton: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
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
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  spacer: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalList: {
    padding: 20,
  },
  shelfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shelfItemSelected: {
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.primary,
  },
  shelfIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  shelfInfo: {
    flex: 1,
  },
  shelfName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  shelfLocation: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  shelfItemsCount: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  variantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  variantCardHeader: {
    marginBottom: 12,
  },
  variantCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  variantCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  variantStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  variantSelectedBadge: {
    backgroundColor: '#D1FAE5',
  },
  variantUnselectedBadge: {
    backgroundColor: '#F1F5F9',
  },
  variantStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  variantScrollView: {
    marginHorizontal: -4,
  },
  variantOptionCard: {
    width: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  variantOptionCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: COLORS.primary,
  },
  variantOptionImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  variantOptionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  variantOptionPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  variantSelectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  noVariantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  noVariantsText: {
    fontSize: 14,
    color: '#64748B',
  },
  noVariantsPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  variantQuantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  variantQuantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  variantQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variantQuantityButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  variantQuantityInput: {
    width: 48,
    height: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  collectionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: COLORS.primary,
  },
  collectionModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  collectionModalInfo: {
    flex: 1,
  },
  collectionModalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  collectionModalDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    lineHeight: 20,
  },
  collectionModalTags: {
    flexDirection: 'row',
  },
  collectionTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  collectionTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  collectionDiscountContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  collectionDiscountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  collectionDiscountInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectionDiscountTextInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    marginRight: 8,
  },
  collectionDiscountPercent: {
    fontSize: 16,
    color: '#92400E',
    fontWeight: '600',
  },
  variantsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  addToOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 12,
  },
  addToOrderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
  },
});

export default AddNewOrder;