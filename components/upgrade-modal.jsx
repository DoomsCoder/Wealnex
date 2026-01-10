"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const proFeatures = [
    "Bank linking via Account Aggregator",
    "Auto-sync transactions",
    "Unlimited AI insights",
    "Export reports (CSV/PDF)",
];

// Load Razorpay script dynamically
function loadRazorpayScript() {
    return new Promise((resolve) => {
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
}

export function UpgradeModal({ open, onOpenChange, feature = "this feature" }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isYearly, setIsYearly] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);

        try {
            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
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
                    color: "#7C3AED", // Violet color matching your brand
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

                        onOpenChange(false);

                        // Reload to refresh user data
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } catch (verifyError) {
                        console.error("Verification error:", verifyError);
                        toast.error("Payment verification failed", {
                            description: "Please contact support if amount was deducted.",
                        });
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
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
            });
            razorpay.open();
        } catch (error) {
            console.error("Upgrade error:", error);
            toast.error("Failed to start payment", {
                description: error.message,
            });
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                            <Crown className="h-5 w-5 text-white" />
                        </div>
                        <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
                    </div>
                    <DialogDescription>
                        Unlock <strong>{feature}</strong> and all Pro features for just {isYearly ? "₹999/year" : "₹149/month"}.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Features List */}
                    <div className="space-y-3 mb-6">
                        <p className="text-sm font-medium text-foreground">Pro includes:</p>
                        {proFeatures.map((feat, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-muted-foreground">{feat}</span>
                            </div>
                        ))}
                    </div>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className={`text-sm ${!isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>Monthly</span>
                        <button
                            type="button"
                            onClick={() => setIsYearly(!isYearly)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isYearly ? "bg-primary" : "bg-muted"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? "translate-x-6" : "translate-x-1"
                                    }`}
                            />
                        </button>
                        <span className={`text-sm ${isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>Yearly</span>
                        {isYearly && (
                            <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                                Save ₹789
                            </span>
                        )}
                    </div>

                    {/* Price Display */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/20">
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">Pro Plan</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-foreground">{isYearly ? "₹999" : "₹149"}</span>
                                <span className="text-muted-foreground">{isYearly ? "/year" : "/month"}</span>
                            </div>
                        </div>
                        {isYearly && (
                            <p className="text-xs text-muted-foreground mt-1 text-right">
                                Just ₹83/month, billed annually
                            </p>
                        )}
                    </div>

                    {/* Demo Notice */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <Sparkles className="h-3 w-3" />
                        <span>🧪 Razorpay Sandbox — Test Card: 5267 3181 8797 5449</span>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Crown className="mr-2 h-4 w-4" />
                                Pay with Razorpay — {isYearly ? "₹999/year" : "₹149/month"}
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/pricing")}
                        className="w-full"
                    >
                        Compare all plans
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Simple hook to use the upgrade modal
export function useUpgradeModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [feature, setFeature] = useState("this feature");

    const openUpgradeModal = (featureName) => {
        setFeature(featureName || "this feature");
        setIsOpen(true);
    };

    const closeUpgradeModal = () => {
        setIsOpen(false);
    };

    return {
        isOpen,
        feature,
        openUpgradeModal,
        closeUpgradeModal,
        setIsOpen,
    };
}

