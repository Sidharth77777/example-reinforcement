"use client"

import { useRouter } from "next/navigation";
import Image from "next/image";

const CARD_DATA = [
    {
        id: 1,
        title: "AI DETECTION",
        description: "IDENTIFIES WASTE TYPES",
        image: "/images/Ai detection.png"
    },
    {
        id: 2,
        title: "AUTOMATIC SORTING",
        description: "HANDS FREE DISPOSAL",
        image: "/images/automatic sorting.png"
    },
    {
        id: 3,
        title: "DATA ANALYSIS",
        description: "TRACKS WASTE STATISTICS",
        image: "/images/data analysis.png"
    }
]

export default function HeroSection() {
    const router = useRouter();
    return (
        <section className="min-h-screen sm:px-10 px-5 flex flex-col justify-center gap-16">
            {/* HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                {/* LEFT */}
                <div className="space-y-6">
                    <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl [font-family:var(--font-hooge)] leading-tight">
                        AI - WASTEBIN
                    </h1>

                    <h2 className="text-white text-2xl sm:text-5xl [font-family:var(--font-orbitron)] opacity-80">
                        MODEL - 1
                    </h2>

                    <p className="text-white/70 text-sm sm:text-base max-w-md [font-family:var(--font-imprima)]">
                        Smart solution for hospital waste management powered by AI detection
                        and automation.
                    </p>

                    {/* BUTTONS */}
                    <div className="flex flex-wrap gap-4">

                        {/* PRIMARY */}
                        <button className="relative px-8 py-3 text-sm cursor-pointer tracking-widest rounded-md overflow-hidden group [font-family:var(--font-hooge)]">
                            <span onClick={() => router.push("/dashboard")} className="relative z-10 text-white">
                                GET STARTED
                            </span>
                            <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#151515] to-[#0a0a0a]"></span>
                            <span className="absolute inset-0 opacity-0 group-hover:opacity-30 transition duration-300 bg-gradient-to-r from-white/20 via-white/40 to-white/20"></span>
                            <span className="absolute inset-0 border border-white/20 rounded-md group-hover:border-white/40 transition"></span>
                        </button>

                        {/* SECONDARY */}
                        <button className="px-8 py-3 cursor-pointer text-sm tracking-widest border border-white/20 rounded-md text-white/70 hover:text-white hover:border-white/40 transition-all duration-300 [font-family:var(--font-hooge)]">
                            DEMO
                        </button>

                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex justify-center">
                    <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[500px]">

                        {/* ── ASH ELLIPSE GLOW ── */}
                        <div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
                            style={{
                                width: "85%",
                                height: "70%",
                                borderRadius: "50%",
                                background: "radial-gradient(ellipse at center, #000 0%, #fff 30%, #000000 70%)",
                                opacity: 0.13,
                                filter: "blur(22px)",
                            }}
                        >
                            {/* Grain overlay via SVG filter */}
                            <svg
                                className="absolute inset-0 w-full h-full rounded-full"
                                style={{ opacity: 0.35, mixBlendMode: "overlay" }}
                            >
                                <filter id="grain">
                                    <feTurbulence
                                        type="fractalNoise"
                                        baseFrequency="0.75"
                                        numOctaves="4"
                                        stitchTiles="stitch"
                                    />
                                    <feColorMatrix type="saturate" values="0" />
                                </filter>
                                <rect width="100%" height="100%" filter="url(#grain)" />
                            </svg>
                        </div>

                        {/* MAIN IMAGE */}
                        <Image
                            src="/images/dustbin for website.png"
                            alt="AI"
                            width={500}
                            height={500}
                            className="w-full object-contain relative z-10"
                        />

                        {/* BASE IMAGE */}
                        <div className="absolute bottom-7 sm:bottom-10 left-0 w-[80%] z-0">
                            <Image
                                src="/images/base.jpg"
                                alt="base"
                                width={100}
                                height={100}
                                className="w-full object-contain"
                            />
                        </div>

                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-20 gap-8">
                {CARD_DATA && CARD_DATA.map((card) => (
                    <div
                        key={card.id}
                        className="relative border bg-gradient-to-b from-[#202020] via-[#151515] to-[#0a0a0a] border-white/10 rounded-xl sm:p-12 p-6 pr-16 hover:border-white/30 transition overflow-visible"
                    >
                        <div>
                            <h3 className="text-white mb-2 sm:text-xl [font-family:var(--font-hooge)]">
                                {card.title}
                            </h3>
                            <p className="text-white/60 text-sm [font-family:var(--font-imprima)]">
                                {card.description}
                            </p>
                        </div>

                        <div className="absolute -top-12 -right-6 w-24 sm:w-28 lg:w-32">
                            <Image
                                src={card.image}
                                alt={card.title}
                                width={120}
                                height={120}
                                className={`${card.id === 2 ? "scale-x-[-1]" : ""} w-full object-contain`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}