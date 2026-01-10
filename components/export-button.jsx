"use client";

import { useState, useEffect } from "react";
import { Download, Lock, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeModal } from "@/components/upgrade-modal";
import { toast } from "sonner";

export function ExportButton({ transactions = [], accountName = "transactions" }) {
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [userPlan, setUserPlan] = useState("FREE");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/upgrade")
            .then((res) => res.json())
            .then((data) => {
                if (data.plan) setUserPlan(data.plan);
            })
            .catch(console.error);
    }, []);

    const isPro = userPlan !== "FREE";

    const handleExport = async (format) => {
        if (!isPro) {
            setUpgradeModalOpen(true);
            return;
        }

        if (!transactions || transactions.length === 0) {
            toast.error("No transactions to export");
            return;
        }

        setLoading(true);

        try {
            if (format === "csv") {
                exportToCSV();
            } else if (format === "json") {
                exportToJSON();
            }
            toast.success(`Exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error("Failed to export");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = ["Date", "Type", "Category", "Amount", "Description"];
        const rows = transactions.map((t) => [
            new Date(t.date).toLocaleDateString(),
            t.type,
            t.category,
            t.type === "EXPENSE" ? -t.amount : t.amount,
            `"${(t.description || "").replace(/"/g, '""')}"`,
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        downloadFile(csv, `${accountName}-${new Date().toISOString().split("T")[0]}.csv`, "text/csv");
    };

    const exportToJSON = () => {
        const data = transactions.map((t) => ({
            date: t.date,
            type: t.type,
            category: t.category,
            amount: t.amount,
            description: t.description,
        }));
        downloadFile(JSON.stringify(data, null, 2), `${accountName}-${new Date().toISOString().split("T")[0]}.json`, "application/json");
    };

    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className={!isPro ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400" : ""}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : isPro ? (
                            <Download className="h-4 w-4 mr-2" />
                        ) : (
                            <Lock className="h-4 w-4 mr-2" />
                        )}
                        Export
                        {!isPro && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                                PRO
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("csv")} disabled={!isPro}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export as CSV
                        {!isPro && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("json")} disabled={!isPro}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as JSON
                        {!isPro && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <UpgradeModal
                open={upgradeModalOpen}
                onOpenChange={setUpgradeModalOpen}
                feature="Export Reports"
            />
        </>
    );
}
