
import { Suspense } from "react";
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { LinkedAccountCard } from "./_components/linked-account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { LinkBankButton } from "@/components/link-bank-button";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";


export default async function DashboardPage() {
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  // Check for URL params (success/error from bank linking)
  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Get budget for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  // Separate linked and manual accounts
  const linkedAccounts = accounts?.filter((acc) => acc.isLinked) || [];
  const manualAccounts = accounts?.filter((acc) => !acc.isLinked) || [];

  return (
    <div className="space-y-8">
      {/* Budget Progress */}
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Dashboard Overview */}
      <Suspense fallback={"Loading Overview..."}>
        <DashboardOverview
          accounts={accounts}
          transactions={transactions || []}
        />
      </Suspense>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Add New Account Button */}
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {/* Link Bank Account Button */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
          <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
            <LinkBankButton />
          </CardContent>
        </Card>

        {/* Linked Accounts */}
        {linkedAccounts.map((account) => (
          <LinkedAccountCard key={account.id} account={account} />
        ))}

        {/* Manual Accounts */}
        {manualAccounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}