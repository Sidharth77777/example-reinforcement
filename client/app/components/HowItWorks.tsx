"use client";

import { ArrowRight, ArrowDown } from "lucide-react";
import Image from "next/image";

export default function HowItWorks() {
  const steps = [
    {
      title: "CAMERA SCANS WASTE",
      description: "Camera detects waste types",
      image: "/images/DIgital camera.png",
    },
    {
      title: "AI IDENTIFIES MATERIAL",
      description: "AI analyzes waste material",
      image: "/images/AI.png",
    },
    {
      title: "SMART SORTING MECHANISM",
      description: "Automated sorting process",
      image: "/images/sorting.png",
    },
    {
      title: "SORTED INTO BINS",
      description: "Waste placed in correct bins",
      image: "/images/bins.png",
    },
  ];

  return (
    <section className="w-full bg-black py-10 px-4 sm:px-6 lg:px-10">

      {/* TITLE */}
      <div className="flex items-center justify-center gap-4 mb-16">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#6c6c6c]" />
        <h2 className="text-xl sm:text-2xl lg:text-3xl text-white [font-family:var(--font-hooge)] tracking-widest">
          HOW IT WORKS
        </h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#6c6c6c] to-transparent" />
      </div>

      {/* STEPS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 relative">

        {steps.map((step, index) => (
          <div key={index} className="relative flex flex-col items-center text-center group">

            {/* CARD */}
            <div className="relative group hover:-translate-y-2 transition duration-300 w-full max-w-[220px] rounded-xl p-6 hover:border-white/30 transition">

              {/* IMAGE */}
              <div className="mb-4 flex justify-center">
                <div className="w-40 sm:w-40 lg:w-60">
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={140}
                    height={140}
                    className="w-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:scale-110 transition duration-300"
                  />
                </div>
              </div>

              {/* TEXT */}
              <h3 className="text-white text-sm sm:text-base [font-family:var(--font-hooge)]">
                {step.title}
              </h3>

              {/* <p className="text-white/60 text-xs sm:text-sm mt-2 [font-family:var(--font-imprima)]">
                {step.description}
              </p> */}

            </div>

            {index !== steps.length - 1 && (
              <div
                className="hidden md:flex items-center absolute top-1/2 -right-12 animate-[fadeLoop_2.5s_ease-in-out_infinite]"
                style={{ animationDelay: `${index * 0.6}s` }}
              >
                <div className="w-20 lg:w-24 h-[2px] bg-gradient-to-r from-[#000] to-[#6c6c6c]" />
                <div className="w-3 h-3 border-t-2 border-r-2 border-[#6C6C6C] rotate-45 -ml-2" />
              </div>
            )}

            {index !== steps.length - 1 && (
              <div
                className="md:hidden flex flex-col items-center mt-6 animate-[fadeLoop_2.5s_ease-in-out_infinite]"
                style={{ animationDelay: `${index * 0.6}s` }}
              >
                <div className="h-10 w-[2px] bg-gradient-to-b from-[#000] to-[#6c6c6c]" />
                <div className="w-3 h-3 border-b-2 border-r-2 border-[#6C6C6C] rotate-45 -mt-2" />
              </div>
            )}
          </div>
        ))}

      </div>
    </section>
  );
}