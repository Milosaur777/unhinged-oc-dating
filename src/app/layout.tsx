import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unhinged - RP Dating Platform",
  description: "Match with roleplaying characters, swipe, chat, and connect.",
  openGraph: {
    title: "Unhinged - RP Dating Platform",
    description: "Match with roleplaying characters, swipe, chat, and connect.",
    url: "https://unhinged-rp.vercel.app",
    siteName: "Unhinged",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Unhinged - RP Dating Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unhinged - RP Dating Platform",
    description: "Match with roleplaying characters, swipe, chat, and connect.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#08080e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className="noise-bg min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
