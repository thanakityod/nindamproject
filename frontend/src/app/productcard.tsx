import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getProductStatus } from '../lib/product-status';
import { PRICE_TIER_COLORS } from '../lib/kmeans';
import { COLORS, SHADOWS } from '../constants/theme';

export type Product = {
  id: string;
  name: string;
  details?: string;
  price: number | string;
  monthly_sales?: number;
  color?: string;
  size?: string;
  category: string;
  stock: number;
  stock_text?: string;
  location_count?: number;
  location_text?: string;
  image_url: string;
  product_link?: string;
  priceTier?: 'Low' | 'Mid' | 'High';
};

export const CATEGORY_STYLE: Record<string, { bg: string; fg: string; border: string; icon: string }> = {
  'Sport & Tactical': { bg: 'rgba(2, 132, 199, 0.15)', fg: '#38BDF8', border: 'rgba(56, 189, 248, 0.3)', icon: '🏃‍♂️' },
  'Smartwatch': { bg: 'rgba(124, 58, 237, 0.15)', fg: '#A78BFA', border: 'rgba(167, 139, 250, 0.3)', icon: '⚡' },
  'Vintage Retro': { bg: 'rgba(217, 119, 6, 0.15)', fg: '#FBBF24', border: 'rgba(251, 191, 36, 0.3)', icon: '📻' },
  'Casual LED': { bg: 'rgba(5, 150, 105, 0.15)', fg: '#34D399', border: 'rgba(52, 211, 153, 0.3)', icon: '💡' },
  'Luxury Digital': { bg: 'rgba(219, 39, 119, 0.15)', fg: '#F472B6', border: 'rgba(244, 114, 182, 0.3)', icon: '💎' },
};

