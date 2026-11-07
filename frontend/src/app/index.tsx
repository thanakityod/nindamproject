import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddProductScreen from './add';
import EditProductScreen from './edit';
import CategoriesScreen from './categories';
import LocationsScreen from './locations';
import ProductsScreen from './products';
import DashboardScreen from './dashboard';
import OrdersScreen from './orders';
import CartModal from './cartmodal';
import ProductCard, { Product } from './productcard';
import { apiCall, clearAuthSession, loadAuthToken, setAuthToken, fetchFromGitHubJSON } from '../lib/api';
import { getProductStatus } from '../lib/product-status';
import { clusterPricesLocally } from '../lib/kmeans';
import { getSavedCart, saveCart, CartItem } from '../lib/cart';
import { COLORS } from '../constants/theme';

const NAV_ITEMS = [
  { key: 'home', label: 'หน้าหลัก', emoji: '🏠' },
  { key: 'products', label: 'แคตตาล็อก', emoji: '📦' },
  { key: 'orders', label: 'คำสั่งซื้อ', emoji: '🚚' },
  { key: 'dashboard', label: 'AI แดชบอร์ด', emoji: '📊' },
  { key: 'categories', label: 'หมวดหมู่', emoji: '🗂️' },
] as const;

const DRAWER_ITEMS = [
  { key: 'home', label: 'หน้าแรกบูทีก GUWATCH888', emoji: '🏠' },
  { key: 'products', label: 'แคตตาล็อกนาฬิกาดิจิตอล', emoji: '📦' },
  { key: 'orders', label: 'ประวัติคำสั่งซื้อและการจัดส่ง', emoji: '🚚' },
  { key: 'dashboard', label: 'การวิเคราะห์ราคา AI K-Means', emoji: '📊' },
  { key: 'categories', label: 'หมวดหมู่นาฬิกาทั้งหมด', emoji: '🗂️' },
  { key: 'locations', label: 'คลังสินค้าและศูนย์กระจายสินค้า', emoji: '🏬' },
] as const;

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.84);
type AuthMode = 'login' | 'signup';

