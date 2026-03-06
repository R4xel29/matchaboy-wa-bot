'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Phone,
  Clock,
  Camera,
  Check,
  ChevronRight,
  ArrowLeft,
  Truck,
  Store,
  User,
  LogOut,
  Banknote,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

type DriverOrderStatus = 'assigned' | 'to-store' | 'picked-up' | 'delivered';

interface DriverOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  distance: string;
  items: { name: string; qty: number }[];
  total: number;
  paymentMethod: 'midtrans' | 'cod';
  status: DriverOrderStatus;
  createdAt: string;
}

// Mock active orders
const MOCK_ORDERS: DriverOrder[] = [
  {
    id: 'MCB-A1B2C3',
    customerName: 'Rina Anggraini',
    customerPhone: '081234567890',
    address: 'Jl. Sudirman No. 45, Jakarta Selatan',
    distance: '3.2 km',
    items: [
      { name: 'Matcha Signature', qty: 2 },
      { name: 'Dirty Matcha', qty: 1 },
    ],
    total: 108000,
    paymentMethod: 'cod',
    status: 'assigned',
    createdAt: '14:32',
  },
  {
    id: 'MCB-D4E5F6',
    customerName: 'Budi Santoso',
    customerPhone: '087654321098',
    address: 'Jl. Kemang Raya No. 12, Jakarta Selatan',
    distance: '5.1 km',
    items: [
      { name: 'Iced Matcha Latte', qty: 1 },
      { name: 'Matcha Croissant', qty: 2 },
    ],
    total: 78000,
    paymentMethod: 'midtrans',
    status: 'assigned',
    createdAt: '14:45',
  },
  {
    id: 'MCB-G7H8I9',
    customerName: 'Sarah Wijaya',
    customerPhone: '082111222333',
    address: 'Senayan City, Lt. 5, Jakarta',
    distance: '2.8 km',
    items: [
      { name: 'Matcha Biscoff', qty: 1 },
      { name: 'Hot Matcha', qty: 1 },
      { name: 'Matcha Cookie', qty: 3 },
    ],
    total: 126000,
    paymentMethod: 'cod',
    status: 'to-store',
    createdAt: '13:58',
  },
];

const STATUS_CONFIG: Record<
  DriverOrderStatus,
  { label: string; color: string; bg: string; next?: DriverOrderStatus; nextLabel?: string }
> = {
  assigned: {
    label: 'Menunggu',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    next: 'to-store',
    nextLabel: 'Menuju Toko',
  },
  'to-store': {
    label: 'Menuju Toko',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    next: 'picked-up',
    nextLabel: 'Pesanan Dibawa',
  },
  'picked-up': {
    label: 'Pesanan Dibawa',
    color: 'text-matcha-700',
    bg: 'bg-matcha-50 border-matcha-200',
    next: 'delivered',
    nextLabel: 'Selesai',
  },
  delivered: {
    label: 'Selesai',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
  },
};

export default function DriverOrdersPage() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [podOrderId, setPodOrderId] = useState<string | null>(null);
  const [podImage, setPodImage] = useState<string | null>(null);

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  const updateOrderStatus = (orderId: string, newStatus: DriverOrderStatus) => {
    // For COD + delivered, require PoD
    const order = orders.find((o) => o.id === orderId);
    if (
      newStatus === 'delivered' &&
      order?.paymentMethod === 'cod' &&
      !podImage
    ) {
      setPodOrderId(orderId);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    setPodOrderId(null);
    setPodImage(null);
  };

  const handlePodCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPodImage(url);
    }
  };

  const confirmPod = () => {
    if (podOrderId && podImage) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === podOrderId ? { ...o, status: 'delivered' as const } : o
        )
      );
      setPodOrderId(null);
      setPodImage(null);
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-40 gradient-matcha text-white pt-safe">
        <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg leading-tight">
                Driver Panel
              </p>
              <p className="text-xs text-matcha-200">
                {activeOrders.length} pesanan aktif
              </p>
            </div>
          </div>
          <button
            className="w-10 h-10 rounded-full bg-white/10 
              flex items-center justify-center hover:bg-white/20 transition-colors touch-target"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
        {/* Active Orders */}
        <section>
          <h2 className="font-heading font-bold text-base text-foreground mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-matcha-600" />
            Pesanan Aktif
          </h2>

          {activeOrders.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Truck className="w-10 h-10 mx-auto mb-3 text-matcha-300" />
              Belum ada pesanan aktif
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => {
                const config = STATUS_CONFIG[order.status];
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm"
                  >
                    {/* Order Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                      <div>
                        <p className="font-mono text-xs font-bold text-matcha-700">
                          {order.id}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {order.createdAt}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border ${config.bg} ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{order.customerName}</span>
                        {order.paymentMethod === 'cod' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold">
                            COD
                          </span>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-foreground">{order.address}</p>
                          <p className="text-[10px] text-matcha-600">{order.distance}</p>
                        </div>
                      </div>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="flex items-center gap-2 text-xs text-matcha-600 hover:underline touch-target"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {order.customerPhone}
                      </a>
                    </div>

                    {/* Items */}
                    <div className="px-4 py-2 bg-muted/30 border-t border-border/30">
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {order.items.map((item, i) => (
                          <span key={i} className="text-[11px] text-muted-foreground">
                            {item.qty}× {item.name}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-sm font-bold text-matcha-700 flex items-center gap-1">
                          {order.paymentMethod === 'cod' && (
                            <Banknote className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          {formatRupiah(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {config.next && (
                      <button
                        onClick={() => updateOrderStatus(order.id, config.next!)}
                        className="w-full py-3.5 flex items-center justify-center gap-2
                          gradient-matcha text-white font-semibold text-sm
                          hover:opacity-95 transition-opacity touch-target"
                      >
                        {config.next === 'to-store' && <Store className="w-4 h-4" />}
                        {config.next === 'picked-up' && <Package className="w-4 h-4" />}
                        {config.next === 'delivered' && <Check className="w-4 h-4" />}
                        {config.nextLabel}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <section>
            <h2 className="font-heading font-bold text-base text-foreground mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Selesai ({completedOrders.length})
            </h2>
            <div className="space-y-2">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-4 py-3 
                    rounded-xl bg-green-50/50 border border-green-200/50"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-green-700">
                      {order.id}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {order.customerName} · {order.distance}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-green-700">
                    {formatRupiah(order.total)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Proof of Delivery Modal */}
      <AnimatePresence>
        {podOrderId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setPodOrderId(null);
                setPodImage(null);
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-[71] 
                bg-card rounded-t-3xl shadow-2xl p-6 pb-safe"
            >
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <h3 className="font-heading font-bold text-lg mb-1">
                Bukti Pengiriman (COD)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Foto bukti pengiriman wajib untuk pesanan COD sebelum menyelesaikan order.
              </p>

              {!podImage ? (
                <label className="flex flex-col items-center gap-3 py-8 
                  rounded-2xl border-2 border-dashed border-matcha-300 
                  bg-matcha-50/50 cursor-pointer hover:bg-matcha-50 transition-colors">
                  <Camera className="w-8 h-8 text-matcha-500" />
                  <span className="text-sm font-medium text-matcha-700">
                    Ambil Foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePodCapture}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={podImage}
                      alt="Proof of delivery"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPodImage(null)}
                      className="flex-1 py-3 rounded-xl border border-border 
                        text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Ulang
                    </button>
                    <button
                      onClick={confirmPod}
                      className="flex-1 py-3 rounded-xl gradient-matcha text-white 
                        text-sm font-semibold shadow-lg shadow-matcha-700/20"
                    >
                      Konfirmasi & Selesai
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
