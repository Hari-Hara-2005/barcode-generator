import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barcode Agentwarebot - Professional Barcode & Label Designer",
  description:
    "Professional barcode label design software - Barcode Agentwarebot. Features New Document Wizard, multi-label grid layout, high-precision linear and 2D barcode generation, print preview, and data entry forms.",
  keywords: "barcode agentwarebot, barcode tender, barcode generator, label designer, zebra, qr code, code128, ean13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
