import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiCall } from '../lib/api';
import { COLORS, SHADOWS } from '../constants/theme';

const WATCH_CATEGORIES = [
  'Sport & Tactical',
  'Smartwatch',
  'Vintage Retro',
  'Casual LED',
  'Luxury Digital',
];

export type EditableProduct = {
  id: string;
  name: string;
  details?: string;
  price?: number | string;
  monthly_sales?: number;
  color?: string;
  size?: string;
  category: string;
  stock: number;
  location_text?: string;
  image_url: string;
};

type AddProductScreenProps = {
  existingCategories?: string[];
  product?: EditableProduct | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isAdmin?: boolean;
};

export default function AddProductScreen({
  existingCategories = [],
  product = null,
  onSuccess,
  onCancel,
  isAdmin = true,
}: AddProductScreenProps) {
  const isEditMode = !!product;

  const initialCategories = Array.from(
    new Set([...WATCH_CATEGORIES, ...existingCategories, ...(product?.category ? [product.category] : [])])
  );

  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.id ?? `DW-${Math.floor(100 + Math.random() * 900)}`);
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [stock, setStock] = useState(String(product?.stock ?? '15'));
  const [details, setDetails] = useState(product?.details ?? '');
  const [color, setColor] = useState(product?.color ?? 'Matte Black');
  const [size, setSize] = useState(product?.size ?? '42 mm');
  const [location, setLocation] = useState(product?.location_text ?? 'Warehouse Sriracha');
  const [category, setCategory] = useState(product?.category ?? initialCategories[0]);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function pickImageFromDevice() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'กรุณาอนุญาตการเข้าถึงรูปภาพเพื่ออัปโหลดรูปนาฬิกา');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setImageUrl(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setImageUrl(asset.uri);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', 'ไม่สามารถเลือกรูปภาพได้: ' + e.message);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อสินค้านาฬิกา');
      return;
    }
    if (!sku.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณาระบุรหัสสินค้า (SKU / Product Code)');
      return;
    }
    if (!price || isNaN(Number(price))) {
      Alert.alert('ข้อมูลไม่ถูกต้อง', 'กรุณาระบุราคาเป็นตัวเลข');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: sku.trim(),
        name: name.trim(),
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        details: details.trim(),
        category,
        color: color.trim(),
        size: size.trim(),
        location_text: location.trim(),
        image_url:
          imageUrl.trim() ||
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
      };

      if (isEditMode) {
        await apiCall(`/products/${encodeURIComponent(product.id)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        Alert.alert('สำเร็จ', 'อัปเดตข้อมูลนาฬิกาดิจิตอลเรียบร้อยแล้ว');
      } else {
        await apiCall('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        Alert.alert('สำเร็จ', 'เพิ่มสินค้านาฬิกาใหม่เข้าสู่ฐานข้อมูลเรียบร้อยแล้ว');
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      Alert.alert('เกิดข้อผิดพลาด', err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'แก้ไขข้อมูลนาฬิกา' : 'เพิ่มสินค้านาฬิกาดิจิตอล'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEditMode
              ? `รหัสสินค้า: ${product.id}`
              : 'บันทึกข้อมูลและราคาเพื่อนำไปประมวลผล K-Means'}
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          {/* Section 1: Basic Info */}
          <Text style={styles.sectionHeader}>1. ข้อมูลทั่วไป (Basic Info)</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ชื่อรุ่นนาฬิกา (Watch Model Name) *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="เช่น Casio G-Shock Origin DW-5600"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>รหัสสินค้า (Product Code / SKU) *</Text>
            <TextInput
              value={sku}
              onChangeText={setSku}
              editable={!isEditMode}
              placeholder="เช่น DW-120"
              placeholderTextColor="#94A3B8"
              style={[styles.input, isEditMode && styles.inputDisabled]}
            />
          </View>

          {/* Section 2: Pricing & Stock */}
          <Text style={styles.sectionHeader}>2. ราคาและสต็อก (Pricing & Stock)</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ราคาจำหน่าย (฿) *</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="เช่น 2490"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>จำนวนในสต็อก (เรือน) *</Text>
              <TextInput
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
                placeholder="เช่น 20"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>
          </View>

          {/* Section 3: Categories */}
          <Text style={styles.sectionHeader}>3. หมวดหมู่และลักษณะตัวเรือน</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>หมวดหมู่นาฬิกา</Text>
            <View style={styles.categoryChips}>
              {initialCategories.map((c) => {
                const selected = category === c;
                return (
                  <Pressable
                    key={c}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>สี / วัสดุตัวเรือน</Text>
              <TextInput
                value={color}
                onChangeText={setColor}
                placeholder="เช่น Stealth Black"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ขนาดตัวเรือน</Text>
              <TextInput
                value={size}
                onChangeText={setSize}
                placeholder="เช่น 44 mm"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>คลังจัดเก็บสินค้า (Warehouse)</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="เช่น Warehouse Sriracha"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          {/* Section 4: Specifications */}
          <Text style={styles.sectionHeader}>4. คุณสมบัติและสเปก (Specifications)</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>รายละเอียดและคุณสมบัติเด่น</Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="ระบุ เช่น กันน้ำลึก 200m, ไฟ LED ส่องสว่าง, โหมดจับเวลา 1/100s, แบตเตอรี่ 5 ปี..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
            />
          </View>

          {/* Section 5: Image */}
          <Text style={styles.sectionHeader}>5. รูปภาพสินค้า (Product Image)</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>URL รูปภาพ</Text>
            <TextInput
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://images.unsplash.com/..."
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <Pressable style={styles.pickerBtn} onPress={pickImageFromDevice}>
            <Text style={styles.pickerBtnText}>📷 เลือกรูปภาพจากอัลบั้มในเครื่อง</Text>
          </Pressable>

          {imageUrl ? (
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>ตัวอย่างรูปภาพที่เลือก:</Text>
              <Image source={{ uri: imageUrl }} style={styles.previewImg} resizeMode="cover" />
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            {onCancel && (
              <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting
                  ? 'กำลังบันทึกข้อมูล...'
                  : isEditMode
                  ? 'บันทึกการแก้ไข'
                  : 'บันทึกนาฬิกาลงฐานข้อมูล'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 2,
  },
  fieldGroup: { gap: 4 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155' },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  inputDisabled: {
    backgroundColor: '#E2E8F0',
    color: '#64748B',
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 12 },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  pickerBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  pickerBtnText: { color: '#4F46E5', fontSize: 13, fontWeight: '800' },
  previewBox: { marginTop: 4, alignItems: 'center' },
  previewLabel: { fontSize: 11, color: '#64748B', marginBottom: 6 },
  previewImg: { width: 140, height: 140, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#475569', fontWeight: '800', fontSize: 14 },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
});