export default function HomeScreen() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Form Inputs for Auth Modal
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // App & Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [drawerVisible, setDrawerVisible] = useState(false);

  // E-Commerce Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAdmin = sessionUser?.role === 'admin';
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Load Saved Cart and User Session on startup
  useEffect(() => {
    const initApp = async () => {
      try {
        const saved = await getSavedCart();
        setCartItems(saved);

        const token = await loadAuthToken();
        if (token) {
          const userData = await apiCall('/auth/me');
          if (userData?.user) setSessionUser(userData.user);
        }
      } catch {
        // Fallback guest
      } finally {
        loadProducts();
      }
    };
    initApp();
  }, []);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const handleAddToCart = (product: Product, qty = 1) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      let updated: CartItem[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty };
      } else {
        updated = [{ product, quantity: qty }, ...prev];
      }
      saveCart(updated);
      return updated;
    });
    showToast(`🛒 เพิ่ม "${product.name}" ลงในตะกร้าเรียบร้อย`);
  };

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product, 1);
    setCartVisible(true);
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    setCartItems((prev) => {
      let updated: CartItem[];
      if (quantity <= 0) {
        updated = prev.filter((i) => i.product.id !== productId);
      } else {
        updated = prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i));
      }
      saveCart(updated);
      return updated;
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((i) => i.product.id !== productId);
      saveCart(updated);
      return updated;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    saveCart([]);
  };

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerVisible(false));
  };

  function loadProducts(query = searchQuery, isPull = false) {
    if (isPull) setIsRefreshing(true);
    else setIsLoading(true);

    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (query.trim()) params.set('q', query.trim());

    apiCall(`/products?${params.toString()}`)
      .then((data) => {
        const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        const rawMapped = rows.map((row: any) => ({
          id: String(row.id ?? row.Productcode ?? ''),
          name: row.name ?? row.Name ?? '',
          details: row.details ?? '',
          price: Number(row.price ?? 0),
          monthly_sales: Number(row.monthly_sales ?? 0),
          color: row.color ?? '',
          size: row.size ?? '',
          category: row.category ?? row.Category ?? 'Casual LED',
          stock: Number(row.stock ?? row.Stock ?? 0),
          stock_text: `${row.Stock ?? row.stock ?? 0} in stock`,
          location_count: 1,
          location_text: row.location_text ?? row.Location ?? 'Warehouse Sriracha',
          image_url: row.image_url ?? row.image ?? '',
          product_link: row.product_link ?? '',
        }));

        const clustered = clusterPricesLocally(rawMapped);
        setProducts(clustered);
      })
      .catch(async () => {
        try {
          const gitItems = await fetchFromGitHubJSON();
          if (gitItems.length > 0) {
            const rawMapped = gitItems.map((item: any) => ({
              id: item.Productcode || item.id,
              name: item.Name || item.name,
              details: item.details || '',
              price: Number(item.price || 0),
              monthly_sales: Number(item.monthly_sales || 0),
              color: item.color || '',
              size: item.size || '',
              category: item.Category || item.category || 'Casual LED',
              stock: Number(item.Stock ?? item.stock ?? 0),
              stock_text: `${item.Stock ?? item.stock ?? 0} in stock`,
              location_count: 1,
              location_text: item.Location || item.location || 'Warehouse Sriracha',
              image_url: item.image || item.image_url || '',
            }));
            setProducts(clusterPricesLocally(rawMapped));
          }
        } catch {}
      })
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogin = async () => {
    setAuthError(null);
    if (!usernameInput || !passwordInput) {
      setAuthError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: usernameInput.trim(), password: passwordInput }),
      });

      await setAuthToken(response?.token ?? null);
      setSessionUser(response?.user ?? null);
      setAuthModalVisible(false);
      setUsernameInput('');
      setPasswordInput('');
      loadProducts();
      showToast(`ยินดีต้อนรับคุณ ${response?.user?.username || ''} สู่ GUWATCH888`);
    } catch (error: any) {
      setAuthError(error?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async () => {
    setAuthError(null);
    if (!usernameInput || !passwordInput || !emailInput) {
      setAuthError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    if (passwordInput.length < 5) {
      setAuthError('รหัสผ่านต้องมีความยาวอย่างน้อย 5 ตัวอักษร');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput,
          email: emailInput.trim(),
        }),
      });

      await setAuthToken(response?.token ?? null);
      setSessionUser(response?.user ?? null);
      setAuthModalVisible(false);
      setUsernameInput('');
      setPasswordInput('');
      setEmailInput('');
      setConfirmPasswordInput('');
      loadProducts();
      showToast('สมัครสมาชิกและบันทึกลง MySQL สำเร็จแล้ว!');
    } catch (error: any) {
      setAuthError(error?.message || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    closeDrawer();
    await clearAuthSession();
    setSessionUser(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  const handleDeleteProduct = async (product: Product) => {
    setDeletingProductId(product.id);
    try {
      await apiCall(`/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`ลบนาฬิกา ${product.name} ออกจากระบบแล้ว`);
    } catch (error: any) {
      Alert.alert('ไม่สามารถลบได้', error.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
    } finally {
      setDeletingProductId(null);
    }
  };

  const stats = useMemo(() => {
    const totalModels = products.length;
    const totalStock = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
    const lowStockCount = products.filter((p) => getProductStatus(p.stock) === 'Low Stock').length;
    const totalInventoryValue = products.reduce((acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);
    return { totalModels, totalStock, lowStockCount, totalInventoryValue };
  }, [products]);

  // Featured Watches for Home Spotlight
  const featuredProducts = useMemo(() => {
    return products.slice(0, 6);
  }, [products]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#07090E" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
          <Pressable style={styles.toastActionBtn} onPress={() => setCartVisible(true)}>
            <Text style={styles.toastActionText}>ดูตะกร้า ›</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* ================= TOP NAVBAR ================= */}
      <View style={styles.topNav}>
        <View style={styles.topNavLeft}>
          <Pressable style={styles.menuButton} onPress={openDrawer}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>

          {/* GUWATCH888 Brand Logo */}
          <Pressable onPress={() => setActiveTab('home')} style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>⌚</Text>
            </View>
            <View>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandTitle}>GUWATCH</Text>
                <Text style={styles.brandTitle888}>888</Text>
              </View>
              <Text style={styles.brandTagline}>LUXURY DIGITAL TIMEPIECES</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.topNavRight}>
          {/* Cart Icon with Live Counter */}
          <Pressable style={styles.cartButton} onPress={() => setCartVisible(true)}>
            <Text style={styles.cartIcon}>🛒</Text>
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
              </View>
            )}
          </Pressable>

          {/* Auth Button or User Profile */}
          {sessionUser ? (
            <Pressable style={styles.userPill} onPress={openDrawer}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {String(sessionUser.username || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userNameText} numberOfLines={1}>
                {sessionUser.username}
              </Text>
              {isAdmin && <View style={styles.adminDot} />}
            </Pressable>
          ) : (
            <Pressable style={styles.loginPill} onPress={() => setAuthModalVisible(true)}>
              <Text style={styles.loginPillText}>🔑 เข้าสู่ระบบ</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ================= MAIN CONTENT TABS ================= */}
      <View style={styles.contentArea}>
        {editingProduct ? (
          <EditProductScreen
            product={editingProduct}
            existingCategories={Array.from(new Set(products.map((p) => p.category)))}
            isAdmin={isAdmin}
            onCancel={() => setEditingProduct(null)}
            onSuccess={() => {
              setEditingProduct(null);
              loadProducts();
              showToast('แก้ไขข้อมูลนาฬิกาเรียบร้อย');
            }}
          />
        ) : activeTab === 'add' ? (
          isAdmin ? (
            <AddProductScreen
              existingCategories={Array.from(new Set(products.map((p) => p.category)))}
              isAdmin={isAdmin}
              onCancel={() => setActiveTab('home')}
              onSuccess={() => {
                setActiveTab('products');
                loadProducts();
                showToast('เพิ่มนาฬิกาลงคลัง MySQL สำเร็จ');
              }}
            />
          ) : (
            <View style={styles.authLockCenter}>
              <Text style={{ fontSize: 50, marginBottom: 12 }}>🔒</Text>
              <Text style={styles.authLockTitle}>เฉพาะผู้ดูแลระบบ (Admin)</Text>
              <Text style={styles.authLockSub}>
                กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน เพื่อเพิ่มหรือจัดการสินค้าใน MySQL
              </Text>
              <Pressable style={styles.authLockBtn} onPress={() => setAuthModalVisible(true)}>
                <Text style={styles.authLockBtnText}>เข้าสู่ระบบแอดมิน ›</Text>
              </Pressable>
            </View>
          )
        ) : activeTab === 'products' ? (
          <ProductsScreen
            products={products}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={() => loadProducts(searchQuery, true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onEdit={setEditingProduct}
            onDelete={handleDeleteProduct}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isAdmin={isAdmin}
            deletingProductId={deletingProductId}
          />
        ) : activeTab === 'orders' ? (
          <OrdersScreen onBack={() => setActiveTab('home')} />
        ) : activeTab === 'dashboard' ? (
          <DashboardScreen />
        ) : activeTab === 'categories' ? (
          <CategoriesScreen
            onSelectCategory={(cat) => {
              setSearchQuery(cat);
              setActiveTab('products');
            }}
          />
        ) : activeTab === 'locations' ? (
          <LocationsScreen />
        ) : (
          /* ================= HOME TAB ================= */
          <ScrollView
            style={styles.homeScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <ScrollView
                refreshControl={undefined}
              />
            }
          >
            {/* GUWATCH888 Hero Luxury Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroVipBadge}>
                  <Text style={styles.heroVipText}>👑 GUWATCH888 OFFICIAL</Text>
                </View>
                <Text style={styles.heroLiveDb}>MySQL: ip_std6730251468</Text>
              </View>

              <Text style={styles.heroTitle}>สุดยอดนาฬิกาดิจิตอล</Text>
              <Text style={styles.heroTitleSub}>นวัตกรรมความหรูหราที่คุณสัมผัสได้</Text>
              <Text style={styles.heroDesc}>
                รวบรวมนาฬิกาดิจิตอลแท้ 100% สไตล์เรโทร สมาร์ทวอทช์ และพันธุ์แกร่ง สั่งซื้อง่ายผ่านระบบพร้อมเพย์และบัตรเครดิต พร้อมประกันศูนย์ 2 ปี
              </Text>

              {/* Promo Code Highlight */}
              <View style={styles.heroPromoCard}>
                <View style={styles.heroPromoLeft}>
                  <Text style={styles.heroPromoTag}>🎁 โค้ดส่วนลดพิเศษ</Text>
                  <Text style={styles.heroPromoCode}>GU888VIP</Text>
                </View>
                <Text style={styles.heroPromoDesc}>ลดทันที 10% ทุกออเดอร์ ไม่มีขั้นต่ำ</Text>
              </View>

              <View style={styles.heroActionRow}>
                <Pressable style={styles.heroShopNowBtn} onPress={() => setActiveTab('products')}>
                  <Text style={styles.heroShopNowText}>เลือกซื้อสินค้าเลย 🛒</Text>
                </Pressable>
                <Pressable style={styles.heroAiBtn} onPress={() => setActiveTab('dashboard')}>
                  <Text style={styles.heroAiText}>🤖 AI K-Means</Text>
                </Pressable>
              </View>
            </View>

            {/* Store Highlights Grid */}
            <View style={styles.highlightsGrid}>
              <View style={styles.highlightCard}>
                <Text style={styles.highlightIcon}>🛡️</Text>
                <Text style={styles.highlightTitle}>ของแท้ 100%</Text>
                <Text style={styles.highlightSub}>ประกันศูนย์ 2 ปีเต็ม</Text>
              </View>

              <View style={styles.highlightCard}>
                <Text style={styles.highlightIcon}>⚡</Text>
                <Text style={styles.highlightTitle}>ส่งด่วนฟรี</Text>
                <Text style={styles.highlightSub}>รับของภายใน 24-48 ชม.</Text>
              </View>

              <View style={styles.highlightCard}>
                <Text style={styles.highlightIcon}>💳</Text>
                <Text style={styles.highlightTitle}>ชำระเงินปลอดภัย</Text>
                <Text style={styles.highlightSub}>พร้อมเพย์ & บัตรเครดิต</Text>
              </View>

              <View style={styles.highlightCard}>
                <Text style={styles.highlightIcon}>🤖</Text>
                <Text style={styles.highlightTitle}>AI Price Hub</Text>
                <Text style={styles.highlightSub}>วิเคราะห์ 3 ช่วงราคา</Text>
              </View>
            </View>

            {/* KPI Statistics Row */}
            <View style={styles.kpiContainer}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>{stats.totalModels}</Text>
                <Text style={styles.kpiLabel}>รุ่นในคลัง</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>{stats.totalStock}</Text>
                <Text style={styles.kpiLabel}>สต็อกรวม</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiNumber, { color: '#38BDF8' }]}>
                  ฿{(stats.totalInventoryValue / 1000).toFixed(0)}k
                </Text>
                <Text style={styles.kpiLabel}>มูลค่าสินค้า</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiNumber, { color: '#34D399' }]}>100%</Text>
                <Text style={styles.kpiLabel}>ประกันแท้</Text>
              </View>
            </View>

            {/* Featured Watches Spotlight */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>นาฬิกาแนะนำยอดนิยม</Text>
                <Text style={styles.sectionSub}>Featured Digital Timepieces</Text>
              </View>
              <Pressable onPress={() => setActiveTab('products')}>
                <Text style={styles.viewAllText}>ดูทั้งหมด ({products.length}) ›</Text>
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#00F2FE" />
                <Text style={styles.loadingSub}>กำลังโหลดคลังนาฬิกา GUWATCH888 จาก MySQL...</Text>
              </View>
            ) : (
              <View style={styles.featuredList}>
                {featuredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    onEdit={setEditingProduct}
                    onDelete={handleDeleteProduct}
                    isAdmin={isAdmin}
                  />
                ))}
              </View>
            )}

            {/* Bottom Slogan Footer */}
            <View style={styles.footerNote}>
              <Text style={styles.footerBrand}>GUWATCH888 • LUXURY DIGITAL WATCH STORE</Text>
              <Text style={styles.footerCopyright}>
                ฐานข้อมูลเชื่อมต่อ MySQL <Text style={{ color: '#00F2FE' }}>ip_std6730251468</Text> พอร์ต 3108
              </Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* ================= BOTTOM TAB NAVIGATION ================= */}
      <View style={styles.bottomNav}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <Pressable
              key={item.key}
              style={[styles.bottomNavItem, isActive && styles.bottomNavItemActive]}
              onPress={() => {
                setEditingProduct(null);
                setActiveTab(item.key);
              }}
            >
              <Text style={[styles.bottomNavEmoji, isActive && styles.bottomNavEmojiActive]}>
                {item.emoji}
              </Text>
              <Text style={[styles.bottomNavText, isActive && styles.bottomNavTextActive]}>
                {item.label}
              </Text>
              {item.key === 'products' && (
                <View style={styles.productCountDot}>
                  <Text style={styles.productCountDotText}>{products.length}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ================= DRAWER MENU ================= */}
      <Modal visible={drawerVisible} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.drawerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer}>
            <Animated.View style={[styles.drawerBackdrop, { opacity: fadeAnim }]} />
          </Pressable>

          <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerLogoCircle}>
                <Text style={{ fontSize: 28 }}>⌚</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.drawerBrandTitle}>GUWATCH</Text>
                  <Text style={[styles.drawerBrandTitle, { color: '#F59E0B' }]}>888</Text>
                </View>
                <Text style={styles.drawerBrandSub}>LUXURY DIGITAL STORE</Text>
              </View>
              <Pressable style={styles.drawerCloseBtn} onPress={closeDrawer}>
                <Text style={styles.drawerCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* User Session Info Card */}
            {sessionUser ? (
              <View style={styles.drawerUserCard}>
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>
                    {String(sessionUser.username || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerUserName}>{sessionUser.username}</Text>
                  <Text style={styles.drawerUserRole}>
                    {isAdmin ? '👑 ผู้ดูแลระบบ (Admin)' : '👤 สมาชิกทั่วไป (Member)'}
                  </Text>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.drawerLoginCard}
                onPress={() => {
                  closeDrawer();
                  setAuthModalVisible(true);
                }}
              >
                <Text style={styles.drawerLoginTitle}>🔑 เข้าสู่ระบบ / สมัครสมาชิก</Text>
                <Text style={styles.drawerLoginSub}>บันทึกข้อมูลและประวัติคำสั่งซื้อลง MySQL</Text>
              </Pressable>
            )}

            {/* Menu List */}
            <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.drawerSectionLabel}>เมนูนำทางหลัก</Text>
              {DRAWER_ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  style={[styles.drawerMenuItem, activeTab === item.key && styles.drawerMenuItemActive]}
                  onPress={() => {
                    setEditingProduct(null);
                    setActiveTab(item.key);
                    closeDrawer();
                  }}
                >
                  <Text style={styles.drawerMenuEmoji}>{item.emoji}</Text>
                  <Text style={[styles.drawerMenuText, activeTab === item.key && styles.drawerMenuTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}

              {isAdmin && (
                <>
                  <Text style={[styles.drawerSectionLabel, { marginTop: 16 }]}>ระบบจัดการแอดมิน</Text>
                  <Pressable
                    style={styles.drawerAdminItem}
                    onPress={() => {
                      setEditingProduct(null);
                      setActiveTab('add');
                      closeDrawer();
                    }}
                  >
                    <Text style={styles.drawerMenuEmoji}>➕</Text>
                    <Text style={styles.drawerAdminText}>เพิ่มสินค้านาฬิกาใหม่ (Add Product)</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>

            {/* Drawer Footer */}
            {sessionUser && (
              <View style={styles.drawerFooter}>
                <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                  <Text style={styles.logoutBtnText}>🚪 ออกจากระบบ</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* ================= AUTHENTICATION MODAL ================= */}
      <Modal
        visible={authModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.authModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAuthModalVisible(false)} />
          <View style={styles.authModalCard}>
            {/* Header */}
            <View style={styles.authModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>⌚</Text>
                <Text style={styles.authBrandTitle}>GUWATCH888</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setAuthModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.authModalSub}>
              {authMode === 'login'
                ? 'เข้าสู่ระบบคลังนาฬิกาดิจิตอล MySQL'
                : 'สมัครสมาชิกใหม่ บันทึกลงตาราง user ใน MySQL'}
            </Text>

            {/* Mode Switch Tabs */}
            <View style={styles.authTabRow}>
              <Pressable
                style={[styles.authTabBtn, authMode === 'login' && styles.authTabBtnActive]}
                onPress={() => { setAuthMode('login'); setAuthError(null); }}
              >
                <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>
                  เข้าสู่ระบบ (Sign In)
                </Text>
              </Pressable>
              <Pressable
                style={[styles.authTabBtn, authMode === 'signup' && styles.authTabBtnActive]}
                onPress={() => { setAuthMode('signup'); setAuthError(null); }}
              >
                <Text style={[styles.authTabText, authMode === 'signup' && styles.authTabTextActive]}>
                  สมัครสมาชิก (Sign Up)
                </Text>
              </Pressable>
            </View>

            {/* Inputs */}
            <View style={styles.authInputGroup}>
              <Text style={styles.authLabel}>ชื่อผู้ใช้ (Username)</Text>
              <TextInput
                style={styles.authTextInput}
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder="เช่น admin หรือ std6730251468"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
            </View>

            {authMode === 'signup' && (
              <View style={styles.authInputGroup}>
                <Text style={styles.authLabel}>อีเมล (Email Address)</Text>
                <TextInput
                  style={styles.authTextInput}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="เช่น student@ku.th"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.authInputGroup}>
              <Text style={styles.authLabel}>รหัสผ่าน (Password)</Text>
              <TextInput
                style={styles.authTextInput}
                value={passwordInput}
                onChangeText={setPasswordInput}
                placeholder="รหัสผ่านอย่างน้อย 5 ตัวอักษร"
                placeholderTextColor="#64748B"
                secureTextEntry
              />
            </View>

            {authMode === 'signup' && (
              <View style={styles.authInputGroup}>
                <Text style={styles.authLabel}>ยืนยันรหัสผ่าน (Confirm Password)</Text>
                <TextInput
                  style={styles.authTextInput}
                  value={confirmPasswordInput}
                  onChangeText={setConfirmPasswordInput}
                  placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                />
              </View>
            )}

            {authError && (
              <View style={styles.authErrorBox}>
                <Text style={styles.authErrorText}>⚠️ {authError}</Text>
              </View>
            )}

            <Pressable
              style={[styles.authSubmitBtn, authLoading && styles.btnDisabled]}
              disabled={authLoading}
              onPress={authMode === 'login' ? handleLogin : handleSignup}
            >
              {authLoading ? (
                <ActivityIndicator color="#07090E" />
              ) : (
                <Text style={styles.authSubmitText}>
                  {authMode === 'login' ? 'เข้าสู่ระบบ GUWATCH888 ›' : 'สร้างบัญชีผู้ใช้ใหม่ ›'}
                </Text>
              )}
            </Pressable>

            <View style={styles.authTipBox}>
              <Text style={styles.authTipTitle}>💡 บัญชีทดสอบใน MySQL:</Text>
              <Text style={styles.authTipText}>• Admin: <Text style={{ color: '#FBBF24', fontWeight: '800' }}>admin</Text> / รหัส: <Text style={{ color: '#FBBF24', fontWeight: '800' }}>123456</Text></Text>
              <Text style={styles.authTipText}>• นักศึกษา: <Text style={{ color: '#38BDF8', fontWeight: '800' }}>std6730251468</Text> / รหัส: <Text style={{ color: '#38BDF8', fontWeight: '800' }}>123456</Text></Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= SHOPPING CART & CHECKOUT MODAL ================= */}
      <CartModal
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
        items={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        user={sessionUser}
        onOrderPlaced={() => {
          loadProducts();
          showToast('สั่งซื้อสำเร็จ! ตัดสต็อกจาก MySQL เรียบร้อย');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#0E172A',
    borderWidth: 1,
    borderColor: '#00F2FE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  toastActionBtn: {
    backgroundColor: '#00F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toastActionText: {
    color: '#07090E',
    fontSize: 11,
    fontWeight: '900',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#07090E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginRight: 6,
  },
  menuIcon: {
    color: '#F8FAFC',
    fontSize: 22,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoIcon: {
    fontSize: 18,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandTitle888: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
    marginLeft: 2,
  },
  brandTagline: {
    fontSize: 9,
    color: '#00F2FE',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  topNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartButton: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0E1424',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 18,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1424',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  userAvatarText: {
    color: '#07090E',
    fontSize: 11,
    fontWeight: '900',
  },
  userNameText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 90,
  },
  adminDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginLeft: 6,
  },
  loginPill: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  loginPillText: {
    color: '#00F2FE',
    fontSize: 12,
    fontWeight: '800',
  },
  contentArea: {
    flex: 1,
  },
  homeScroll: {
    flex: 1,
  },
  heroBanner: {
    margin: 16,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#0E1424',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroVipBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroVipText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroLiveDb: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroTitleSub: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00F2FE',
    marginTop: 2,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 14,
  },
  heroPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131B30',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  heroPromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroPromoTag: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  heroPromoCode: {
    backgroundColor: '#F59E0B',
    color: '#07090E',
    fontWeight: '900',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroPromoDesc: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroShopNowBtn: {
    flex: 1,
    backgroundColor: '#00F2FE',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  heroShopNowText: {
    color: '#07090E',
    fontSize: 14,
    fontWeight: '900',
  },
  heroAiBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroAiText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  highlightCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#0E1424',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  highlightIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  highlightSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#0E1424',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  kpiNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllText: {
    color: '#00F2FE',
    fontSize: 12,
    fontWeight: '800',
  },
  loadingBox: {
    alignItems: 'center',
    padding: 40,
  },
  loadingSub: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 13,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  footerNote: {
    alignItems: 'center',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 20,
  },
  footerBrand: {
    color: '#00F2FE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  footerCopyright: {
    color: '#475569',
    fontSize: 10,
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#070A12',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  bottomNavItemActive: {},
  bottomNavEmoji: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.5,
  },
  bottomNavEmojiActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  bottomNavText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomNavTextActive: {
    color: '#00F2FE',
    fontWeight: '800',
  },
  productCountDot: {
    position: 'absolute',
    top: 0,
    right: 18,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCountDotText: {
    color: '#00F2FE',
    fontSize: 8,
    fontWeight: '900',
  },
  drawerOverlay: {
    flex: 1,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#090D18',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: Platform.OS === 'android' ? 24 : 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  drawerLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  drawerBrandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  drawerBrandSub: {
    fontSize: 9,
    color: '#00F2FE',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  drawerCloseBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCloseText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  drawerUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  drawerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  drawerAvatarText: {
    color: '#07090E',
    fontSize: 16,
    fontWeight: '900',
  },
  drawerUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  drawerUserRole: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 2,
  },
  drawerLoginCard: {
    margin: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  drawerLoginTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00F2FE',
  },
  drawerLoginSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 14,
  },
  drawerSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    marginVertical: 10,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  drawerMenuItemActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  drawerMenuEmoji: {
    fontSize: 16,
    marginRight: 12,
  },
  drawerMenuText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  drawerMenuTextActive: {
    color: '#00F2FE',
    fontWeight: '800',
  },
  drawerAdminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  drawerAdminText: {
    fontSize: 13,
    color: '#FBBF24',
    fontWeight: '800',
  },
  drawerFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  authModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0E1424',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  authModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  authBrandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00F2FE',
    letterSpacing: 1.5,
  },
  authModalSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
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
    color: '#94A3B8',
    fontSize: 14,
  },
  authTabRow: {
    flexDirection: 'row',
    backgroundColor: '#070A12',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  authTabBtnActive: {
    backgroundColor: '#1E293B',
  },
  authTabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  authTabTextActive: {
    color: '#00F2FE',
  },
  authInputGroup: {
    marginBottom: 12,
  },
  authLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  authTextInput: {
    backgroundColor: '#131B30',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  authErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  authErrorText: {
    color: '#EF4444',
    fontSize: 11,
  },
  authSubmitBtn: {
    backgroundColor: '#00F2FE',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  authSubmitText: {
    color: '#07090E',
    fontSize: 14,
    fontWeight: '900',
  },
  authTipBox: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  authTipTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  authTipText: {
    fontSize: 11,
    color: '#64748B',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  authLockCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  authLockTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  authLockSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
    marginBottom: 18,
  },
  authLockBtn: {
    backgroundColor: '#00F2FE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  authLockBtnText: {
    color: '#07090E',
    fontSize: 13,
    fontWeight: '800',
  },
});
