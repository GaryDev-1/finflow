import { gql } from '@apollo/client';

export const TRANSACTIONS_QUERY = gql`
  query GetTransactions($accountId: String, $page: Int, $limit: Int) {
    transactions(accountId: $accountId, page: $page, limit: $limit) {
      transactions {
        id
        accountId
        type
        amount
        currency
        description
        category
        reference
        status
        transactionDate
      }
      summary {
        totalCredits
        totalDebits
        netBalance
        transactionCount
      }
      pageInfo {
        total
        page
        hasNextPage
      }
    }
  }
`;
