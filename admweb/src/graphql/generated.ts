import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: any; output: any; }
};

export type AiExcutionInput = {
  maxTokens: Scalars['Int']['input'];
  metaType: Scalars['String']['input'];
  metaUid: Scalars['String']['input'];
  model: Scalars['String']['input'];
  params: Array<Scalars['String']['input']>;
  prompt: Scalars['String']['input'];
  size: Scalars['String']['input'];
  temperature: Scalars['Float']['input'];
};

export type AiExecution = Node & {
  __typename?: 'AiExecution';
  createdAt: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  maxTokens: Scalars['Int']['output'];
  metaType: Scalars['String']['output'];
  metaUid: Scalars['String']['output'];
  model: Scalars['String']['output'];
  outputImage?: Maybe<Scalars['String']['output']>;
  outputText?: Maybe<Scalars['String']['output']>;
  params: Array<Scalars['String']['output']>;
  prompt: Scalars['String']['output'];
  size: Scalars['String']['output'];
  status: Scalars['String']['output'];
  temperature: Scalars['Float']['output'];
  uid: Scalars['String']['output'];
  updatedAt: Scalars['BigInt']['output'];
};

export type AiExecutionSearchInput = {
  limit: Scalars['Int']['input'];
  metaType?: InputMaybe<Scalars['String']['input']>;
  metaUid?: InputMaybe<Scalars['String']['input']>;
  offset: Scalars['Int']['input'];
};

export type AiMeta = Node & {
  __typename?: 'AiMeta';
  createdAt: Scalars['BigInt']['output'];
  desc: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  metaType: Scalars['String']['output'];
  name: Scalars['String']['output'];
  prompt: Scalars['String']['output'];
  uid: Scalars['String']['output'];
  updatedAt: Scalars['BigInt']['output'];
};

export type AiMetaInput = {
  desc: Scalars['String']['input'];
  metaType?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
  uid?: InputMaybe<Scalars['String']['input']>;
};

export type AiMetaSearchInput = {
  limit: Scalars['Int']['input'];
  metaType?: InputMaybe<Scalars['String']['input']>;
  offset: Scalars['Int']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createPhyIdealPartner?: Maybe<SimpleResult>;
  createSajuProfile?: Maybe<SimpleResult>;
  delAiMeta?: Maybe<SimpleResult>;
  deletePhyIdealPartner?: Maybe<SimpleResult>;
  deleteSajuProfile?: Maybe<SimpleResult>;
  putAiMeta?: Maybe<SimpleResult>;
  runAiExecution: SimpleResult;
  setAiMetaDefault?: Maybe<SimpleResult>;
};


export type MutationCreatePhyIdealPartnerArgs = {
  input: PhyIdealPartnerCreateInput;
};


export type MutationCreateSajuProfileArgs = {
  input: SajuProfileCreateInput;
};


export type MutationDelAiMetaArgs = {
  uid: Scalars['String']['input'];
};


export type MutationDeletePhyIdealPartnerArgs = {
  uid: Scalars['String']['input'];
};


export type MutationDeleteSajuProfileArgs = {
  uid: Scalars['String']['input'];
};


export type MutationPutAiMetaArgs = {
  input: AiMetaInput;
};


export type MutationRunAiExecutionArgs = {
  input: AiExcutionInput;
};


export type MutationSetAiMetaDefaultArgs = {
  uid: Scalars['String']['input'];
};

export type Node = {
  id: Scalars['ID']['output'];
};

export type PhyIdealPartner = Node & {
  __typename?: 'PhyIdealPartner';
  age: Scalars['Int']['output'];
  createdAt: Scalars['BigInt']['output'];
  featureEyes: Scalars['String']['output'];
  featureFaceShape: Scalars['String']['output'];
  featureMouth: Scalars['String']['output'];
  featureNose: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  personalityMatch: Scalars['String']['output'];
  sex: Scalars['String']['output'];
  similarityScore: Scalars['Float']['output'];
  summary: Scalars['String']['output'];
  uid: Scalars['String']['output'];
  updatedAt: Scalars['BigInt']['output'];
};

export type PhyIdealPartnerCreateInput = {
  age: Scalars['Int']['input'];
  featureEyes: Scalars['String']['input'];
  featureFaceShape: Scalars['String']['input'];
  featureMouth: Scalars['String']['input'];
  featureNose: Scalars['String']['input'];
  image?: InputMaybe<Scalars['String']['input']>;
  personalityMatch: Scalars['String']['input'];
  sex: Scalars['String']['input'];
  summary: Scalars['String']['input'];
};

