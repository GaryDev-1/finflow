import { query } from '@/components/apollo/apollo-client';
import { LOANS_QUERY } from '@/graphql/queries/loans';
import { LoanCard } from '@/components/loans/LoanCard';
import { PageHeader } from '@/components/ui/PageHeader';

const DEFAULT_USER_ID = 'user-001';

export default async function LoansPage() {
  const { data } = await query({
    query: LOANS_QUERY,
    variables: { userId: DEFAULT_USER_ID },
  });

  const result = data as any;
  const loans = result?.loans?.loans ?? [];
  const pageInfo = result?.loans?.pageInfo;

  return (
    <div>
      <PageHeader
        title="Loans"
        subtitle={`${pageInfo?.total ?? 0} loan${(pageInfo?.total ?? 0) !== 1 ? 's' : ''}`}
      />
      <div className="flex flex-col gap-4">
        {loans.map((loan: any) => (
          <LoanCard key={loan.id} loan={loan} />
        ))}
      </div>
    </div>
  );
}
