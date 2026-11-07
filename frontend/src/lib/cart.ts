import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../app/productcard';

export type CartItem = {
  product: Product;
  quantity: number;
};

const CART_STORAGE_KEY = 'guwatch888_cart_v1';

export async function getSavedCart(): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load cart:', e);
    return [];
  }
}

export async function saveCart(items: CartItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
}
