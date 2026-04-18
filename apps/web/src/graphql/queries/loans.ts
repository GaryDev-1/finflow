import { gql } from '@apollo/client';

export const LOANS_QUERY = gql`
  query GetLoans($userId: String, $status: LoanStatus) {
    loans(userId: $userId, status: $status) {
      loans {
        id
        userId
        principalAmount
        outstandingBalance
        interestRate
        termMonths
        monthlyInstalment
        status
        disbursedAt
        nextPaymentDate
        currency
        createdAt
        repayments {
          id
          dueDate
          amount
          status
          paidAt
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

export const LOAN_QUERY = gql`
  query GetLoan($id: ID!) {
    loan(id: $id) {
      id
      principalAmount
      outstandingBalance
      interestRate
      termMonths
      monthlyInstalment
      status
      disbursedAt
      nextPaymentDate
      currency
      repayments {
        id
        dueDate
        amount
        status
        paidAt
      }
    }
  }
`;
