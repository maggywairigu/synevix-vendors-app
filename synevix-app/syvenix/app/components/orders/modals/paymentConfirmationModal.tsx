// app/components/modals/PaymentConfirmationModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/Colors';

interface PaymentConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  order: any;
  onComplete: (paymentDetails: {
    method: 'cash' | 'mpesa';
    transactionCode?: string;
    amount: string;
    notes?: string;
  }) => void;
}

export default function PaymentConfirmationModal({ 
  visible, 
  onClose, 
  order, 
  onComplete 
}: PaymentConfirmationModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('mpesa');
  const [transactionCode, setTransactionCode] = useState('');
  const [amount, setAmount] = useState(order?.pendingAmount?.replace('KES ', '') || order?.amount?.replace('KES ', '') || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    if (paymentMethod === 'mpesa' && !transactionCode.trim()) {
      Alert.alert('Error', 'Please enter the M-Pesa transaction code');
      return;
    }

    if (paymentMethod === 'mpesa' && !/^[A-Z0-9]{8,15}$/.test(transactionCode)) {
      Alert.alert('Error', 'Please enter a valid transaction code (8-15 alphanumeric characters)');
      return;
    }

    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const paymentDetails = {
        method: paymentMethod,
        transactionCode: paymentMethod === 'mpesa' ? transactionCode.toUpperCase() : undefined,
        amount: `KES ${amount}`,
        notes: notes.trim() || undefined,
      };
      
      onComplete(paymentDetails);
      setLoading(false);
      
      // Reset form
      setTransactionCode('');
      setNotes('');
    }, 1500);
  };

  const handleQuickAmount = (percentage: number) => {
    const total = parseFloat(order?.amount?.replace('KES ', '').replace(',', '') || '0');
    const pending = parseFloat(order?.pendingAmount?.replace('KES ', '').replace(',', '') || total.toString());
    
    if (percentage === 100) {
      setAmount(pending.toString());
    } else {
      const calculatedAmount = (pending * percentage / 100).toFixed(0);
      setAmount(calculatedAmount);
    }
  };

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
                <Text style={styles.modalTitle}>Confirm Payment</Text>
                <Text style={styles.modalSubtitle}>Complete payment for {order?.id}</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Order ID:</Text>
                  <Text style={styles.summaryValue}>{order?.id}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Customer:</Text>
                  <Text style={styles.summaryValue}>{order?.customerName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shelf:</Text>
                  <Text style={styles.summaryValue}>{order?.shelfId}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount:</Text>
                  <Text style={styles.summaryValue}>{order?.amount}</Text>
                </View>
                {order?.pendingAmount && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Pending Amount:</Text>
                    <Text style={[styles.summaryValue, styles.pendingAmount]}>
                      {order.pendingAmount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethods}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'mpesa' && styles.paymentMethodButtonActive,
                  ]}
                  onPress={() => setPaymentMethod('mpesa')}
                >
                  <View style={styles.paymentMethodContent}>
                    <View style={[styles.paymentMethodIcon, { backgroundColor: paymentMethod === 'mpesa' ? 'rgba(201, 70, 238, 0.1)' : '#f5f5f5' }]}>
                      <Ionicons 
                        name="phone-portrait" 
                        size={24} 
                        color={paymentMethod === 'mpesa' ? COLORS.primary : COLORS.textLight} 
                      />
                    </View>
                    <View style={styles.paymentMethodTextContainer}>
                      <Text style={[
                        styles.paymentMethodText,
                        paymentMethod === 'mpesa' && styles.paymentMethodTextActive,
                      ]}>
                        M-Pesa
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        Mobile money payment
                      </Text>
                    </View>
                  </View>
                  {paymentMethod === 'mpesa' && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'cash' && styles.paymentMethodButtonActive,
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <View style={styles.paymentMethodContent}>
                    <View style={[styles.paymentMethodIcon, { backgroundColor: paymentMethod === 'cash' ? 'rgba(201, 70, 238, 0.1)' : '#f5f5f5' }]}>
                      <Ionicons 
                        name="cash" 
                        size={24} 
                        color={paymentMethod === 'cash' ? COLORS.primary : COLORS.textLight} 
                      />
                    </View>
                    <View style={styles.paymentMethodTextContainer}>
                      <Text style={[
                        styles.paymentMethodText,
                        paymentMethod === 'cash' && styles.paymentMethodTextActive,
                      ]}>
                        Cash
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        Physical cash payment
                      </Text>
                    </View>
                  </View>
                  {paymentMethod === 'cash' && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>KES</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textLight}
                  editable={!loading}
                />
              </View>
              
              {/* Quick Amount Buttons */}
              {order?.pendingAmount && (
                <View style={styles.quickAmountContainer}>
                  <Text style={styles.quickAmountLabel}>Quick Select:</Text>
                  <View style={styles.quickAmountButtons}>
                    {[25, 50, 75, 100].map((percentage) => (
                      <TouchableOpacity
                        key={percentage}
                        style={styles.quickAmountButton}
                        onPress={() => handleQuickAmount(percentage)}
                        disabled={loading}
                      >
                        <Text style={styles.quickAmountText}>{percentage}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Transaction Code for M-Pesa */}
            {paymentMethod === 'mpesa' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>M-Pesa Transaction Code</Text>
                <View style={styles.transactionInputContainer}>
                  <Ionicons name="key" size={20} color={COLORS.textLight} style={styles.transactionIcon} />
                  <TextInput
                    style={styles.transactionInput}
                    value={transactionCode}
                    onChangeText={(text) => setTransactionCode(text.toUpperCase())}
                    placeholder="Enter transaction code"
                    placeholderTextColor={COLORS.textLight}
                    autoCapitalize="characters"
                    editable={!loading}
                  />
                </View>
                <Text style={styles.helperText}>
                  Example: MPX1234ABCD, OLX5678EFGH
                </Text>
              </View>
            )}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <View style={styles.notesInputContainer}>
                <Ionicons name="document-text" size={20} color={COLORS.textLight} style={styles.notesIcon} />
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about this payment..."
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.completeButton, loading && styles.completeButtonDisabled]}
              onPress={handleComplete}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#CCCCCC', '#BBBBBB'] : [COLORS.primary, '#D663F6']}
                style={styles.completeButtonGradient}
              >
                {loading ? (
                  <Ionicons name="refresh" size={20} color={COLORS.white} style={{ transform: [{ rotate: '0deg' }] }} />
                ) : (
                  <Ionicons name="checkmark" size={20} color={COLORS.white} />
                )}
                <Text style={styles.completeButtonText}>
                  {loading ? 'Processing...' : 'Complete Payment'}
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
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: 500,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 12,
  },
  orderSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Regular',
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    fontFamily: 'Montserrat-SemiBold',
  },
  pendingAmount: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(201, 70, 238, 0.05)',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodTextContainer: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 2,
  },
  paymentMethodTextActive: {
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Regular',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Montserrat-SemiBold',
  },
  quickAmountContainer: {
    marginTop: 8,
  },
  quickAmountLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 8,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: 'rgba(201, 70, 238, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  transactionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  transactionIcon: {
    marginRight: 8,
  },
  transactionInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Montserrat-Regular',
    letterSpacing: 1,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: 'Montserrat-Regular',
    marginTop: 4,
    marginLeft: 4,
  },
  notesInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
  },
  notesIcon: {
    marginTop: 4,
    marginRight: 8,
  },
  notesInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Montserrat-Regular',
    textAlignVertical: 'top',
    minHeight: 80,
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
  completeButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
});