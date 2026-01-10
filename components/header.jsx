'use client';

import { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { LayoutDashboard, PenBox, Crown, Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const Header = () => {
  const [userPlan, setUserPlan] = useState(null);

  // Fetch user plan on mount
  useEffect(() => {
    fetch("/api/upgrade")
      .then((res) => res.json())
      .then((data) => {
        if (data.plan) setUserPlan(data.plan);
      })
      .catch(() => setUserPlan('FREE'));
  }, []);

  const isPro = userPlan === 'PRO' || userPlan === 'BUSINESS';

  return (
    <div className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src={"/logo111.png"}
            alt="Wealnex Logo"
            height={60}
            width={200}
            className="h-12 w-auto object-contain dark:brightness-0 dark:invert"
          />
        </Link>
        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link
              href={"/dashboard"}
              className="text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <Button variant="outline">
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>

            <Link href={"/transaction/create"}>
              <Button className="flex items-center gap-2">
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transactions</span>
              </Button>
            </Link>

            {/* Show Upgrade CTA for Free users, Pro badge for Pro users */}
            {userPlan && (
              isPro ? (
                <Link href={"/pricing"}>
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity">
                    <Crown size={14} />
                    <span className="hidden md:inline">PRO</span>
                  </div>
                </Link>
              ) : (
                <Link href={"/pricing"}>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-amber-300 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  >
                    <Sparkles size={16} />
                    <span className="hidden md:inline">Upgrade</span>
                  </Button>
                </Link>
              )
            )}
          </SignedIn>

          <ThemeToggle />

          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">Login</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </div>
  );
};

export default Header;