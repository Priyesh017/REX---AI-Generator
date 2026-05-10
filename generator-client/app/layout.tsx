import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { dark } from "@clerk/themes";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { QueryProvider } from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "REX — AI Image Social Platform",
  description:
    "Generate stunning AI images from prompts, manage your studio drafts, and discover creator galleries on REX.",
  openGraph: {
    title: "REX — AI Image Social Platform",
    description: "The social platform for AI-generated art.",
    siteName: "REX",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        elements: {
          card: "bg-zinc-900 text-white rounded-2xl",
          formFieldInput: "bg-zinc-800 text-white border border-zinc-700",
          formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#030303]`}
        >
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="afterInteractive"
          />
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              style: {
                background: "#18181b",
                color: "#e4e4e7",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                fontSize: "13px",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
