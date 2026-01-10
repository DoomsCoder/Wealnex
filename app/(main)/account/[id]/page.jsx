import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/account";
import { notFound } from "next/navigation";
import { BarLoader } from "react-spinners";
import { TransactionTable } from "../_components/transaction-table";
import { AccountChart } from "../_components/account-chart";
import { ExportButton } from "@/components/export-button";
import { AiInsightsCard } from "@/components/ai-insights-card";
import { checkUser } from "@/lib/checkUser";

export default async function AccountPage({ params }) {
  const { id } = await params;
  const [accountData, user] = await Promise.all([
    getAccountWithTransactions(id),
    checkUser(),
  ]);

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;
  const userPlan = user?.plan || 'FREE';

  return (
    <div className="space-y-8 px-5">
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-xl sm:text-2xl font-bold">
            ₹{parseFloat(account.balance).toFixed(2)}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {account._count.transactions} Transactions
            </p>
            <ExportButton transactions={transactions} accountName={account.name} />
          </div>
        </div>
      </div>

      {/* Chart + AI Insights Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense
            fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
          >
            <AccountChart transactions={transactions} />
          </Suspense>
        </div>

        <div className="lg:col-span-1">
          <AiInsightsCard
            transactions={transactions}
            userPlan={userPlan}
            accountName={account.name}
          />
        </div>
      </div>

      {/* Transactions Table */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}