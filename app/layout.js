import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoresProvider } from "@/contexts/stores-context";
import { CompanyProvider } from "@/contexts/company-context";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Namo",
  description: "Modern pharmacy inventory system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoresProvider>
          <CompanyProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </CompanyProvider>
        </StoresProvider>
      </body>
    </html>
  );
}
