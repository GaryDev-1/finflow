import { gql } from '@apollo/client';

export const DASHBOARD_QUERY = gql`
  query GetDashboard($userId: String!) {
    dashboard(userId: $userId) {
      totalBalance
      activeLoansCount
      totalOutstanding
      accounts {
        id
        accountNumber
        accountType
        balance
        currency
        status
      }
      activeLoans {
        id
        principalAmount
        outstandingBalance
        interestRate
        monthlyInstalment
        currency
        status
      }
      recentTransactions {
        id
        type
        amount
        currency
        description
        category
        transactionDate
      }
    }
  }
`;
