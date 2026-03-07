'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Truck,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

type POSProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  categoryId: string;
  categoryName: string;
  modifiers: {
    iceLevel?: string[];
    sugarLevel?: string[];
    addOns?: { id: string; name: string; price: number }[];
  } | null;
};

type CartItemPOS = {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  quantity: number;
  iceLevel: string;
  sugarLevel: string;
  addOns: { id: string; name: string; price: number }[];
  totalPrice: number;
};

type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN';

interface Props {
  products: POSProduct[];
  categories: { id: string; name: string; slug: string }[];
}

export default function CashierPOSClient({ products, categories }: Props) {
  const router = useRouter();

  // State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cart, setCart] = useState<CartItemPOS[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('PICKUP');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  // Modifier modal state
  const [modifierProduct, setModifierProduct] = useState<POSProduct | null>(null);
  const [modIce, setModIce] = useState('Normal Ice');
  const [modSugar, setModSugar] = useState('Normal Sugar');
  const [modAddOns, setModAddOns] = useState<{ id: string; name: string; price: number }[]>([]);
  const [modQty, setModQty] = useState(1);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add to cart
  const handleProductClick = (product: POSProduct) => {
    if (product.modifiers && (product.modifiers.iceLevel || product.modifiers.sugarLevel || product.modifiers.addOns)) {
      setModifierProduct(product);
      setModIce(product.modifiers.iceLevel?.[0] || 'Normal Ice');
      setModSugar(product.modifiers.sugarLevel?.[0] || 'Normal Sugar');
      setModAddOns([]);
      setModQty(1);
    } else {
      addToCart(product, 'Normal Ice', 'Normal Sugar', [], 1);
    }
  };

  const addToCart = (
    product: POSProduct,
    iceLevel: string,
    sugarLevel: string,
    addOns: { id: string; name: string; price: number }[],
    qty: number
  ) => {
    const addOnIds = addOns.map((a) => a.id).sort().join(',');
    const cartId = `${product.id}__${iceLevel}__${sugarLevel}__${addOnIds}`;
    const addOnTotal = addOns.reduce((sum, a) => sum + a.price, 0);
    const itemPrice = product.price + addOnTotal;

    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartId
            ? { ...i, quantity: i.quantity + qty, totalPrice: itemPrice * (i.quantity + qty) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: cartId,
          productId: product.id,
          name: product.name,
          basePrice: product.price,
          quantity: qty,
          iceLevel,
          sugarLevel,
          addOns,
          totalPrice: itemPrice * qty,
        },
      ];
    });
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
    } else {
      setCart((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                quantity: newQty,
                totalPrice: (i.basePrice + i.addOns.reduce((s, a) => s + a.price, 0)) * newQty,
              }
            : i
        )
      );
    }
  };

  const handleModifierConfirm = () => {
    if (!modifierProduct) return;
    addToCart(modifierProduct, modIce, modSugar, modAddOns, modQty);
    setModifierProduct(null);
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (cart.length === 0 || !customerName) return;
    setIsSubmitting(true);

    try {
      const payload = {
        orderType,
        customerName,
        customerPhone: customerPhone || '-',
        address: orderType === 'DELIVERY' ? address : '',
        notes,
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          addOnIds: item.addOns.map((a) => a.id),
          modsString: `${item.iceLevel}, ${item.sugarLevel}${item.addOns.length > 0 ? ', +' + item.addOns.map((a) => a.name).join(', +') : ''}`,
        })),
      };

      const res = await fetch('/api/cashier/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal membuat pesanan');

      setLastOrderId(data.orderId);
      setShowSuccess(true);

      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setAddress('');
      setNotes('');

      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAddOn = (addOn: { id: string; name: string; price: number }) => {
    setModAddOns((prev) =>
      prev.find((a) => a.id === addOn.id)
        ? prev.filter((a) => a.id !== addOn.id)
        : [...prev, addOn]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">Kasir (POS)</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Buat pesanan baru untuk pelanggan</p>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT: Product Grid */}
        <div className="xl:col-span-3 space-y-4">
          {/* Search + Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-border/40 text-muted-foreground hover:bg-muted/60'
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white border border-border/40 text-muted-foreground hover:bg-muted/60'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group bg-white rounded-2xl border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-amber-300 transition-all duration-200 overflow-hidden text-left"
              >
                {product.image && (
                  <div className="aspect-square bg-muted/30 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-foreground line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.categoryName}</p>
                  <p className="text-sm font-bold text-amber-700 mt-1">{formatRupiah(product.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Cart & Order Panel */}
        <div className="xl:col-span-2 space-y-4">
          {/* Order Type Tabs */}
          <div className="bg-white rounded-2xl border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { type: 'PICKUP' as OrderType, label: 'Pickup', icon: ShoppingBag },
                { type: 'DELIVERY' as OrderType, label: 'Delivery', icon: Truck },
              ]).map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    orderType === type
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Info Pelanggan</p>

            <input
              type="text"
              placeholder="Nama pelanggan *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
            />

            {(orderType === 'PICKUP' || orderType === 'DELIVERY') && (
              <input
                type="tel"
                placeholder="No. HP"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
              />
            )}

            {orderType === 'DELIVERY' && (
              <textarea
                placeholder="Alamat pengiriman *"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 text-sm bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all resize-none"
              />
            )}

            <input
              type="text"
              placeholder="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
            />
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-2xl border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                Keranjang ({totalItems} item)
              </p>
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground/50">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Klik produk untuk menambahkan</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30 max-h-[320px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.iceLevel} · {item.sugarLevel}
                        {item.addOns.length > 0 && ` · +${item.addOns.map((a) => a.name).join(', ')}`}
                      </p>
                      <p className="text-xs font-bold text-amber-700 mt-0.5">{formatRupiah(item.totalPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQty(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      >
                        {item.quantity <= 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment & Total */}
            {cart.length > 0 && (
              <div className="border-t border-border/30 p-4 space-y-3">
                {/* Payment method */}
                <div className="flex gap-2">
                  {['CASH', 'QRIS'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        paymentMethod === method
                          ? 'bg-amber-600 text-white'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-amber-700">{formatRupiah(subtotal)}</span>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || !customerName || cart.length === 0}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Buat Pesanan
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modifier Modal */}
      <AnimatePresence>
        {modifierProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setModifierProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-border overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-border/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-lg">{modifierProduct.name}</h3>
                    <p className="text-sm text-amber-700 font-semibold">{formatRupiah(modifierProduct.price)}</p>
                  </div>
                  <button onClick={() => setModifierProduct(null)} className="p-1.5 hover:bg-muted rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Ice Level */}
                {modifierProduct.modifiers?.iceLevel && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Ice Level</p>
                    <div className="flex flex-wrap gap-2">
                      {modifierProduct.modifiers.iceLevel.map((level) => (
                        <button
                          key={level}
                          onClick={() => setModIce(level)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            modIce === level
                              ? 'bg-amber-600 text-white'
                              : 'bg-muted/50 text-foreground hover:bg-muted'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugar Level */}
                {modifierProduct.modifiers?.sugarLevel && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Sugar Level</p>
                    <div className="flex flex-wrap gap-2">
                      {modifierProduct.modifiers.sugarLevel.map((level) => (
                        <button
                          key={level}
                          onClick={() => setModSugar(level)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            modSugar === level
                              ? 'bg-amber-600 text-white'
                              : 'bg-muted/50 text-foreground hover:bg-muted'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-ons */}
                {modifierProduct.modifiers?.addOns && modifierProduct.modifiers.addOns.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Add-ons</p>
                    <div className="space-y-2">
                      {modifierProduct.modifiers.addOns.map((addOn) => {
                        const selected = modAddOns.find((a) => a.id === addOn.id);
                        return (
                          <button
                            key={addOn.id}
                            onClick={() => toggleAddOn(addOn)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                              selected
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-border/40 hover:border-amber-300'
                            }`}
                          >
                            <span className="text-sm font-medium">{addOn.name}</span>
                            <span className="text-xs font-semibold text-amber-700">+{formatRupiah(addOn.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Jumlah</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModQty(Math.max(1, modQty - 1))}
                      className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-bold w-8 text-center">{modQty}</span>
                    <button
                      onClick={() => setModQty(modQty + 1)}
                      className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm button */}
              <div className="p-5 border-t border-border/30">
                <button
                  onClick={handleModifierConfirm}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-sm hover:shadow-md transition-all active:scale-[0.98]"
                >
                  Tambah ke Pesanan — {formatRupiah(
                    (modifierProduct.price + modAddOns.reduce((s, a) => s + a.price, 0)) * modQty
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 px-6 py-4 rounded-2xl bg-green-600 text-white shadow-2xl flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold">Pesanan berhasil dibuat!</p>
              <p className="text-xs text-green-100">#{lastOrderId.slice(0, 8).toUpperCase()}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