export type PhyIdealPartnerSearchInput = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  sex?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  aiExecution: SimpleResult;
  aiExecutions: SimpleResult;
  aiMeta: SimpleResult;
  aiMetas: SimpleResult;
  palja: SimpleResult;
  phyIdealPartner: SimpleResult;
  phyIdealPartners: SimpleResult;
  sajuProfile: SimpleResult;
  sajuProfileSimilarPartners: SimpleResult;
  sajuProfiles: SimpleResult;
};


export type QueryAiExecutionArgs = {
  uid: Scalars['String']['input'];
};


export type QueryAiExecutionsArgs = {
  input: AiExecutionSearchInput;
};


export type QueryAiMetaArgs = {
  uid: Scalars['String']['input'];
};


export type QueryAiMetasArgs = {
  input: AiMetaSearchInput;
};


export type QueryPaljaArgs = {
  birthdate: Scalars['String']['input'];
  timezone: Scalars['String']['input'];
};


export type QueryPhyIdealPartnerArgs = {
  uid: Scalars['String']['input'];
};


export type QueryPhyIdealPartnersArgs = {
  input: PhyIdealPartnerSearchInput;
};


export type QuerySajuProfileArgs = {
  uid: Scalars['String']['input'];
};


export type QuerySajuProfileSimilarPartnersArgs = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  uid: Scalars['String']['input'];
};


export type QuerySajuProfilesArgs = {
  input: SajuProfileSearchInput;
};

export type SajuProfile = Node & {
  __typename?: 'SajuProfile';
  birthdate: Scalars['String']['output'];
  createdAt: Scalars['BigInt']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  imageMimeType: Scalars['String']['output'];
  myFeatureEyes: Scalars['String']['output'];
  myFeatureFaceShape: Scalars['String']['output'];
  myFeatureMouth: Scalars['String']['output'];
  myFeatureNose: Scalars['String']['output'];
  myFeatureNotes: Scalars['String']['output'];
  nickname: Scalars['String']['output'];
  palja: Scalars['String']['output'];
  partnerAge: Scalars['Int']['output'];
  partnerFeatureEyes: Scalars['String']['output'];
  partnerFeatureFaceShape: Scalars['String']['output'];
  partnerFeatureMouth: Scalars['String']['output'];
  partnerFeatureNose: Scalars['String']['output'];
  partnerMatchTips: Scalars['String']['output'];
  partnerPersonalityMatch: Scalars['String']['output'];
  partnerSex: Scalars['String']['output'];
  partnerSummary: Scalars['String']['output'];
  phyContent: Scalars['String']['output'];
  phyPartnerSimilarity: Scalars['Float']['output'];
  phyPartnerUid: Scalars['String']['output'];
  phySummary: Scalars['String']['output'];
  sajuContent: Scalars['String']['output'];
  sajuSummary: Scalars['String']['output'];
  sex: Scalars['String']['output'];
  uid: Scalars['String']['output'];
  updatedAt: Scalars['BigInt']['output'];
};

export type SajuProfileCreateInput = {
  birthdate: Scalars['String']['input'];
  image: Scalars['String']['input'];
  sex: Scalars['String']['input'];
};

export type SajuProfileSearchInput = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
};

