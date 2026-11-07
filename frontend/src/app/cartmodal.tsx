import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CartItem } from '../lib/cart';
import { apiCall } from '../lib/api';

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'success';
type PaymentMethod = 'promptpay' | 'credit' | 'bank' | 'cod';

export default function CartModal({
  visible,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderPlaced?: (order: any) => void;
  user?: any;
}) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Shipping Form State
  const [customerName, setCustomerName] = useState(user?.username || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [shippingNote, setShippingNote] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const shippingFee = subtotal > 0 ? 0 : 0; // FREE Express Shipping
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'GU888VIP' || code === 'GU888' || code === 'DISCOUNT10') {
      setDiscountPercent(10);
      setPromoMessage('✅ ส่วนลด VIP 10% ประยุกต์ใช้สำเร็จ!');
    } else if (code === 'KU67' || code === 'SRIRACHA') {
      setDiscountPercent(15);
      setPromoMessage('✅ โค้ดส่วนลดนักศึกษา KU ศรีราชา 15% สำเร็จ!');
    } else {
      setDiscountPercent(0);
      setPromoMessage('❌ โค้ดส่วนลดไม่ถูกต้อง (ลองใช้: GU888VIP หรือ SRIRACHA)');
    }
  };

  const handleNextToShipping = () => {
    if (items.length === 0) {
      if (Platform.OS === 'web') alert('ไม่มีสินค้าในตะกร้า');
      return;
    }
    setStep('shipping');
  };

  const handleNextToPayment = () => {
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      const msg = 'กรุณากรอกชื่อผู้รับ, เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบถ้วน';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('ข้อมูลไม่ครบถ้วน', msg);
      return;
    }
    setStep('payment');
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderPayload = {
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
        shipping_address: `${address.trim()}${shippingNote ? ` (หมายเหตุ: ${shippingNote.trim()})` : ''}`,
        payment_method: paymentMethod,
        user_id: user?.user_id || null,
        items: items.map((it) => ({
          product_code: it.product.id,
          name: it.product.name,
          price: it.product.price,
          quantity: it.quantity,
        })),
      };

      const res = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (res?.success) {
        setCompletedOrder(res);
        setStep('success');
        onClearCart();
        if (onOrderPlaced) onOrderPlaced(res);
      } else {
        throw new Error(res?.error || 'ไม่สามารถบันทึกคำสั่งซื้อได้');
      }
    } catch (e: any) {
      const err = e.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ';
      if (Platform.OS === 'web') alert(err);
      else Alert.alert('ข้อผิดพลาด', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setStep('cart');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCloseModal}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseModal} />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brandTitle}>GUWATCH888</Text>
              <Text style={styles.headerSub}>
                {step === 'cart' && `ตะกร้าสินค้า (${items.length} รายการ)`}
                {step === 'shipping' && 'ข้อมูลการจัดส่งสินค้า'}
                {step === 'payment' && 'เลือกช่องทางชำระเงิน'}
                {step === 'success' && 'คำสั่งซื้อเสร็จสมบูรณ์'}
              </Text>
            </View>

            <Pressable style={styles.closeBtn} onPress={handleCloseModal}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Step Progress Bar */}
          <View style={styles.stepperRow}>
            <View style={[styles.stepDot, step === 'cart' && styles.stepDotActive, (step === 'shipping' || step === 'payment' || step === 'success') && styles.stepDotDone]}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <View style={[styles.stepLine, (step === 'shipping' || step === 'payment' || step === 'success') && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 'shipping' && styles.stepDotActive, (step === 'payment' || step === 'success') && styles.stepDotDone]}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <View style={[styles.stepLine, (step === 'payment' || step === 'success') && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 'payment' && styles.stepDotActive, step === 'success' && styles.stepDotDone]}>
              <Text style={styles.stepNum}>3</Text>
            </View>
          </View>

          {/* ================= STEP 1: CART ================= */}
          {step === 'cart' && (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {items.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Text style={{ fontSize: 50, marginBottom: 12 }}>🛒</Text>
                  <Text style={styles.emptyCartTitle}>ตะกร้าสินค้าว่างเปล่า</Text>
                  <Text style={styles.emptyCartSub}>เลือกนาฬิกาดิจิตอลเรือนโปรดของคุณใน GUWATCH888 แล้วกดใส่ตะกร้าได้เลยครับ</Text>
                </View>
              ) : (
                <>
                  {items.map((it) => (
                    <View key={it.product.id} style={styles.cartItemCard}>
                      <View style={styles.itemImageCard}>
                        {it.product.image_url ? (
                          <Image source={{ uri: it.product.image_url }} style={styles.itemImage} resizeMode="cover" />
                        ) : (
                          <Text style={{ fontSize: 24 }}>⌚</Text>
                        )}
                      </View>

                      <View style={styles.itemDetails}>
                        <Text style={styles.itemSku}>#{it.product.id}</Text>
                        <Text style={styles.itemName} numberOfLines={1}>{it.product.name}</Text>
                        <Text style={styles.itemPrice}>฿{Number(it.product.price).toLocaleString()} / เรือน</Text>

                        {/* Quantity Counter */}
                        <View style={styles.qtyRow}>
                          <View style={styles.qtyControls}>
                            <Pressable style={styles.qtyBtn} onPress={() => onUpdateQty(it.product.id, it.quantity - 1)}>
                              <Text style={styles.qtyBtnText}>-</Text>
                            </Pressable>
                            <Text style={styles.qtyValue}>{it.quantity}</Text>
                            <Pressable style={styles.qtyBtn} onPress={() => onUpdateQty(it.product.id, it.quantity + 1)}>
                              <Text style={styles.qtyBtnText}>+</Text>
                            </Pressable>
                          </View>

                          <Pressable style={styles.removeItemBtn} onPress={() => onRemoveItem(it.product.id)}>
                            <Text style={styles.removeItemText}>🗑️ นำออก</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}

                  {/* Promo Code Box */}
                  <View style={styles.promoBox}>
                    <Text style={styles.promoLabel}>🎁 โค้ดส่วนลดพิเศษ (Promo Code)</Text>
                    <View style={styles.promoInputRow}>
                      <TextInput
                        style={styles.promoInput}
                        value={promoCode}
                        onChangeText={setPromoCode}
                        placeholder="กรอก GU888VIP หรือ SRIRACHA"
                        placeholderTextColor="#64748B"
                        autoCapitalize="characters"
                      />
                      <Pressable style={styles.applyBtn} onPress={applyPromo}>
                        <Text style={styles.applyBtnText}>ใช้โค้ด</Text>
                      </Pressable>
                    </View>
                    {promoMessage && <Text style={styles.promoMsg}>{promoMessage}</Text>}
                  </View>

                  {/* Price Summary */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>ราคารวมสินค้า ({items.reduce((s, i) => s + i.quantity, 0)} เรือน)</Text>
                      <Text style={styles.summaryVal}>฿{subtotal.toLocaleString()}</Text>
                    </View>

                    {discountAmount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: '#34D399' }]}>ส่วนลดพิเศษ ({discountPercent}%)</Text>
                        <Text style={[styles.summaryVal, { color: '#34D399' }]}>-฿{discountAmount.toLocaleString()}</Text>
                      </View>
                    )}

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>ค่าจัดส่งด่วนพิเศษ (Express Delivery)</Text>
                      <Text style={[styles.summaryVal, { color: '#00F2FE' }]}>ฟรี (Free)</Text>
                    </View>

                    <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                      <Text style={styles.totalLabel}>ยอดรวมสุทธิทั้งสิ้น</Text>
                      <Text style={styles.totalVal}>฿{grandTotal.toLocaleString()}</Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          )}

          {/* ================= STEP 2: SHIPPING ================= */}
          {step === 'shipping' && (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>📍 ที่อยู่สำหรับการจัดส่งด่วน</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ชื่อ-นามสกุล ผู้รับพัสดุ *</Text>
                  <TextInput
                    style={styles.input}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="เช่น คุณสมชาย ดิจิตอล"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>เบอร์โทรศัพท์ติดต่อ *</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="เช่น 081-234-5678"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ที่อยู่จัดส่งอย่างละเอียด *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="เลขที่, หมู่บ้าน/อาคาร, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด และรหัสไปรษณีย์"
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>หมายเหตุถึงพนักงานจัดส่ง (ไม่บังคับ)</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingNote}
                    onChangeText={setShippingNote}
                    placeholder="เช่น วางไว้หน้าบ้าน, โทรแจ้งก่อนส่ง"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>ยอดรวมที่ต้องชำระ</Text>
                  <Text style={styles.totalValSmall}>฿{grandTotal.toLocaleString()}</Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* ================= STEP 3: PAYMENT ================= */}
          {step === 'payment' && (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formSectionTitle}>💳 เลือกวิธีชำระเงินที่ต้องการ</Text>

              {/* PromptPay */}
              <Pressable
                style={[styles.payOptionCard, paymentMethod === 'promptpay' && styles.payOptionCardActive]}
                onPress={() => setPaymentMethod('promptpay')}
              >
                <View style={styles.payOptionHeader}>
                  <View style={styles.payRadio}>
                    {paymentMethod === 'promptpay' && <View style={styles.payRadioInner} />}
                  </View>
                  <Text style={styles.payOptionTitle}>📱 พร้อมเพย์ (PromptPay QR Code)</Text>
                  <Text style={styles.payBadge}>แนะนำ</Text>
                </View>
                <Text style={styles.payOptionSub}>สแกนจ่ายได้ทุกแอปธนาคาร ยืนยันยอดทันที ไม่มีค่าธรรมเนียม</Text>

                {paymentMethod === 'promptpay' && (
                  <View style={styles.promptpayBox}>
                    <View style={styles.qrCard}>
                      {/* Realistic PromptPay Header & QR Visual */}
                      <View style={styles.qrHeader}>
                        <Text style={styles.qrBrand}>PromptPay • พร้อมเพย์</Text>
                      </View>
                      <Image
                        source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GUWATCH888_PROMPTPAY_ORDER_PORT3108' }}
                        style={styles.qrImage}
                      />
                      <Text style={styles.qrScanInstruct}>สแกนเพื่อชำระเงิน ฿{grandTotal.toLocaleString()}</Text>
                      <Text style={styles.qrAccountName}>บัญชี: บจก. กียูวอทช์ 888 (ไทยแลนด์)</Text>
                    </View>
                  </View>
                )}
              </Pressable>

              {/* Credit Card */}
              <Pressable
                style={[styles.payOptionCard, paymentMethod === 'credit' && styles.payOptionCardActive]}
                onPress={() => setPaymentMethod('credit')}
              >
                <View style={styles.payOptionHeader}>
                  <View style={styles.payRadio}>
                    {paymentMethod === 'credit' && <View style={styles.payRadioInner} />}
                  </View>
                  <Text style={styles.payOptionTitle}>💳 บัตรเครดิต / เดบิต (VISA, Mastercard, JCB)</Text>
                </View>
                <Text style={styles.payOptionSub}>ระบบความปลอดภัยระดับสากล 3D Secure 256-bit</Text>
              </Pressable>

              {/* Bank Transfer */}
              <Pressable
                style={[styles.payOptionCard, paymentMethod === 'bank' && styles.payOptionCardActive]}
                onPress={() => setPaymentMethod('bank')}
              >
                <View style={styles.payOptionHeader}>
                  <View style={styles.payRadio}>
                    {paymentMethod === 'bank' && <View style={styles.payRadioInner} />}
                  </View>
                  <Text style={styles.payOptionTitle}>🏦 โอนผ่านบัญชีธนาคาร (Bank Transfer)</Text>
                </View>
                <Text style={styles.payOptionSub}>ธนาคารกสิกรไทย (KBANK) • เลขที่ 123-4-56789-0</Text>
              </Pressable>

              {/* COD */}
              <Pressable
                style={[styles.payOptionCard, paymentMethod === 'cod' && styles.payOptionCardActive]}
                onPress={() => setPaymentMethod('cod')}
              >
                <View style={styles.payOptionHeader}>
                  <View style={styles.payRadio}>
                    {paymentMethod === 'cod' && <View style={styles.payRadioInner} />}
                  </View>
                  <Text style={styles.payOptionTitle}>💵 ชำระเงินปลายทาง (Cash on Delivery)</Text>
                </View>
                <Text style={styles.payOptionSub}>ชำระเงินกับพนักงานจัดส่งเมื่อได้รับนาฬิกาเรียบร้อยแล้ว</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* ================= STEP 4: SUCCESS ================= */}
          {step === 'success' && completedOrder && (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <Text style={{ fontSize: 40 }}>✅</Text>
                </View>
                <Text style={styles.successTitle}>สั่งซื้อสินค้าสำเร็จแล้ว!</Text>
                <Text style={styles.successSub}>
                  ข้อมูลคำสั่งซื้อถูกบันทึกลงในฐานข้อมูล MySQL <Text style={{ color: '#00F2FE' }}>ip_std6730251468</Text> เรียบร้อยแล้ว
                </Text>

                {/* Digital Invoice Slip */}
                <View style={styles.receiptCard}>
                  <View style={styles.receiptTopRow}>
                    <Text style={styles.receiptBrand}>GUWATCH888 OFFICIAL RECEIPT</Text>
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>PAID / ชำระแล้ว</Text>
                    </View>
                  </View>

                  <View style={styles.receiptLine} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>หมายเลขคำสั่งซื้อ:</Text>
                    <Text style={styles.receiptValHighlight}>{completedOrder.order_no}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>ผู้รับพัสดุ:</Text>
                    <Text style={styles.receiptVal}>{completedOrder.customer_name}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>ช่องทางชำระเงิน:</Text>
                    <Text style={styles.receiptVal}>{paymentMethod.toUpperCase()}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>เวลาที่บันทึกคำสั่งซื้อ:</Text>
                    <Text style={styles.receiptVal}>{new Date().toLocaleTimeString('th-TH')}</Text>
                  </View>

                  <View style={styles.receiptLine} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabelTotal}>ยอดชำระสุทธิทั้งสิ้น:</Text>
                    <Text style={styles.receiptValTotal}>฿{Number(completedOrder.total_amount).toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.trackingHintCard}>
                  <Text style={styles.trackingHintTitle}>🚚 การจัดส่งสินค้าด่วน:</Text>
                  <Text style={styles.trackingHintText}>• สินค้าจะถูกแพ็กและตัดสต็อกจากคลังทันที</Text>
                  <Text style={styles.trackingHintText}>• รับประกันของแท้ 100% พร้อมใบรับประกันในกล่อง</Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer Controls */}
          <View style={styles.footer}>
            {step === 'cart' && (
              <Pressable
                style={[styles.primaryActionBtn, items.length === 0 && styles.btnDisabled]}
                disabled={items.length === 0}
                onPress={handleNextToShipping}
              >
                <Text style={styles.primaryActionText}>
                  ดำเนินการสั่งซื้อ (฿{grandTotal.toLocaleString()}) ›
                </Text>
              </Pressable>
            )}

            {step === 'shipping' && (
              <View style={styles.navBtnRow}>
                <Pressable style={styles.backBtn} onPress={() => setStep('cart')}>
                  <Text style={styles.backBtnText}>‹ กลับไปตะกร้า</Text>
                </Pressable>
                <Pressable style={styles.primaryActionBtnFlex} onPress={handleNextToPayment}>
                  <Text style={styles.primaryActionText}>ไปขั้นตอนชำระเงิน ›</Text>
                </Pressable>
              </View>
            )}

            {step === 'payment' && (
              <View style={styles.navBtnRow}>
                <Pressable style={styles.backBtn} onPress={() => setStep('shipping')}>
                  <Text style={styles.backBtnText}>‹ กลับไปแก้ไขที่อยู่</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryActionBtnFlex, isSubmitting && styles.btnDisabled]}
                  disabled={isSubmitting}
                  onPress={handleConfirmOrder}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#07090E" />
                  ) : (
                    <Text style={styles.primaryActionText}>ยืนยันการชำระเงิน ฿{grandTotal.toLocaleString()} ✓</Text>
                  )}
                </Pressable>
              </View>
            )}

            {step === 'success' && (
              <Pressable style={styles.primaryActionBtn} onPress={handleCloseModal}>
                <Text style={styles.primaryActionText}>กลับสู่หน้าเลือกซื้อนาฬิกา GUWATCH888</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#0E1424',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00F2FE',
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#080C16',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#00F2FE',
  },
  stepDotDone: {
    backgroundColor: '#10B981',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#07090E',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#1E293B',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  scrollBody: {
    padding: 18,
    maxHeight: 460,
  },
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptyCartSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#131B30',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  itemImageCard: {
    width: 70,
    height: 70,
    backgroundColor: '#070A12',
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemSku: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FBBF24',
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0F1D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyBtnText: {
    color: '#00F2FE',
    fontSize: 14,
    fontWeight: '900',
  },
  qtyValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
  removeItemBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeItemText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  promoBox: {
    backgroundColor: '#131B30',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  promoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  applyBtn: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: '#00F2FE',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#00F2FE',
    fontSize: 12,
    fontWeight: '800',
  },
  promoMsg: {
    fontSize: 11,
    marginTop: 6,
    color: '#34D399',
  },
  summaryCard: {
    backgroundColor: '#131B30',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 0,
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FBBF24',
  },
  totalValSmall: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FBBF24',
  },
  formSection: {
    marginBottom: 10,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#131B30',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  payOptionCard: {
    backgroundColor: '#131B30',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  payOptionCardActive: {
    borderColor: '#00F2FE',
    backgroundColor: '#111A30',
  },
  payOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  payRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#00F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  payRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F2FE',
  },
  payOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    flex: 1,
  },
  payBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  payOptionSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 28,
  },
  promptpayBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    maxWidth: 260,
  },
  qrHeader: {
    backgroundColor: '#00427A',
    width: '100%',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  qrBrand: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  qrImage: {
    width: 170,
    height: 170,
    marginBottom: 8,
  },
  qrScanInstruct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrAccountName: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  successSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 18,
    marginBottom: 16,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#131B30',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    marginBottom: 16,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptBrand: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00F2FE',
  },
  paidBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  receiptLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  receiptVal: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  receiptValHighlight: {
    fontSize: 13,
    color: '#FBBF24',
    fontWeight: '900',
  },
  receiptLabelTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  receiptValTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FBBF24',
  },
  trackingHintCard: {
    width: '100%',
    backgroundColor: '#090E1A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackingHintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
  },
  trackingHintText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#080C16',
  },
  primaryActionBtn: {
    backgroundColor: '#00F2FE',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionBtnFlex: {
    flex: 1,
    backgroundColor: '#00F2FE',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#07090E',
    fontSize: 14,
    fontWeight: '900',
  },
  navBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
