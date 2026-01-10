
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Wealnex",
  description: "Wealnex is a platform for managing your wealth.",
  icons: {
    icon: "/favicon.png",
  },
};

export default async function RootLayout({ children }) {
  const user = await checkUser();

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} theme-transition`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />
            <footer className="bg-muted py-12 border-t border-border">
              <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p>Made with ❤️ by DoomsCoder</p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
