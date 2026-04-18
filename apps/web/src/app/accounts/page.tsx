import { query } from '@/components/apollo/apollo-client';
import { ACCOUNTS_QUERY } from '@/graphql/queries/accounts';
import { AccountsView } from '@/components/accounts/AccountsView';
import { PageHeader } from '@/components/ui/PageHeader';

const DEFAULT_USER_ID = 'user-001';

export default async function AccountsPage() {
  const { data } = await query({
    query: ACCOUNTS_QUERY,
    variables: { userId: DEFAULT_USER_ID, page: 1, limit: 20 },
  });

  const result = data as any;
  const accounts = result?.accounts?.accounts ?? [];
  const pageInfo = result?.accounts?.pageInfo;

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle={`${pageInfo?.total ?? 0} account${(pageInfo?.total ?? 0) !== 1 ? 's' : ''}`}
      />
      <AccountsView accounts={accounts} />
    </div>
  );
}
