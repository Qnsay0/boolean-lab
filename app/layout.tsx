import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "boolean-lab",
  description: "Klakulator webowy jako pomoc naukowa do kolokwium z logiki układów cyfrowych",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={cn("relative mx-auto min-h-dvh w-full max-w-7xl overflow-x-clip font-sans antialiased")}>{children}</body>
    </html>
  );
}
