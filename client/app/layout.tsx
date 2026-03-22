import type { Metadata } from "next";
import { Imprima, Orbitron } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import LayoutProvider from "./LayoutProvider";

const imprima = Imprima({
  variable: "--font-imprima",
  subsets: ["latin"],
  weight: "400", // ONLY available weight
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: "400", // ONLY available weight
  display: "swap",
});

const hooge = localFont({
  src: "./fonts/hooge 05_54.ttf",
  variable: "--font-hooge",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAAF",
  description: "Hospital Waste AI Classifier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${imprima.variable} ${orbitron.variable} ${hooge.variable}  antialiased bg-black`}
        // style={{ fontFamily: "var(--font-outfit), sans-serif" }}
      >
        <LayoutProvider>
          {children}
        </LayoutProvider>
      </body>
    </html>
  );
}