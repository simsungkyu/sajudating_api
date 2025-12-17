import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import type {
  ApolloQueryResult,
  DefaultContext,
  FetchResult,
  MutationOptions,
  OperationVariables,
  QueryOptions,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({ uri: '/api/gql' });
const authLink = setContext((_: any, { headers }) => {
  const _headers = { ...headers };
  return {
    headers: _headers,
  };
});

const createApolloClient = () => {
  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: { query: { fetchPolicy: 'network-only' } },
  });
  const _query = client.query;

  client.query = <T = any, TVariables extends OperationVariables = OperationVariables>(
    options: QueryOptions<TVariables, T>,
  ): Promise<ApolloQueryResult<T>> => {
    options.fetchPolicy = options.fetchPolicy ? options.fetchPolicy : 'no-cache';
    return _query(options)
      .then((result) => {
        let name = '';
        const defs = options?.query?.definitions ?? [];
        if (defs.length > 0) name = (defs[0] as any).name?.value ?? '';

        console.log(name, JSON.stringify(result?.data));
        return result;
      })
      .catch((err) => {
        console.log('GraphQL Error Catching', err);
        throw err;
      });
  };

  const _mutate = client.mutate;
  client.mutate = <
    TData = any,
    TVariables extends OperationVariables = OperationVariables,
    TContext extends Record<string, any> = DefaultContext,
  >(
    options: MutationOptions<TData, TVariables, TContext>,
  ): Promise<FetchResult<TData>> => {
    return _mutate(options)
      .then((result) => {
        let name = '';
        const defs = options?.mutation?.definitions ?? [];
        if (defs.length > 0) name = (defs[0] as any).name?.value ?? '';

        console.log(name, JSON.stringify(result?.data));
        return result;
      })
      .catch((err) => {
        console.log('GraphQL Mutation Error Catching', err);
        throw err;
      });
  };

  return client;
};

export const client: ApolloClient<any> = createApolloClient();
  
