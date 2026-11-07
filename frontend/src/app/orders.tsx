import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiCall } from '../lib/api';

type Order = {
  order_id: number;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  payment_method: string;
  total_amount: number | string;
  status: string;
  item_count?: number;
  created_at: string;
};

export default function OrdersScreen({ onBack }: { onBack?: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await apiCall('/orders');
      if (res?.success) {
        setOrders(res.orders || []);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderDetail = async (orderNo: string) => {
    setOrderDetailLoading(true);
    try {
      const res = await apiCall(`/orders/${orderNo}`);
      if (res?.success) {
        setSelectedOrder(res.order);
      }
    } catch (e) {
      console.error('Error fetching order detail:', e);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'ชำระแล้ว (เตรียมส่ง)', bg: 'rgba(16, 185, 129, 0.15)', fg: '#34D399' };
      case 'shipping':
        return { label: 'กำลังจัดส่ง', bg: 'rgba(56, 189, 248, 0.15)', fg: '#38BDF8' };
      case 'completed':
        return { label: 'สำเร็จเรียบร้อย', bg: 'rgba(16, 185, 129, 0.25)', fg: '#10B981' };
      default:
        return { label: status || 'รอดำเนินการ', bg: 'rgba(245, 158, 11, 0.15)', fg: '#FBBF24' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>GUWATCH888</Text>
          <Text style={styles.subTitle}>ประวัติคำสั่งซื้อและการซื้อขายในคลัง MySQL</Text>
        </View>

        {onBack && (
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>‹ กลับหน้าหลัก</Text>
          </Pressable>
        )}
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#00F2FE" />
          <Text style={styles.loadingText}>กำลังโหลดประวัติการสั่งซื้อจากฐานข้อมูล...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={{ fontSize: 44, marginBottom: 10 }}>📦</Text>
          <Text style={styles.emptyTitle}>ยังไม่มีคำสั่งซื้อในระบบ</Text>
          <Text style={styles.emptySub}>คำสั่งซื้อที่คุณทำผ่านหน้าร้านจะถูกบันทึกและแสดงที่นี่</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.order_id || item.order_no)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#00F2FE" />
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            return (
              <Pressable
                style={({ pressed }) => [styles.orderCard, pressed && styles.cardPressed]}
                onPress={() => openOrderDetail(item.order_no)}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNoText}>{item.order_no}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(item.created_at).toLocaleString('th-TH')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.fg }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBody}>
                  <Text style={styles.customerText}>👤 ผู้รับ: {item.customer_name} ({item.customer_phone})</Text>
                  <Text style={styles.addressText} numberOfLines={1}>📍 ที่อยู่: {item.shipping_address}</Text>
                  <Text style={styles.paymentText}>💳 วิธีชำระ: {String(item.payment_method).toUpperCase()}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.itemCountText}>จำนวน {item.item_count || 1} รายการ</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.totalLabel}>ยอดรวมสุทธิ:</Text>
                    <Text style={styles.totalAmount}>฿{Number(item.total_amount).toLocaleString()}</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="fade" onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedOrder(null)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalBrand}>GUWATCH888 • ORDER SLIP</Text>
                <Text style={styles.modalTitle}>{selectedOrder?.order_no}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setSelectedOrder(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.secTitle}>ข้อมูลการจัดส่ง</Text>
              <Text style={styles.secText}>👤 ชื่อผู้รับ: {selectedOrder?.customer_name}</Text>
              <Text style={styles.secText}>📞 เบอร์โทรศัพท์: {selectedOrder?.customer_phone}</Text>
              <Text style={styles.secText}>📍 ที่อยู่จัดส่ง: {selectedOrder?.shipping_address}</Text>
              <Text style={styles.secText}>💳 ช่องทางชำระ: {String(selectedOrder?.payment_method).toUpperCase()}</Text>

              <Text style={[styles.secTitle, { marginTop: 14 }]}>รายการสินค้าในคำสั่งซื้อ</Text>
              {selectedOrder?.items?.map((it: any, index: number) => (
                <View key={index} style={styles.orderItemRow}>
                  <Text style={styles.orderItemName} numberOfLines={1}>• {it.product_name} x {it.quantity}</Text>
                  <Text style={styles.orderItemPrice}>฿{Number(it.subtotal || it.price).toLocaleString()}</Text>
                </View>
              ))}

              <View style={styles.modalDivider} />

              <View style={styles.modalTotalRow}>
                <Text style={styles.modalTotalLabel}>ยอดชำระสุทธิทั้งสิ้น:</Text>
                <Text style={styles.modalTotalVal}>฿{Number(selectedOrder?.total_amount).toLocaleString()}</Text>
              </View>
            </View>

            <Pressable style={styles.modalCloseActionBtn} onPress={() => setSelectedOrder(null)}>
              <Text style={styles.modalCloseActionText}>ปิดหน้าต่าง</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00F2FE',
    letterSpacing: 1.5,
  },
  subTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  backBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 10,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#0E1424',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.9,
    borderColor: 'rgba(0, 242, 254, 0.4)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNoText: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '900',
  },
  orderDate: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
  cardBody: {
    marginBottom: 10,
  },
  customerText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressText: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 2,
  },
  paymentText: {
    color: '#64748B',
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemCountText: {
    color: '#64748B',
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginRight: 6,
  },
  totalAmount: {
    color: '#FBBF24',
    fontSize: 17,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0E1424',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalBrand: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#CBD5E1',
    fontSize: 15,
  },
  modalBody: {
    padding: 18,
  },
  secTitle: {
    color: '#00F2FE',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  secText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orderItemName: {
    color: '#F1F5F9',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  orderItemPrice: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  modalTotalLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  modalTotalVal: {
    color: '#FBBF24',
    fontSize: 20,
    fontWeight: '900',
  },
  modalCloseActionBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalCloseActionText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
});
