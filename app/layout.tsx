import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart QR Ordering",
  description: "QR-based ordering for hotels and restaurants"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container py-6">
          <header className="mb-6">
            <h1 className="text-2xl font-bold">Smart QR Ordering</h1>
            <p className="text-slate-600">
              Multi-tenant QR ordering platform for hotels and restaurants
            </p>
          </header>
          {children}
          <footer className="mt-10 text-sm text-slate-500">
            ? {new Date().getFullYear()} Smart QR Ordering
          </footer>
        </div>
      </body>
    </html>
  );
}
