"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, Bot, X } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";
import { classifyTransaction } from "@/lib/ai-classify";

// AI Detection Badge Component
function AiBadge({ onClear }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 animate-in fade-in duration-300">
      <Bot className="h-3 w-3" />
      AI detected
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="ml-0.5 hover:bg-violet-200 dark:hover:bg-violet-800 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export function AddTransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Track which fields were AI-detected
  const [aiDetected, setAiDetected] = useState({
    type: false,
    category: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editMode && initialData
        ? {
          type: initialData.type,
          amount: initialData.amount.toString(),
          description: initialData.description,
          accountId: initialData.accountId,
          category: initialData.category,
          date: new Date(initialData.date),
          isRecurring: initialData.isRecurring,
          ...(initialData.recurringInterval && {
            recurringInterval: initialData.recurringInterval,
          }),
        }
        : {
          type: "EXPENSE",
          amount: "",
          description: "",
          accountId: accounts.find((ac) => ac.isDefault)?.id,
          date: new Date(),
          isRecurring: false,
        },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  const onSubmit = (data) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
    };
    if (editMode) {
      transactionFn(editId, formData);
    } else {
      transactionFn(formData);
    }
  };

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully"
      );
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading, editMode]);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const description = watch("description");

  // AI auto-classification when description changes
  const runAiClassification = useDebouncedCallback((desc) => {
    if (!desc || desc.length < 3 || editMode) return;

    const result = classifyTransaction(desc);

    if (result.isAiDetected && result.confidence > 0.5) {
      // Auto-set type if not manually changed
      if (result.type && !aiDetected.typeManuallySet) {
        setValue("type", result.type);
        setAiDetected(prev => ({ ...prev, type: true }));
      }

      // Auto-set category if valid and not manually changed
      if (result.category && !aiDetected.categoryManuallySet) {
        const validCategory = categories.find(c => c.id === result.category);
        if (validCategory && validCategory.type === (result.type || type)) {
          setValue("category", result.category);
          setAiDetected(prev => ({ ...prev, category: true }));
        }
      }
    }
  }, 500);

  // Watch description changes for AI classification
  useEffect(() => {
    runAiClassification(description);
  }, [description]);

  // Clear AI badge when user manually changes a field
  const handleTypeChange = (value) => {
    setValue("type", value);
    setAiDetected(prev => ({ ...prev, type: false, typeManuallySet: true }));
  };

  const handleCategoryChange = (value) => {
    setValue("category", value);
    setAiDetected(prev => ({ ...prev, category: false, categoryManuallySet: true }));
  };

  const clearAiType = () => {
    setAiDetected(prev => ({ ...prev, type: false, typeManuallySet: true }));
  };

  const clearAiCategory = () => {
    setAiDetected(prev => ({ ...prev, category: false, categoryManuallySet: true }));
  };

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  const handleScanComplete = (scannedData) => {
    if (scannedData) {
      setValue("amount", scannedData.amount.toString());
      setValue("date", new Date(scannedData.date));
      if (scannedData.description) {
        setValue("description", scannedData.description);
      }
      if (scannedData.category) {
        setValue("category", scannedData.category);
        setAiDetected(prev => ({ ...prev, category: true }));
      }
      // Set type to expense for receipts (usually expenses)
      setValue("type", "EXPENSE");
      setAiDetected(prev => ({ ...prev, type: true }));
      toast.success("Receipt scanned successfully");
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Receipt Scanner - Only show in create mode */}
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      {/* Type */}
      <div className="space-y-2 w-full">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Type</label>
          {aiDetected.type && <AiBadge onClear={clearAiType} />}
        </div>
        <Select
          onValueChange={handleTypeChange}
          value={type}
        >
          <SelectTrigger className={cn(
            "w-full rounded-md border bg-background px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary",
            aiDetected.type && "border-violet-300 dark:border-violet-700"
          )}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* Amount and Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (₹{parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button
                  variant="ghost"
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2 w-full">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Category</label>
          {aiDetected.category && <AiBadge onClear={clearAiCategory} />}
        </div>
        <Select
          onValueChange={handleCategoryChange}
          value={getValues("category")}
        >
          <SelectTrigger className={cn(
            "w-full rounded-md border bg-background px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary",
            aiDetected.category && "border-violet-300 dark:border-violet-700"
          )}>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => setValue("date", date)}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input placeholder="Enter description (AI will auto-classify)" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Recurring Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Recurring Transaction</label>
          <div className="text-sm text-muted-foreground">
            Set up a recurring schedule for this transaction
          </div>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>

      {/* Recurring Interval */}
      {isRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select
            onValueChange={(value) => setValue("recurringInterval", value)}
            defaultValue={getValues("recurringInterval")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-primary text-primary-foreground"
          disabled={transactionLoading}
        >{transactionLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {editMode ? "Updating..." : "Creating..."}
          </>
        ) : editMode ? (
          "Update Transaction"
        ) : (
          "Create Transaction"
        )}
        </Button>
      </div>
    </form>
  );
}