export type SimpleResult = {
  __typename?: 'SimpleResult';
  limit?: Maybe<Scalars['Int']['output']>;
  msg?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Node>;
  nodes?: Maybe<Array<Node>>;
  offset?: Maybe<Scalars['Int']['output']>;
  ok: Scalars['Boolean']['output'];
  total?: Maybe<Scalars['Int']['output']>;
  uid?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type SajuProfileBasicFragment = { __typename?: 'SajuProfile', uid: string, createdAt: any, updatedAt: any, sex: string, birthdate: string, palja: string, email: string, imageMimeType: string, sajuSummary: string, sajuContent: string, nickname: string, phySummary: string, phyContent: string, myFeatureEyes: string, myFeatureNose: string, myFeatureMouth: string, myFeatureFaceShape: string, myFeatureNotes: string, partnerMatchTips: string, partnerSummary: string, partnerFeatureEyes: string, partnerFeatureNose: string, partnerFeatureMouth: string, partnerFeatureFaceShape: string, partnerPersonalityMatch: string, partnerSex: string, partnerAge: number, phyPartnerUid: string, phyPartnerSimilarity: number };

export type PhyIdealPartnerBasicFragment = { __typename?: 'PhyIdealPartner', uid: string, createdAt: any, updatedAt: any, summary: string, featureEyes: string, featureNose: string, featureMouth: string, featureFaceShape: string, personalityMatch: string, sex: string, age: number, similarityScore: number };

export type SajuProfilesQueryVariables = Exact<{
  input: SajuProfileSearchInput;
}>;


export type SajuProfilesQuery = { __typename?: 'Query', sajuProfiles: { __typename?: 'SimpleResult', ok: boolean, msg?: string | null, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile', uid: string, createdAt: any, updatedAt: any, sex: string, birthdate: string, palja: string, email: string, imageMimeType: string, sajuSummary: string, sajuContent: string, nickname: string, phySummary: string, phyContent: string, myFeatureEyes: string, myFeatureNose: string, myFeatureMouth: string, myFeatureFaceShape: string, myFeatureNotes: string, partnerMatchTips: string, partnerSummary: string, partnerFeatureEyes: string, partnerFeatureNose: string, partnerFeatureMouth: string, partnerFeatureFaceShape: string, partnerPersonalityMatch: string, partnerSex: string, partnerAge: number, phyPartnerUid: string, phyPartnerSimilarity: number }
    > | null } };

export type SajuProfileQueryVariables = Exact<{
  uid: Scalars['String']['input'];
}>;


export type SajuProfileQuery = { __typename?: 'Query', sajuProfile: { __typename?: 'SimpleResult', ok: boolean, node?:
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile', uid: string, createdAt: any, updatedAt: any, sex: string, birthdate: string, palja: string, email: string, imageMimeType: string, sajuSummary: string, sajuContent: string, nickname: string, phySummary: string, phyContent: string, myFeatureEyes: string, myFeatureNose: string, myFeatureMouth: string, myFeatureFaceShape: string, myFeatureNotes: string, partnerMatchTips: string, partnerSummary: string, partnerFeatureEyes: string, partnerFeatureNose: string, partnerFeatureMouth: string, partnerFeatureFaceShape: string, partnerPersonalityMatch: string, partnerSex: string, partnerAge: number, phyPartnerUid: string, phyPartnerSimilarity: number }
     | null } };

export type SajuProfileSimilarPartnersQueryVariables = Exact<{
  uid: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type SajuProfileSimilarPartnersQuery = { __typename?: 'Query', sajuProfileSimilarPartners: { __typename?: 'SimpleResult', ok: boolean, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'PhyIdealPartner', uid: string, createdAt: any, updatedAt: any, summary: string, featureEyes: string, featureNose: string, featureMouth: string, featureFaceShape: string, personalityMatch: string, sex: string, age: number, similarityScore: number }
      | { __typename?: 'SajuProfile' }
    > | null } };

export type PhyIdealPartnersQueryVariables = Exact<{
  input: PhyIdealPartnerSearchInput;
}>;


export type PhyIdealPartnersQuery = { __typename?: 'Query', phyIdealPartners: { __typename?: 'SimpleResult', ok: boolean, msg?: string | null, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'PhyIdealPartner', uid: string, createdAt: any, updatedAt: any, summary: string, featureEyes: string, featureNose: string, featureMouth: string, featureFaceShape: string, personalityMatch: string, sex: string, age: number, similarityScore: number }
      | { __typename?: 'SajuProfile' }
    > | null } };

export type PhyIdealPartnerQueryVariables = Exact<{
  uid: Scalars['String']['input'];
}>;


export type PhyIdealPartnerQuery = { __typename?: 'Query', phyIdealPartner: { __typename?: 'SimpleResult', ok: boolean, node?:
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'PhyIdealPartner', uid: string, createdAt: any, updatedAt: any, summary: string, featureEyes: string, featureNose: string, featureMouth: string, featureFaceShape: string, personalityMatch: string, sex: string, age: number, similarityScore: number }
      | { __typename?: 'SajuProfile' }
     | null } };

export type AiMetasQueryVariables = Exact<{
  input: AiMetaSearchInput;
}>;


export type AiMetasQuery = { __typename?: 'Query', aiMetas: { __typename?: 'SimpleResult', ok: boolean, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta', uid: string, createdAt: any, updatedAt: any, name: string, desc: string }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
    > | null } };

export type PutAiMetaMutationVariables = Exact<{
  input: AiMetaInput;
}>;


export type PutAiMetaMutation = { __typename?: 'Mutation', putAiMeta?: { __typename?: 'SimpleResult', ok: boolean, uid?: string | null, msg?: string | null } | null };

export type AiExecutionQueryVariables = Exact<{
  uid: Scalars['String']['input'];
}>;