export const STATUS_STYLE: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  'In Stock': { bg: 'rgba(16, 185, 129, 0.15)', fg: '#34D399', dot: '#10B981', label: 'มีสินค้าพร้อมส่ง' },
  'Low Stock': { bg: 'rgba(245, 158, 11, 0.15)', fg: '#FBBF24', dot: '#F59E0B', label: 'สินค้าใกล้หมด' },
  'Out of Stock': { bg: 'rgba(239, 68, 68, 0.15)', fg: '#F87171', dot: '#EF4444', label: 'สินค้าหมดชั่วคราว' },
};

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  onAddToCart,
  onBuyNow,
  isDeleting = false,
  isAdmin = false,
}: {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  isDeleting?: boolean;
  isAdmin?: boolean;
}) {
  const cat = CATEGORY_STYLE[product.category] || { bg: 'rgba(100, 116, 139, 0.15)', fg: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)', icon: '⌚' };
  const derivedStatus = getProductStatus(product.stock);
  const status = STATUS_STYLE[derivedStatus] || STATUS_STYLE['In Stock'];
  const [detailVisible, setDetailVisible] = useState(false);

  const canEdit = isAdmin && !!onEdit;
  const canDelete = isAdmin && !!onDelete;
  const isOutOfStock = Number(product.stock) <= 0;

  const handleDeletePress = () => {
    if (!canDelete || !onDelete) return;

    const message = `คุณต้องการลบ "${product.name}" ออกจากคลังสินค้าหรือไม่?`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        onDelete(product);
      }
      return;
    }

    Alert.alert('ยืนยันการลบสินค้า', message, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบสินค้า', style: 'destructive', onPress: () => onDelete(product) },
    ]);
  };

  const tier = product.priceTier;
  const tierColor = tier ? PRICE_TIER_COLORS[tier] : null;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.productCard, pressed && styles.cardPressed]}
        onPress={() => setDetailVisible(true)}
      >
        {/* Watch Image Box with Cyber Glow */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={{ fontSize: 40 }}>⌚</Text>
            </View>
          )}

          {/* Top Floating Badges */}
          <View style={styles.imageOverlayTop}>
            <View style={[styles.categoryTag, { backgroundColor: cat.bg, borderColor: cat.border }]}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryText, { color: cat.fg }]}>{product.category}</Text>
            </View>

            <View style={[styles.stockDotBadge, { backgroundColor: status.bg, borderColor: status.dot }]}>
              <View style={[styles.microDot, { backgroundColor: status.dot }]} />
              <Text style={[styles.stockDotText, { color: status.fg }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {/* Content Info */}
        <View style={styles.infoContainer}>
          <View style={styles.topMetaRow}>
            <Text style={styles.brandTag}>GUWATCH888 • OFFICIAL</Text>
            <Text style={styles.skuText}>#{product.id}</Text>
          </View>

          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>

          <Text style={styles.productDetails} numberOfLines={2}>
            {product.details || 'สุดยอดนาฬิกาดิจิตอลฟังก์ชันระดับไฮเอนด์ ระบบกันน้ำและจับเวลาละเอียด'}
          </Text>

          {/* Price & Badges Row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>ราคาพิเศษ</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.currencySymbol}>฿</Text>
                <Text style={styles.priceNumber}>
                  {Number(product.price || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {tierColor && (
              <View
                style={[
                  styles.aiTierBadge,
                  { backgroundColor: tierColor.bg, borderColor: tierColor.border },
                ]}
              >
                <Text style={styles.aiTierIcon}>🤖</Text>
                <Text style={[styles.aiTierText, { color: tierColor.fg }]}>
                  {tierColor.shortLabel}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Commerce Action Buttons */}
          <View style={styles.actionButtonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.addToCartBtn,
                isOutOfStock && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              disabled={isOutOfStock}
              onPress={(e) => {
                e.stopPropagation();
                if (onAddToCart) onAddToCart(product);
              }}
            >
              <Text style={styles.addToCartText}>🛒 ใส่ตะกร้า</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.buyNowBtn,
                isOutOfStock && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              disabled={isOutOfStock}
              onPress={(e) => {
                e.stopPropagation();
                if (onBuyNow) onBuyNow(product);
              }}
            >
              <Text style={styles.buyNowText}>⚡ ซื้อทันที</Text>
            </Pressable>
          </View>
        </View>

        {/* Admin Quick Action Controls */}
        {isAdmin && (
          <View style={styles.adminActions}>
            {canEdit && (
              <Pressable
                style={styles.adminIconBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit!(product);
                }}
                hitSlop={6}
              >
                <Text style={styles.btnIcon}>✏️</Text>
              </Pressable>
            )}
            {canDelete && (
              <Pressable
                style={[styles.adminIconBtn, isDeleting && styles.disabledBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeletePress();
                }}
                hitSlop={6}
              >
                <Text style={styles.btnIcon}>🗑️</Text>
              </Pressable>
            )}
          </View>
        )}
      </Pressable>

      {/* Product Detail Modal */}
      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetailVisible(false)} />
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={[styles.categoryTag, { backgroundColor: cat.bg, borderColor: cat.border }]}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryText, { color: cat.fg }]}>{product.category}</Text>
                </View>
                <Pressable
                  style={styles.closeCircle}
                  onPress={() => setDetailVisible(false)}
                  hitSlop={10}
                >
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalBrand}>GUWATCH888 • OFFICIAL BOUTIQUE</Text>
              <Text style={styles.modalTitle}>{product.name}</Text>
              <Text style={styles.modalSubSKU}>รหัสสินค้า (Product SKU): {product.id}</Text>

              {/* Watch Hero Image */}
              <View style={styles.modalImageCard}>
                {product.image_url ? (
                  <Image
                    source={{ uri: product.image_url }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 64 }}>⌚</Text>
                )}
              </View>

              {/* Price Banner with Gold Glow */}
              <View style={styles.modalPriceCard}>
                <View>
                  <Text style={styles.priceLabelText}>ราคาจำหน่ายสุทธิ (รวมภาษี)</Text>
                  <Text style={styles.modalPriceBig}>
                    ฿{Number(product.price || 0).toLocaleString()}
                  </Text>
                </View>

                {tierColor && (
                  <View
                    style={[
                      styles.modalTierPill,
                      { backgroundColor: tierColor.bg, borderColor: tierColor.border },
                    ]}
                  >
                    <Text style={styles.modalTierLabel}>AI Price Tier</Text>
                    <Text style={[styles.modalTierValue, { color: tierColor.fg }]}>
                      {tierColor.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* E-Commerce Benefits Banner */}
              <View style={styles.benefitsRow}>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>🛡️</Text>
                  <Text style={styles.benefitText}>ประกันศูนย์แท้ 2 ปี</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>⚡</Text>
                  <Text style={styles.benefitText}>ส่งด่วนฟรี 24 ชม.</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>💎</Text>
                  <Text style={styles.benefitText}>ของแท้ 100%</Text>
                </View>
              </View>

              {/* Specs Grid */}
              <Text style={styles.modalSectionTitle}>ข้อมูลจำเพาะและคลังสินค้า</Text>
              <View style={styles.specGrid}>
                <View style={styles.specBox}>
                  <Text style={styles.specKey}>📦 จำนวนสต็อก</Text>
                  <Text style={[styles.specVal, { color: status.fg }]}>
                    {product.stock} เรือน ({status.label})
                  </Text>
                </View>

                <View style={styles.specBox}>
                  <Text style={styles.specKey}>🎨 สี / วัสดุ</Text>
                  <Text style={styles.specVal}>{product.color || 'Standard Resin'}</Text>
                </View>

                <View style={styles.specBox}>
                  <Text style={styles.specKey}>📐 ขนาดตัวเรือน</Text>
                  <Text style={styles.specVal}>{product.size || 'Standard Size'}</Text>
                </View>

                <View style={styles.specBox}>
                  <Text style={styles.specKey}>🏬 คลังจัดเก็บสินค้า</Text>
                  <Text style={styles.specVal}>{product.location_text || 'Warehouse Sriracha'}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.modalSectionTitle}>รายละเอียดสินค้า</Text>
              <View style={styles.descBox}>
                <Text style={styles.modalDescription}>
                  {product.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer with Cart Actions */}
            <View style={styles.modalFooter}>
              <View style={styles.modalCommerceRow}>
                <Pressable
                  style={[styles.modalAddToCartBtn, isOutOfStock && styles.btnDisabled]}
                  disabled={isOutOfStock}
                  onPress={() => {
                    setDetailVisible(false);
                    if (onAddToCart) onAddToCart(product);
                  }}
                >
                  <Text style={styles.modalAddToCartText}>🛒 เพิ่มลงในตะกร้า</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalBuyNowBtn, isOutOfStock && styles.btnDisabled]}
                  disabled={isOutOfStock}
                  onPress={() => {
                    setDetailVisible(false);
                    if (onBuyNow) onBuyNow(product);
                  }}
                >
                  <Text style={styles.modalBuyNowText}>⚡ ซั่งซื้อทันที</Text>
                </Pressable>
              </View>

              {isAdmin && (
                <View style={styles.adminModalRow}>
                  <Pressable
                    style={styles.modalEditBtn}
                    onPress={() => {
                      setDetailVisible(false);
                      onEdit?.(product);
                    }}
                  >
                    <Text style={styles.modalEditBtnText}>✏️ แก้ไขสินค้าใน MySQL</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalDelBtn}
                    onPress={() => {
                      setDetailVisible(false);
                      handleDeletePress();
                    }}
                  >
                    <Text style={styles.modalDelBtnText}>🗑️ ลบ</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#0E1424',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  imageContainer: {
    height: 180,
    backgroundColor: '#070A12',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  microDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stockDotText: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoContainer: {
    padding: 16,
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTag: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  skuText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F59E0B',
    marginRight: 3,
  },
  priceNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: -0.5,
  },
  aiTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  aiTierIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  aiTierText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '700',
  },
  buyNowBtn: {
    flex: 1,
    backgroundColor: '#00F2FE',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  buyNowText: {
    color: '#07090E',
    fontSize: 13,
    fontWeight: '800',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    opacity: 0.4,
  },
  adminActions: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  adminIconBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnIcon: {
    fontSize: 13,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: '#0E1424',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  modalScroll: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBrand: {
    color: '#00F2FE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  modalSubSKU: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  modalImageCard: {
    height: 240,
    backgroundColor: '#070A12',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalPriceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131B30',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  priceLabelText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  modalPriceBig: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FBBF24',
  },
  modalTierPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalTierLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: 2,
  },
  modalTierValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  benefitText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 10,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  specBox: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#131B30',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  specKey: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  descBox: {
    backgroundColor: '#131B30',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalDescription: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0A0F1D',
  },
  modalCommerceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  modalAddToCartBtn: {
    flex: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalAddToCartText: {
    color: '#22D3EE',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBuyNowBtn: {
    flex: 1,
    backgroundColor: '#00F2FE',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBuyNowText: {
    color: '#07090E',
    fontSize: 14,
    fontWeight: '900',
  },
  adminModalRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalEditBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalEditBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  modalDelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDelBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
