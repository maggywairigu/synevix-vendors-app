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
  Modal,
  Image,
  Alert,
  ActivityIndicator
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { COLORS } from "@/constants/Colors"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { useLocalSearchParams } from "expo-router"
import { router } from "expo-router"
import convertCloudinaryUrlToPng from "@/app/utils/normalizeImages"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

// Helper functions
const formatDate = (timestamp) => {
  if (!timestamp || !timestamp._seconds) return "Unknown date";
  const date = new Date(timestamp._seconds * 1000);
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const formatCurrency = (amount) => {
  return `KES ${parseFloat(amount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const calculateProfitPercentage = (buyingPrice, sellingPrice) => {
  if (!buyingPrice || buyingPrice === 0) return 0;
  return (((sellingPrice - buyingPrice) / buyingPrice) * 100).toFixed(1);
}

export default function ProductDetailsScreen() {
  const navigation = useNavigation()
  const params = useLocalSearchParams()
  const productId = params.productId as string
  
  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddVariantModal, setShowAddVariantModal] = useState(false)
  const [showEditVariantModal, setShowEditVariantModal] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [addFormData, setAddFormData] = useState({})
  const [editInfoData, setEditInfoData] = useState({})
  const [variations, setVariations] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingImages, setUploadingImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  
  const apiUrl = process.env.EXPO_PUBLIC_API_URL
  
  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current
  const contentAnim = useRef(new Animated.Value(0)).current
  const modalAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      })
    ]).start()
  }, [])

  useEffect(() => {
    if (showEditModal || showDeleteModal || showAddVariantModal || showEditVariantModal) {
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 20,
      }).start()
    } else {
      modalAnim.setValue(0)
    }
  }, [showEditModal, showDeleteModal, showAddVariantModal, showEditVariantModal])

  // Fetch product data
  useEffect(() => {
    fetchProduct()
    fetchCategoriesData()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiUrl}/getProductById/${productId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch product info.")
      }

      setProduct(data.data)
      setExistingImages(data.data?.images || [])
    } catch (err) {
      console.error("Fetch error:", err)
      Alert.alert("Error", err.message || "Failed to fetch product")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoriesData = async () => {
    try {
      const response = await fetch(`${apiUrl}/getCategories`)
      const data = await response.json()
      if (response.ok) {
        setCategories(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  // Calculate totals
  const totalStock = product?.variants?.reduce((sum, variant) => sum + Number(variant.stock || 0), 0) || 0
  const totalSpoiled = product?.variants?.reduce((sum, variant) => sum + Number(variant.spoiled || 0), 0) || 0
  const profitPercentage = calculateProfitPercentage(product?.buying_price, product?.selling_price)

  // Stock level helper
  const getStockLevel = (stock) => {
    if (stock <= 0) return { label: "Out of Stock", color: "#F44336" }
    if (stock <= 10) return { label: "Low Stock", color: "#FF9800" }
    if (stock <= 50) return { label: "Medium Stock", color: "#2196F3" }
    return { label: "High Stock", color: "#4CAF50" }
  }

  // Handle form changes
  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddChange = (field, value) => {
    setAddFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInfoChange = (field, value) => {
    setEditInfoData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddSelectChange = (value, name) => {
    if (name === "type") {
      const selectedCategory = categories.find(c => c.name === value)
      if (selectedCategory) {
        setVariations(selectedCategory.variations || [])
      }
    }
    setAddFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value, name) => {
    if (name === "type") {
      const selectedCategory = categories.find(c => c.name === value)
      if (selectedCategory) {
        setVariations(selectedCategory.variations || [])
      }
    }
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle product update
  const handleUpdateProduct = async () => {
    try {
      const formData = new FormData()
      formData.append('id', productId)
      
      Object.keys(editInfoData).forEach(key => {
        if (key !== 'images') {
          formData.append(key, editInfoData[key])
        }
      })
      
      // Append existing images
      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages))
      }
      
      const res = await fetch(`${apiUrl}/updateProductInfo`, {
        method: "PUT",
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Product was not updated successfully")
      }

      Alert.alert("Success", "Product updated successfully!", [
        { text: "OK", onPress: () => {
          setShowEditModal(false)
          fetchProduct()
        }}
      ])
    } catch (error) {
      console.error(error)
      Alert.alert("Error", error?.message || "Failed to update product")
    }
  }

  // Handle product deletion
  const handleDeleteProduct = async () => {
    try {
      const response = await fetch(`${apiUrl}/deleteProduct?id=${productId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert("Success", "Product deleted successfully!", [
          { 
            text: "OK", 
            onPress: () => {
              setShowDeleteModal(false)
              navigation.goBack()
            }
          }
        ])
      } else {
        Alert.alert("Error", data.message || "Something went wrong.")
      }
    } catch (error) {
      console.error(error)
      Alert.alert("Error", "Failed to delete product.")
    }
  }

  // Handle variant actions
  const handleEditVariant = (variant) => {
    setSelectedVariant(variant)
    setEditFormData({
      sku: variant.sku,
      label: variant.label,
      type: variant.type,
      stock: variant.stock.toString(),
      spoiled: variant.spoiled.toString(),
      name: variant.names || []
    })
    
    // Load variations for selected type
    const selectedCategory = categories.find(c => c.name === variant.type)
    if (selectedCategory) {
      setVariations(selectedCategory.variations || [])
    }

    
    setShowEditVariantModal(true)
  }

  const handleUpdateVariant = async () => {
    try {
      const res = await fetch(`${apiUrl}/updateItem`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: productId,
          sku: selectedVariant.sku,
          ...editFormData
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "There was an issue updating the item")
      }

      Alert.alert("Success", "Variant updated successfully!", [
        { text: "OK", onPress: () => {
          setShowEditVariantModal(false)
          fetchProduct()
        }}
      ])
    } catch (error) {
      console.error(error)
      Alert.alert("Error", error?.message || "Failed to update variant")
    }
  }

  const handleAddVariant = async () => {
    try {
      const response = await fetch(`${apiUrl}/addItem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          id: productId, 
          ...addFormData 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert("Success", "Variant added successfully!", [
          { text: "OK", onPress: () => {
            setShowAddVariantModal(false)
            fetchProduct()
          }}
        ])
      } else {
        Alert.alert("Error", data?.message || "Something went wrong.")
      }
    } catch (error) {
      console.error(error)
      Alert.alert("Error", error?.message || "Something went wrong.")
    }
  }

  const handleDeleteVariant = async (variant) => {
    Alert.alert(
      "Delete Variant",
      `Are you sure you want to delete variant ${variant.sku}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${apiUrl}/deleteItem?id=${productId}&sku=${variant.sku}`, {
                method: "DELETE",
              })

              const data = await response.json()

              if (response.ok) {
                Alert.alert("Success", "Item deleted successfully!")
                fetchProduct()
              } else {
                Alert.alert("Error", data.message || "Something went wrong.")
              }
            } catch (error) {
              console.error(error)
              Alert.alert("Error", "Failed to delete item.")
            }
          }
        }
      ]
    )
  }

  // Handle image upload
  const handleImageUpload = async () => {
    // This is a placeholder - you'll need to implement actual image upload
    // For React Native, you might use expo-image-picker or react-native-image-picker
    Alert.alert("Info", "Image upload functionality would be implemented here")
  }

  // Render Info Item component
  const InfoItem = ({ label, value, icon = null, color = COLORS.text }) => (
    <View style={styles.infoItem}>
      <View style={styles.infoItemHeader}>
        {icon && (
          <Ionicons name={icon} size={16} color={color} style={styles.infoItemIcon} />
        )}
        <Text style={styles.infoItemLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoItemValue, { color }]}>{value || "N/A"}</Text>
    </View>
  )

  // Render modal
  const renderModal = (title, content, actions) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showEditModal || showDeleteModal || showAddVariantModal || showEditVariantModal}
      onRequestClose={() => {
        setShowEditModal(false)
        setShowDeleteModal(false)
        setShowAddVariantModal(false)
        setShowEditVariantModal(false)
      }}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{
                translateY: modalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })
              }],
              opacity: modalAnim
            }
          ]}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowEditModal(false)
                  setShowDeleteModal(false)
                  setShowAddVariantModal(false)
                  setShowEditVariantModal(false)
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {content}
            
            <View style={styles.modalActions}>
              {actions}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )

  // Edit Product Modal Content
  const editProductContent = product && (
    <View style={styles.formContainer}>
      {/* Image Upload Section */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Product Images</Text>
        <Text style={styles.formHint}>Current images:</Text>
        {existingImages.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
            <View style={styles.imagePreviews}>
              {existingImages.map((url, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: url }} style={styles.imagePreviewImage} />
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.noImagesText}>No images available</Text>
        )}
        
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleImageUpload}
        >
          <Ionicons name="cloud-upload" size={20} color={COLORS.primary} />
          <Text style={styles.uploadButtonText}>Upload New Images</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Product Name</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter product name"
          defaultValue={product.name}
          onChangeText={(text) => handleInfoChange("name", text)}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.formInput, { height: 80 }]}
          placeholder="Enter product description"
          defaultValue={product.description}
          multiline
          numberOfLines={3}
          onChangeText={(text) => handleInfoChange("description", text)}
        />
      </View>
      
      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Buying Price (KES)</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Buying price"
            defaultValue={product.buying_price?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => handleInfoChange("buying_price", text)}
          />
        </View>
        
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Profit in {product.profit_in}</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Enter profit"
            defaultValue={product.profit?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => handleInfoChange("profit", text)}
          />
        </View>
      </View>
      
      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Add On (KES)</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Add on"
            defaultValue={product.addOn?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => handleInfoChange("addOn", text)}
          />
        </View>
        
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Selling Price (KES)</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Selling price"
            defaultValue={product.selling_price?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => handleInfoChange("selling_price", text)}
          />
        </View>
      </View>
      
      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Market Price (KES)</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Market price"
            defaultValue={product.market_price?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => handleInfoChange("market_price", text)}
          />
        </View>
        
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Unit</Text>
          <View style={styles.selectContainer}>
            {['pcs', 'kg', 'ml'].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.selectOption,
                  editInfoData.unit === unit || (!editInfoData.unit && product.unit === unit) 
                    ? styles.selectOptionActive 
                    : {}
                ]}
                onPress={() => handleInfoChange("unit", unit)}
              >
                <Text style={[
                  styles.selectOptionText,
                  editInfoData.unit === unit || (!editInfoData.unit && product.unit === unit)
                    ? styles.selectOptionTextActive
                    : {}
                ]}>
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  )

  const editProductActions = (
    <>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setShowEditModal(false)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleUpdateProduct}
      >
        <Text style={styles.confirmButtonText}>Update Product</Text>
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
      </TouchableOpacity>
    </>
  )

  // Delete Product Modal Content
  const deleteProductContent = product && (
    <View style={styles.deleteWarning}>
      <Ionicons name="warning" size={60} color="#F44336" />
      <Text style={styles.warningTitle}>Delete Product?</Text>
      <Text style={styles.warningText}>
        Are you sure you want to delete {product.name}? This action cannot be undone. All variants and associated data will be permanently removed.
      </Text>
    </View>
  )

  const deleteProductActions = (
    <>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setShowDeleteModal(false)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: "#F44336" }]}
        onPress={handleDeleteProduct}
      >
        <Text style={styles.confirmButtonText}>Delete Product</Text>
        <Ionicons name="trash" size={20} color="#fff" />
      </TouchableOpacity>
    </>
  )

  // Add Variant Modal Content
  const addVariantContent = (
    <View style={styles.formContainer}>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Label/Variant Name</Text>
        <TextInput
          style={styles.formInput}
          placeholder="e.g., Black, Large, etc."
          onChangeText={(text) => handleAddChange("label", text)}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Category</Text>
        <View style={styles.selectGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.selectOption,
                addFormData.type === category.name ? styles.selectOptionActive : {}
              ]}
              onPress={() => handleAddSelectChange(category.name, "type")}
            >
              <Text style={[
                styles.selectOptionText,
                addFormData.type === category.name ? styles.selectOptionTextActive : {}
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {variations.length > 0 && (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Variations/Tags</Text>
          <View style={styles.selectGrid}>
            {variations.map((variation, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectOption,
                  Array.isArray(addFormData.name) && addFormData.name.includes(variation)
                    ? styles.selectOptionActive
                    : {}
                ]}
                onPress={() => {
                  const current = Array.isArray(addFormData.name) ? addFormData.name : []
                  const updated = current.includes(variation)
                    ? current.filter(v => v !== variation)
                    : [...current, variation]
                  handleAddChange("name", updated)
                }}
              >
                <Text style={[
                  styles.selectOptionText,
                  Array.isArray(addFormData.name) && addFormData.name.includes(variation)
                    ? styles.selectOptionTextActive
                    : {}
                ]}>
                  {variation}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Initial Stock</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Stock amount"
            keyboardType="numeric"
            onChangeText={(text) => handleAddChange("stock", text)}
          />
        </View>
        
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Spoiled</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Spoiled amount"
            keyboardType="numeric"
            onChangeText={(text) => handleAddChange("spoiled", text)}
          />
        </View>
      </View>
    </View>
  )

  const addVariantActions = (
    <>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setShowAddVariantModal(false)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleAddVariant}
      >
        <Text style={styles.confirmButtonText}>Add Variant</Text>
        <Ionicons name="add-circle" size={20} color="#fff" />
      </TouchableOpacity>
    </>
  )

  // Edit Variant Modal Content
  const editVariantContent = selectedVariant && (
    <View style={styles.formContainer}>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>SKU</Text>
        <Text style={styles.formValue}>{selectedVariant.sku}</Text>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Label/Variant Name</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Label"
          value={editFormData.label}
          onChangeText={(text) => handleEditChange("label", text)}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Category</Text>
        <View style={styles.selectGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.selectOption,
                editFormData.type === category.name ? styles.selectOptionActive : {}
              ]}
              onPress={() => handleSelectChange(category.name, "type")}
            >
              <Text style={[
                styles.selectOptionText,
                editFormData.type === category.name ? styles.selectOptionTextActive : {}
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* {variations.length > 0 && ( */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Variations/Tags</Text>
          <View style={styles.selectGrid}>
            {variations.map((variation, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectOption,
                  Array.isArray(editFormData.name) && editFormData.name.includes(variation)
                    ? styles.selectOptionActive
                    : {}
                ]}
                onPress={() => {
                  const current = Array.isArray(editFormData.name) ? editFormData.name : []
                  const updated = current.includes(variation)
                    ? current.filter(v => v !== variation)
                    : [...current, variation]
                  handleEditChange("name", updated)
                }}
              >
                <Text style={[
                  styles.selectOptionText,
                  Array.isArray(editFormData.name) && editFormData.name.includes(variation)
                    ? styles.selectOptionTextActive
                    : {}
                ]}>
                  {variation}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      {/* )} */}
      
      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Stock</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Stock"
            value={editFormData.stock}
            keyboardType="numeric"
            onChangeText={(text) => handleEditChange("stock", text)}
          />
        </View>
        
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Spoiled</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Spoiled"
            value={editFormData.spoiled}
            keyboardType="numeric"
            onChangeText={(text) => handleEditChange("spoiled", text)}
          />
        </View>
      </View>
    </View>
  )

  const editVariantActions = selectedVariant && (
    <>
      <TouchableOpacity
        style={[styles.cancelButton, { backgroundColor: "#f5f5f5" }]}
        onPress={() => setShowEditVariantModal(false)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: "#FF9800" }]}
        onPress={handleUpdateVariant}
      >
        <Text style={styles.confirmButtonText}>Update Variant</Text>
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
      </TouchableOpacity>
    </>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </SafeAreaView>
    )
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#FF9800" />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorText}>The product you're looking for doesn't exist or has been deleted.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back to Products</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Back Button */}
        <Animated.View 
          style={[
            styles.header,
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
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={28} color={COLORS.white} />
              </TouchableOpacity>
              
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>{product.name}</Text>
                <Text style={styles.headerSubtitle}>Product Details</Text>
              </View>
              
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.headerActionButton}
                  onPress={() => setShowEditModal(true)}
                >
                  <Ionicons name="create-outline" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerActionButton}
                  onPress={() => setShowDeleteModal(true)}
                >
                  <Ionicons name="trash-outline" size={22} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Product Images Carousel */}
        <Animated.View 
          style={[
            styles.imageSection,
            {
              opacity: contentAnim,
              transform: [{
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.mainImageContainer}>
            {product.images && product.images.length > 0 ? (
              <Image
                source={{
                  uri: convertCloudinaryUrlToPng(product.images[activeImageIndex]) || 'https://via.placeholder.com/150',
                }}
                style={styles.mainImage}
              />
            ) : (
              <View style={styles.noImage}>
                <Ionicons name="cube" size={80} color={COLORS.textLight} />
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}
          </View>
          
          {/* Image Thumbnails */}
          {product.images && product.images.length > 1 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailsContainer}
            >
              <View style={styles.thumbnails}>
                {product.images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.thumbnail,
                      activeImageIndex === index && styles.thumbnailActive
                    ]}
                    onPress={() => setActiveImageIndex(index)}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.thumbnailImage}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </Animated.View>

        {/* Product Summary Cards */}
        <Animated.View 
          style={[
            styles.summaryCards,
            {
              opacity: contentAnim,
              transform: [{
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: "rgba(76, 175, 80, 0.1)" }]}>
                <Ionicons name="cube" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.summaryNumber}>{totalStock}</Text>
              <Text style={styles.summaryLabel}>Total Stock</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: "rgba(244, 67, 54, 0.1)" }]}>
                <Ionicons name="alert-circle" size={24} color="#F44336" />
              </View>
              <Text style={styles.summaryNumber}>{totalSpoiled}</Text>
              <Text style={styles.summaryLabel}>Spoiled</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: "rgba(33, 150, 243, 0.1)" }]}>
                <Ionicons name="trending-up" size={24} color="#2196F3" />
              </View>
              <Text style={styles.summaryNumber}>{profitPercentage}%</Text>
              <Text style={styles.summaryLabel}>Profit Margin</Text>
            </View>
          </View>
        </Animated.View>

        {/* Product Information */}
        <Animated.View 
          style={[
            styles.infoSection,
            {
              opacity: contentAnim,
              transform: [{
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [70, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Product Information</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <InfoItem 
              label="Product Name" 
              value={product.name} 
              icon="cube"
            />
            <InfoItem 
              label="Description" 
              value={product.description} 
              icon="document-text"
            />
            <InfoItem 
              label="Unit" 
              value={product.unit} 
              icon="scale"
            />
            <InfoItem 
              label="Status" 
              value={product.status} 
              icon="checkmark-circle"
              color={product.status === "active" ? "#4CAF50" : "#9E9E9E"}
            />
          </View>
        </Animated.View>

        {/* Pricing Information */}
        <Animated.View 
          style={[
            styles.infoSection,
            {
              opacity: contentAnim,
              transform: [{
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [80, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Pricing Information</Text>
          </View>
          
          <View style={styles.pricingGrid}>
            <InfoItem 
              label="Buying Price" 
              value={formatCurrency(product.buying_price)} 
              icon="arrow-down-circle"
              color="#F44336"
            />
            <InfoItem 
              label="Selling Price" 
              value={formatCurrency(product.selling_price)} 
              icon="arrow-up-circle"
              color="#4CAF50"
            />
            <InfoItem 
              label="Market Price" 
              value={formatCurrency(product.market_price)} 
              icon="pricetag"
              color="#2196F3"
            />
            <InfoItem 
              label="Add On" 
              value={formatCurrency(Number(product.addOn))} 
              icon="add-circle"
              color="#FF9800"
            />
            <InfoItem 
              label="Profit" 
              value={formatCurrency(product.profit)} 
              icon="trending-up"
              color="#9C27B0"
            />
            <InfoItem 
              label="Profit in" 
              value={product.profit_in} 
              icon="percentage"
              color="#9C27B0"
            />
          </View>
        </Animated.View>

        {/* Timeline Information */}
        <Animated.View 
          style={[
            styles.infoSection,
            {
              opacity: contentAnim,
              transform: [{
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [90, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Timeline</Text>
          </View>
          
          <View style={styles.timeline}>
            {product.createdAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, { backgroundColor: "rgba(201, 70, 238, 0.1)" }]}>
                  <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineAction}>Product Created</Text>
                  <Text style={styles.timelineTime}>{formatDate(product.createdAt)}</Text>
                </View>
              </View>
            )}
            
            {product.updatedAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, { backgroundColor: "rgba(33, 150, 243, 0.1)" }]}>
                  <Ionicons name="create" size={20} color="#2196F3" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineAction}>Last Updated</Text>
                  <Text style={styles.timelineTime}>{formatDate(product.updatedAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Variants Section */}
        <Animated.View 
          style={[
            styles.variantsSection,
            {
              opacity: contentAnim,
              transform: [{
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="layers" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Product Variants ({product.variants?.length || 0})</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddVariantModal(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>Add Variant</Text>
            </TouchableOpacity>
          </View>
          
          {product.variants?.map((variant, index) => {
            const stockLevel = getStockLevel(variant.stock)
            return (
              <TouchableOpacity
                key={variant.sku || index}
                style={styles.variantCard}
                onPress={() => handleEditVariant(variant)}
                activeOpacity={0.7}
              >
                <View style={styles.variantHeader}>
                  <View style={styles.variantInfo}>
                    <Text style={styles.variantSku}>{variant.sku}</Text>
                    <Text style={styles.variantLabel}>{variant.label}</Text>
                  </View>
                  
                  <View style={[styles.stockBadge, { backgroundColor: stockLevel.color + "20" }]}>
                    <Ionicons 
                      name={variant.stock <= 10 ? "alert-circle" : "cube"} 
                      size={16} 
                      color={stockLevel.color} 
                    />
                    <Text style={[styles.stockText, { color: stockLevel.color }]}>
                      {variant.stock} units
                    </Text>
                  </View>
                </View>
                
                <View style={styles.variantDetails}>
                  <View style={styles.variantDetailItem}>
                    <Ionicons name="pricetag" size={16} color={COLORS.textLight} />
                    <Text style={styles.variantDetailText}>{variant.type}</Text>
                  </View>
                  
                  <View style={styles.variantDetailItem}>
                    <Ionicons name="alert-circle" size={16} color="#F44336" />
                    <Text style={[styles.variantDetailText, { color: "#F44336" }]}>
                      Spoiled: {variant.spoiled}
                    </Text>
                  </View>
                </View>
                
                {variant.names && variant.names.length > 0 && (
                  <View style={styles.variantTags}>
                    {variant.names.slice(0, 2).map((tag, idx) => (
                      <View key={idx} style={styles.variantTag}>
                        <Text style={styles.variantTagText}>{tag}</Text>
                      </View>
                    ))}
                    {variant.names.length > 2 && (
                      <View style={[styles.variantTag, { backgroundColor: "rgba(201, 70, 238, 0.1)" }]}>
                        <Text style={[styles.variantTagText, { color: COLORS.primary }]}>
                          +{variant.names.length - 2}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                
                <View style={styles.variantActions}>
                  <TouchableOpacity 
                    style={styles.variantActionButton}
                    onPress={() => handleEditVariant(variant)}
                  >
                    <Ionicons name="create" size={16} color={COLORS.primary} />
                    <Text style={[styles.variantActionText, { color: COLORS.primary }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.variantActionButton, { backgroundColor: "#f5f5f5" }]}
                    onPress={() => handleDeleteVariant(variant)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                    <Text style={[styles.variantActionText, { color: "#F44336" }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )
          })}
        </Animated.View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Render Modals */}
      {showEditModal && renderModal("Edit Product", editProductContent, editProductActions)}
      {showDeleteModal && renderModal("Delete Product", deleteProductContent, deleteProductActions)}
      {showAddVariantModal && renderModal("Add New Variant", addVariantContent, addVariantActions)}
      {showEditVariantModal && selectedVariant && renderModal("Edit Variant", editVariantContent, editVariantActions)}
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
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    fontFamily: "Montserrat-Regular",
    marginBottom: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    position: "relative",
    marginBottom: 20,
  },
  headerGradient: {
    height: 160,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    fontFamily: "Montserrat-Bold",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Montserrat-Regular",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mainImageContainer: {
    width: "100%",
    height: 250,
    borderRadius: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  noImageText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  thumbnailsContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  thumbnails: {
    flexDirection: "row",
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbnailActive: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  summaryCards: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 2,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
  },
  infoSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "column",
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
    gap: 16,
  },
  infoItem: {
    marginBottom: 12,
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
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  infoItemValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
    fontFamily: "Montserrat-SemiBold",
  },
  pricingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineContent: {
    flex: 1,
  },
  timelineAction: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  variantsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    margin: "auto",
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  variantCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  variantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  variantInfo: {
    flex: 1,
  },
  variantSku: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    marginBottom: 4,
  },
  variantLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
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
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  variantDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  variantDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  variantDetailText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  variantTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  variantTag: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  variantTagText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
  },
  variantActions: {
    flexDirection: "row",
    gap: 12,
  },
  variantActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "rgba(201, 70, 238, 0.1)",
  },
  variantActionText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  bottomSpacing: {
    height: 30,
  },
  // Modal Styles
  modalOverlay: {
    flex: 10,
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 8,
  },
  formHint: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
  },
  formValue: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
    paddingVertical: 12,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
  },
  selectContainer: {
    flexDirection: "row",
    gap: 8,
  },
  selectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  selectOptionActive: {
    backgroundColor: COLORS.primary,
  },
  selectOptionText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
  },
  selectOptionTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(201, 70, 238, 0.1)",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  uploadButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  imagePreviewContainer: {
    marginBottom: 8,
  },
  imagePreviews: {
    flexDirection: "row",
    gap: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  imagePreviewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noImagesText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: "Montserrat-Regular",
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 30,
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
    fontSize: 14,
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
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  deleteWarning: {
    alignItems: "center",
    padding: 40,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    marginTop: 20,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
    lineHeight: 24,
  },
})