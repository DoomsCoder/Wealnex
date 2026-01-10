"use client";

import { useState } from "react";
import {
    ArrowUpRight,
    ArrowDownRight,
    Unlink,
    Landmark,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { updateDefaultAccount } from "@/actions/account";


export function LinkedAccountCard({ account }) {
    const {
        id,
        name,
        type,
        balance,
        isDefault,
    } = account;

    // Extract institution name and masked account number from the name
    // Format: "setu-fip-2 - XXXXXXXX3962"
    const nameParts = name.split(' - ');
    const institutionName = account.institutionName || nameParts[0] || 'Linked Bank';
    const maskedAccNumber = account.maskedAccNumber || nameParts[1] || 'XXXX';

    const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
    const [unlinking, setUnlinking] = useState(false);

    const {
        loading: updateDefaultLoading,
        fn: updateDefaultFn,
        data: updatedAccount,
        error,
    } = useFetch(updateDefaultAccount);

    const handleDefaultChange = async (event) => {
        event.preventDefault();

        if (isDefault) {
            toast.warning("You need at least 1 default account");
            return;
        }

        await updateDefaultFn(id);
    };

    const handleUnlink = async () => {
        setUnlinking(true);
        try {
            const response = await fetch("/api/setu/revoke-consent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId: id, deleteTransactions: false }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unlink failed");
            }

            toast.success("Bank account unlinked successfully");
            setUnlinkDialogOpen(false);
            window.location.reload();
        } catch (error) {
            console.error("Unlink error:", error);
            toast.error(error.message || "Failed to unlink account");
        } finally {
            setUnlinking(false);
        }
    };

    return (
        <>
            <Card className="hover:shadow-md transition-shadow group relative overflow-hidden border-blue-200">
                {/* Linked Badge */}
                <div className="absolute top-2 right-2 z-10">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium">
                        <Landmark className="h-3 w-3" />
                        <span>Linked</span>
                    </div>
                </div>

                <Link href={`/account/${id}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                                {institutionName || name}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground font-mono">
                                {maskedAccNumber || "••••"}
                            </p>
                        </div>
                        <Switch
                            checked={isDefault}
                            onClick={handleDefaultChange}
                            disabled={updateDefaultLoading}
                        />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{parseFloat(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {type.charAt(0) + type.slice(1).toLowerCase()} Account
                        </p>
                    </CardContent>

                    <CardFooter className="flex justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                            Income
                        </div>
                        <div className="flex items-center">
                            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                            Expense
                        </div>
                    </CardFooter>
                </Link>

                {/* Action buttons - shown on hover */}
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setUnlinkDialogOpen(true);
                        }}
                        className="h-8 px-2 bg-white text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Unlink className="h-4 w-4 mr-1" />
                        Unlink
                    </Button>
                </div>
            </Card>

            {/* Unlink Dialog */}
            <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Bank Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unlink <strong>{institutionName || name}</strong>?
                            <br /><br />
                            This will revoke consent and stop automatic transaction syncing.
                            Your existing transaction history will be preserved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={unlinking}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleUnlink}
                            disabled={unlinking}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {unlinking ? "Unlinking..." : "Unlink Account"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
