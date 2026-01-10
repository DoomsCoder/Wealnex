"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Crown, Building2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

const getPlans = (isYearly) => [
    {
        id: "FREE",
        name: "Free",
        price: "₹0",
        period: "forever",
        description: "Get started with manual expense tracking",
        features: [
            "Unlimited manual accounts",
            "Transaction tracking",
            "Basic budget alerts",
            "AI insights (3/month)",
        ],
        cta: "Current Plan",
        disabled: true,
    },
    {
        id: "PRO",
        name: "Pro",
        price: isYearly ? "₹999" : "₹149",
        period: isYearly ? "/year" : "/month",
        description: "Full power with bank linking and AI",
        features: [
            "Everything in Free",
            "Bank linking via Account Aggregator",
            "Auto-sync transactions",
            "Unlimited AI insights",
            "Export reports (CSV/PDF)",
        ],
        cta: "Upgrade to Pro",
        popular: true,
        icon: Crown,
        savings: isYearly ? "Save ₹789" : null,
    },
    {
        id: "BUSINESS",
        name: "Business",
        price: "Contact Us",
        period: "",
        description: "Team finance management",
        features: [
            "Everything in Pro",
            "Multi-user access",
            "API access",
            "Priority support",
        ],
        cta: "Coming Soon",
        comingSoon: true,
        disabled: true,
        icon: Building2,
    },
];

export default function PricingPage() {
    const router = useRouter();
    const [currentPlan, setCurrentPlan] = useState("FREE");
    const [loading, setLoading] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [isYearly, setIsYearly] = useState(false);

    const plans = getPlans(isYearly);

    useEffect(() => {
        // Fetch current plan
        fetch("/api/upgrade")
            .then((res) => res.json())
            .then((data) => {
                if (data.plan) setCurrentPlan(data.plan);
            })
            .catch(console.error);
    }, []);

    const handleUpgrade = async (planId) => {
        if (planId === currentPlan || planId === "BUSINESS") return;

        setUpgrading(true);
        setLoading(true);

        try {
            // Load Razorpay script dynamically
            const scriptLoaded = await new Promise((resolve) => {
                if (window.Razorpay) {
                    resolve(true);
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });

            if (!scriptLoaded) {
                throw new Error("Failed to load payment gateway");
            }

            // Create order on backend
            const orderResponse = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isYearly }),
            });

            const orderData = await orderResponse.json();

            if (!orderResponse.ok) {
                throw new Error(orderData.error || "Failed to create order");
            }

            // Open Razorpay checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Wealnex",
                description: `Pro Plan (${isYearly ? "Yearly" : "Monthly"})`,
                order_id: orderData.orderId,
                prefill: {
                    email: orderData.userEmail,
                    name: orderData.userName,
                },
                theme: {
                    color: "#7C3AED",
                },
                handler: async function (response) {
                    // Payment successful - verify on backend
                    try {
                        const verifyResponse = await fetch("/api/payment/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        const verifyData = await verifyResponse.json();

                        if (!verifyResponse.ok) {
                            throw new Error(verifyData.error || "Payment verification failed");
                        }

                        // Success!
                        toast.success("Welcome to Wealnex Pro! 🚀", {
                            description: "Your account has been upgraded successfully.",
                        });

                        setCurrentPlan("PRO");

                        // Redirect to dashboard
                        setTimeout(() => {
                            router.push("/dashboard");
                        }, 1500);
                    } catch (verifyError) {
                        console.error("Verification error:", verifyError);
                        toast.error("Payment verification failed", {
                            description: "Please contact support if amount was deducted.",
                        });
                    } finally {
                        setLoading(false);
                        setUpgrading(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        setUpgrading(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on("payment.failed", function (response) {
                console.error("Payment failed:", response.error);
                toast.error("Payment failed", {
                    description: response.error.description || "Please try again.",
                });
                setLoading(false);
                setUpgrading(false);
            });
            razorpay.open();
        } catch (error) {
            console.error("Upgrade error:", error);
            toast.error("Failed to start payment", {
                description: error.message,
            });
            setLoading(false);
            setUpgrading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        Start free, upgrade when you're ready. No hidden fees.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-muted/50 border border-border">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isYearly
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isYearly
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Yearly
                            <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                                Save ₹789
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {plans.map((plan) => {
                        const isCurrentPlan = plan.id === currentPlan;
                        const Icon = plan.icon;

                        return (
                            <Card
                                key={plan.id}
                                className={`relative overflow-hidden transition-all duration-300 ${plan.popular
                                    ? "border-2 border-primary shadow-lg scale-105 z-10"
                                    : "border border-border"
                                    } ${plan.comingSoon ? "opacity-75" : ""}`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            POPULAR
                                        </div>
                                    </div>
                                )}

                                {/* Coming Soon Badge */}
                                {plan.comingSoon && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            COMING SOON
                                        </div>
                                    </div>
                                )}

                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {Icon && <Icon className="h-5 w-5 text-primary" />}
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-foreground">
                                            {plan.price}
                                        </span>
                                        <span className="text-muted-foreground">{plan.period}</span>
                                    </div>
                                    <CardDescription className="mt-2">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="pb-6">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-muted-foreground">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        className={`w-full ${plan.popular && !isCurrentPlan
                                            ? "bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
                                            : ""
                                            }`}
                                        variant={isCurrentPlan ? "outline" : plan.comingSoon ? "secondary" : "default"}
                                        disabled={plan.disabled || isCurrentPlan || loading}
                                        onClick={() => handleUpgrade(plan.id)}
                                    >
                                        {upgrading && plan.id === "PRO" ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : isCurrentPlan ? (
                                            "Current Plan"
                                        ) : (
                                            plan.cta
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* Demo Notice */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-sm text-amber-600 dark:text-amber-400">
                            🧪 Demo Mode — Razorpay Sandbox (No real payment) • Test Card: 4111 1111 1111 1111
                        </span>
                    </div>
                </div>

                {/* FAQ or additional info */}
                <div className="mt-16 max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        Why upgrade to Pro?
                    </h2>
                    <p className="text-muted-foreground">
                        Pro users can link their bank accounts via India's RBI Account Aggregator framework.
                        This means your transactions sync automatically — no manual entry needed.
                        Plus, you get unlimited AI-powered insights to help you make smarter financial decisions.
                    </p>
                </div>
            </div>
        </div>
    );
}
