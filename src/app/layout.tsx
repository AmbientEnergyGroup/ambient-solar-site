import "./globals.css";
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from "@/lib/contexts/AuthContext";

// Use Inter font with expanded character set and weights
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ["300", "400", "500", "600", "700", "800"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-gray-700 font-sans antialiased">
        {/* Global Loading Animation - hidden by default */}
        <div id="global-loader" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin"></div>
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
