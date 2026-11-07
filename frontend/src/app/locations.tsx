import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Product } from './productcard';
import { COLORS, SHADOWS } from '../constants/theme';

const WAREHOUSES = [
  {
    name: 'Warehouse Sriracha',
    location: 'วิทยาเขตศรีราชา ชลบุรี',
    type: 'คลังสินค้าหลัก (Main Hub)',
    icon: '🏬',
    accent: '#4F46E5',
    bg: '#EEF2FF',
  },
  {
    name: 'Central Store BKK',
    location: 'เซ็นทรัลเวิลด์ กรุงเทพฯ',
    type: 'หน้าร้าน Flagship Store',
    icon: '🏢',
    accent: '#0284C7',
    bg: '#E0F2FE',
  },
  {
    name: 'Outlet Zone Chonburi',
    location: 'เอาท์เล็ทมอลล์ ชลบุรี',
    type: 'ศูนย์กระจายสินค้าภาคตะวันออก',
    icon: '📦',
    accent: '#059669',
    bg: '#ECFDF5',
  },
];

export default function LocationsScreen({ products }: { products: Product[] }) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>คลังจัดเก็บและสาขาจำหน่าย</Text>
        <Text style={styles.subtitle}>ระบบติดตามสต็อกนาฬิกาตามสถานที่จัดเก็บจริง</Text>

        <FlatList
          data={WAREHOUSES}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{ gap: 14, paddingTop: 10, paddingBottom: 28 }}
          renderItem={({ item }) => {
            const count = products.filter((p) => p.location_text === item.name).length;
            const stockTotal = products
              .filter((p) => p.location_text === item.name)
              .reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

            return (
              <View style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                  <Text style={{ fontSize: 32 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: item.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: item.accent }]}>
                        {item.type}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardLocation}>📍 {item.location}</Text>

                  <View style={styles.statPills}>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillNumber}>{count}</Text>
                      <Text style={styles.statPillLabel}>รุ่นนาฬิกา</Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={[styles.statPillNumber, { color: '#059669' }]}>
                        {stockTotal}
                      </Text>
                      <Text style={styles.statPillLabel}>เรือนในสต็อก</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800' },
  cardLocation: { fontSize: 12, color: '#64748B', marginTop: 3 },
  statPills: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statPillNumber: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  statPillLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
});
