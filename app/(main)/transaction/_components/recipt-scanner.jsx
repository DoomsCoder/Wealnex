"use client";

import { useRef, useEffect, useState } from "react";
import { Camera, Loader2, Lock, Crown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";
import { UpgradeModal } from "@/components/upgrade-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FREE_SCAN_LIMIT = 3;

export function ReceiptScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [scanInfo, setScanInfo] = useState({
    scansUsed: 0,
    plan: 'FREE',
    loading: true
  });

  // Fetch current scan count and plan
  useEffect(() => {
    fetch("/api/scan-info")
      .then((res) => res.json())
      .then((data) => {
        setScanInfo({
          scansUsed: data.scansUsed || 0,
          plan: data.plan || 'FREE',
          loading: false,
        });
      })
      .catch(() => {
        setScanInfo(prev => ({ ...prev, loading: false }));
      });
  }, []);

  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedData,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file) => {
    // Check if user has reached limit (only for FREE users)
    if (scanInfo.plan === 'FREE' && scanInfo.scansUsed >= FREE_SCAN_LIMIT) {
      setUpgradeModalOpen(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    await scanReceiptFn(file);
  };

  useEffect(() => {
    if (scannedData && !scanReceiptLoading) {
      onScanComplete(scannedData);
      toast.success("Receipt scanned successfully");

      // Persist scan count to database after successful scan
      if (scanInfo.plan === 'FREE') {
        fetch("/api/scan-info", { method: "POST" })
          .then((res) => res.json())
          .then((data) => {
            if (data.scansUsed !== undefined) {
              setScanInfo(prev => ({ ...prev, scansUsed: data.scansUsed }));
            } else {
              // Fallback: increment locally
              setScanInfo(prev => ({ ...prev, scansUsed: prev.scansUsed + 1 }));
            }
          })
          .catch(() => {
            // Fallback: increment locally
            setScanInfo(prev => ({ ...prev, scansUsed: prev.scansUsed + 1 }));
          });
      }
    }
  }, [scanReceiptLoading, scannedData]);

  const handleButtonClick = () => {
    // Check limit before allowing file selection
    if (scanInfo.plan === 'FREE' && scanInfo.scansUsed >= FREE_SCAN_LIMIT) {
      setUpgradeModalOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const isPro = scanInfo.plan !== 'FREE';
  const scansRemaining = FREE_SCAN_LIMIT - scanInfo.scansUsed;
  const isLimitReached = !isPro && scansRemaining <= 0;

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleReceiptScan(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className={`flex-1 h-10 transition-all ${isLimitReached
              ? "bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300 hover:from-amber-200 hover:to-orange-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-700"
              : "bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 text-white hover:text-white"
              }`}
            onClick={handleButtonClick}
            disabled={scanReceiptLoading || scanInfo.loading}
          >
            {scanReceiptLoading ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                <span>Scanning Receipt...</span>
              </>
            ) : isLimitReached ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                <span>Scan Limit Reached</span>
              </>
            ) : (
              <>
                <Camera className="mr-2" />
                <span>Scan Receipt with AI</span>
              </>
            )}
          </Button>

          {/* PRO badge or scan counter */}
          {isPro ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">
                    <Crown className="h-3 w-3" />
                    PRO
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Unlimited scans with Pro</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : !scanInfo.loading && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${scansRemaining <= 1
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-muted text-muted-foreground"
                    }`}>
                    <Camera className="h-3 w-3" />
                    {scanInfo.scansUsed}/{FREE_SCAN_LIMIT}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{scansRemaining} scan{scansRemaining !== 1 ? 's' : ''} remaining this month</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Low scan warning */}
        {!isPro && scansRemaining === 1 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Last free scan this month
          </p>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        feature="Unlimited Receipt Scans"
      />
    </>
  );
}