import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import "./globals.css";

export const metadata = {
  title: "E-Commerce Store",
  description: "Online shopping store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <AuthProvider>
          <CurrencyProvider>
            <Navbar />
            <main className="container mx-auto">{children}</main>
            <Toaster richColors />
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
