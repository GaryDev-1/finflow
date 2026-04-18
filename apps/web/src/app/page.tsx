import { query } from '@/components/apollo/apollo-client';
import { DASHBOARD_QUERY } from '@/graphql/queries/dashboard';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { LoanStatusWidget } from '@/components/dashboard/LoanStatusWidget';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';

const DEFAULT_USER_ID = 'user-001';

export default async function DashboardPage() {
  const { data } = await query({
    query: DASHBOARD_QUERY,
    variables: { userId: DEFAULT_USER_ID },
  });

  const dashboard = (data as any)?.dashboard;

  return (
    <div>
      <WelcomeBanner />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          label="Total Balance"
          value={dashboard?.totalBalance ?? 0}
          type="money"
          accent="primary"
        />
        <SummaryCard
          label="Active Loans"
          value={dashboard?.activeLoansCount ?? 0}
          type="count"
          accent="secondary"
        />
        <SummaryCard
          label="Outstanding Debt"
          value={dashboard?.totalOutstanding ?? 0}
          type="money"
          accent="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={dashboard?.recentTransactions ?? []} />
        <LoanStatusWidget loans={dashboard?.activeLoans ?? []} />
      </div>
    </div>
  );
}
