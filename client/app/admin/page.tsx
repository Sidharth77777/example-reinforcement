"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getFeedbacks } from "@/lib/api"
import {
    DownloadIcon,
    Loader2,
    ScanLine,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Eye,
    X,
} from "lucide-react"

export default function AdminPage() {
    const [adminUser, setAdminUser] = useState("")
    const [adminKey, setAdminKey] = useState("")
    const [authenticated, setAuthenticated] = useState(false)
    const [totalPages, setTotalPages] = useState(1)
    const [data, setData] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [loginError, setLoginError] = useState("")
    const [loginLoading, setLoginLoading] = useState(false)
    const [lightbox, setLightbox] = useState<{ url: string; predicted: string; corrected: string } | null>(null)

    const limit = 9

    const loadFeedbacks = async (p = page, isLogin = false) => {
        setLoading(true)
        try {
            const res = await getFeedbacks(adminUser, adminKey, p, limit)
            setData(res.data)
            setPage(res.page)
            setTotalPages(res.total_pages)
        } catch (err: any) {
            if (isLogin) throw err      // bubble up so handleLogin reads the detail
            setAuthenticated(false)     // session expired mid-use, kick to login
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async () => {
        setLoginError("")
        setLoginLoading(true)
        try {
            await loadFeedbacks(1, true)
            setAuthenticated(true)
        } catch (err: any) {
            const detail = err?.response?.data?.detail
            if (detail === "User not allowed") {
                setLoginError("Access denied - this email is not authorized.")
            } else if (detail === "Invalid secret key") {
                setLoginError("Wrong admin key. Please try again.")
            } else {
                setLoginError("Access denied. Check your credentials.")
            }
        } finally {
            setLoginLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleLogin()
    }

    const downloadImage = async (url: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const link = document.createElement("a")
            link.href = URL.createObjectURL(blob)
            link.download = "feedback-image.png"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (err) {
            console.error("Download failed", err)
        }
    }

    useEffect(() => {
        if (authenticated) loadFeedbacks(page)
    }, [page])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightbox(null)
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [])

    return (
        <div className="min-h-screen bg-black font-sans">

            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-white/[0.02] blur-3xl rounded-full" />
            </div>

            {/* ── Header ── */}
            <header className="border-b border-white/10 sticky top-0 z-40 bg-black/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center shrink-0 bg-gradient-to-b from-[#202020] to-[#0a0a0a]">
                            <ScanLine className="w-4 h-4 text-white/80" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white leading-none [font-family:var(--font-hooge)] tracking-widest">
                                SAAF AI
                            </p>
                            <p className="text-[10px] text-white/30 leading-none mt-0.5 [font-family:var(--font-imprima)] tracking-wider">
                                ADMIN PANEL
                            </p>
                        </div>
                    </div>

                    {authenticated && (
                        <button
                            onClick={() => {
                                setAuthenticated(false)
                                setData([])
                                setAdminUser("")
                                setAdminKey("")
                            }}
                            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors [font-family:var(--font-hooge)] tracking-widest"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            LOGOUT
                        </button>
                    )}
                </div>
            </header>

            {/* ── LOGIN ── */}
            {!authenticated && (
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 relative z-10">
                    <div className="w-full max-w-sm">

                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 rounded-2xl border border-white/10 bg-gradient-to-b from-[#202020] to-[#0a0a0a] flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7 text-white/30" />
                            </div>
                        </div>

                        <p className="text-center text-xl [font-family:var(--font-hooge)] tracking-widest text-white mb-1">
                            ACCESS DASHBOARD
                        </p>
                        <p className="text-center text-xs text-white/25 [font-family:var(--font-imprima)] mb-8">
                            Enter your admin credentials to continue
                        </p>

                        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] p-6 flex flex-col gap-4">

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-white/25 uppercase tracking-widest [font-family:var(--font-hooge)]">
                                    Admin Email
                                </label>
                                <input
                                    type="email"
                                    value={adminUser}
                                    onChange={(e) => setAdminUser(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="admin@saaf.ai"
                                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 outline-none transition-colors [font-family:var(--font-imprima)]"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-white/25 uppercase tracking-widest [font-family:var(--font-hooge)]">
                                    Admin Key
                                </label>
                                <input
                                    type="password"
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="••••••••••••"
                                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 outline-none transition-colors [font-family:var(--font-imprima)]"
                                />
                            </div>

                            {loginError && (
                                <p className="text-xs text-red-400/80 [font-family:var(--font-imprima)] text-center">
                                    {loginError}
                                </p>
                            )}

                            <button
                                onClick={handleLogin}
                                disabled={loginLoading || !adminUser || !adminKey}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 disabled:opacity-30 text-black font-semibold text-xs py-3.5 rounded-xl transition-all active:scale-[0.98] [font-family:var(--font-hooge)] tracking-widest mt-1"
                            >
                                {loginLoading ? (
                                    <><Loader2 className="animate-spin w-4 h-4" /> AUTHENTICATING...</>
                                ) : (
                                    "ACCESS DASHBOARD"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DASHBOARD ── */}
            {authenticated && (
                <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">

                    {/* Section divider */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                        <span className="text-[10px] text-white/30 [font-family:var(--font-hooge)] tracking-widest uppercase">
                            Feedback Log
                        </span>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="animate-spin w-6 h-6 text-white/20" />
                            <p className="text-xs text-white/20 [font-family:var(--font-hooge)] tracking-widest">
                                LOADING DATA...
                            </p>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && data.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24">
                            <p className="text-xs text-white/20 [font-family:var(--font-hooge)] tracking-widest">
                                NO FEEDBACK RECORDS FOUND
                            </p>
                        </div>
                    )}

                    {/* Grid */}
                    {!loading && data.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.map((item, index) => (
                                <div
                                    key={index}
                                    className="group rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] overflow-hidden hover:border-white/20 transition-all duration-300"
                                >
                                    {/* Image */}
                                    <div className="relative w-full h-52 bg-black overflow-hidden">
                                        <Image
                                            src={item.image_url}
                                            alt="feedback"
                                            fill
                                            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                        />

                                        {/* Hover actions */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => setLightbox({ url: item.image_url, predicted: item.predicted_label, corrected: item.corrected_label })}
                                                className="w-9 h-9 rounded-full border border-white/30 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                                                title="Preview"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => downloadImage(item.image_url)}
                                                className="w-9 h-9 rounded-full border border-white/30 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                                                title="Download"
                                            >
                                                <DownloadIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Labels */}
                                    <div className="p-4 flex flex-col gap-2 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] text-white/20 uppercase tracking-widest [font-family:var(--font-hooge)]">
                                                Predicted
                                            </span>
                                            <span className="text-xs text-white/50 capitalize [font-family:var(--font-imprima)]">
                                                {item.predicted_label}
                                            </span>
                                        </div>
                                        <div className="h-[1px] bg-white/5" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] text-white/20 uppercase tracking-widest [font-family:var(--font-hooge)]">
                                                Corrected
                                            </span>
                                            <span className="text-xs text-emerald-400 capitalize font-semibold [font-family:var(--font-imprima)]">
                                                {item.corrected_label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-10">

                            <button
                                onClick={() => page > 1 && setPage(page - 1)}
                                disabled={page === 1}
                                className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1">
                                {page > 2 && (
                                    <>
                                        <PageBtn n={1} current={page} onClick={() => setPage(1)} />
                                        {page > 3 && <span className="text-white/20 text-xs px-1">…</span>}
                                    </>
                                )}
                                {page > 1 && <PageBtn n={page - 1} current={page} onClick={() => setPage(page - 1)} />}
                                <PageBtn n={page} current={page} onClick={() => {}} />
                                {page < totalPages && <PageBtn n={page + 1} current={page} onClick={() => setPage(page + 1)} />}
                                {page < totalPages - 1 && (
                                    <>
                                        {page < totalPages - 2 && <span className="text-white/20 text-xs px-1">…</span>}
                                        <PageBtn n={totalPages} current={page} onClick={() => setPage(totalPages)} />
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => page < totalPages && setPage(page + 1)}
                                disabled={page === totalPages}
                                className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </main>
            )}

            {/* ── Lightbox ── */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative max-w-2xl w-full rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative w-full aspect-video bg-black">
                            <Image
                                src={lightbox.url}
                                alt="preview"
                                fill
                                className="object-contain"
                            />
                        </div>

                        <div className="p-5 flex items-center justify-between gap-4 border-t border-white/10">
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-[9px] text-white/20 uppercase tracking-widest [font-family:var(--font-hooge)] mb-1">Predicted</p>
                                    <p className="text-sm text-white/50 capitalize [font-family:var(--font-imprima)]">{lightbox.predicted}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/20 uppercase tracking-widest [font-family:var(--font-hooge)] mb-1">Corrected</p>
                                    <p className="text-sm text-emerald-400 capitalize font-semibold [font-family:var(--font-imprima)]">{lightbox.corrected}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => downloadImage(lightbox.url)}
                                className="flex items-center gap-2 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs px-4 py-2.5 rounded-xl transition-all [font-family:var(--font-hooge)] tracking-widest"
                            >
                                <DownloadIcon className="w-3.5 h-3.5" />
                                DOWNLOAD
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

// ── Page button helper ─────────────────────────────────────────────────────────
function PageBtn({ n, current, onClick }: { n: number; current: number; onClick: () => void }) {
    const isActive = n === current
    return (
        <button
            onClick={onClick}
            className={`w-9 h-9 rounded-xl border text-xs font-semibold transition-all [font-family:var(--font-orbitron)] ${
                isActive
                    ? "bg-white text-black border-white"
                    : "border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/30"
            }`}
        >
            {n}
        </button>
    )
}