export type AiExecutionQuery = { __typename?: 'Query', aiExecution: { __typename?: 'SimpleResult', ok: boolean, node?:
      | { __typename?: 'AiExecution', uid: string, status: string, metaUid: string, metaType: string, prompt: string, params: Array<string>, model: string, temperature: number, maxTokens: number, size: string, outputText?: string | null, outputImage?: string | null, createdAt: any, updatedAt: any }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
     | null } };

export type AiExecutionsQueryVariables = Exact<{
  input: AiExecutionSearchInput;
}>;


export type AiExecutionsQuery = { __typename?: 'Query', aiExecutions: { __typename?: 'SimpleResult', ok: boolean, msg?: string | null, total?: number | null, limit?: number | null, offset?: number | null, nodes?: Array<
      | { __typename?: 'AiExecution', uid: string, status: string, metaUid: string, metaType: string, prompt: string, params: Array<string>, model: string, temperature: number, maxTokens: number, size: string, outputText?: string | null, outputImage?: string | null, createdAt: any, updatedAt: any }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
    > | null } };

export type RunAiExecutionMutationVariables = Exact<{
  input: AiExcutionInput;
}>;


export type RunAiExecutionMutation = { __typename?: 'Mutation', runAiExecution: { __typename?: 'SimpleResult', ok: boolean, uid?: string | null, msg?: string | null } };

export type PaljaQueryVariables = Exact<{
  birthdate: Scalars['String']['input'];
  timezone: Scalars['String']['input'];
}>;


export type PaljaQuery = { __typename?: 'Query', palja: { __typename?: 'SimpleResult', ok: boolean, value?: string | null } };

export const SajuProfileBasicFragmentDoc = gql`
    fragment sajuProfileBasic on SajuProfile {
  uid
  createdAt
  updatedAt
  sex
  birthdate
  palja
  email
  imageMimeType
  sajuSummary
  sajuContent
  nickname
  phySummary
  phyContent
  myFeatureEyes
  myFeatureNose
  myFeatureMouth
  myFeatureFaceShape
  myFeatureNotes
  partnerMatchTips
  partnerSummary
  partnerFeatureEyes
  partnerFeatureNose
  partnerFeatureMouth
  partnerFeatureFaceShape
  partnerPersonalityMatch
  partnerSex
  partnerAge
  phyPartnerUid
  phyPartnerSimilarity
}
    `;
export const PhyIdealPartnerBasicFragmentDoc = gql`
    fragment phyIdealPartnerBasic on PhyIdealPartner {
  uid
  createdAt
  updatedAt
  summary
  featureEyes
  featureNose
  featureMouth
  featureFaceShape
  personalityMatch
  sex
  age
  similarityScore
}
    `;
export const SajuProfilesDocument = gql`
    query sajuProfiles($input: SajuProfileSearchInput!) {
  sajuProfiles(input: $input) {
    ok
    msg
    nodes {
      ... on SajuProfile {
        ...sajuProfileBasic
      }
    }
  }
}
    ${SajuProfileBasicFragmentDoc}`;

/**
 * __useSajuProfilesQuery__
 *
 * To run a query within a React component, call `useSajuProfilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSajuProfilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSajuProfilesQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSajuProfilesQuery(baseOptions: Apollo.QueryHookOptions<SajuProfilesQuery, SajuProfilesQueryVariables> & ({ variables: SajuProfilesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SajuProfilesQuery, SajuProfilesQueryVariables>(SajuProfilesDocument, options);
      }
export function useSajuProfilesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SajuProfilesQuery, SajuProfilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SajuProfilesQuery, SajuProfilesQueryVariables>(SajuProfilesDocument, options);
        }
// @ts-ignore
export function useSajuProfilesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SajuProfilesQuery, SajuProfilesQueryVariables>): Apollo.UseSuspenseQueryResult<SajuProfilesQuery, SajuProfilesQueryVariables>;
export function useSajuProfilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SajuProfilesQuery, SajuProfilesQueryVariables>): Apollo.UseSuspenseQueryResult<SajuProfilesQuery | undefined, SajuProfilesQueryVariables>;
export function useSajuProfilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SajuProfilesQuery, SajuProfilesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SajuProfilesQuery, SajuProfilesQueryVariables>(SajuProfilesDocument, options);
        }
export type SajuProfilesQueryHookResult = ReturnType<typeof useSajuProfilesQuery>;
export type SajuProfilesLazyQueryHookResult = ReturnType<typeof useSajuProfilesLazyQuery>;
export type SajuProfilesSuspenseQueryHookResult = ReturnType<typeof useSajuProfilesSuspenseQuery>;
export type SajuProfilesQueryResult = Apollo.QueryResult<SajuProfilesQuery, SajuProfilesQueryVariables>;
export const SajuProfileDocument = gql`
    query sajuProfile($uid: String!) {
  sajuProfile(uid: $uid) {
    ok
    node {
      ... on SajuProfile {
        ...sajuProfileBasic
      }
    }
  }
}
    ${SajuProfileBasicFragmentDoc}`;

/**
 * __useSajuProfileQuery__
 *
 * To run a query within a React component, call `useSajuProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useSajuProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSajuProfileQuery({
 *   variables: {
 *      uid: // value for 'uid'
 *   },
 * });
 */
