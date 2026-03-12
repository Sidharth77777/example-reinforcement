"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

import { getFeedbacks } from "@/lib/api"
import { DownloadIcon } from "lucide-react"

export default function AdminPage() {
    const [adminUser, setAdminUser] = useState("")
    const [adminKey, setAdminKey] = useState("")
    const [authenticated, setAuthenticated] = useState(false)

    const [totalPages, setTotalPages] = useState(1)
    const [data, setData] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const limit = 9

    const [loading, setLoading] = useState(false)

    const loadFeedbacks = async (p = page) => {
        try {
            setLoading(true)

            const res = await getFeedbacks(adminUser, adminKey, p, limit)

            setData(res.data)
            setPage(res.page)
            setTotalPages(res.total_pages)
        } catch (err) {
            alert("Access denied")
            setAuthenticated(false)
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async () => {
        try {
            await loadFeedbacks(1)
            setAuthenticated(true)
        } catch {
            alert("Invalid credentials")
        }
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

    return (
        <div className="max-w-7xl mx-auto px-6 py-20">

            <h1 className="text-3xl font-bold mb-10 text-center">
                Admin Panel
            </h1>

            {/* LOGIN FORM */}
            {!authenticated && (
                <div className="max-w-md mx-auto bg-white shadow-xl rounded-xl p-8 space-y-6">

                    <Input
                        placeholder="Admin Email"
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                    />

                    <Input
                        type="password"
                        placeholder="Admin Key"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                    />

                    <Button
                        className="w-full bg-[#2d7b53]"
                        onClick={handleLogin}
                    >
                        Access Dashboard
                    </Button>

                </div>
            )}

            {/* IMAGE GRID */}
            {authenticated && (
                <>

                    {loading && (
                        <p className="text-center py-10">Loading...</p>
                    )}

                    {!loading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

                            {data.map((item, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl shadow-md overflow-hidden"
                                >

                                    <div className="relative w-full h-60">
                                        <Image
                                            src={item.image_url}
                                            alt="feedback"
                                            fill
                                            className="object-cover"
                                        />

                                        <button
                                            onClick={() => downloadImage(item.image_url)}
                                            className="absolute cursor-pointer top-2 right-2 bg-black/60 text-white text-xs px-3 py-1 rounded-md hover:bg-black"
                                        >
                                            <DownloadIcon />
                                        </button>
                                    </div>

                                    <div className="p-4 space-y-1">

                                        <p className="text-sm text-gray-600">
                                            Predicted:{" "}
                                            <span className="font-semibold">
                                                {item.predicted_label}
                                            </span>
                                        </p>

                                        <p className="text-sm text-gray-600">
                                            Corrected:{" "}
                                            <span className="font-semibold text-green-600">
                                                {item.corrected_label}
                                            </span>
                                        </p>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                    {/* PAGINATION */}
                    <div className="flex justify-center mt-10">

                        <Pagination>
                            <PaginationContent>

                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => page > 1 && setPage(page - 1)}
                                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>

                                {page > 2 && (
                                    <>
                                        <PaginationItem>
                                            <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                                        </PaginationItem>

                                        {page > 3 && <span className="px-2">...</span>}
                                    </>
                                )}

                                {page > 1 && (
                                    <PaginationItem>
                                        <PaginationLink onClick={() => setPage(page - 1)}>
                                            {page - 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                )}

                                <PaginationItem>
                                    <PaginationLink isActive>
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>

                                {page < totalPages && (
                                    <PaginationItem>
                                        <PaginationLink onClick={() => setPage(page + 1)}>
                                            {page + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                )}

                                {page < totalPages - 1 && (
                                    <>
                                        {page < totalPages - 2 && <span className="px-2">...</span>}

                                        <PaginationItem>
                                            <PaginationLink onClick={() => setPage(totalPages)}>
                                                {totalPages}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </>
                                )}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => page < totalPages && setPage(page + 1)}
                                        className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>

                            </PaginationContent>
                        </Pagination>

                    </div>

                </>
            )}

        </div>
    )
}