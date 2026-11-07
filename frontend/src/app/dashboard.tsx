import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiCall } from '../lib/api';

type ClusterSummary = {
  cluster: 'low' | 'medium' | 'high';
  product_count: number;
  average_price: number | string;
  min_price: number | string;
  max_price: number | string;
  average_monthly_sales: number | string;
  total_monthly_sales: number | string;
};

type ClusterProduct = {
  id: string;
  cluster: 'low' | 'medium' | 'high';
  price: number | string;
  monthly_sales: number | string;
};

type ClusterResponse = {
  generated_at: string | null;
  clusters: ClusterSummary[];
  products: ClusterProduct[];
};

const CLUSTER_STYLE = {
  low: {
    label: '🟢 Low Tier (กลุ่มราคาประหยัด)',
    bg: 'rgba(16, 185, 129, 0.12)',
    fg: '#34D399',
    border: 'rgba(16, 185, 129, 0.3)',
    barColor: '#10B981',
    desc: 'นาฬิกาฟังก์ชันพื้นฐาน จับเวลา ไฟ LED ราคาคุ้มค่า',
  },
  medium: {
    label: '🔵 Mid Tier (กลุ่มมาตรฐาน)',
    bg: 'rgba(56, 189, 248, 0.12)',
    fg: '#38BDF8',
    border: 'rgba(56, 189, 248, 0.3)',
    barColor: '#00F2FE',
    desc: 'สมาร์ทวอทช์ & สปอร์ตเซนเซอร์ วัดหัวใจและก้าวเดิน',
  },
  high: {
    label: '🟡 High Tier (กลุ่มพรีเมียม / ลักชูรี)',
    bg: 'rgba(245, 158, 11, 0.15)',
    fg: '#FBBF24',
    border: 'rgba(245, 158, 11, 0.4)',
    barColor: '#F59E0B',
    desc: 'ตัวเรือนไทเทเนียม / โซลาร์เซลล์ GPS ระดับไฮเอนด์',
  },
};

