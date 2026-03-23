import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "@financeos/ui/styles.css";

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinanceOS",
  description: "Personal finance tracking dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={lora.className}>{children}</body>
    </html>
  );
}
