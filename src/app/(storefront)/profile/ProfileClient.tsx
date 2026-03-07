'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Package,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Heart,
  Bell,
  Coffee,
  Plus,
  Home,
  Briefcase,
  Shield,
  Smartphone,
  Loader2,
  Trash2,
  MapNext 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';

// Data shapes
type OrderShape = {
  id: string;
  date: string;
  items: string;
  total: number;
  status: string;
};

type UserShape = {
  name: string;
  phone: string;
  points: number;
  totalOrders: number;
  memberSince: string;
};

type SectionType = 'menu' | 'orders' | 'favorites' | 'addresses' | 'notifications' | 'settings';

const MENU_ITEMS: { icon: any; label: string; id: SectionType; badge: string | null; current: boolean }[] = [
  { icon: Package, label: 'Pesanan Saya', id: 'orders', badge: '3', current: true },
  { icon: Heart, label: 'Favorit', id: 'favorites', badge: null, current: false },
  { icon: MapPin, label: 'Alamat Tersimpan', id: 'addresses', badge: null, current: false },
  { icon: Bell, label: 'Notifikasi', id: 'notifications', badge: '2', current: true },
  { icon: Settings, label: 'Pengaturan', id: 'settings', badge: null, current: false },
];

export default function ProfileClient({
  user: initialUser,
  orders
}: {
  user: UserShape;
  orders: OrderShape[];
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionType>('menu');
  const [user, setUser] = useState(initialUser);

  const handleBack = () => {
    if (activeSection !== 'menu') {
      setActiveSection('menu');
    } else {
      router.push('/');
    }
  };

  const getHeaderTitle = () => {
    switch (activeSection) {
      case 'orders': return 'Riwayat Pesanan';
      case 'favorites': return 'Favorit Saya';
      case 'addresses': return 'Alamat Tersimpan';
      case 'notifications': return 'Notifikasi';
      case 'settings': return 'Pengaturan';
      default: return 'Profile';
    }
  };

  return (
    <div className="min-h-dvh bg-[#FDFBF7] pb-safe font-sans">
      {/* Header */}
      <header className="gradient-matcha text-white pt-safe sticky top-0 z-20 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/5 rounded-full blur-2xl" />

        <div className="flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto relative z-10">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95 touch-target backdrop-blur-md"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <motion.h1 
             key={activeSection}
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             className="font-serif text-xl font-medium tracking-wide"
          >
             {getHeaderTitle()}
          </motion.h1>
        </div>

        {/* Profile Card - Only visible when in menu */}
        <AnimatePresence mode="popLayout">
          {activeSection === 'menu' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-6 pt-2 max-w-2xl mx-auto overflow-hidden relative z-10"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                  <User className="w-8 h-8 text-white/90" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl tracking-tight leading-tight">{user.name}</h2>
                  <p className="text-sm text-matcha-100/80 font-medium tracking-wide">{user.phone}</p>
                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full bg-black/10 border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-[10px] text-white/90 font-medium">Member sejak {user.memberSince}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: 'Total Order', value: user.totalOrders.toString() },
                  { label: 'Poin', value: user.points.toString() },
                  { label: 'Level', value: user.points > 100 ? '🍵 Gold' : '🌱 Green' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm"
                  >
                    <p className="font-serif text-xl">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-matcha-100 font-semibold mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {/* Main Menu */}
          {activeSection === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-2">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 rounded-2xl transition-all active:scale-[0.98] group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[#FDFBF7] flex items-center justify-center border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <item.icon className="w-5 h-5 text-[#18442D]" />
                    </div>
                    <span className="flex-1 text-[15px] font-medium text-gray-800 text-left">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#18442D]/10 text-[#18442D] text-xs font-bold">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                  </button>
                ))}
              </div>

              {/* Logout */}
              <button 
                onClick={async () => {
                   await signOut({ redirect: false });
                   router.push('/');
                   router.refresh();
                }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-50 bg-white text-[15px] font-bold text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-[0.98]">
                <LogOut className="w-5 h-5" />
                Keluar
              </button>
            </motion.div>
          )}

          {/* Render Sections */}
          {activeSection === 'orders' && <OrdersSection orders={orders} router={router} />}
          {activeSection === 'favorites' && <FavoritesSection />}
          {activeSection === 'addresses' && <AddressesSection />}
          {activeSection === 'notifications' && <NotificationsSection />}
          {activeSection === 'settings' && <SettingsSection user={user} onUpdate={(u) => setUser({...user, ...u})} />}

        </AnimatePresence>
      </div>
    </div>
  );
}

// Sub-components

function OrdersSection({ orders, router }: { orders: OrderShape[], router: any }) {
  return (
    <motion.section
      key="orders"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-3"
    >
      {orders.length === 0 ? (
        <div className="text-center py-12 px-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-serif text-lg text-gray-800 mb-1">Belum Ada Pesanan</h3>
          <p className="text-sm text-gray-500 mb-6">Nikmati berbagai pilihan matcha terbaik kami.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#18442D] text-white rounded-full text-sm font-medium hover:bg-[#123321] transition-colors"
          >
            Pesan Sekarang
          </button>
        </div>
      ) : (
        orders.map((order, i) => (
          <motion.button
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => router.push(`/orders/${order.id}`)}
            className="w-full text-left p-4 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-[#18442D]/30 hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                  <Package className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-mono text-xs font-bold text-gray-900 leading-none">{order.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{order.date}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider
                ${order.status === 'completed' || order.status === 'selesai' ? 'bg-green-50 border-green-200 text-green-700' : 
                  order.status === 'cancelled' || order.status === 'dibatalkan' ? 'bg-red-50 border-red-200 text-red-700' : 
                  'bg-amber-50 border-amber-200 text-amber-700'}`}>
                {order.status}
              </span>
            </div>
            <div className="pl-10">
              <p className="text-sm text-gray-600 line-clamp-1 mb-2 font-medium">{order.items}</p>
              <div className="flex items-center gap-x-2">
                <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Total</span>
                <p className="text-[15px] font-bold text-[#18442D]">{formatRupiah(order.total)}</p>
              </div>
            </div>
          </motion.button>
        ))
      )}
    </motion.section>
  );
}

function FavoritesSection() {
  const [favorites, setFavorites] = useState([
    { id: '1', name: 'Matcha Signature', price: 25000, type: 'Cold' },
    { id: '2', name: 'Matcha Latte Oatmilk', price: 32000, type: 'Hot/Cold' },
    { id: '3', name: 'Dirty Matcha Espresso', price: 28000, type: 'Cold' }
  ]);

  return (
    <motion.section
      key="favorites"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        {favorites.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm relative group cursor-pointer hover:border-[#18442D]/20 transition-colors"
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setFavorites(favorites.filter(f => f.id !== item.id));
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center z-10 hover:bg-red-100 transition-colors"
            >
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </button>
            <div className="aspect-square bg-[#FDFBF7] rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-[#18442D]/10 to-transparent opacity-50"></div>
               <Coffee className="w-12 h-12 text-[#18442D]/40" />
            </div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{item.type}</span>
            <h4 className="font-serif text-sm font-medium leading-tight mt-1 mb-2 line-clamp-2">{item.name}</h4>
            <p className="text-sm font-bold text-[#18442D]">{formatRupiah(item.price)}</p>
          </motion.div>
        ))}
        {favorites.length === 0 && (
          <div className="col-span-2 text-center py-12 px-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-gray-800 mb-1">Belum ada Favorit</h3>
            <p className="text-sm text-gray-500">Tambahkan pesanan favoritmu disini.</p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function AddressesSection() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/locations');
      if(res.ok) {
        setAddresses(await res.json());
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/user/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      });
      fetchAddresses();
    } catch(err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/user/locations/${id}`, { method: 'DELETE' });
      setAddresses(addresses.filter(a => a.id !== id));
    } catch(err) {
      console.error(err);
    }
  };

  const handleAddAddress = async () => {
    if(!newAddress) return;
    try {
      await fetch('/api/user/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAddress, isDefault: addresses.length === 0 })
      });
      setNewAddress("");
      setShowAddForm(false);
      fetchAddresses();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <motion.section
      key="addresses"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-4"
    >
      {!showAddForm ? (
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 border-2 border-dashed border-[#18442D]/30 rounded-3xl text-[#18442D] font-medium flex items-center justify-center gap-2 hover:bg-[#18442D]/5 transition-colors active:scale-[0.98]">
          <Plus className="w-5 h-5" />
          Tambah Alamat Baru
        </button>
      ) : (
        <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <textarea
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Alamat lengkap (beserta patokan)"
            className="w-full p-4 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-[#18442D]/50 mb-3 bg-gray-50/50"
            rows={3}
          />
          <div className="flex gap-2">
            <button 
              onClick={handleAddAddress}
              className="px-6 py-2.5 bg-[#18442D] text-white rounded-xl text-sm font-medium flex-1">
              Simpan
            </button>
            <button 
              onClick={() => setShowAddForm(false)}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">
              Batal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
           <Loader2 className="w-6 h-6 animate-spin text-[#18442D]" />
        </div>
      ) : (
        addresses.map((address, i) => (
          <motion.div
             key={address.id}
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.1 }}
             className={`p-5 rounded-3xl border ${address.isDefault ? 'border-[#18442D] bg-[#18442D]/5 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'} transition-all`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${address.isDefault ? 'bg-[#18442D] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {address.isDefault ? <Home className="w-5 h-5" /> : <MapPin className="w-5 h-5"/>}
                </div>
                <div>
                  <div className="flex gap-2 items-center">
                    <h4 className="font-bold text-gray-900 leading-none">{address.isDefault ? 'Utama' : 'Tersimpan'}</h4>
                    {address.isDefault && (
                      <span className="px-2 py-0.5 rounded border border-[#18442D]/30 bg-white text-[#18442D] text-[9px] font-bold uppercase tracking-wider">Utama</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 pl-[44px] leading-relaxed mt-1">{address.address}</p>
            <div className="flex gap-4 pl-[44px] mt-4">
              {!address.isDefault && (
                <button 
                  onClick={() => handleSetDefault(address.id)}
                  className="text-[13px] font-semibold text-[#18442D] hover:underline">Jadikan Utama</button>
              )}
              <button 
                onClick={() => handleDelete(address.id)}
                className="text-[13px] font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Hapus
              </button>
            </div>
          </motion.div>
        ))
      )}
    </motion.section>
  );
}

function NotificationsSection() {
  const notifs = [
    { id: '1', type: 'order', title: 'Pesanan Diterima', desc: 'Yeay! Pesanan MATCH-XA98 telah sampai di tujuan.', time: '2 jam yang lalu', unread: true },
    { id: '2', type: 'promo', title: 'Promo Spesial Weekend ✨', desc: 'Dapatkan diskon 20% untuk semua varian Matcha Latte khusus hari ini.', time: '1 hari yang lalu', unread: true },
    { id: '3', type: 'system', title: 'Poin Bertambah', desc: 'Selamat! Kamu mendapatkan 5 Poin dari pesanan sebelumnya.', time: '3 hari yang lalu', unread: false },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5 text-blue-500" />;
      case 'promo': return <Heart className="w-5 h-5 text-pink-500" />;
      default: return <Bell className="w-5 h-5 text-[#18442D]" />;
    }
  };

  return (
    <motion.section
      key="notifications"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-4"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-2">
        {notifs.map((notif, i) => (
          <div 
            key={notif.id}
            className={`flex gap-3 p-4 rounded-2xl ${notif.unread ? 'bg-[#18442D]/5' : 'bg-white hover:bg-gray-50'} mb-1 last:mb-0 relative transition-colors cursor-pointer`}
          >
            {notif.unread && (
              <span className="absolute top-5 right-4 w-2 h-2 rounded-full bg-[#18442D]"></span>
            )}
            <div className={`mt-0.5 p-2 rounded-xl h-fit ${notif.unread ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
              {getIcon(notif.type)}
            </div>
            <div className="pr-4">
              <h4 className={`text-sm mb-1 ${notif.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</h4>
              <p className={`text-[13px] leading-relaxed mb-1.5 ${notif.unread ? 'text-gray-600' : 'text-gray-500'}`}>{notif.desc}</p>
              <span className="text-[10px] text-gray-400 font-medium">{notif.time}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function SettingsSection({ user, onUpdate }: { user: UserShape, onUpdate: (user: Partial<UserShape>) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      });
      if(res.ok) {
        onUpdate({ name, phone });
        setEditing(false);
      }
    } catch(err) {
      console.error(err);
    } finally {
        setSaving(false);
    }
  };

  return (
    <motion.section
      key="settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-serif text-lg font-medium text-gray-900">Informasi Akun</h3>
           {!editing ? (
             <button onClick={() => setEditing(true)} className="text-sm font-semibold text-[#18442D] hover:underline">Ubah Profil</button>
           ) : (
             <button onClick={() => setEditing(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Batal</button>
           )}
        </div>

        <div className="space-y-4">
          <div>
             <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-1.5">Nama Lengkap</label>
             {editing ? (
               <input 
                 value={name} 
                 onChange={e => setName(e.target.value)} 
                 className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#18442D]/50 bg-gray-50/50" 
               />
             ) : (
               <div className="p-4 bg-gray-50/50 rounded-2xl border border-transparent">
                  <p className="text-[15px] font-medium text-gray-900">{user.name}</p>
               </div>
             )}
          </div>
          <div>
             <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-1.5">Nomor Handphone</label>
             {editing ? (
               <input 
                 value={phone} 
                 onChange={e => setPhone(e.target.value)} 
                 className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#18442D]/50 bg-gray-50/50" 
               />
             ) : (
               <div className="p-4 bg-gray-50/50 rounded-2xl border border-transparent">
                  <p className="text-[15px] font-medium text-gray-900">{user.phone || '-'}</p>
               </div>
             )}
          </div>
        </div>

        {editing && (
          <button 
            disabled={saving}
            onClick={handleSave}
            className="w-full mt-6 py-4 bg-[#18442D] text-white rounded-2xl text-[15px] font-semibold hover:bg-[#123321] transition-all flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Perubahan
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-2">
        <div className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-[#FDFBF7] flex items-center justify-center border border-gray-100 group-hover:border-[#18442D]/20 transition-colors">
            <Shield className="w-6 h-6 text-gray-500 group-hover:text-[#18442D] transition-colors" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-[15px] font-bold text-gray-800">Keamanan</h4>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">Ubah password Anda</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#18442D] transition-colors" />
        </div>
      </div>
      
      <div className="text-center pt-2">
        <p className="text-xs text-gray-400 font-mono">Matchaboy App v1.0.0</p>
      </div>
    </motion.section>
  );
}
