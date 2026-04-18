import { gql } from '@apollo/client';

export const ACCOUNTS_QUERY = gql`
  query GetAccounts($userId: String, $page: Int, $limit: Int) {
    accounts(userId: $userId, page: $page, limit: $limit) {
      accounts {
        id
        accountNumber
        accountType
        balance
        currency
        status
        createdAt
        recentTransactions {
          id
          type
          amount
          description
          transactionDate
        }
      }
      pageInfo {
        total
        page
        hasNextPage
      }
    }
  }
`;

export const ACCOUNT_QUERY = gql`
  query GetAccount($id: ID!) {
    account(id: $id) {
      id
      accountNumber
      accountType
      balance
      currency
      status
      createdAt
      updatedAt
      recentTransactions {
        id
        type
        amount
        description
        category
        transactionDate
      }
    }
  }
`;
