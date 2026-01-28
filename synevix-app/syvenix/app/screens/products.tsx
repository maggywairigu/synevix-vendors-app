"use client";

import { COLORS } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import your queries and types
import { fetchCategories } from "@/apis/products/getCategories";
import { useGetProducts } from "@/queries/productQueries";
import type { TCategory } from "@/types/category";
import type { TProduct } from "@/types/product";
import convertCloudinaryUrlToPng from "../utils/normalizeImages";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Product categories for filtering
const PRODUCT_CATEGORIES = [
  { id: "all", label: "All Products", color: COLORS.primary, icon: "apps" },
  { id: "active", label: "Active", color: "#4CAF50", icon: "checkmark-circle" },
  { id: "inactive", label: "Inactive", color: "#9E9E9E", icon: "close-circle" },
  {
    id: "lowstock",
    label: "Low Stock",
    color: "#FF9800",
    icon: "alert-circle",
  },
  {
    id: "outofstock",
    label: "Out of Stock",
    color: "#F44336",
    icon: "close-circle",
  },
  { id: "featured", label: "Featured", color: "#2196F3", icon: "star" },
];

const STOCK_LEVELS = [
  { id: "all", label: "All Stock" },
  { id: "high", label: "High Stock", color: "#4CAF50", icon: "trending-up" },
  {
    id: "medium",
    label: "Medium Stock",
    color: "#FF9800",
    icon: "trending-flat",
  },
  { id: "low", label: "Low Stock", color: "#F44336", icon: "trending-down" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest", icon: "time" },
  { id: "name", label: "Name A-Z", icon: "text" },
  { id: "price_low", label: "Price: Low to High", icon: "arrow-up" },
  { id: "price_high", label: "Price: High to Low", icon: "arrow-down" },
  { id: "stock_low", label: "Stock: Low to High", icon: "trending-down" },
  { id: "stock_high", label: "Stock: High to Low", icon: "trending-up" },
];

// Stock adjustment reasons
const STOCK_ADJUSTMENT_REASONS = [
  {
    id: "spoiled",
    label: "Spoiled/Damaged Stock",
    color: "#F44336",
    icon: "trash",
  },
  {
    id: "returned",
    label: "Customer Return",
    color: "#FF9800",
    icon: "return-up-back",
  },
  { id: "theft", label: "Theft/Loss", color: "#607D8B", icon: "alert-circle" },
  {
    id: "correction",
    label: "Inventory Correction",
    color: "#2196F3",
    icon: "create",
  },
  {
    id: "other",
    label: "Other",
    color: "#9E9E9E",
    icon: "ellipsis-horizontal",
  },
];

export default function ProductsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeStockLevel, setActiveStockLevel] = useState("all");
  const [activeSort, setActiveSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isAdding, setIsAdding] = useState(true);
  const [categories, setCategories] = useState<TCategory[]>([]);
  const [filters, setFilters] = useState({
    sku: "",
    type: "",
  });

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  // Use your product query
  const pageLimit = 6;
  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetProducts({
    searchText: searchQuery,
    pageLimit,
    filters: {
      sku: filters.sku,
      type: filters.type,
    },
  });

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Combine all pages of products
  const allProducts = data?.pages.flatMap((page) => page.products) ?? [];

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === "all" ? 0 : 1,
      useNativeDriver: true,
      tension: 150,
      friction: 20,
    }).start();
  }, [activeTab]);

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
    ]).start();
  }, []);

  useEffect(() => {
    if (showQuickEdit) {
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 20,
      }).start();
    } else {
      modalAnim.setValue(0);
    }
  }, [showQuickEdit]);

  // Helper function to calculate total stock for a product
  const getTotalStock = (product: TProduct) => {
    return (
      product.variants?.reduce(
        (sum, variant) => sum + Number(variant.stock || 0),
        0
      ) || 0
    );
  };

  // Helper function to get stock level color and label
  const getStockLevel = (stock: number) => {
    if (stock <= 0)
      return {
        label: "Out of Stock",
        color: "#F44336",
        bg: "rgba(244, 67, 54, 0.1)",
      };
    if (stock <= 10)
      return {
        label: "Low Stock",
        color: "#FF9800",
        bg: "rgba(255, 152, 0, 0.1)",
      };
    if (stock <= 50)
      return {
        label: "Medium Stock",
        color: "#2196F3",
        bg: "rgba(33, 150, 243, 0.1)",
      };
    return {
      label: "High Stock",
      color: "#4CAF50",
      bg: "rgba(76, 175, 80, 0.1)",
    };
  };

  // Helper function to get status color and label
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          color: "#4CAF50",
          bg: "rgba(76, 175, 80, 0.1)",
          icon: "checkmark-circle",
        };
      case "inactive":
        return {
          label: "Inactive",
          color: "#9E9E9E",
          bg: "rgba(158, 158, 158, 0.1)",
          icon: "close-circle",
        };
      default:
        return {
          label: "Draft",
          color: "#FF9800",
          bg: "rgba(255, 152, 0, 0.1)",
          icon: "time",
        };
    }
  };

  // Transform API data to match our component format
  const transformProducts = () => {
    return allProducts.map((product) => {
      const totalStock = getTotalStock(product);
      const stockLevel = getStockLevel(totalStock);
      const statusInfo = getStatusInfo(product.status);

      // Get all SKUs for the product
      const skus = product.variants?.map((v) => v.sku) || [];
      const primarySku = skus[0] || "N/A";

      // Get product type (category) - using first variant's type
      const productType = product.variants?.[0]?.type || "Uncategorized";

      // Format price
      const price = product.market_price
        ? `KES ${product.market_price.toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "KES 0.00";

      return {
        id: product.productId || product.id,
        name: product.name || "Unnamed Product",
        sku: primarySku,
        skus: skus,
        image: product.images?.[0] || "https://via.placeholder.com/100",
        type: productType,
        price: price,
        stock: totalStock,
        stockLevel: stockLevel,
        status: product.status || "draft",
        statusInfo: statusInfo,
        variants: product.variants || [],
        description: product.description || "",
        createdAt: product.createdAt || { _seconds: Date.now() / 1000 },
        featured: product.featured || false,
        // Store reference to original data
        productData: product,
      };
    });
  };

  const products = transformProducts();

  // Handle quick edit button click
  const handleQuickEdit = (product: any) => {
    setSelectedProduct(product.productData);
    // Default to first variant
    setSelectedVariant(product.variants[0]);
    setAdjustmentAmount("");
    setAdjustmentReason("");
    setOtherReason("");
    setIsAdding(true);
    setShowQuickEdit(true);
  };

  // Handle stock adjustment
  const handleStockAdjustment = () => {
    if (!selectedProduct || !selectedVariant) return;

    const amount = parseInt(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive number");
      return;
    }

    if (!isAdding && !adjustmentReason) {
      Alert.alert(
        "Reason Required",
        "Please select a reason for reducing stock"
      );
      return;
    }

    if (adjustmentReason === "other" && !otherReason.trim()) {
      Alert.alert(
        "Reason Required",
        "Please specify the reason for stock reduction"
      );
      return;
    }

    if (!isAdding && amount > selectedVariant.stock) {
      Alert.alert(
        "Insufficient Stock",
        `Cannot reduce ${amount} units. Only ${selectedVariant.stock} units available.`
      );
      return;
    }

    // In a real app, you would make an API call here
    // For now, we'll just show a success message
    const action = isAdding ? "added to" : "removed from";
    const reasonText =
      adjustmentReason === "other"
        ? otherReason
        : STOCK_ADJUSTMENT_REASONS.find((r) => r.id === adjustmentReason)
            ?.label || "N/A";

    Alert.alert(
      "Stock Updated",
      `${amount} units ${action} ${selectedVariant.sku}\nReason: ${reasonText}\n\nNote: This is a demo. In production, this would update the database.`,
      [{ text: "OK", onPress: () => setShowQuickEdit(false) }]
    );

    // Reset form
    setAdjustmentAmount("");
    setAdjustmentReason("");
    setOtherReason("");
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      sku: "",
      type: "",
    });
    setActiveStockLevel("all");
    setActiveSort("newest");
    setActiveCategory("all");
    setSearchQuery("");
  };

  // Render quick edit modal
  const renderQuickEditModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showQuickEdit}
      onRequestClose={() => setShowQuickEdit(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
              opacity: modalAnim,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Adjust Stock</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedProduct?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowQuickEdit(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Product Info */}
            <View style={styles.productInfoCard}>
              <View style={styles.productImageContainer}>
                {selectedProduct?.images?.[0] ? (
                  <Image
                    source={{ uri: selectedProduct.images[0] }}
                    style={styles.productImage}
                  />
                ) : (
                  <Ionicons name="cube" size={40} color={COLORS.textLight} />
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {selectedProduct?.name}
                </Text>
                <Text style={styles.productType}>
                  {selectedProduct?.variants?.[0]?.type || "Uncategorized"}
                </Text>
                <Text style={styles.currentStock}>
                  Current Stock:{" "}
                  <Text style={styles.stockNumber}>
                    {selectedVariant?.stock || 0}
                  </Text>{" "}
                  units
                </Text>
              </View>
            </View>

            {/* Variant Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Variant</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.variantsScroll}
              >
                <View style={styles.variantsContainer}>
                  {selectedProduct?.variants.map((variant: any) => (
                    <TouchableOpacity
                      key={variant.sku}
                      style={[
                        styles.variantButton,
                        selectedVariant?.sku === variant.sku &&
                          styles.variantButtonActive,
                      ]}
                      onPress={() => setSelectedVariant(variant)}
                    >
                      <View style={styles.variantInfo}>
                        <Text
                          style={[
                            styles.variantLabel,
                            selectedVariant?.sku === variant.sku &&
                              styles.variantLabelActive,
                          ]}
                        >
                          {variant.label || variant.sku}
                        </Text>
                        <Text style={styles.variantSku}>{variant.sku}</Text>
                      </View>
                      <View
                        style={[
                          styles.variantStockBadge,
                          { backgroundColor: getStockLevel(variant.stock).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.variantStock,
                            { color: getStockLevel(variant.stock).color },
                          ]}
                        >
                          {variant.stock} units
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Action Type (Add/Remove) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Action Type</Text>
              <View style={styles.actionTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.actionTypeButton,
                    isAdding && styles.actionTypeButtonActive,
                  ]}
                  onPress={() => setIsAdding(true)}
                >
                  <View
                    style={[
                      styles.actionTypeIcon,
                      { backgroundColor: isAdding ? "#4CAF50" : "#f0f0f0" },
                    ]}
                  >
                    <Ionicons
                      name="add-circle"
                      size={24}
                      color={isAdding ? "#fff" : "#9E9E9E"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.actionTypeLabel,
                      isAdding && styles.actionTypeLabelActive,
                    ]}
                  >
                    Add Stock
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionTypeButton,
                    !isAdding && styles.actionTypeButtonActive,
                  ]}
                  onPress={() => setIsAdding(false)}
                >
                  <View
                    style={[
                      styles.actionTypeIcon,
                      { backgroundColor: !isAdding ? "#F44336" : "#f0f0f0" },
                    ]}
                  >
                    <Ionicons
                      name="remove-circle"
                      size={24}
                      color={!isAdding ? "#fff" : "#9E9E9E"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.actionTypeLabel,
                      !isAdding && styles.actionTypeLabelActive,
                    ]}
                  >
                    Reduce Stock
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {isAdding ? "Amount to Add" : "Amount to Remove"}
              </Text>
              <View style={styles.amountInputContainer}>
                <View style={styles.amountInputWrapper}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Enter amount"
                    placeholderTextColor={COLORS.textLight}
                    value={adjustmentAmount}
                    onChangeText={setAdjustmentAmount}
                    keyboardType="numeric"
                  />
                  <Text style={styles.amountUnit}>units</Text>
                </View>
                <Text style={styles.amountHelper}>
                  {isAdding
                    ? `Will update stock to ${
                        (selectedVariant?.stock || 0) +
                        (parseInt(adjustmentAmount) || 0)
                      } units`
                    : `Will update stock to ${
                        (selectedVariant?.stock || 0) -
                        (parseInt(adjustmentAmount) || 0)
                      } units`}
                </Text>
              </View>
            </View>

            {/* Reduction Reason (only shown when reducing stock) */}
            {!isAdding && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reason for Reduction</Text>

                {/* Reason Options */}
                <View style={styles.reasonOptions}>
                  {STOCK_ADJUSTMENT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonOption,
                        adjustmentReason === reason.id && [
                          styles.reasonOptionActive,
                          { borderColor: reason.color },
                        ],
                      ]}
                      onPress={() => setAdjustmentReason(reason.id)}
                    >
                      <View
                        style={[
                          styles.reasonIcon,
                          {
                            backgroundColor:
                              adjustmentReason === reason.id
                                ? reason.color
                                : "#f5f5f5",
                          },
                        ]}
                      >
                        <Ionicons
                          name={reason.icon as any}
                          size={20}
                          color={
                            adjustmentReason === reason.id
                              ? "#fff"
                              : reason.color
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.reasonLabel,
                          adjustmentReason === reason.id && {
                            color: reason.color,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {reason.label}
                      </Text>
                      {adjustmentReason === reason.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={reason.color}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Other Reason Input */}
                {adjustmentReason === "other" && (
                  <View style={styles.otherReasonContainer}>
                    <Text style={styles.otherReasonLabel}>Specify Reason</Text>
                    <TextInput
                      style={styles.otherReasonInput}
                      placeholder="Enter reason for stock reduction..."
                      placeholderTextColor={COLORS.textLight}
                      value={otherReason}
                      onChangeText={setOtherReason}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                )}

                {/* Warning for stock reduction */}
                {!isAdding && (
                  <View style={styles.reductionWarning}>
                    <Ionicons name="alert-circle" size={20} color="#FF9800" />
                    <Text style={styles.warningText}>
                      Stock reduction requires a valid reason for audit
                      purposes.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowQuickEdit(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !isAdding && !adjustmentReason && { opacity: 0.5 },
                  adjustmentReason === "other" &&
                    !otherReason.trim() && { opacity: 0.5 },
                ]}
                onPress={handleStockAdjustment}
                disabled={
                  (!isAdding && !adjustmentReason) ||
                  (adjustmentReason === "other" && !otherReason.trim())
                }
              >
                <Text style={styles.confirmButtonText}>
                  {isAdding ? "Add Stock" : "Reduce Stock"}
                </Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => {
                    setAdjustmentAmount("1");
                    setIsAdding(true);
                  }}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                    ]}
                  >
                    <Ionicons name="add" size={20} color="#4CAF50" />
                  </View>
                  <Text style={styles.quickActionLabel}>Add 1 Unit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => {
                    setAdjustmentAmount("5");
                    setIsAdding(true);
                  }}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                    ]}
                  >
                    <Ionicons name="add" size={20} color="#4CAF50" />
                  </View>
                  <Text style={styles.quickActionLabel}>Add 5 Units</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => {
                    setAdjustmentAmount("1");
                    setIsAdding(false);
                    setAdjustmentReason("spoiled");
                  }}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: "rgba(244, 67, 54, 0.1)" },
                    ]}
                  >
                    <Ionicons name="remove" size={20} color="#F44336" />
                  </View>
                  <Text style={styles.quickActionLabel}>Mark as Spoiled</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => {
                    if (selectedVariant?.stock > 0) {
                      setAdjustmentAmount(selectedVariant.stock.toString());
                      setIsAdding(false);
                      setAdjustmentReason("correction");
                    }
                  }}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: "rgba(33, 150, 243, 0.1)" },
                    ]}
                  >
                    <Ionicons name="refresh" size={20} color="#2196F3" />
                  </View>
                  <Text style={styles.quickActionLabel}>Zero Stock</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  // Filter products based on active filters
  const filterProducts = () => {
    let filtered = products;

    // Filter by category tab
    if (activeCategory === "active") {
      filtered = filtered.filter((product) => product.status === "active");
    } else if (activeCategory === "inactive") {
      filtered = filtered.filter((product) => product.status === "inactive");
    } else if (activeCategory === "lowstock") {
      filtered = filtered.filter(
        (product) => product.stock <= 10 && product.stock > 0
      );
    } else if (activeCategory === "outofstock") {
      filtered = filtered.filter((product) => product.stock === 0);
    } else if (activeCategory === "featured") {
      filtered = filtered.filter((product) => product.featured);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.skus.some((sku) =>
            sku.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Filter by stock level
    if (activeStockLevel !== "all") {
      if (activeStockLevel === "high") {
        filtered = filtered.filter((product) => product.stock > 50);
      } else if (activeStockLevel === "medium") {
        filtered = filtered.filter(
          (product) => product.stock <= 50 && product.stock > 10
        );
      } else if (activeStockLevel === "low") {
        filtered = filtered.filter(
          (product) => product.stock <= 10 && product.stock > 0
        );
      }
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (activeSort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price_low":
          return (
            parseFloat(a.price.replace(/[^0-9.]/g, "")) -
            parseFloat(b.price.replace(/[^0-9.]/g, ""))
          );
        case "price_high":
          return (
            parseFloat(b.price.replace(/[^0-9.]/g, "")) -
            parseFloat(a.price.replace(/[^0-9.]/g, ""))
          );
        case "stock_low":
          return a.stock - b.stock;
        case "stock_high":
          return b.stock - a.stock;
        case "newest":
        default:
          return (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0);
      }
    });

    return filtered;
  };

  const getProductCountByCategory = (categoryId: string) => {
    switch (categoryId) {
      case "all":
        return products.length;
      case "active":
        return products.filter((product) => product.status === "active").length;
      case "inactive":
        return products.filter((product) => product.status === "inactive")
          .length;
      case "lowstock":
        return products.filter(
          (product) => product.stock <= 10 && product.stock > 0
        ).length;
      case "outofstock":
        return products.filter((product) => product.stock === 0).length;
      case "featured":
        return products.filter((product) => product.featured).length;
      default:
        return 0;
    }
  };

  const getTotalStockCount = () => {
    return products.reduce((sum, product) => sum + product.stock, 0);
  };

  const getActiveProductCount = () => {
    return products.filter((product) => product.status === "active").length;
  };

  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilters}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.filterModalOverlay}>
        <ScrollView style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <View style={styles.filterModalTitleContainer}>
              <Text style={styles.filterModalTitle}>
                Filter & Sort Products
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.filterModalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.type === "" && styles.filterOptionActive,
                  ]}
                  onPress={() => handleFilterChange("type", "")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.type === "" && styles.filterOptionTextActive,
                    ]}
                  >
                    All Categories
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.name}
                    style={[
                      styles.filterOption,
                      filters.type === category.name &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => handleFilterChange("type", category.name)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.type === category.name &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Stock Level Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Stock Level</Text>
              <View style={styles.filterOptions}>
                {STOCK_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.filterOption,
                      activeStockLevel === level.id &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => setActiveStockLevel(level.id)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        activeStockLevel === level.id &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptions}>
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.sortOption,
                      activeSort === option.id && styles.sortOptionActive,
                    ]}
                    onPress={() => setActiveSort(option.id)}
                  >
                    <View style={styles.sortOptionContent}>
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color={
                          activeSort === option.id
                            ? COLORS.primary
                            : COLORS.textLight
                        }
                      />
                      <Text
                        style={[
                          styles.sortOptionText,
                          activeSort === option.id &&
                            styles.sortOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {activeSort === option.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.filterModalActions}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>
                  Clear All Filters
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderProductCard = (product: any, index: number) => (
    <Animated.View
      key={product.id}
      style={[
        styles.productCardContainer,
        {
          opacity: cardAnim,
          transform: [
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50 + index * 20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.productCard}
        onPress={() =>
          router.push({
            pathname: "/components/products/productDetails",
            params: {
              productId: product.id,
              productData: JSON.stringify(product.productData),
            },
          })
        }
        activeOpacity={0.9}
      >
        {/* Product Header with Image */}
        <View style={styles.productHeader}>
          {/* Product Image */}
          <View style={styles.productImageWrapper}>
            {product.image ? (
              <Image
                source={{ uri: convertCloudinaryUrlToPng(product.image) }}
                style={styles.productThumbnail}
              />
            ) : (
              <Ionicons name="cube" size={40} color={COLORS.textLight} />
            )}
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <View style={styles.productTitleRow}>
              <View style={styles.productTitleContainer}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <View style={styles.productTypeContainer}>
                  <Ionicons
                    name="pricetag"
                    size={14}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.productType}>{product.type}</Text>
                </View>
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: product.statusInfo.bg },
                ]}
              >
                <Ionicons
                  name={product.statusInfo.icon as any}
                  size={12}
                  color={product.statusInfo.color}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: product.statusInfo.color },
                  ]}
                >
                  {product.statusInfo.label}
                </Text>
              </View>
            </View>

            {/* SKU Tags */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.skuTagsContainer}
            >
              <View style={styles.skuTags}>
                {product.skus.slice(0, 3).map((sku: string, idx: number) => (
                  <View key={idx} style={styles.skuTag}>
                    <Text style={styles.skuTagText}>{sku}</Text>
                  </View>
                ))}
                {product.skus.length > 3 && (
                  <View style={styles.skuTag}>
                    <Text style={styles.skuTagText}>
                      +{product.skus.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Product Details */}
        <View style={styles.productDetails}>
          <View style={styles.priceStockRow}>
            <View style={styles.priceContainer}>
              <Ionicons name="cash" size={18} color={COLORS.primary} />
              <Text style={styles.productPrice}>{product.price}</Text>
            </View>

            <View
              style={[
                styles.stockBadge,
                { backgroundColor: product.stockLevel.bg },
              ]}
            >
              <Ionicons
                name={product.stock <= 10 ? "alert-circle" : "cube"}
                size={14}
                color={product.stockLevel.color}
              />
              <Text
                style={[styles.stockText, { color: product.stockLevel.color }]}
              >
                {product.stock} units
              </Text>
            </View>
          </View>

          {/* Stock Progress Bar */}
          <View style={styles.stockProgressContainer}>
            <View style={styles.stockProgressHeader}>
              <Text style={styles.stockProgressLabel}>Stock Level</Text>
              <Text style={styles.stockProgressValue}>
                {product.stockLevel.label}
              </Text>
            </View>
            <View style={styles.stockProgressBar}>
              <View
                style={[
                  styles.stockProgressFill,
                  {
                    width: `${Math.min(product.stock, 100)}%`,
                    backgroundColor: product.stockLevel.color,
                  },
                ]}
              />
            </View>
          </View>

          {/* Variants Summary */}
          {product.variants.length > 0 && (
            <View style={{
              width: "100%",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginHorizontal: 10,
            }}>
              {product.variants.slice(0, 2).map((variant: any, idx: number) => (
                <View key={idx} style={styles.variantTag}>
                  <Text style={{
                    fontSize: 14,
                    color: COLORS.text,
                    fontFamily: "Montserrat-ExtraLight",
                  }}>
                    {variant.label || "Variant"}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: COLORS.textLight,
                    fontFamily: "Montserrat-ExtraLight",
                  }}>({variant.stock})</Text>
                </View>
              ))}
              {product.variants.length > 2 && (
                <View style={styles.moreVariantsTag}>
                  <Text style={styles.moreVariantsText}>
                    +{product.variants.length - 2} variants
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Footer */}
        <LinearGradient
          colors={["rgba(249, 249, 249, 0.8)", "rgba(249, 249, 249, 1)"]}
          style={styles.productFooter}
        >
          <TouchableOpacity
            style={styles.quickEditButton}
            onPress={() => handleQuickEdit(product)}
          >
            <Ionicons name="pencil" size={16} color={COLORS.primary} />
            <Text style={styles.quickEditText}>Quick Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewDetailsButton}
            activeOpacity={0.8}
            onPress={() => {
              router.push({
                pathname: "/components/products/productDetails",
                params: {
                  productId: product.id,
                  productData: JSON.stringify(product.productData),
                },
              });
            }}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, "#D663F6"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>Product Inventory</Text>
                <Text style={styles.headerSubtitle}>
                  {getActiveProductCount()} active products •{" "}
                  {getTotalStockCount()} total units
                </Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.addProductButton}
                  onPress={() => router.push("/components/products/addProduct")}
                >
                  <Ionicons name="add-circle" size={14} color={COLORS.white} />
                  <Text style={styles.addProductText}>Add Product</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterIconButton}
                  onPress={() => setShowFilters(true)}
                >
                  <Ionicons name="filter" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <Animated.View style={styles.searchBarContainer}>
            <LinearGradient
              colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.98)"]}
              style={styles.searchBarGradient}
            >
              <View style={styles.searchBar}>
                <Ionicons
                  name="search"
                  size={22}
                  color={isSearchFocused ? COLORS.primary : COLORS.textLight}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products, SKUs, names..."
                  placeholderTextColor={COLORS.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="barcode" size={20} color={COLORS.textLight} />
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* Category Tabs */}
        <View style={styles.categoryTabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  activeCategory === category.id && styles.categoryItemActive,
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor:
                        activeCategory === category.id
                          ? category.color
                          : "rgba(0,0,0,0.05)",
                    },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color={
                      activeCategory === category.id
                        ? COLORS.white
                        : category.color
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    activeCategory === category.id && {
                      color: category.color,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {category.label}
                </Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {getProductCountByCategory(category.id)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Loading Indicator */}
        {isFetching && !isFetchingNextPage && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        )}

        {/* Active Filters */}
        {(activeStockLevel !== "all" ||
          activeSort !== "newest" ||
          filters.type ||
          filters.sku) && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.activeFilters}>
                {filters.type && (
                  <View style={styles.activeFilterTag}>
                    <Ionicons
                      name="pricetag"
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={styles.activeFilterText}>
                      {categories.find((c) => c.name === filters.type)?.name ||
                        filters.type}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleFilterChange("type", "")}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                {filters.sku && (
                  <View style={styles.activeFilterTag}>
                    <Ionicons name="barcode" size={14} color={COLORS.primary} />
                    <Text style={styles.activeFilterText}>
                      SKU: {filters.sku}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleFilterChange("sku", "")}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                {activeStockLevel !== "all" && (
                  <View style={styles.activeFilterTag}>
                    <Ionicons
                      name={
                        STOCK_LEVELS.find((s) => s.id === activeStockLevel)
                          ?.icon as any
                      }
                      size={14}
                      color={
                        STOCK_LEVELS.find((s) => s.id === activeStockLevel)
                          ?.color || COLORS.primary
                      }
                    />
                    <Text style={styles.activeFilterText}>
                      {
                        STOCK_LEVELS.find((s) => s.id === activeStockLevel)
                          ?.label
                      }
                    </Text>
                    <TouchableOpacity
                      onPress={() => setActiveStockLevel("all")}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                {activeSort !== "newest" && (
                  <View style={styles.activeFilterTag}>
                    <Ionicons
                      name={
                        SORT_OPTIONS.find((s) => s.id === activeSort)
                          ?.icon as any
                      }
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={styles.activeFilterText}>
                      {SORT_OPTIONS.find((s) => s.id === activeSort)?.label}
                    </Text>
                    <TouchableOpacity onPress={() => setActiveSort("newest")}>
                      <Ionicons
                        name="close"
                        size={14}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.clearAllFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearAllFiltersText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {filterProducts().length > 0 ? (
            filterProducts().map((product, index) =>
              renderProductCard(product, index)
            )
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name={activeCategory === "outofstock" ? "close-circle" : "cube"}
                size={80}
                color={COLORS.textLight}
              />
              <Text style={styles.emptyStateTitle}>No products found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery
                  ? "Try a different search term"
                  : `No products match your current filters`}
              </Text>
              {(activeStockLevel !== "all" ||
                activeSort !== "newest" ||
                filters.type ||
                filters.sku) && (
                <TouchableOpacity
                  style={styles.clearFiltersButtonSmall}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersButtonSmallText}>
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Load More Indicator */}
        {hasNextPage && (
          <View style={styles.loadMoreContainer}>
            {isFetchingNextPage ? (
              <Text style={styles.loadMoreText}>Loading more products...</Text>
            ) : (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                <Text style={styles.loadMoreButtonText}>
                  Load More Products
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderFilterModal()}
      {renderQuickEditModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
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
  headerContent: {
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
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  addProductText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarContainer: {
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
  searchBarGradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  searchBar: {
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
  categoryTabsContainer: {
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
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  activeFiltersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  activeFilters: {
    flexDirection: "row",
    gap: 8,
  },
  activeFilterTag: {
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
  clearAllFiltersButton: {
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clearAllFiltersText: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: "Montserrat-SemiBold",
  },
  productsGrid: {
    paddingHorizontal: 20,
  },
  productCardContainer: {
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: "hidden",

  },
  productHeader: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 12,
  },
  productImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  productThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productInfo: {
    flex: 1,
  },
  productTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  productTitleContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    marginBottom: 2,
  },
  productTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  productType: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  skuTagsContainer: {
    marginBottom: 8,
  },
  skuTags: {
    flexDirection: "row",
    gap: 6,
  },
  skuTag: {
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skuTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  productDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  priceStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  stockProgressContainer: {
    marginBottom: 12,
  },
  stockProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  stockProgressLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  stockProgressValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  stockProgressBar: {
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  stockProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  variantsContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderColor: COLORS.error,
  },
  variantTag: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  variantLabel: {
    fontSize: 8,
    color: COLORS.text,
    fontFamily: "Montserrat-ExtraLight",
  },
  variantStock: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: "Montserrat-ExtraLight",
  },
  moreVariantsTag: {
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moreVariantsText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  quickEditButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickEditText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  viewDetailsText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
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
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    fontFamily: "Montserrat-Regular",
  },
  clearFiltersButtonSmall: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    borderRadius: 12,
  },
  clearFiltersButtonSmallText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loadMoreButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
  },
  bottomSpacer: {
    height: 30,
  },
  // Filter Modal Styles
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "80%",
  },
  filterModalHeader: {
    padding: 20,
  },
  filterModalTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  filterModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
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
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
  },
  filterOptionTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  sortOptionActive: {
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sortOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortOptionText: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
  },
  sortOptionTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  filterModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  clearFiltersButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyFiltersButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  // Quick Edit Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
    marginTop: 4,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfoCard: {
    flexDirection: "row",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    marginBottom: 4,
  },
  productType: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
    marginBottom: 8,
  },
  currentStock: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
  },
  stockNumber: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    marginBottom: 16,
  },
  variantsScroll: {
    marginHorizontal: -20,
  },
  variantsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  variantButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    minWidth: 180,
    borderWidth: 2,
    borderColor: "transparent",
  },
  variantButtonActive: {
    backgroundColor: "rgba(201, 70, 238, 0.05)",
    borderColor: COLORS.primary,
  },
  variantInfo: {
    marginBottom: 12,
  },
  variantLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 4,
  },
  variantLabelActive: {
    color: COLORS.primary,
  },
  variantSku: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  variantStockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  variantStock: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  actionTypeContainer: {
    flexDirection: "row",
    gap: 16,
  },
  actionTypeButton: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "transparent",
  },
  actionTypeButtonActive: {
    backgroundColor: "rgba(201, 70, 238, 0.05)",
    borderColor: COLORS.primary,
  },
  actionTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTypeLabel: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "Montserrat-SemiBold",
  },
  actionTypeLabelActive: {
    color: COLORS.primary,
  },
  amountInputContainer: {
    gap: 8,
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  amountInput: {
    flex: 1,
    fontSize: 17,
    color: COLORS.text,
    fontFamily: "Montserrat-SemiBold",
  },
  amountUnit: {
    fontSize: 16,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  amountHelper: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
    marginTop: 4,
  },
  reasonOptions: {
    gap: 12,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  reasonOptionActive: {
    backgroundColor: "rgba(201, 70, 238, 0.05)",
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
  },
  otherReasonContainer: {
    marginTop: 16,
  },
  otherReasonLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 8,
  },
  otherReasonInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
    minHeight: 100,
    textAlignVertical: "top",
  },
  reductionWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#FF9800",
    fontFamily: "Montserrat-Regular",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  quickActions: {
    padding: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickAction: {
    width: "48%",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
  },
});
