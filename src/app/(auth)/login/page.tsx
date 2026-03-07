"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })
      
      if (res?.error) {
        setError("Email atau password salah")
        showToast("Email atau password salah", "error")
      } else {
        showToast("Login berhasil!", "success")
        // Fetch updated session to get user role
        const session = await getSession()
        const role = (session?.user as any)?.role
        
        if (role === 'ADMIN') {
          router.push("/admin")
        } else if (role === 'CASHIER') {
          router.push("/admin/cashier")
        } else {
          router.push("/profile")
        }
        router.refresh()
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col px-6">
      <div className="pt-8 pb-4">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#18442D] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Home
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-serif text-4xl text-[#18442D] mb-2">Welcome Back</h1>
          <p className="text-gray-500">Log in to track your matcha orders.</p>
        </motion.div>
        
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#18442D]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#18442D]/20 focus:border-[#18442D] transition-all"
              placeholder="matcha@example.com"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#18442D]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#18442D]/20 focus:border-[#18442D] transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-[#18442D] text-white rounded-full font-medium shadow-md hover:bg-[#123321] active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>

          <div className="relative mt-8 mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#FDFBF7] text-gray-500">Atau lanjutkan dengan</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/profile" })}
            className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-full font-medium shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all flex justify-center items-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        </motion.form>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-500 text-sm">
            Belum punya akun?{' '}
            <Link href="/register" className="text-[#18442D] font-medium hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
