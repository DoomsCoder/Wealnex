"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Loader2, Sparkles, Wand2, Lock } from "lucide-react";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/upgrade-modal";

export function LinkBankButton() {
    const [open, setOpen] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [mobileNumber, setMobileNumber] = useState("");
    const [userPlan, setUserPlan] = useState("FREE");
    const [planLoading, setPlanLoading] = useState(true);

    // Fetch user's current plan
    useEffect(() => {
        fetch("/api/upgrade")
            .then((res) => res.json())
            .then((data) => {
                if (data.plan) setUserPlan(data.plan);
            })
            .catch(console.error)
            .finally(() => setPlanLoading(false));
    }, []);

    const handleButtonClick = () => {
        if (userPlan === "FREE") {
            // Show upgrade modal for free users
            setUpgradeModalOpen(true);
        } else {
            // Pro/Business users can link bank
            setOpen(true);
        }
    };

    const handleLinkBank = async () => {
        if (!mobileNumber || mobileNumber.length !== 10) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/setu/create-consent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobileNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create consent");
            }

            if (data.redirectUrl) {
                toast.success("Redirecting to bank consent page...");
                window.location.href = data.redirectUrl;
            } else {
                throw new Error("No redirect URL received");
            }
        } catch (error) {
            console.error("Link bank error:", error);
            toast.error(error.message || "Failed to link bank account");
        } finally {
            setLoading(false);
        }
    };

    const handleDemoMode = async () => {
        setDemoLoading(true);
        try {
            const response = await fetch("/api/setu/demo-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bankName: "HDFC" }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create demo account");
            }

            toast.success("Demo bank account linked successfully!");
            setOpen(false);
            window.location.reload();
        } catch (error) {
            console.error("Demo mode error:", error);
            toast.error(error.message || "Failed to create demo account");
        } finally {
            setDemoLoading(false);
        }
    };

    const isPro = userPlan !== "FREE";

    return (
        <>
            {/* Main Button */}
            <Button
                variant="outline"
                onClick={handleButtonClick}
                disabled={planLoading}
                className={`relative overflow-hidden border-2 border-dashed transition-all group ${isPro
                    ? "border-blue-300 hover:border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30"
                    : "border-amber-300 hover:border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30"
                    }`}
            >
                <div className="flex items-center gap-2">
                    {isPro ? (
                        <Landmark className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    ) : (
                        <Lock className="h-5 w-5 text-amber-600 group-hover:scale-110 transition-transform" />
                    )}
                    <span className={`font-medium ${isPro ? "text-blue-700 dark:text-blue-400" : "text-amber-700 dark:text-amber-400"}`}>
                        Link Bank Account
                    </span>
                    <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                        PRO
                    </span>
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
            </Button>

            {/* Upgrade Modal for Free Users */}
            <UpgradeModal
                open={upgradeModalOpen}
                onOpenChange={setUpgradeModalOpen}
                feature="Bank Linking"
            />

            {/* Bank Linking Dialog for Pro Users */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Landmark className="h-5 w-5 text-blue-600" />
                            Link Your Bank Account
                        </DialogTitle>
                        <DialogDescription>
                            Connect your bank account to automatically sync transactions.
                            Powered by RBI's Account Aggregator framework.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {/* Sandbox Notice */}
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <span className="text-amber-500">⚠️</span>
                                <span>
                                    <strong>Sandbox Mode</strong> - Demo only. No real bank data is accessed.
                                </span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile Number</Label>
                            <Input
                                id="mobile"
                                placeholder="Enter 10-digit mobile number"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                maxLength={10}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter your mobile number linked to your bank account
                            </p>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">What happens next:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>You'll be redirected to the consent page</li>
                                <li>Select your bank and approve data sharing</li>
                                <li>Transactions will be automatically synced</li>
                            </ol>
                        </div>

                        {/* Demo Mode Section */}
                        <div className="pt-3 border-t">
                            <button
                                onClick={handleDemoMode}
                                disabled={demoLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium text-sm transition-all disabled:opacity-50"
                            >
                                {demoLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating Demo Account...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-4 w-4" />
                                        Quick Demo (Skip OTP)
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                Creates a sample linked account with transactions
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLinkBank}
                            disabled={loading || mobileNumber.length !== 10}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Landmark className="mr-2 h-4 w-4" />
                                    Connect Bank
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
