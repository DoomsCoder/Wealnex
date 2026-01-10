"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/components/hero";
import Link from "next/link";
import {
  whyWealnexData,
  howItWorksData,
  featuresData,
  securityData,
  footerData,
} from "@/data/landing";
import {
  ArrowRight,
  ExternalLink,
  Github,
  Key,
  Brain,
  Shield,
  Lock,
  ArrowRightLeft,
  Cpu,
  Lightbulb,
  CreditCard,
  Receipt,
  PieChart,
  Wallet,
  Zap,
  Play,
  ShieldCheck,
  FileKey,
  Eye,
} from "lucide-react";

// Icon map for dynamic rendering
const iconMap = {
  Key,
  Brain,
  Shield,
  Lock,
  ArrowRightLeft,
  Cpu,
  Lightbulb,
  CreditCard,
  Receipt,
  PieChart,
  Wallet,
  Zap,
  Play,
  ShieldCheck,
  FileKey,
  Eye,
};

const LandingPage = () => {
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
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".scroll-animate");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Why Wealnex Section */}
      <section id="why-wealnex" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Wealnex
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for the new era of open banking in India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {whyWealnexData.map((item, index) => {
              const Icon = iconMap[item.iconName];
              return (
                <Card
                  key={index}
                  className="border border-border bg-card scroll-animate card-hover"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center mx-auto mb-6">
                      {Icon && <Icon className="w-7 h-7 text-primary" />}
                    </div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-3">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section - AA Flow Stepper */}
      <section id="how-it-works" className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powered by India's RBI Account Aggregator Framework
            </p>
          </div>

          {/* Horizontal Stepper */}
          <div className="relative max-w-6xl mx-auto scroll-animate">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-1 stepper-line rounded-full" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorksData.map((step, index) => {
                const Icon = iconMap[step.iconName];
                return (
                  <div key={index} className="relative text-center">
                    {/* Step Circle */}
                    <div className="relative z-10 w-32 h-32 rounded-full bg-card border-4 border-border shadow-lg flex flex-col items-center justify-center mx-auto mb-6 hover-lift">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center mb-1">
                        {Icon && <Icon className="w-8 h-8 text-white" />}
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">
                        STEP {step.step}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm font-medium text-primary mb-2">
                      {step.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for intelligent financial management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featuresData.map((feature, index) => {
              const Icon = iconMap[feature.iconName];
              return (
                <Card
                  key={index}
                  className="border border-border bg-card scroll-animate card-hover group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center group-hover:from-primary group-hover:to-violet-500 transition-all duration-300">
                        {Icon && <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />}
                      </div>
                      {feature.tag && (
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${feature.tag === "AI"
                            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            : feature.tag === "AA"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                        >
                          {feature.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section id="security" className="py-24 bg-[#0F172A]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Security & Compliance
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Your financial data is protected by enterprise-grade security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {securityData.map((item, index) => {
              const Icon = iconMap[item.iconName];
              return (
                <div
                  key={index}
                  className="scroll-animate p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                    {Icon && <Icon className="w-6 h-6 text-green-400" />}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Experience Intelligent Finance?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Try the demo with sandbox data — no real bank account required.
            </p>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg font-semibold hover-lift"
              >
                Start Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Sandbox powered • No OTP required for demo
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Product */}
            <div>
              <h4 className="font-semibold text-card-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                {footerData.product.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-primary text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security */}
            <div>
              <h4 className="font-semibold text-card-foreground mb-4">Security</h4>
              <ul className="space-y-3">
                {footerData.security.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-primary text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech Stack */}
            <div>
              <h4 className="font-semibold text-card-foreground mb-4">Tech Stack</h4>
              <ul className="space-y-3">
                {footerData.techStack.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary text-sm transition-colors inline-flex items-center gap-1"
                    >
                      {item.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* GitHub */}
            <div>
              <h4 className="font-semibold text-card-foreground mb-4">Open Source</h4>
              <a
                href={footerData.social[0].href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="text-sm font-medium">View on GitHub</span>
              </a>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Wealnex. Built for RBI AA Framework.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Sandbox Mode Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;