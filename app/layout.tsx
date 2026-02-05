import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Park Manager",
  description: "GIS Park Management App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-screen`}>
        {/* Navbar đã được xóa, children sẽ chiếm toàn bộ trang */}
        {children}
      </body>
    </html>
  );
}
