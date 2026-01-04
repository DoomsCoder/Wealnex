"use client";

import { useState } from "react";
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
import { Landmark, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function LinkBankButton() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mobileNumber, setMobileNumber] = useState("");

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

            // Redirect to Setu consent page
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="relative overflow-hidden border-2 border-dashed border-blue-300 hover:border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-blue-700">Link Bank Account</span>
                        <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                            PRO
                        </span>
                    </div>
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
                </Button>
            </DialogTrigger>
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
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs text-amber-700 flex items-center gap-1.5">
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
                            For sandbox testing, use: 9999999999
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
    );
}