export default function DashboardScreen() {
  const [data, setData] = useState<ClusterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isPull = false) => {
    if (isPull) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall('/clusters');
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถโหลดข้อมูล AI คลัสเตอร์ได้');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00F2FE" />
        <Text style={styles.loadingText}>กำลังประมวลผล K-Means Price Clustering...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>ไม่สามารถแสดงแดชบอร์ดได้</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => loadDashboard()}>
          <Text style={styles.retryButtonText}>ลองใหม่อีกครั้ง</Text>
        </Pressable>
      </View>
    );
  }

  const clusters = data?.clusters ?? [];
  const products = data?.products ?? [];
  const totalItems = products.length;
  const totalSales = clusters.reduce((sum, c) => sum + Number(c.total_monthly_sales || 0), 0);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadDashboard(true)} tintColor="#00F2FE" />}
    >
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTag}>GUWATCH888 • AI ANALYTICS</Text>
          <Text style={styles.headerTitle}>AI / ML Price Clustering</Text>
          <Text style={styles.headerSubtitle}>
            การจัดกลุ่มราคานาฬิกาดิจิตอลด้วย K-Means Machine Learning
          </Text>
        </View>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>🤖 K-Means v2.0</Text>
        </View>
      </View>

      {/* Top Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>สินค้าที่จัดกลุ่ม</Text>
          <Text style={styles.metricValue}>{totalItems}</Text>
          <Text style={styles.metricSub}>นาฬิกาในคลัง</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>กลุ่มราคา AI</Text>
          <Text style={styles.metricValue}>{clusters.length}</Text>
          <Text style={styles.metricSub}>Low, Mid, High</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>ยอดขายรวมเฉลี่ย</Text>
          <Text style={[styles.metricValue, { color: '#FBBF24' }]}>
            {totalSales.toLocaleString()}
          </Text>
          <Text style={styles.metricSub}>เรือน / เดือน</Text>
        </View>
      </View>

      {/* Distribution Progress Bar */}
      <View style={styles.distCard}>
        <Text style={styles.distTitle}>สัดส่วนจำนวนสินค้ารายกลุ่มราคา</Text>
        <View style={styles.barTrack}>
          {clusters.map((c) => {
            const widthPct = totalItems > 0 ? (c.product_count / totalItems) * 100 : 0;
            const styleInfo = CLUSTER_STYLE[c.cluster] || CLUSTER_STYLE.low;
            if (widthPct === 0) return null;
            return (
              <View
                key={c.cluster}
                style={{
                  width: `${widthPct}%`,
                  height: 12,
                  backgroundColor: styleInfo.barColor,
                }}
              />
            );
          })}
        </View>
        <View style={styles.legendRow}>
          {clusters.map((c) => {
            const styleInfo = CLUSTER_STYLE[c.cluster] || CLUSTER_STYLE.low;
            const pct = totalItems > 0 ? Math.round((c.product_count / totalItems) * 100) : 0;
            return (
              <View key={c.cluster} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: styleInfo.barColor }]} />
                <Text style={styles.legendLabel}>
                  {c.cluster.toUpperCase()} ({pct}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Cluster Detailed Cards */}
      <Text style={styles.sectionHeaderTitle}>รายละเอียดผลการแบ่งกลุ่มราคา (Price Tiers)</Text>
      <View style={styles.clusterGrid}>
        {clusters.map((item) => {
          const style = CLUSTER_STYLE[item.cluster] || CLUSTER_STYLE.low;
          return (
            <View
              key={item.cluster}
              style={[
                styles.clusterCard,
                { backgroundColor: style.bg, borderColor: style.border },
              ]}
            >
              <View style={styles.clusterCardHeader}>
                <View>
                  <Text style={[styles.clusterName, { color: style.fg }]}>{style.label}</Text>
                  <Text style={styles.clusterDesc}>{style.desc}</Text>
                </View>
                <View style={[styles.clusterCountBadge, { backgroundColor: style.barColor }]}>
                  <Text style={styles.clusterCountText}>{item.product_count} รุ่น</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>ราคาเฉลี่ย</Text>
                  <Text style={[styles.statValue, { color: style.fg }]}>
                    ฿{Math.round(Number(item.average_price)).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>ช่วงราคา</Text>
                  <Text style={styles.statSubValue}>
                    ฿{Number(item.min_price).toLocaleString()} - ฿{Number(item.max_price).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>ยอดขาย/เดือน</Text>
                  <Text style={styles.statSubValue}>
                    {Number(item.total_monthly_sales).toLocaleString()} เรือน
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Clustered Products Table */}
      <View style={styles.productsSection}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>รายการสินค้าและกลุ่มราคาที่กำหนดโดย AI</Text>
          <Text style={styles.tableSubtitle}>
            อัปเดตล่าสุด: {data?.generated_at ? new Date(data.generated_at).toLocaleString('th-TH') : 'เรียลไทม์'}
          </Text>
        </View>

        <View style={styles.productsTable}>
          {products.map((p) => {
            const style = CLUSTER_STYLE[p.cluster] || CLUSTER_STYLE.low;
            return (
              <View key={p.id} style={styles.tableRow}>
                <View>
                  <Text style={styles.productCode}>{p.id}</Text>
                  <Text style={styles.productSales}>
                    ยอดขาย ~{Number(p.monthly_sales).toLocaleString()} เรือน/เดือน
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.productPrice}>฿{Number(p.price).toLocaleString()}</Text>
                  <View style={[styles.tierPill, { backgroundColor: style.bg, borderColor: style.border }]}>
                    <Text style={[styles.tierPillText, { color: style.fg }]}>
                      {p.cluster.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07090E' },
  container: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#07090E' },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 14 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: '#EF4444', marginBottom: 6 },
  errorText: { color: '#94A3B8', textAlign: 'center', marginBottom: 14 },
  retryButton: { backgroundColor: '#00F2FE', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryButtonText: { color: '#07090E', fontWeight: '800' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTag: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  aiBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: '#00F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiBadgeText: { color: '#00F2FE', fontSize: 11, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: '#0E1424',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  metricValue: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginVertical: 4 },
  metricSub: { fontSize: 10, color: '#94A3B8' },
  distCard: {
    backgroundColor: '#0E1424',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  distTitle: { fontSize: 13, fontWeight: '800', color: '#F8FAFC', marginBottom: 10 },
  barTrack: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    marginBottom: 12,
  },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  clusterGrid: { gap: 12, marginBottom: 20 },
  clusterCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  clusterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clusterName: { fontSize: 15, fontWeight: '900' },
  clusterDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2, maxWidth: 220 },
  clusterCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clusterCountText: { color: '#07090E', fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginVertical: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCol: { flex: 1 },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '900' },
  statSubValue: { fontSize: 11, fontWeight: '700', color: '#F8FAFC' },
  productsSection: {
    backgroundColor: '#0E1424',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableHeader: { marginBottom: 12 },
  tableTitle: { fontSize: 14, fontWeight: '800', color: '#F8FAFC' },
  tableSubtitle: { fontSize: 11, color: '#64748B', marginTop: 2 },
  productsTable: { gap: 4 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  productCode: { fontSize: 13, fontWeight: '800', color: '#F8FAFC' },
  productSales: { fontSize: 11, color: '#64748B' },
  productPrice: { fontSize: 14, fontWeight: '900', color: '#FBBF24' },
  tierPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  tierPillText: { fontSize: 9, fontWeight: '800' },
});
