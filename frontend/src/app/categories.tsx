import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { apiCall } from '../lib/api';
import ProductCard, { Product } from './productcard';
import { COLORS, SHADOWS } from '../constants/theme';

type Cat = { id: string; name: string; count: number; stock_total: number };

const CATEGORY_META: Record<string, { emoji: string; bg: string; color: string; desc: string }> = {
  'Sport & Tactical': { emoji: '🏃‍♂️', bg: '#E0F2FE', color: '#0284C7', desc: 'ทนแรงกระแทก กันน้ำลึก เหมาะสำหรับสายลุยและเดินป่า' },
  'Smartwatch': { emoji: '⚡', bg: '#EDE9FE', color: '#7C3AED', desc: 'เชื่อมต่อมือถือ วัดสุขภาพ นับก้าวและออกซิเจนในเลือด' },
  'Vintage Retro': { emoji: '📻', bg: '#FEF3C7', color: '#D97706', desc: 'ดีไซน์เรโทรเหนือกาลเวลา ยุค 80s ทรงสี่เหลี่ยมคลาสสิก' },
  'Casual LED': { emoji: '💡', bg: '#ECFDF5', color: '#059669', desc: 'ไฟหน้าปัดดิจิตอล สวมใส่ง่าย เข้ากับทุกไลฟ์สไตล์ประจำวัน' },
  'Luxury Digital': { emoji: '💎', bg: '#FCE7F3', color: '#DB2777', desc: 'วัสดุไทเทเนียมและเซรามิก หน้าจอ OLED ความละเอียดสูง' },
};

export default function CategoriesScreen({
  products,
  isAdmin = false,
}: {
  products: Product[];
  isAdmin?: boolean;
}) {
  const [categories, setCategories] = useState<Cat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadCategories = useCallback(() => {
    setIsLoading(true);
    apiCall('/categories')
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        const catMap = new Map<string, { count: number; stock_total: number }>();
        products.forEach((p) => {
          const c = p.category || 'Casual LED';
          const existing = catMap.get(c) || { count: 0, stock_total: 0 };
          catMap.set(c, {
            count: existing.count + 1,
            stock_total: existing.stock_total + (Number(p.stock) || 0),
          });
        });

        const list = Array.from(catMap.entries()).map(([name, stat]) => ({
          id: name,
          name,
          count: stat.count,
          stock_total: stat.stock_total,
        }));
        setCategories(list);
      })
      .finally(() => setIsLoading(false));
  }, [products]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const categoryProducts = selectedCategory === null
    ? []
    : products.filter((p) => (p.category?.trim() || 'Casual LED') === selectedCategory);

  if (selectedCategory !== null) {
    const meta = CATEGORY_META[selectedCategory] || { emoji: '⌚', bg: '#F1F5F9', color: '#64748B', desc: '' };
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.container}>
          <Pressable onPress={() => setSelectedCategory(null)} style={styles.backButton}>
            <Text style={styles.backText}>‹ กลับไปดูหมวดหมู่ทั้งหมด</Text>
          </Pressable>

          <View style={styles.catHeaderBox}>
            <View style={[styles.catIconBoxBig, { backgroundColor: meta.bg }]}>
              <Text style={{ fontSize: 32 }}>{meta.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{selectedCategory}</Text>
              <Text style={styles.subtitle}>{meta.desc}</Text>
            </View>
          </View>

          <FlatList
            data={categoryProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => <ProductCard product={item} isAdmin={isAdmin} />}
            ListEmptyComponent={
              <View style={styles.messageState}>
                <Text style={styles.emptyText}>ไม่มีสินค้านาฬิกาในหมวดหมู่นี้</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>หมวดหมู่นาฬิกาดิจิตอล</Text>
        <Text style={styles.subtitle}>จำแนกตามประเภทการใช้งาน สไตล์ และเทคโนโลยี</Text>

        {isLoading ? (
          <View style={styles.messageState}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>กำลังโหลดหมวดหมู่...</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => {
              const meta = CATEGORY_META[item.name] || { emoji: '⌚', bg: '#F1F5F9', color: '#475569', desc: 'นาฬิกาข้อมือดิจิตอล' };
              return (
                <Pressable
                  style={({ pressed }) => [styles.categoryCard, pressed && styles.cardPressed]}
                  onPress={() => setSelectedCategory(item.name)}
                >
                  <View style={[styles.categoryIconBox, { backgroundColor: meta.bg }]}>
                    <Text style={{ fontSize: 28 }}>{meta.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Text style={styles.categoryDesc} numberOfLines={1}>{meta.desc}</Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.categoryStats, { color: meta.color }]}>
                        {item.count} รุ่นสินค้า
                      </Text>
                      <Text style={styles.dotSeparator}>•</Text>
                      <Text style={styles.stockStats}>สต็อกรวม {item.stock_total} เรือน</Text>
                    </View>
                  </View>
                  <Text style={styles.arrowText}>›</Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 14 },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.99 }],
  },
  categoryIconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  categoryDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  categoryStats: { fontSize: 12, fontWeight: '800' },
  dotSeparator: { fontSize: 10, color: '#CBD5E1' },
  stockStats: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  arrowText: { fontSize: 22, color: '#94A3B8', fontWeight: '800' },
  listContent: { paddingBottom: 28 },
  messageState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontWeight: '600' },
  backButton: { marginBottom: 14, alignSelf: 'flex-start' },
  backText: { color: '#4F46E5', fontSize: 14, fontWeight: '800' },
  catHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  catIconBoxBig: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
});
