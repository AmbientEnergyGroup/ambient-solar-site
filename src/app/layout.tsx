import "./globals.css";
import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import { AuthProvider } from "@/lib/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";
import NavigationOptimizer from "@/components/NavigationOptimizer";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";

// Use Inter font with expanded character set and weights
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
});

// Use Orbitron font for futuristic/geometric text
const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
  weight: ["400", "700", "900"],
  preload: true,
});

export const metadata: Metadata = {
  title: 'Ambient Pro',
  description: 'Professional dashboard for managing your solar sales and canvassing',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  themeColor: '#000000',
  icons: {
    icon: '/three-lines-icon.svg',
    shortcut: '/three-lines-icon.svg',
    apple: '/three-lines-icon.svg',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/three-lines-icon.svg',
    },
  },
  // Performance optimizations
  other: {
    'X-DNS-Prefetch-Control': 'on',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} dark`}>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/images/ambient-logo-teal.jpeg" as="image" />
        <link rel="dns-prefetch" href="//firebase.googleapis.com" />
        <link rel="dns-prefetch" href="//maps.googleapis.com" />
        <link rel="preconnect" href="https://firebase.googleapis.com" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
      </head>
      <body className="min-h-screen bg-gray-700 font-orbitron antialiased">
        {/* Performance Optimizer - runs in background */}
        <PerformanceOptimizer />
        
        {/* Global Loading Animation - hidden by default */}
        <div id="global-loader" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-black"></div>
            </div>
          </div>
        </div>
        
        {/* Page content with authentication wrapper */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
