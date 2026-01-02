
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser"; // 👈 import it
import { Toaster } from "sonner";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Wealnex",
  description: "Wealnex is a platform for managing your wealth.",
  icons: {
    icon: "/favicon.png",
  },
};

export default async function RootLayout({ children }) {
  const user = await checkUser(); // 👈 Call it here to create/fetch user in DB

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Toaster richColors />
          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>Made with ❤️ by DoomsCoder</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
