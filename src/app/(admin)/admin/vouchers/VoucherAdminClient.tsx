'use client'

import { useState, useTransition, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Ticket, Plus, Edit, Trash2, Search, Calendar, DollarSign, Percent, 
  ShoppingBag, Check, X, Upload, Loader2, Info, Eye, Tag, AlertCircle, FileText
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import Image from 'next/image'

interface ProductSelectOption {
  id: string
  name: string
  category: {
    name: string
  } | null
}

interface VoucherTemplateShape {
  id: string
  code: string
  title: string
  description: string
  bannerUrl: string | null
  discountType: 'PERCENTAGE' | 'NOMINAL'
  discountValue: number
  minSpend: number
  maxClaims: number
  claimedCount: number
  startDate: string
  endDate: string
  validProductIds: string[]
  createdAt: string
}

export default function VoucherAdminClient({ 
  initialTemplates, 
  products 
}: { 
  initialTemplates: VoucherTemplateShape[]
  products: ProductSelectOption[]
}) {
  const [templates, setTemplates] = useState<VoucherTemplateShape[]>(initialTemplates)
  const [isOpenForm, setIsOpenForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<VoucherTemplateShape | null>(null)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PERCENTAGE' | 'NOMINAL'>('ALL')
  
  // Form State
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'NOMINAL'>('NOMINAL')
  const [discountValue, setDiscountValue] = useState(0)
  const [minSpend, setMinSpend] = useState(0)
  const [maxClaims, setMaxClaims] = useState(100)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  
  // UI States
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [productSearch, setProductSearch] = useState('')

  // Statistics
  const stats = useMemo(() => {
    const total = templates.length
    const active = templates.filter(t => {
      const now = new Date().getTime()
      const start = new Date(t.startDate).getTime()
      const end = new Date(t.endDate).getTime()
      return now >= start && now <= end
    }).length
    const totalClaims = templates.reduce((sum, t) => sum + t.claimedCount, 0)
    return { total, active, totalClaims }
  }, [templates])

  // Filter templates list
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'ALL' || t.discountType === typeFilter
      return matchesSearch && matchesType
    })
  }, [templates, searchQuery, typeFilter])

  // Client-side WebP/Canvas Compression Helper
  const compressAndUpload = async (file: File) => {
    setIsUploading(true)
    setUploadError('')
    try {
      // 1. Client-side canvas compression
      const image = document.createElement('img')
      const reader = new FileReader()

      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        reader.onload = (e) => {
          image.src = e.target?.result as string
          image.onload = () => {
            const canvas = document.createElement('canvas')
            let width = image.width
            let height = image.height

            // Max dimensions 1200x800 for banner
            const MAX_WIDTH = 1200
            const MAX_HEIGHT = 800
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width)
              width = MAX_WIDTH
            }
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height)
              height = MAX_HEIGHT
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(image, 0, 0, width, height)

            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Canvas compression failed'))
              }
            }, 'image/webp', 0.8) // Save as webp with 80% quality
          }
        }
        reader.onerror = () => reject(new Error('File reader failed'))
        reader.readAsDataURL(file)
      })

      // 2. Upload to server
      const compressedFile = new File([compressedBlob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
        type: 'image/webp'
      })

      const formData = new FormData()
      formData.append('file', compressedFile)

      const res = await fetch('/api/admin/upload/banner', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah banner')
      
      setBannerUrl(data.url)
    } catch (e: any) {
      console.error(e)
      setUploadError(e.message || 'Gagal mengompresi dan mengunggah gambar.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingTemplate(null)
    setCode('')
    setTitle('')
    setDescription('')
    setBannerUrl(null)
    setDiscountType('NOMINAL')
    setDiscountValue(0)
    setMinSpend(0)
    setMaxClaims(100)
    
    // Default dates (today to next month)
    const today = new Date().toISOString().split('T')[0]
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    setStartDate(today)
    setEndDate(nextMonth)
    setSelectedProductIds([])
    setIsOpenForm(true)
  }

  const handleOpenEdit = (t: VoucherTemplateShape) => {
    setEditingTemplate(t)
    setCode(t.code)
    setTitle(t.title)
    setDescription(t.description)
    setBannerUrl(t.bannerUrl)
    setDiscountType(t.discountType)
    setDiscountValue(t.discountValue)
    setMinSpend(t.minSpend)
    setMaxClaims(t.maxClaims)
    setStartDate(new Date(t.startDate).toISOString().split('T')[0])
    setEndDate(new Date(t.endDate).toISOString().split('T')[0])
    setSelectedProductIds(t.validProductIds || [])
    setIsOpenForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus template voucher ini? Seluruh voucher personal pengguna yang aktif dari template ini juga akan terhapus.")) {
      try {
        const res = await fetch(`/api/admin/vouchers?id=${id}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          setTemplates(templates.filter(t => t.id !== id))
        } else {
          const data = await res.json()
          alert(data.error || "Gagal menghapus template")
        }
      } catch (err) {
        alert("Koneksi gagal")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !title || !description || !startDate || !endDate) {
      alert("Mohon isi semua field wajib.")
      return
    }

    const payload = {
      code: code.trim().toUpperCase(),
      title,
      description,
      bannerUrl,
      discountType,
      discountValue: Number(discountValue),
      minSpend: Number(minSpend),
      maxClaims: Number(maxClaims),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      validProductIds: selectedProductIds
    }

    try {
      const url = '/api/admin/vouchers'
      const method = editingTemplate ? 'PUT' : 'POST'
      const body = editingTemplate ? { ...payload, id: editingTemplate.id } : payload

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (editingTemplate) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? data.template : t))
      } else {
        setTemplates([data.template, ...templates])
      }
      setIsOpenForm(false)
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan voucher")
    }
  }

  const toggleProduct = (prodId: string) => {
    if (selectedProductIds.includes(prodId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== prodId))
    } else {
      setSelectedProductIds([...selectedProductIds, prodId])
    }
  }

  // Filter products for multiselect
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category?.name || '').toLowerCase().includes(productSearch.toLowerCase())
    )
  }, [products, productSearch])

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-7 h-7 text-[#B48A5E]" />
            Sistem Manajemen Voucher
          </h1>
          <p className="text-sm text-gray-500 mt-1">Buat, edit, dan awasi distribusi kupon promo diskon Matchaboy.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 bg-[#B48A5E] hover:bg-[#946F48] text-white font-bold rounded-2xl shadow-lg shadow-[#B48A5E]/10 transition-all flex items-center gap-2 text-sm md:self-end shrink-0"
        >
          <Plus className="w-4 h-4" />
          Template Voucher Baru
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Total Template", value: stats.total, color: "text-[#B48A5E]", bg: "bg-[#B48A5E]/5" },
          { label: "Voucher Aktif", value: stats.active, color: "text-emerald-600", bg: "bg-emerald-50/50" },
          { label: "Total Klaim Pelanggan", value: stats.totalClaims, color: "text-purple-600", bg: "bg-purple-50/50" },
        ].map((s, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <h3 className={`text-3xl font-black mt-2 leading-none ${s.color}`}>{s.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.bg}`}>
              <Ticket className={`w-6 h-6 ${s.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* List Filters */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-450" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan kode / judul..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#B48A5E] bg-gray-50/30"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto shrink-0">
          {[
            { id: 'ALL', label: 'Semua Tipe' },
            { id: 'NOMINAL', label: 'Diskon Nominal' },
            { id: 'PERCENTAGE', label: 'Diskon Persentase' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTypeFilter(opt.id as any)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                typeFilter === opt.id
                  ? 'bg-[#B48A5E] text-white shadow-md'
                  : 'bg-gray-100 text-gray-650 hover:bg-gray-200/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTemplates.map((t) => (
            <motion.div
              layout
              key={t.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Banner image or placeholder */}
              <div className="relative h-40 bg-gray-150 w-full shrink-0 flex items-center justify-center">
                {t.bannerUrl ? (
                  <Image 
                    src={t.bannerUrl} 
                    alt={t.title} 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 768px) 100vw, 30vw"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-gray-400">
                    <Ticket className="w-10 h-10 stroke-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">No Banner Image</span>
                  </div>
                )}
                
                {/* Discount Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md text-white font-extrabold text-[10px] tracking-wide uppercase flex items-center gap-1">
                  {t.discountType === 'PERCENTAGE' ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                  <span>
                    {t.discountType === 'PERCENTAGE' 
                      ? `Potongan ${t.discountValue}%` 
                      : `Potongan ${formatRupiah(t.discountValue)}`}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                      {t.code}
                    </span>
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                      Klaim: {t.claimedCount} / {t.maxClaims}
                    </span>
                  </div>
                  <h3 className="font-serif font-black text-gray-900 leading-snug">{t.title}</h3>
                  <p className="text-xs text-gray-500 leading-normal line-clamp-2">{t.description}</p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-gray-50 text-[11px] text-gray-500 font-medium">
                  <div className="flex justify-between">
                    <span>Min. Belanja:</span>
                    <span className="font-bold text-gray-700">{formatRupiah(t.minSpend)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Produk Valid:</span>
                    <span className="font-bold text-gray-700">
                      {t.validProductIds.length === 0 ? "Semua Produk" : `${t.validProductIds.length} Item Terdaftar`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durasi:</span>
                    <span className="font-bold text-gray-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#B48A5E]" />
                      {new Date(t.startDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - {new Date(t.endDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2.5 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm mt-8 space-y-4">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto stroke-1" />
          <div className="space-y-1">
            <h4 className="font-bold text-gray-800">Tidak Ada Template Voucher</h4>
            <p className="text-xs text-gray-500">Silakan tambahkan template voucher baru untuk memulai.</p>
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <AnimatePresence>
        {isOpenForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
                <h2 className="font-serif font-black text-lg text-gray-900">
                  {editingTemplate ? `Edit Template: ${editingTemplate.code}` : "Template Voucher Baru"}
                </h2>
                <button
                  onClick={() => setIsOpenForm(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Main Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 border-b border-gray-50 pb-2">
                    Informasi Utama
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Kode Voucher *</label>
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: PROMOSEKALI"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#B48A5E] uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Judul Voucher *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Contoh: Diskon Matcha Mantap"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#B48A5E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Deskripsi / Peraturan *</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tulis detail syarat, ketentuan, serta produk mana saja yang valid."
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#B48A5E]"
                    />
                  </div>

                  {/* Banner Upload Card */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gambar Banner Voucher</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="md:col-span-2 relative border-2 border-dashed border-gray-250 hover:border-[#B48A5E] rounded-3xl p-5 text-center transition-all bg-gray-50/20 group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) compressAndUpload(file)
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-1.5 text-gray-400 group-hover:text-[#B48A5E] transition-colors">
                          {isUploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-[#B48A5E]" />
                          ) : (
                            <Upload className="w-8 h-8 stroke-1" />
                          )}
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                            {isUploading ? "Mengompresi & Mengunggah..." : "Pilih File Gambar Banner"}
                          </span>
                          <span className="text-[9px] text-gray-400">Kompresi WebP otomatis aktif</span>
                        </div>
                      </div>
                      <div className="relative h-28 bg-gray-100 rounded-3xl overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
                        {bannerUrl ? (
                          <>
                            <Image src={bannerUrl} alt="Preview Banner" fill className="object-cover" sizes="200px" />
                            <button
                              type="button"
                              onClick={() => setBannerUrl(null)}
                              className="absolute top-1.5 right-1.5 p-1 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">No Preview</span>
                        )}
                      </div>
                    </div>
                    {uploadError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><X className="w-3.5 h-3.5" />{uploadError}</p>}
                  </div>
                </div>

                {/* 2. Values and Spends */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 border-b border-gray-50 pb-2">
                    Tipe Diskon & Nilai
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tipe Potongan *</label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-250 text-xs focus:outline-none focus:border-[#B48A5E] bg-white"
                      >
                        <option value="NOMINAL">Nominal Rupiah (Rp)</option>
                        <option value="PERCENTAGE">Persentase (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        Nilai Potongan {discountType === 'PERCENTAGE' ? '(%)' : '(Rp)'} *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-250 text-xs focus:outline-none focus:border-[#B48A5E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Minimal Total Belanja (Rp) *</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={minSpend}
                        onChange={(e) => setMinSpend(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-250 text-xs focus:outline-none focus:border-[#B48A5E]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Date constraints and quotas */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 border-b border-gray-50 pb-2">
                    Batasan Kuota & Tanggal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Kuota Klaim Maksimal *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={maxClaims}
                        onChange={(e) => setMaxClaims(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-250 text-xs focus:outline-none focus:border-[#B48A5E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tanggal Mulai Berlaku *</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-250 text-xs focus:outline-none focus:border-[#B48A5E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tanggal Berakhir *</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-250 text-xs focus:outline-none focus:border-[#B48A5E]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Valid Products Selector */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                      Produk Valid (Terdaftar)
                    </h3>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {selectedProductIds.length === 0 ? "Semua Produk Valid" : `${selectedProductIds.length} Produk Dipilih`}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Cari nama produk / kategori..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-205 text-xs focus:outline-none focus:border-[#B48A5E]"
                    />
                    {selectedProductIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedProductIds([])}
                        className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-colors"
                      >
                        Kosongkan Seleksi
                      </button>
                    )}
                  </div>

                  {/* Scrollable products check list */}
                  <div className="border border-gray-150 rounded-3xl max-h-56 overflow-y-auto divide-y divide-gray-100 bg-gray-50/10">
                    {filteredProducts.map((prod) => {
                      const isChecked = selectedProductIds.includes(prod.id)
                      return (
                        <div 
                          key={prod.id}
                          onClick={() => toggleProduct(prod.id)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/40 cursor-pointer transition-colors"
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isChecked 
                              ? 'bg-[#B48A5E] border-[#B48A5E] text-white shadow-sm shadow-[#B48A5E]/20' 
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{prod.name}</p>
                            {prod.category && (
                              <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                                {prod.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {filteredProducts.length === 0 && (
                      <div className="p-8 text-center text-xs text-gray-400 font-medium">
                        Tidak ada produk yang cocok dengan pencarian.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 p-2 bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                      💡 <strong>Catatan:</strong> Jika tidak memilih produk sama sekali, voucher secara otomatis dianggap valid untuk <strong>seluruh menu</strong> di Matchaboy. Jika Anda memilih beberapa produk, potongan harga voucher *hanya memotong* subtotal produk-produk terpilih itu saja saat checkout.
                    </p>
                  </div>
                </div>

                {/* Modal actions */}
                <div className="flex items-center gap-3 pt-6 border-t border-gray-100 shrink-0">
                  <button
                    type="submit"
                    className="flex-1 py-4.5 bg-[#B48A5E] hover:bg-[#946F48] text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#B48A5E]/10"
                  >
                    <span>Simpan Template Voucher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpenForm(false)}
                    className="px-6 py-4.5 bg-gray-105 hover:bg-gray-150 text-gray-650 font-bold rounded-2xl transition-all text-xs"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
