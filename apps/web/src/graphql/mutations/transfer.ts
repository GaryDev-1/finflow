import { gql } from '@apollo/client';

export const TRANSFER_MUTATION = gql`
  mutation Transfer(
    $fromAccountId: ID!
    $toAccountId: ID!
    $amount: Int!
    $description: String
  ) {
    transfer(
      fromAccountId: $fromAccountId
      toAccountId: $toAccountId
      amount: $amount
      description: $description
    ) {
      fromAccount { id balance }
      toAccount   { id balance }
      debitTransaction  { id amount }
      creditTransaction { id amount }
    }
  }
`;