export function useSajuProfileQuery(baseOptions: Apollo.QueryHookOptions<SajuProfileQuery, SajuProfileQueryVariables> & ({ variables: SajuProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SajuProfileQuery, SajuProfileQueryVariables>(SajuProfileDocument, options);
      }
export function useSajuProfileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SajuProfileQuery, SajuProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SajuProfileQuery, SajuProfileQueryVariables>(SajuProfileDocument, options);
        }
// @ts-ignore
export function useSajuProfileSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SajuProfileQuery, SajuProfileQueryVariables>): Apollo.UseSuspenseQueryResult<SajuProfileQuery, SajuProfileQueryVariables>;
export function useSajuProfileSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SajuProfileQuery, SajuProfileQueryVariables>): Apollo.UseSuspenseQueryResult<SajuProfileQuery | undefined, SajuProfileQueryVariables>;
export function useSajuProfileSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SajuProfileQuery, SajuProfileQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SajuProfileQuery, SajuProfileQueryVariables>(SajuProfileDocument, options);
        }
export type SajuProfileQueryHookResult = ReturnType<typeof useSajuProfileQuery>;
export type SajuProfileLazyQueryHookResult = ReturnType<typeof useSajuProfileLazyQuery>;
export type SajuProfileSuspenseQueryHookResult = ReturnType<typeof useSajuProfileSuspenseQuery>;
export type SajuProfileQueryResult = Apollo.QueryResult<SajuProfileQuery, SajuProfileQueryVariables>;
export const SajuProfileSimilarPartnersDocument = gql`
    query sajuProfileSimilarPartners($uid: String!, $limit: Int!, $offset: Int!) {
  sajuProfileSimilarPartners(uid: $uid, limit: $limit, offset: $offset) {
    ok
    nodes {
      ... on PhyIdealPartner {
        ...phyIdealPartnerBasic
      }
    }
  }
}
    ${PhyIdealPartnerBasicFragmentDoc}`;

