import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import ProductCard, { Product } from './productcard';
import { COLORS, SHADOWS } from '../constants/theme';

const CATEGORIES = [
  { label: 'ทั้งหมด', value: 'All', icon: '🌐' },
  { label: 'Sport & Tactical', value: 'Sport & Tactical', icon: '🏃‍♂️' },
  { label: 'Smartwatch', value: 'Smartwatch', icon: '⚡' },
  { label: 'Vintage Retro', value: 'Vintage Retro', icon: '📻' },
  { label: 'Casual LED', value: 'Casual LED', icon: '💡' },
  { label: 'Luxury Digital', value: 'Luxury Digital', icon: '💎' },
];

const TIER_FILTERS = [
  { label: 'ทุกช่วงราคา', value: 'All' },
  { label: '🟢 Low Tier', value: 'Low' },
  { label: '🔵 Mid Tier', value: 'Mid' },
  { label: '🟡 High Tier', value: 'High' },
];

export default function ProductsScreen({
  products,
  isLoading,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  onEdit,
  onDelete,
  onAddToCart,
  onBuyNow,
  isAdmin = false,
  deletingProductId,
}: {
  products: Product[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onEdit?: (p: Product) => void;
  onDelete?: (p: Product) => void;
  onAddToCart?: (p: Product) => void;
  onBuyNow?: (p: Product) => void;
  isAdmin?: boolean;
  deletingProductId?: string | null;
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) {
      return false;
    }
    if (selectedTier !== 'All' && p.priceTier !== selectedTier) {
      return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>คลังนาฬิกา GUWATCH888</Text>
            <Text style={styles.headerSubtitle}>
              Luxury Digital Timepieces & AI Price Intelligence
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredProducts.length} เรือน</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="ค้นหารุ่นนาฬิกา, รหัส SKU, แบรนด์ หรือฟังก์ชัน..."
              placeholderTextColor="#64748B"
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Horizontal Chips */}
        <View style={styles.categoryChipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsList}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.value;
              return (
                <Pressable
                  key={cat.value}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.value)}
                >
                  <Text style={styles.chipIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* K-Means Tier Filter Quick Filter */}
        <View style={styles.tierFilterRow}>
          <Text style={styles.tierFilterLabel}>AI คลัสเตอร์ราคา:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierChipsList}>
            {TIER_FILTERS.map((tf) => {
              const active = selectedTier === tf.value;
              return (
                <Pressable
                  key={tf.value}
                  style={[styles.tierChip, active && styles.tierChipActive]}
                  onPress={() => setSelectedTier(tf.value)}
                >
                  <Text style={[styles.tierChipText, active && styles.tierChipTextActive]}>
                    {tf.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Product Cards List */}
        {isLoading && !isRefreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#00F2FE" />
            <Text style={styles.loadingText}>กำลังเชื่อมต่อคลังสินค้าจาก MySQL...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                isAdmin={isAdmin}
                isDeleting={deletingProductId === item.id}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 44, marginBottom: 8 }}>⌚</Text>
                <Text style={styles.emptyTitle}>ไม่พบนาฬิกาตามเงื่อนไขที่เลือก</Text>
                <Text style={styles.emptySubtitle}>
                  ลองพิมพ์ค้นหาด้วยคำอื่น หรือเลือกตัวกรองหมวดหมู่ "ทั้งหมด"
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#00F2FE',
    marginTop: 2,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#00F2FE',
    fontSize: 12,
    fontWeight: '800',
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1424',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#F8FAFC',
    padding: 0,
  },
  clearIcon: {
    color: '#64748B',
    fontSize: 14,
    paddingLeft: 8,
  },
  categoryChipsContainer: {
    marginBottom: 8,
  },
  categoryChipsList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#0E1424',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: '#00F2FE',
  },
  chipIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#00F2FE',
    fontWeight: '800',
  },
  tierFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tierFilterLabel: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 8,
    fontWeight: '700',
  },
  tierChipsList: {
    gap: 6,
  },
  tierChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0E1424',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tierChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
  },
  tierChipText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tierChipTextActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
});
