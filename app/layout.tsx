import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Level Trading - Predict Stocks & Crypto",
  description: "Fun and easy trading predictions for stocks and cryptocurrencies",
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