/**
 * __useSajuProfileSimilarPartnersQuery__
 *
 * To run a query within a React component, call `useSajuProfileSimilarPartnersQuery` and pass it any options that fit your needs.
 * When your component renders, `useSajuProfileSimilarPartnersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSajuProfileSimilarPartnersQuery({
 *   variables: {
 *      uid: // value for 'uid'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useSajuProfileSimilarPartnersQuery(baseOptions: Apollo.QueryHookOptions<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables> & ({ variables: SajuProfileSimilarPartnersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables>(SajuProfileSimilarPartnersDocument, options);
      }
export function useSajuProfileSimilarPartnersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables>(SajuProfileSimilarPartnersDocument, options);
        }
// @ts-ignore
export function useSajuProfileSimilarPartnersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables>): Apollo.UseSuspenseQueryResult<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables>;
export function useSajuProfileSimilarPartnersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables>): Apollo.UseSuspenseQueryResult<SajuProfileSimilarPartnersQuery | undefined, SajuProfileSimilarPartnersQueryVariables>;
export function useSajuProfileSimilarPartnersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables>(SajuProfileSimilarPartnersDocument, options);
        }
export type SajuProfileSimilarPartnersQueryHookResult = ReturnType<typeof useSajuProfileSimilarPartnersQuery>;
export type SajuProfileSimilarPartnersLazyQueryHookResult = ReturnType<typeof useSajuProfileSimilarPartnersLazyQuery>;
export type SajuProfileSimilarPartnersSuspenseQueryHookResult = ReturnType<typeof useSajuProfileSimilarPartnersSuspenseQuery>;
export type SajuProfileSimilarPartnersQueryResult = Apollo.QueryResult<SajuProfileSimilarPartnersQuery, SajuProfileSimilarPartnersQueryVariables>;
export const PhyIdealPartnersDocument = gql`
    query phyIdealPartners($input: PhyIdealPartnerSearchInput!) {
  phyIdealPartners(input: $input) {
    ok
    msg
    nodes {
      ... on PhyIdealPartner {
        ...phyIdealPartnerBasic
      }
    }
  }
}
    ${PhyIdealPartnerBasicFragmentDoc}`;

/**
 * __usePhyIdealPartnersQuery__
 *
 * To run a query within a React component, call `usePhyIdealPartnersQuery` and pass it any options that fit your needs.
 * When your component renders, `usePhyIdealPartnersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePhyIdealPartnersQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePhyIdealPartnersQuery(baseOptions: Apollo.QueryHookOptions<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables> & ({ variables: PhyIdealPartnersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables>(PhyIdealPartnersDocument, options);
      }
export function usePhyIdealPartnersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables>(PhyIdealPartnersDocument, options);
        }
// @ts-ignore
export function usePhyIdealPartnersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables>): Apollo.UseSuspenseQueryResult<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables>;
export function usePhyIdealPartnersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables>): Apollo.UseSuspenseQueryResult<PhyIdealPartnersQuery | undefined, PhyIdealPartnersQueryVariables>;
export function usePhyIdealPartnersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables>(PhyIdealPartnersDocument, options);
        }
export type PhyIdealPartnersQueryHookResult = ReturnType<typeof usePhyIdealPartnersQuery>;
export type PhyIdealPartnersLazyQueryHookResult = ReturnType<typeof usePhyIdealPartnersLazyQuery>;
export type PhyIdealPartnersSuspenseQueryHookResult = ReturnType<typeof usePhyIdealPartnersSuspenseQuery>;
export type PhyIdealPartnersQueryResult = Apollo.QueryResult<PhyIdealPartnersQuery, PhyIdealPartnersQueryVariables>;
export const PhyIdealPartnerDocument = gql`
    query phyIdealPartner($uid: String!) {
  phyIdealPartner(uid: $uid) {
    ok
    node {
      ... on PhyIdealPartner {
        ...phyIdealPartnerBasic
      }
    }
  }
}
    ${PhyIdealPartnerBasicFragmentDoc}`;

/**
 * __usePhyIdealPartnerQuery__
 *
 * To run a query within a React component, call `usePhyIdealPartnerQuery` and pass it any options that fit your needs.
 * When your component renders, `usePhyIdealPartnerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePhyIdealPartnerQuery({
 *   variables: {
 *      uid: // value for 'uid'
 *   },
 * });
 */
export function usePhyIdealPartnerQuery(baseOptions: Apollo.QueryHookOptions<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables> & ({ variables: PhyIdealPartnerQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables>(PhyIdealPartnerDocument, options);
      }
export function usePhyIdealPartnerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables>(PhyIdealPartnerDocument, options);
        }
// @ts-ignore
export function usePhyIdealPartnerSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables>): Apollo.UseSuspenseQueryResult<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables>;
export function usePhyIdealPartnerSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables>): Apollo.UseSuspenseQueryResult<PhyIdealPartnerQuery | undefined, PhyIdealPartnerQueryVariables>;
export function usePhyIdealPartnerSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables>(PhyIdealPartnerDocument, options);
        }
export type PhyIdealPartnerQueryHookResult = ReturnType<typeof usePhyIdealPartnerQuery>;
export type PhyIdealPartnerLazyQueryHookResult = ReturnType<typeof usePhyIdealPartnerLazyQuery>;
export type PhyIdealPartnerSuspenseQueryHookResult = ReturnType<typeof usePhyIdealPartnerSuspenseQuery>;
export type PhyIdealPartnerQueryResult = Apollo.QueryResult<PhyIdealPartnerQuery, PhyIdealPartnerQueryVariables>;
export const AiMetasDocument = gql`
    query aiMetas($input: AiMetaSearchInput!) {
  aiMetas(input: $input) {
    ok
    nodes {
      ... on AiMeta {
        uid
        createdAt
        updatedAt
        name
        desc
      }
    }
  }
}
    `;

