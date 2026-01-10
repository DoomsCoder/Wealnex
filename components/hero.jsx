"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shield, Lock, Brain, TrendingUp, Wallet, ArrowUpRight } from "lucide-react";

const HeroSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    // Scroll animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".scroll-animate");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen pt-32 pb-20 px-4 bg-background relative overflow-hidden"
    >
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight gradient-title leading-tight">
                Manage Your Finances
                <br />
                with Intelligence
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                A consent-driven financial intelligence platform built on the{" "}
                <span className="text-primary font-semibold">
                  RBI Account Aggregator framework
                </span>{" "}
                — secure, compliant, and AI-powered.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold hover-lift"
                >
                  Try Live Demo
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="https://github.com/DoomsCoder">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold border-2 border-border hover:border-primary hover:text-primary hover-lift"
                >
                  View Architecture
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground badge-hover">
                <div className="w-8 h-8 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium">RBI AA Sandbox</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground badge-hover">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium">End-to-End Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground badge-hover">
                <div className="w-8 h-8 rounded-full bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="font-medium">AI-Powered Insights</span>
              </div>
            </div>
          </div>

          {/* Right: Floating Dashboard Visual */}
          <div className="relative lg:h-[500px] flex items-center justify-center">
            {/* Main Dashboard Card */}
            <div className="relative w-full max-w-md">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-3xl blur-3xl" />

              {/* Main Card */}
              <div className="relative bg-card rounded-2xl shadow-2xl border border-border p-6 animate-float">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Balance</p>
                    <p className="text-3xl font-bold text-primary">
                      ₹4,52,847
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="h-20 bg-gradient-to-r from-blue-500/10 to-violet-500/10 rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-1 bg-primary rounded-full" />
                    <div className="h-16 w-1 bg-violet-500 rounded-full" />
                    <div className="h-10 w-1 bg-blue-400 rounded-full" />
                    <div className="h-14 w-1 bg-primary rounded-full" />
                    <div className="h-8 w-1 bg-violet-500 rounded-full" />
                    <div className="h-12 w-1 bg-blue-400 rounded-full" />
                    <div className="h-16 w-1 bg-primary rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating Card 1 - Transactions */}
              <div className="absolute -top-4 -right-4 lg:-right-12 bg-card rounded-xl shadow-lg border border-border p-4 w-48 animate-float-delayed">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    This Month
                  </span>
                </div>
                <p className="text-sm font-semibold text-card-foreground">
                  +₹28,450 Income
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">↑ 12% from last month</p>
              </div>

              {/* Floating Card 2 - AI Insight */}
              <div className="absolute -bottom-4 -left-4 lg:-left-12 bg-card rounded-xl shadow-lg border border-border p-4 w-56 animate-float-slow">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    AI Insight
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  "Reduce dining expenses by 15% to meet your savings goal."
                </p>
              </div>

              {/* Floating Card 3 - Consent Status */}
              <div className="absolute top-1/2 -right-8 lg:-right-20 transform -translate-y-1/2 bg-card rounded-lg shadow-md border border-border px-4 py-2 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Consent Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;