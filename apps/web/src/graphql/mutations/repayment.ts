import { gql } from '@apollo/client';

export const MAKE_REPAYMENT_MUTATION = gql`
  mutation MakeRepayment($loanId: ID!, $repaymentId: ID!) {
    makeRepayment(loanId: $loanId, repaymentId: $repaymentId) {
      repayment {
        id
        status
        paidAt
      }
      loan {
        id
        outstandingBalance
        status
      }
    }
  }
`;
