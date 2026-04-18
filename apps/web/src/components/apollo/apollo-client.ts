import { registerApolloClient, ApolloClient, InMemoryCache } from '@apollo/client-integration-nextjs';
import { HttpLink } from '@apollo/client';

// Used in Server Components via getClient().query(...)
export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_BFF_URL ?? 'http://localhost:4000/graphql',
    }),
  });
});