/**
 * __useAiMetasQuery__
 *
 * To run a query within a React component, call `useAiMetasQuery` and pass it any options that fit your needs.
 * When your component renders, `useAiMetasQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAiMetasQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAiMetasQuery(baseOptions: Apollo.QueryHookOptions<AiMetasQuery, AiMetasQueryVariables> & ({ variables: AiMetasQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AiMetasQuery, AiMetasQueryVariables>(AiMetasDocument, options);
      }
export function useAiMetasLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AiMetasQuery, AiMetasQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AiMetasQuery, AiMetasQueryVariables>(AiMetasDocument, options);
        }
// @ts-ignore
export function useAiMetasSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<AiMetasQuery, AiMetasQueryVariables>): Apollo.UseSuspenseQueryResult<AiMetasQuery, AiMetasQueryVariables>;
export function useAiMetasSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AiMetasQuery, AiMetasQueryVariables>): Apollo.UseSuspenseQueryResult<AiMetasQuery | undefined, AiMetasQueryVariables>;
export function useAiMetasSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AiMetasQuery, AiMetasQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<AiMetasQuery, AiMetasQueryVariables>(AiMetasDocument, options);
        }
export type AiMetasQueryHookResult = ReturnType<typeof useAiMetasQuery>;
export type AiMetasLazyQueryHookResult = ReturnType<typeof useAiMetasLazyQuery>;
export type AiMetasSuspenseQueryHookResult = ReturnType<typeof useAiMetasSuspenseQuery>;
export type AiMetasQueryResult = Apollo.QueryResult<AiMetasQuery, AiMetasQueryVariables>;
export const PutAiMetaDocument = gql`
    mutation putAiMeta($input: AiMetaInput!) {
  putAiMeta(input: $input) {
    ok
    uid
    msg
  }
}
    `;
export type PutAiMetaMutationFn = Apollo.MutationFunction<PutAiMetaMutation, PutAiMetaMutationVariables>;

/**
 * __usePutAiMetaMutation__
 *
 * To run a mutation, you first call `usePutAiMetaMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePutAiMetaMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [putAiMetaMutation, { data, loading, error }] = usePutAiMetaMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePutAiMetaMutation(baseOptions?: Apollo.MutationHookOptions<PutAiMetaMutation, PutAiMetaMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PutAiMetaMutation, PutAiMetaMutationVariables>(PutAiMetaDocument, options);
      }
export type PutAiMetaMutationHookResult = ReturnType<typeof usePutAiMetaMutation>;
export type PutAiMetaMutationResult = Apollo.MutationResult<PutAiMetaMutation>;
export type PutAiMetaMutationOptions = Apollo.BaseMutationOptions<PutAiMetaMutation, PutAiMetaMutationVariables>;
export const AiExecutionDocument = gql`
    query aiExecution($uid: String!) {
  aiExecution(uid: $uid) {
    ok
    node {
      ... on AiExecution {
        uid
        status
        metaUid
        metaType
        prompt
        params
        model
        temperature
        maxTokens
        size
        outputText
        outputImage
        createdAt
        updatedAt
      }
    }
  }
}
    `;

/**
 * __useAiExecutionQuery__
 *
 * To run a query within a React component, call `useAiExecutionQuery` and pass it any options that fit your needs.
 * When your component renders, `useAiExecutionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAiExecutionQuery({
 *   variables: {
 *      uid: // value for 'uid'
 *   },
 * });
 */
export function useAiExecutionQuery(baseOptions: Apollo.QueryHookOptions<AiExecutionQuery, AiExecutionQueryVariables> & ({ variables: AiExecutionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AiExecutionQuery, AiExecutionQueryVariables>(AiExecutionDocument, options);
      }
export function useAiExecutionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AiExecutionQuery, AiExecutionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AiExecutionQuery, AiExecutionQueryVariables>(AiExecutionDocument, options);
        }
// @ts-ignore
export function useAiExecutionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<AiExecutionQuery, AiExecutionQueryVariables>): Apollo.UseSuspenseQueryResult<AiExecutionQuery, AiExecutionQueryVariables>;
export function useAiExecutionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AiExecutionQuery, AiExecutionQueryVariables>): Apollo.UseSuspenseQueryResult<AiExecutionQuery | undefined, AiExecutionQueryVariables>;
export function useAiExecutionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AiExecutionQuery, AiExecutionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<AiExecutionQuery, AiExecutionQueryVariables>(AiExecutionDocument, options);
        }
export type AiExecutionQueryHookResult = ReturnType<typeof useAiExecutionQuery>;
export type AiExecutionLazyQueryHookResult = ReturnType<typeof useAiExecutionLazyQuery>;
export type AiExecutionSuspenseQueryHookResult = ReturnType<typeof useAiExecutionSuspenseQuery>;
export type AiExecutionQueryResult = Apollo.QueryResult<AiExecutionQuery, AiExecutionQueryVariables>;
export const AiExecutionsDocument = gql`
    query aiExecutions($input: AiExecutionSearchInput!) {
  aiExecutions(input: $input) {
    ok
    msg
    total
    limit
    offset
    nodes {
      ... on AiExecution {
        uid
        status
        metaUid
        metaType
        prompt
        params
        model
        temperature
        maxTokens
        size
        outputText
        outputImage
        createdAt
        updatedAt
      }
    }
  }
}
    `;

