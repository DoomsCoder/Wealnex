
import { Suspense } from "react";
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";
import { LinkBankButton } from "@/components/link-bank-button";
import { LinkedAccountCard } from "./_components/linked-account-card";
import { AiInsightsCard } from "@/components/ai-insights-card";
import { checkUser } from "@/lib/checkUser";


export default async function DashboardPage() {
  const [accounts, allTransactions, user] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
    checkUser(),
  ]);

  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Get budget for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  // Filter transactions for default account only (for AI insights)
  const defaultAccountTransactions = defaultAccount
    ? (allTransactions || []).filter(t => t.accountId === defaultAccount.id)
    : [];

  // Get user's plan (default to FREE)
  const userPlan = user?.plan || 'FREE';

  return (
    <div className="space-y-8">
      {/* Budget Progress */}
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Two-column layout: Overview + AI Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dashboard Overview - 2 columns */}
        <div className="lg:col-span-2">
          <Suspense fallback={"Loading Overview..."}>
            <DashboardOverview
              accounts={accounts}
              transactions={allTransactions || []}
            />
          </Suspense>
        </div>

        {/* AI Insights - 1 column (based on default account) */}
        <div className="lg:col-span-1">
          <AiInsightsCard
            transactions={defaultAccountTransactions}
            budgetData={budgetData}
            userPlan={userPlan}
            accountName={defaultAccount?.name || null}
          />
        </div>
      </div>

      {/* Accounts Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Your Accounts</h2>
        <p className="text-sm text-muted-foreground">
          {accounts?.length || 0} account{accounts?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed group">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5 group-hover:text-primary transition-colors">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {/* Link Bank Account Button */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed flex items-center justify-center">
          <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
            <LinkBankButton />
          </CardContent>
        </Card>

        {accounts.length > 0 &&
          accounts?.map((account) => {
            // Use LinkedAccountCard for linked bank accounts
            const isLinkedAccount = account.isLinked ||
              account.name.toLowerCase().includes('setu-fip') ||
              account.name.includes('XXXXXXXX') ||
              account.name.match(/^[A-Za-z-]+ - [A-Z]+\d+$/);

            if (isLinkedAccount) {
              return <LinkedAccountCard key={account.id} account={account} />;
            }
            return <AccountCard key={account.id} account={account} />;
          })}
      </div>
    </div>
  );
}