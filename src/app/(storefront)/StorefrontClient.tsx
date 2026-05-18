'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProductModal } from '@/components/storefront/ProductModal';
import { SearchOverlay } from '@/components/storefront/SearchOverlay';
import { useToast } from '@/components/ui/Toast';
import { useStorefrontContext } from './layout';
import type { Product, Category } from '@/types';
import Image from 'next/image';
import { formatRupiah } from '@/lib/utils';

export default function StorefrontClient({ 
  categories, 
  products,
  banners
}: { 
  categories: Category[]; 
  products: Product[];
  banners: any[];
}) {
  const { data: session, status } = useSession();
  const userName = session?.user?.name || 'Guest';
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { searchOpen, setSearchOpen, openQR } = useStorefrontContext();

  // Location Selector branch state
  const [selectedBranch, setSelectedBranch] = useState({
    name: 'Suroyo Probolinggo',
    address: 'Suroyo Probolinggo, Jl. Suroyo No.16, Tisnonegaran, Kec...',
  });
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const branches = [
    { name: 'Suroyo Probolinggo', address: 'Suroyo Probolinggo, Jl. Suroyo No.16, Tisnonegaran, Kec. Kanigaran, Kota Probolinggo' },
    { name: 'Matchaboy Wamena', address: 'Matchaboy Wamena, Jl. Yos Sudarso No. 8, Wamena, Papua' },
    { name: 'Arus Coffee HQ', address: 'Arus Coffee HQ, Jl. Pemuda No. 45, Jakarta Selatan' },
  ];

  // Mobile Aspect Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const displayBanners = useMemo(() => {
    return banners.length > 0 ? banners : [
      { id: 1, image: '/hero/hero-1.jpg', alt: 'Kopi Gratis', headline: 'Ajak Teman Bisa Dapat Kopi Gratis', subheadline: 'Buy 1 Get 1' },
      { id: 2, image: '/hero/hero-2.jpg', alt: 'Buy 1 Get 1', headline: 'Nikmati Promo Spesial Hari Ini', subheadline: 'Buy 1 Get 1' },
    ];
  }, [banners]);

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [displayBanners]);

  // Filter Spesial Hari Ini
  const spesialProducts = useMemo(() => {
    const list = products.filter(p => p.badge === 'best-seller');
    return list.length > 0 ? list : products.slice(0, 4);
  }, [products]);

  // Filter Baru
  const baruProducts = useMemo(() => {
    const list = products.filter(p => p.badge === 'new');
    return list.length > 0 ? list : products.slice(1, 3);
  }, [products]);

  // Filter Makanan (Roti/Croissant/Donut/Food keywords)
  const makananProducts = useMemo(() => {
    const foodKeywords = ['roti', 'croissant', 'donut', 'cake', 'pastry', 'sweet', 'makanan', 'bread', 'bun', 'pie', 'chocolate', 'keju', 'susu'];
    const list = products.filter(p => {
      const nameLower = p.name.toLowerCase();
      const descLower = p.description.toLowerCase();
      const catLower = p.category.toLowerCase();
      return foodKeywords.some(kw => nameLower.includes(kw) || descLower.includes(kw) || catLower.includes(kw));
    });
    return list.length > 0 ? list : products.slice(2, 8);
  }, [products]);

  const handleProductClick = (product: Product) => {
    if (product.badge === 'sold-out') return;
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSearchSelect = (product: Product) => {
    if (product.badge === 'sold-out') return;
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className={`min-h-screen bg-[#FFFBF5] md:pt-16 ${status === 'unauthenticated' ? 'pb-36 md:pb-28' : 'pb-24'}`}>
        
        {/* ───────────────────────────────────────────────────────────────────────
            1. UNIFIED RESPONSIVE HEADER (Consistent design on mobile and desktop)
            ─────────────────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-b from-[#F2F7F2] to-[#FFFBF5] px-4 md:px-8 pt-6 pb-4 border-b border-brand-100/10 relative z-30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Left Side: Greeting */}
            <div className="flex items-center justify-between md:justify-start gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold tracking-wider">Hai,</p>
                <h2 className="font-heading text-lg md:text-xl font-black text-foreground -mt-1 flex items-center gap-1">
                  {userName} <span className="text-sm">👋</span>
                </h2>
              </div>
              {/* Soft decorative visual element */}
              <div className="w-10 h-10 rounded-full bg-brand-700/5 flex items-center justify-center border border-brand-700/5 md:hidden">
                <span className="text-lg">🍵</span>
              </div>
            </div>

            {/* Right Side: Location Selector, QR Code, and Services (grouped nicely on desktop) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Active Service Indicators */}
              <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground order-2 sm:order-1">
                <span className="text-gray-400">Melayani</span>
                <div className="flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-0.5 rounded-full border border-green-200/40">
                  <span className="text-[8px]">✔</span> Delivery
                </div>
                <div className="flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-0.5 rounded-full border border-green-200/40">
                  <span className="text-[8px]">✔</span> Pickup
                </div>
              </div>

              {/* Location and QR Scanner container */}
              <div className="flex gap-2 order-1 sm:order-2 relative">
                {/* Address Box */}
                <div 
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                  className="flex-1 sm:w-[280px] bg-white border border-brand-100/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-2xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all relative z-40"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-base mt-0.5 shrink-0">📍</span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-foreground flex items-center gap-1">
                        {selectedBranch.name}
                        <span className="text-[8px] text-brand-600">▼</span>
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate leading-tight mt-0.5">
                        {selectedBranch.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Red QR Scanner */}
                <button 
                  onClick={openQR}
                  className="w-11 h-11 bg-white border border-red-200 rounded-2xl flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shrink-0 active:scale-95"
                  aria-label="QR Scan"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="2" y="2" width="8" height="8" rx="1.5" />
                    <rect x="14" y="2" width="8" height="8" rx="1.5" />
                    <rect x="2" y="14" width="8" height="8" rx="1.5" />
                    <rect x="14" y="14" width="8" height="8" rx="1.5" />
                    <path d="M6 6h0M18 6h0M6 18h0M18 18h0" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
                  </svg>
                </button>

                {/* Branch Dropdown Options */}
                {isBranchDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30 bg-black/10" onClick={() => setIsBranchDropdownOpen(false)} />
                    <div className="absolute right-0 mt-14 bg-white border border-brand-100 rounded-2xl shadow-xl z-50 p-2 w-[280px] space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      <p className="text-[9px] font-bold text-muted-foreground px-3 py-1 uppercase tracking-wider">Pilih Cabang MatchaBoy</p>
                      {branches.map((b) => (
                        <button
                          key={b.name}
                          onClick={() => {
                            setSelectedBranch(b);
                            setIsBranchDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[11px] transition-colors flex flex-col gap-0.5
                            ${selectedBranch.name === b.name ? 'bg-brand-50 text-brand-800 font-bold' : 'hover:bg-gray-50 text-foreground'}`}
                        >
                          <span>{b.name}</span>
                          <span className="text-[9px] text-muted-foreground truncate font-normal">{b.address}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────────
            2. ASPECT-PERFECT BANNER SLIDER
            ─────────────────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-0 md:px-8 mt-0 md:mt-6">
          <div className="relative w-full aspect-[2.1/1] md:aspect-[3.2/1] overflow-hidden rounded-b-[2rem] md:rounded-[2rem] bg-brand-700/5 shadow-sm">
            <Image
              src={displayBanners[currentSlide].image}
              alt={displayBanners[currentSlide].alt}
              fill
              className="object-cover"
              priority
              onError={(e) => {
                // fallback if local images aren't present
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=1200';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Top-Left Heart icon button */}
            <button 
              onClick={() => showToast('Disimpan ke Favorit!', 'success')}
              className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all active:scale-90"
              aria-label="Favorites"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Top-Right Ticket/Gift icon button */}
            <button 
              onClick={() => router.push('/profile?section=loyalty&tab=vouchers')}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all active:scale-90"
              aria-label="Vouchers"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </button>

            {/* Bottom dot paginators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {displayBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────────
            3. CURATED PREMIUM SECTIONS (Unified responsive grids & scrolls)
            ─────────────────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-8">
          
          {/* 1. Spesial Hari Ini Section */}
          <section className="py-5 bg-white rounded-3xl border border-brand-100/20 shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-black text-[15px] md:text-lg text-foreground flex items-center gap-1">
                Spesial Hari Ini
              </h3>
              <span className="text-[11px] md:text-[13px] text-brand-600 font-bold flex items-center gap-0.5 cursor-pointer hover:text-brand-500 transition-colors">
                Lihat Semua <span className="text-[8px] md:text-[10px]">▶</span>
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-brand-100 scrollbar-track-transparent">
              {spesialProducts.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="w-[130px] md:w-[160px] shrink-0 bg-[#FAFAF9] rounded-2xl p-2.5 md:p-3.5 border border-brand-100/30 flex flex-col justify-between hover:shadow-md active:scale-[0.98] transition-all cursor-pointer relative group overflow-hidden"
                >
                  {p.image && (
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-brand-50 mb-2">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 120px, 150px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 left-1.5 z-10 px-1.5 py-0.5 rounded bg-green-600 text-white text-[8px] font-black shadow-sm uppercase tracking-wide">
                        {p.badge || 'Spesial'}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between">
                    <p className="text-[11px] md:text-[13px] font-black text-foreground line-clamp-1 leading-snug group-hover:text-brand-700 transition-colors">
                      {p.name}
                    </p>
                    <div className="mt-2 flex items-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-100 text-[#B02A30] text-[10px] md:text-[11px] font-black tracking-tight">
                        {formatRupiah(p.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Diskon & Cashback Section */}
          <section className="py-5 bg-white rounded-3xl border border-brand-100/20 shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-base md:text-xl">🉐</span>
              <h3 className="font-heading font-black text-[14px] md:text-lg text-foreground">
                Diskon & Cashback
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Promo Card: blu */}
              <div className="bg-white border border-[#00B4D8]/20 shadow-sm rounded-2xl p-4 flex items-center justify-between relative overflow-hidden group hover:shadow-md hover:border-[#00B4D8]/40 transition-all">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#00B4D8]/5 rounded-full" />
                <div className="min-w-0 pr-2">
                  <p className="text-[14px] md:text-[16px] font-black text-[#0077B6] leading-none">40% OFF</p>
                  <p className="text-[9px] md:text-[11px] text-muted-foreground mt-2 leading-snug font-semibold">blu by BCA Digital</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#E0F7FA] border border-[#00B4D8]/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <span className="text-[10px] font-black text-[#0096C7]">blu</span>
                </div>
              </div>

              {/* Promo Card: OVO */}
              <div className="bg-white border border-[#4C2A86]/20 shadow-sm rounded-2xl p-4 flex items-center justify-between relative overflow-hidden group hover:shadow-md hover:border-[#4C2A86]/40 transition-all">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#4C2A86]/5 rounded-full" />
                <div className="min-w-0 pr-2">
                  <p className="text-[14px] md:text-[16px] font-black text-[#4C2A86] leading-none">60% OFF</p>
                  <p className="text-[9px] md:text-[11px] text-muted-foreground mt-2 leading-snug font-semibold">Bayar pakai OVO</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#F3E5F5] border border-[#7B1FA2]/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <span className="text-[10px] font-black text-[#4A148C]">OVO</span>
                </div>
              </div>

              {/* Promo Card: ShopeePay */}
              <div className="bg-white border border-[#EE4D2D]/20 shadow-sm rounded-2xl p-4 flex items-center justify-between relative overflow-hidden group hover:shadow-md hover:border-[#EE4D2D]/40 transition-all">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#EE4D2D]/5 rounded-full" />
                <div className="min-w-0 pr-2">
                  <p className="text-[14px] md:text-[16px] font-black text-[#D35400] leading-none">50% OFF</p>
                  <p className="text-[9px] md:text-[11px] text-muted-foreground mt-2 leading-snug font-semibold">ShopeePay Cashback</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#FBE9E7] border border-[#FF5722]/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <span className="text-[10px] font-black text-[#E64A19]">SPay</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Baru! Section */}
          <section className="py-5 bg-white rounded-3xl border border-brand-100/20 shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-black text-[15px] md:text-lg text-foreground flex items-center gap-1">
                Baru!
              </h3>
              <span className="text-[11px] md:text-[13px] text-brand-600 font-bold flex items-center gap-0.5 cursor-pointer hover:text-brand-500 transition-colors">
                Lihat Semua <span className="text-[8px] md:text-[10px]">▶</span>
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-brand-100 scrollbar-track-transparent">
              {baruProducts.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="w-[130px] md:w-[160px] shrink-0 bg-[#FAFAF9] rounded-2xl p-2.5 md:p-3.5 border border-brand-100/30 flex flex-col justify-between hover:shadow-md active:scale-[0.98] transition-all cursor-pointer relative group overflow-hidden"
                >
                  {p.image && (
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-brand-50 mb-2">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 120px, 150px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 left-1.5 z-10 px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[8px] font-extrabold shadow-sm uppercase tracking-wide">
                        New
                      </span>
                    </div>
                  )}

                  <div className="flex-grow flex flex-col justify-between">
                    <p className="text-[11px] md:text-[13px] font-black text-foreground line-clamp-1 leading-snug group-hover:text-brand-700 transition-colors">
                      {p.name}
                    </p>
                    <p className="font-black text-[11px] md:text-[13px] text-[#B48A5E] leading-none mt-2">
                      {formatRupiah(p.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Makanan Section Grid */}
          <section className="py-5 bg-white rounded-3xl border border-brand-100/20 shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-black text-[15px] md:text-lg text-foreground flex items-center gap-1">
                Makanan
              </h3>
              <span className="text-[11px] md:text-[13px] text-brand-600 font-bold flex items-center gap-0.5 cursor-pointer hover:text-brand-500 transition-colors">
                Lihat Semua <span className="text-[8px] md:text-[10px]">▶</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {makananProducts.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="bg-[#FAFAF9] rounded-2xl p-3 md:p-4 border border-brand-100/30 flex flex-col justify-between hover:shadow-md active:scale-[0.98] transition-all cursor-pointer relative group overflow-hidden"
                >
                  {p.image && (
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-brand-50 mb-3">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 150px, 200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between">
                    <p className="text-[12px] md:text-[14px] font-black text-foreground line-clamp-1 leading-snug group-hover:text-brand-700 transition-colors">
                      {p.name}
                    </p>
                    <p className="font-black text-[11px] md:text-[13px] text-gray-700 leading-none mt-2">
                      {formatRupiah(p.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Emerald CS Whatsapp & Ditjen Advisory Footer */}
          <section className="px-4 py-6 bg-white border border-brand-100/20 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            {/* WhatsApp Curhat Button */}
            <a 
              href="https://wa.me/628170756865"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto md:min-w-[320px] py-3.5 px-6 bg-white border border-[#25D366]/30 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#25D366]/5 transition-colors shadow-sm active:scale-[0.99]"
            >
              <span className="text-lg">💬</span>
              <span className="text-[12px] font-black text-[#128C7E]">
                Curhat ke 6281 7075 6865 (Chat Only)
              </span>
            </a>

            {/* advisory disclaimer */}
            <div className="text-[9px] md:text-[10px] text-left text-muted-foreground leading-relaxed max-w-xl space-y-1">
              <p className="font-black text-gray-500">Informasi Kontak Layanan Pengaduan Konsumen</p>
              <p className="text-gray-400">
                Direktorat Jenderal Perlindungan Konsumen dan Tertib Niaga, Kementerian Perdagangan Republik Indonesia, Whatsapp Ditjen PKTN: 0853-1111-1010
              </p>
            </div>
          </section>

        </div>

        {/* 6. Guest Sticky Footer CTA */}
        {status === 'unauthenticated' && (
          <div className="fixed bottom-[56px] md:bottom-6 left-4 right-4 z-40 bg-[#FFFBF5]/95 backdrop-blur-md border border-brand-100/60 p-4 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="hidden md:block">
              <h4 className="text-sm font-black text-foreground">Bergabung dengan MatchaBoy sekarang!</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Dapatkan poin cashback, diskon spesial, dan kemudahan pemesanan.</p>
            </div>
            <button 
              onClick={() => router.push('/login')}
              className="w-full md:w-[220px] py-3.5 bg-[#B02A30] hover:bg-[#901E23] text-white text-[13px] font-black rounded-xl shadow-md transition-colors tracking-wide active:scale-[0.98] shadow-red-700/20"
            >
              Daftar atau Masuk
            </button>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          3. COMMON OVERLAYS & MODALS
          ─────────────────────────────────────────────────────────────────────── */}
      {/* Product Customization Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        allProducts={products}
      />

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onProductSelect={handleSearchSelect}
        products={products}
        categories={categories}
      />
    </>
  );
}