/**
 * __useAiExecutionsQuery__
 *
 * To run a query within a React component, call `useAiExecutionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAiExecutionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAiExecutionsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAiExecutionsQuery(baseOptions: Apollo.QueryHookOptions<AiExecutionsQuery, AiExecutionsQueryVariables> & ({ variables: AiExecutionsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AiExecutionsQuery, AiExecutionsQueryVariables>(AiExecutionsDocument, options);
      }
export function useAiExecutionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AiExecutionsQuery, AiExecutionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AiExecutionsQuery, AiExecutionsQueryVariables>(AiExecutionsDocument, options);
        }
// @ts-ignore
export function useAiExecutionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<AiExecutionsQuery, AiExecutionsQueryVariables>): Apollo.UseSuspenseQueryResult<AiExecutionsQuery, AiExecutionsQueryVariables>;
export function useAiExecutionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AiExecutionsQuery, AiExecutionsQueryVariables>): Apollo.UseSuspenseQueryResult<AiExecutionsQuery | undefined, AiExecutionsQueryVariables>;
export function useAiExecutionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AiExecutionsQuery, AiExecutionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<AiExecutionsQuery, AiExecutionsQueryVariables>(AiExecutionsDocument, options);
        }
export type AiExecutionsQueryHookResult = ReturnType<typeof useAiExecutionsQuery>;
export type AiExecutionsLazyQueryHookResult = ReturnType<typeof useAiExecutionsLazyQuery>;
export type AiExecutionsSuspenseQueryHookResult = ReturnType<typeof useAiExecutionsSuspenseQuery>;
export type AiExecutionsQueryResult = Apollo.QueryResult<AiExecutionsQuery, AiExecutionsQueryVariables>;
export const RunAiExecutionDocument = gql`
    mutation runAiExecution($input: AiExcutionInput!) {
  runAiExecution(input: $input) {
    ok
    uid
    msg
  }
}
    `;
export type RunAiExecutionMutationFn = Apollo.MutationFunction<RunAiExecutionMutation, RunAiExecutionMutationVariables>;

/**
 * __useRunAiExecutionMutation__
 *
 * To run a mutation, you first call `useRunAiExecutionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRunAiExecutionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [runAiExecutionMutation, { data, loading, error }] = useRunAiExecutionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRunAiExecutionMutation(baseOptions?: Apollo.MutationHookOptions<RunAiExecutionMutation, RunAiExecutionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RunAiExecutionMutation, RunAiExecutionMutationVariables>(RunAiExecutionDocument, options);
      }
export type RunAiExecutionMutationHookResult = ReturnType<typeof useRunAiExecutionMutation>;
export type RunAiExecutionMutationResult = Apollo.MutationResult<RunAiExecutionMutation>;
export type RunAiExecutionMutationOptions = Apollo.BaseMutationOptions<RunAiExecutionMutation, RunAiExecutionMutationVariables>;
export const PaljaDocument = gql`
    query palja($birthdate: String!, $timezone: String!) {
  palja(birthdate: $birthdate, timezone: $timezone) {
    ok
    value
  }
}
    `;

/**
 * __usePaljaQuery__
 *
 * To run a query within a React component, call `usePaljaQuery` and pass it any options that fit your needs.
 * When your component renders, `usePaljaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePaljaQuery({
 *   variables: {
 *      birthdate: // value for 'birthdate'
 *      timezone: // value for 'timezone'
 *   },
 * });
 */
export function usePaljaQuery(baseOptions: Apollo.QueryHookOptions<PaljaQuery, PaljaQueryVariables> & ({ variables: PaljaQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PaljaQuery, PaljaQueryVariables>(PaljaDocument, options);
      }
export function usePaljaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PaljaQuery, PaljaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PaljaQuery, PaljaQueryVariables>(PaljaDocument, options);
        }
// @ts-ignore
export function usePaljaSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PaljaQuery, PaljaQueryVariables>): Apollo.UseSuspenseQueryResult<PaljaQuery, PaljaQueryVariables>;
export function usePaljaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PaljaQuery, PaljaQueryVariables>): Apollo.UseSuspenseQueryResult<PaljaQuery | undefined, PaljaQueryVariables>;
export function usePaljaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PaljaQuery, PaljaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PaljaQuery, PaljaQueryVariables>(PaljaDocument, options);
        }
export type PaljaQueryHookResult = ReturnType<typeof usePaljaQuery>;
export type PaljaLazyQueryHookResult = ReturnType<typeof usePaljaLazyQuery>;
export type PaljaSuspenseQueryHookResult = ReturnType<typeof usePaljaSuspenseQuery>;
export type PaljaQueryResult = Apollo.QueryResult<PaljaQuery, PaljaQueryVariables>;