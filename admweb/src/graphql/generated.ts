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
  inputImageBase64?: InputMaybe<Scalars['String']['input']>;
  inputkvs: Array<KvInput>;
  maxTokens: Scalars['Int']['input'];
  metaType: Scalars['String']['input'];
  metaUid: Scalars['String']['input'];
  model: Scalars['String']['input'];
  outputkvs: Array<KvInput>;
  prompt: Scalars['String']['input'];
  promptType: Scalars['String']['input'];
  size: Scalars['String']['input'];
  temperature: Scalars['Float']['input'];
  valued_prompt: Scalars['String']['input'];
};

export type AiExecution = Node & {
  __typename?: 'AiExecution';
  createdAt: Scalars['BigInt']['output'];
  elapsedTime: Scalars['Int']['output'];
  errorMessage: Scalars['String']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  inputImageBase64?: Maybe<Scalars['String']['output']>;
  inputTokens: Scalars['Int']['output'];
  inputkvs: Array<Kv>;
  maxTokens: Scalars['Int']['output'];
  metaType: Scalars['String']['output'];
  metaUid: Scalars['String']['output'];
  model: Scalars['String']['output'];
  outputImageBase64?: Maybe<Scalars['String']['output']>;
  outputText?: Maybe<Scalars['String']['output']>;
  outputTokens: Scalars['Int']['output'];
  outputkvs: Array<Kv>;
  prompt: Scalars['String']['output'];
  runBy?: Maybe<Scalars['String']['output']>;
  runSajuProfileUid?: Maybe<Scalars['String']['output']>;
  size: Scalars['String']['output'];
  status: Scalars['String']['output'];
  temperature: Scalars['Float']['output'];
  totalTokens: Scalars['Int']['output'];
  uid: Scalars['String']['output'];
  updatedAt: Scalars['BigInt']['output'];
  valued_prompt: Scalars['String']['output'];
};

export type AiExecutionSearchInput = {
  limit: Scalars['Int']['input'];
  metaType?: InputMaybe<Scalars['String']['input']>;
  metaUid?: InputMaybe<Scalars['String']['input']>;
  offset: Scalars['Int']['input'];
  runBy?: InputMaybe<Scalars['String']['input']>;
  runSajuProfileUid?: InputMaybe<Scalars['String']['input']>;
};

export type AiMeta = Node & {
  __typename?: 'AiMeta';
  createdAt: Scalars['BigInt']['output'];
  desc: Scalars['String']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  inUse: Scalars['Boolean']['output'];
  maxTokens: Scalars['Int']['output'];
  metaType: Scalars['String']['output'];
  model: Scalars['String']['output'];
  name: Scalars['String']['output'];
  prompt: Scalars['String']['output'];
  size: Scalars['String']['output'];
  temperature: Scalars['Float']['output'];
  uid: Scalars['String']['output'];
  updatedAt: Scalars['BigInt']['output'];
};

export type AiMetaInput = {
  desc: Scalars['String']['input'];
  maxTokens: Scalars['Int']['input'];
  metaType?: InputMaybe<Scalars['String']['input']>;
  model: Scalars['String']['input'];
  name: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
  size: Scalars['String']['input'];
  temperature: Scalars['Float']['input'];
  uid?: InputMaybe<Scalars['String']['input']>;
};

export type AiMetaKVsInput = {
  kvs: Array<KvInput>;
  type: Scalars['String']['input'];
};

export type AiMetaSearchInput = {
  inUse?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  metaType?: InputMaybe<Scalars['String']['input']>;
  offset: Scalars['Int']['input'];
};

export type AiMetaType = Node & {
  __typename?: 'AiMetaType';
  hasInputImage: Scalars['Boolean']['output'];
  hasOutputImage: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  inputFields: Array<Scalars['String']['output']>;
  outputFields: Array<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type Kv = {
  __typename?: 'KV';
  k: Scalars['String']['output'];
  v: Scalars['String']['output'];
};

export type KvInput = {
  k: Scalars['String']['input'];
  v: Scalars['String']['input'];
};

export type LocalLog = Node & {
  __typename?: 'LocalLog';
  createdAt: Scalars['BigInt']['output'];
  expiresAt: Scalars['BigInt']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  status: Scalars['String']['output'];
  text: Scalars['String']['output'];
  uid: Scalars['String']['output'];
};

export type LocalLogSearchInput = {
  limit: Scalars['Int']['input'];
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createAdminUser: SimpleResult;
  createPhyIdealPartner?: Maybe<SimpleResult>;
  createSajuProfile?: Maybe<SimpleResult>;
  delAiMeta?: Maybe<SimpleResult>;
  deletePhyIdealPartner?: Maybe<SimpleResult>;
  deleteSajuProfile?: Maybe<SimpleResult>;
  login: SimpleResult;
  logout: SimpleResult;
  putAiMeta?: Maybe<SimpleResult>;
  runAiExecution: SimpleResult;
  setAdminUserActive: SimpleResult;
  setAiMetaDefault?: Maybe<SimpleResult>;
  setAiMetaInUse?: Maybe<SimpleResult>;
  updateAdminUser: SimpleResult;
};


export type MutationCreateAdminUserArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
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


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  otp: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationPutAiMetaArgs = {
  input: AiMetaInput;
};


export type MutationRunAiExecutionArgs = {
  input: AiExcutionInput;
};


export type MutationSetAdminUserActiveArgs = {
  active: Scalars['Boolean']['input'];
  uid: Scalars['String']['input'];
};


export type MutationSetAiMetaDefaultArgs = {
  uid: Scalars['String']['input'];
};


export type MutationSetAiMetaInUseArgs = {
  uid: Scalars['String']['input'];
};


export type MutationUpdateAdminUserArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  uid: Scalars['String']['input'];
};

export type Node = {
  id?: Maybe<Scalars['ID']['output']>;
};

export type PhyIdealPartner = Node & {
  __typename?: 'PhyIdealPartner';
  age: Scalars['Int']['output'];
  createdAt: Scalars['BigInt']['output'];
  embeddingModel: Scalars['String']['output'];
  embeddingText: Scalars['String']['output'];
  featureEyes: Scalars['String']['output'];
  featureFaceShape: Scalars['String']['output'];
  featureMouth: Scalars['String']['output'];
  featureNose: Scalars['String']['output'];
  hasImage: Scalars['Boolean']['output'];
  id?: Maybe<Scalars['ID']['output']>;
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
  hasImage?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  sex?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  aiExecution: SimpleResult;
  aiExecutions: SimpleResult;
  aiMeta: SimpleResult;
  aiMetaKVs: SimpleResult;
  aiMetaTypes: SimpleResult;
  aiMetas: SimpleResult;
  localLogs: SimpleResult;
  palja: SimpleResult;
  phyIdealPartner: SimpleResult;
  phyIdealPartners: SimpleResult;
  sajuProfile: SimpleResult;
  sajuProfileLogs: SimpleResult;
  sajuProfileSimilarPartners: SimpleResult;
  sajuProfiles: SimpleResult;
  systemStats: SimpleResult;
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


export type QueryAiMetaKVsArgs = {
  input: AiMetaKVsInput;
};


export type QueryAiMetasArgs = {
  input: AiMetaSearchInput;
};


export type QueryLocalLogsArgs = {
  input: LocalLogSearchInput;
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


export type QuerySajuProfileLogsArgs = {
  input: SajuProfileLogSearchInput;
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
  id?: Maybe<Scalars['ID']['output']>;
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
  partnerEmbeddingText: Scalars['String']['output'];
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

export type SajuProfileLog = Node & {
  __typename?: 'SajuProfileLog';
  createdAt: Scalars['BigInt']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  sajuUid: Scalars['String']['output'];
  status: Scalars['String']['output'];
  text: Scalars['String']['output'];
  uid: Scalars['String']['output'];
  updatedAt: Scalars['BigInt']['output'];
};

export type SajuProfileLogSearchInput = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  sajuUid: Scalars['String']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};

export type SajuProfileSearchInput = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
};

export type SimpleResult = {
  __typename?: 'SimpleResult';
  base64Value?: Maybe<Scalars['String']['output']>;
  err?: Maybe<Scalars['String']['output']>;
  kvs?: Maybe<Array<Kv>>;
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

export type SystemStats = Node & {
  __typename?: 'SystemStats';
  cpuUsage: Scalars['Float']['output'];
  hostname: Scalars['String']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  memoryTotal: Scalars['Int']['output'];
  memoryUsage: Scalars['Int']['output'];
};

export type SajuProfileBasicFragment = { __typename?: 'SajuProfile', uid: string, createdAt: any, updatedAt: any, sex: string, birthdate: string, palja: string, email: string, imageMimeType: string, sajuSummary: string, sajuContent: string, nickname: string, phySummary: string, phyContent: string, myFeatureEyes: string, myFeatureNose: string, myFeatureMouth: string, myFeatureFaceShape: string, myFeatureNotes: string, partnerEmbeddingText: string, partnerMatchTips: string, partnerSummary: string, partnerFeatureEyes: string, partnerFeatureNose: string, partnerFeatureMouth: string, partnerFeatureFaceShape: string, partnerPersonalityMatch: string, partnerSex: string, partnerAge: number, phyPartnerUid: string, phyPartnerSimilarity: number };

export type PhyIdealPartnerBasicFragment = { __typename?: 'PhyIdealPartner', uid: string, createdAt: any, updatedAt: any, summary: string, featureEyes: string, featureNose: string, featureMouth: string, featureFaceShape: string, personalityMatch: string, sex: string, age: number, embeddingModel: string, embeddingText: string, similarityScore: number, hasImage: boolean };

export type SajuProfilesQueryVariables = Exact<{
  input: SajuProfileSearchInput;
}>;


export type SajuProfilesQuery = { __typename?: 'Query', sajuProfiles: { __typename?: 'SimpleResult', ok: boolean, msg?: string | null, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile', uid: string, createdAt: any, updatedAt: any, sex: string, birthdate: string, palja: string, email: string, imageMimeType: string, sajuSummary: string, sajuContent: string, nickname: string, phySummary: string, phyContent: string, myFeatureEyes: string, myFeatureNose: string, myFeatureMouth: string, myFeatureFaceShape: string, myFeatureNotes: string, partnerEmbeddingText: string, partnerMatchTips: string, partnerSummary: string, partnerFeatureEyes: string, partnerFeatureNose: string, partnerFeatureMouth: string, partnerFeatureFaceShape: string, partnerPersonalityMatch: string, partnerSex: string, partnerAge: number, phyPartnerUid: string, phyPartnerSimilarity: number }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
    > | null } };

export type SajuProfileQueryVariables = Exact<{
  uid: Scalars['String']['input'];
}>;


export type SajuProfileQuery = { __typename?: 'Query', sajuProfile: { __typename?: 'SimpleResult', ok: boolean, node?:
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile', uid: string, createdAt: any, updatedAt: any, sex: string, birthdate: string, palja: string, email: string, imageMimeType: string, sajuSummary: string, sajuContent: string, nickname: string, phySummary: string, phyContent: string, myFeatureEyes: string, myFeatureNose: string, myFeatureMouth: string, myFeatureFaceShape: string, myFeatureNotes: string, partnerEmbeddingText: string, partnerMatchTips: string, partnerSummary: string, partnerFeatureEyes: string, partnerFeatureNose: string, partnerFeatureMouth: string, partnerFeatureFaceShape: string, partnerPersonalityMatch: string, partnerSex: string, partnerAge: number, phyPartnerUid: string, phyPartnerSimilarity: number }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
     | null } };

export type SajuProfileSimilarPartnersQueryVariables = Exact<{
  uid: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type SajuProfileSimilarPartnersQuery = { __typename?: 'Query', sajuProfileSimilarPartners: { __typename?: 'SimpleResult', ok: boolean, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner', uid: string, createdAt: any, updatedAt: any, summary: string, featureEyes: string, featureNose: string, featureMouth: string, featureFaceShape: string, personalityMatch: string, sex: string, age: number, embeddingModel: string, embeddingText: string, similarityScore: number, hasImage: boolean }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
    > | null } };

export type PhyIdealPartnersQueryVariables = Exact<{
  input: PhyIdealPartnerSearchInput;
}>;


export type PhyIdealPartnersQuery = { __typename?: 'Query', phyIdealPartners: { __typename?: 'SimpleResult', ok: boolean, msg?: string | null, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner', uid: string, createdAt: any, updatedAt: any, summary: string, featureEyes: string, featureNose: string, featureMouth: string, featureFaceShape: string, personalityMatch: string, sex: string, age: number, embeddingModel: string, embeddingText: string, similarityScore: number, hasImage: boolean }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
    > | null } };

export type PhyIdealPartnerQueryVariables = Exact<{
  uid: Scalars['String']['input'];
}>;


export type PhyIdealPartnerQuery = { __typename?: 'Query', phyIdealPartner: { __typename?: 'SimpleResult', ok: boolean, node?:
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner', uid: string, createdAt: any, updatedAt: any, summary: string, featureEyes: string, featureNose: string, featureMouth: string, featureFaceShape: string, personalityMatch: string, sex: string, age: number, embeddingModel: string, embeddingText: string, similarityScore: number, hasImage: boolean }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
     | null } };

export type SajuProfileLogsQueryVariables = Exact<{
  input: SajuProfileLogSearchInput;
}>;


export type SajuProfileLogsQuery = { __typename?: 'Query', sajuProfileLogs: { __typename?: 'SimpleResult', ok: boolean, msg?: string | null, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog', uid: string, createdAt: any, status: string, text: string }
      | { __typename?: 'SystemStats' }
    > | null } };

export type AiMetaBasicFragment = { __typename?: 'AiMeta', uid: string, createdAt: any, updatedAt: any, name: string, desc: string, metaType: string, prompt: string, model: string, temperature: number, maxTokens: number, size: string, inUse: boolean };

export type AiMetasQueryVariables = Exact<{
  input: AiMetaSearchInput;
}>;


export type AiMetasQuery = { __typename?: 'Query', aiMetas: { __typename?: 'SimpleResult', ok: boolean, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta', uid: string, createdAt: any, updatedAt: any, name: string, desc: string, metaType: string, prompt: string, model: string, temperature: number, maxTokens: number, size: string, inUse: boolean }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
    > | null } };

export type PutAiMetaMutationVariables = Exact<{
  input: AiMetaInput;
}>;


export type PutAiMetaMutation = { __typename?: 'Mutation', putAiMeta?: { __typename?: 'SimpleResult', ok: boolean, uid?: string | null, msg?: string | null } | null };

export type SetAiMetaInUseMutationVariables = Exact<{
  uid: Scalars['String']['input'];
}>;


export type SetAiMetaInUseMutation = { __typename?: 'Mutation', setAiMetaInUse?: { __typename?: 'SimpleResult', ok: boolean, err?: string | null, msg?: string | null } | null };

export type DelAiMetaMutationVariables = Exact<{
  uid: Scalars['String']['input'];
}>;


export type DelAiMetaMutation = { __typename?: 'Mutation', delAiMeta?: { __typename?: 'SimpleResult', ok: boolean, msg?: string | null } | null };

export type AiExecutionBasicFragment = { __typename?: 'AiExecution', uid: string, status: string, metaUid: string, metaType: string, prompt: string, valued_prompt: string, model: string, temperature: number, maxTokens: number, size: string, inputImageBase64?: string | null, outputText?: string | null, errorMessage: string, outputImageBase64?: string | null, createdAt: any, updatedAt: any, elapsedTime: number, inputTokens: number, outputTokens: number, totalTokens: number, runBy?: string | null, runSajuProfileUid?: string | null, inputkvs: Array<{ __typename?: 'KV', k: string, v: string }>, outputkvs: Array<{ __typename?: 'KV', k: string, v: string }> };

export type AiExecutionQueryVariables = Exact<{
  uid: Scalars['String']['input'];
}>;


export type AiExecutionQuery = { __typename?: 'Query', aiExecution: { __typename?: 'SimpleResult', ok: boolean, node?:
      | { __typename?: 'AiExecution', uid: string, status: string, metaUid: string, metaType: string, prompt: string, valued_prompt: string, model: string, temperature: number, maxTokens: number, size: string, inputImageBase64?: string | null, outputText?: string | null, errorMessage: string, outputImageBase64?: string | null, createdAt: any, updatedAt: any, elapsedTime: number, inputTokens: number, outputTokens: number, totalTokens: number, runBy?: string | null, runSajuProfileUid?: string | null, inputkvs: Array<{ __typename?: 'KV', k: string, v: string }>, outputkvs: Array<{ __typename?: 'KV', k: string, v: string }> }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
     | null } };

export type AiExecutionsQueryVariables = Exact<{
  input: AiExecutionSearchInput;
}>;


export type AiExecutionsQuery = { __typename?: 'Query', aiExecutions: { __typename?: 'SimpleResult', ok: boolean, msg?: string | null, total?: number | null, limit?: number | null, offset?: number | null, nodes?: Array<
      | { __typename?: 'AiExecution', uid: string, status: string, metaUid: string, metaType: string, prompt: string, valued_prompt: string, model: string, temperature: number, maxTokens: number, size: string, inputImageBase64?: string | null, outputText?: string | null, errorMessage: string, outputImageBase64?: string | null, createdAt: any, updatedAt: any, elapsedTime: number, inputTokens: number, outputTokens: number, totalTokens: number, runBy?: string | null, runSajuProfileUid?: string | null, inputkvs: Array<{ __typename?: 'KV', k: string, v: string }>, outputkvs: Array<{ __typename?: 'KV', k: string, v: string }> }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
    > | null } };

export type RunAiExecutionMutationVariables = Exact<{
  input: AiExcutionInput;
}>;


export type RunAiExecutionMutation = { __typename?: 'Mutation', runAiExecution: { __typename?: 'SimpleResult', ok: boolean, uid?: string | null, err?: string | null, msg?: string | null } };

export type GetAiMetaTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAiMetaTypesQuery = { __typename?: 'Query', aiMetaTypes: { __typename?: 'SimpleResult', ok: boolean, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType', type: string, inputFields: Array<string>, outputFields: Array<string>, hasInputImage: boolean, hasOutputImage: boolean }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
    > | null } };

export type GetAiMetaKVsQueryVariables = Exact<{
  input: AiMetaKVsInput;
}>;


export type GetAiMetaKVsQuery = { __typename?: 'Query', aiMetaKVs: { __typename?: 'SimpleResult', ok: boolean, err?: string | null, msg?: string | null, value?: string | null, kvs?: Array<{ __typename?: 'KV', k: string, v: string }> | null } };

export type PaljaQueryVariables = Exact<{
  birthdate: Scalars['String']['input'];
  timezone: Scalars['String']['input'];
}>;


export type PaljaQuery = { __typename?: 'Query', palja: { __typename?: 'SimpleResult', ok: boolean, value?: string | null } };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  otp: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'SimpleResult', ok: boolean, value?: string | null, err?: string | null, msg?: string | null } };

export type CreateAdminUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type CreateAdminUserMutation = { __typename?: 'Mutation', createAdminUser: { __typename?: 'SimpleResult', ok: boolean, uid?: string | null, value?: string | null, err?: string | null, msg?: string | null } };

export type LocalLogBasicFragment = { __typename?: 'LocalLog', uid: string, createdAt: any, expiresAt: any, status: string, text: string };

export type LocalLogsQueryVariables = Exact<{
  input: LocalLogSearchInput;
}>;


export type LocalLogsQuery = { __typename?: 'Query', localLogs: { __typename?: 'SimpleResult', ok: boolean, msg?: string | null, total?: number | null, limit?: number | null, offset?: number | null, nodes?: Array<
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog', uid: string, createdAt: any, expiresAt: any, status: string, text: string }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats' }
    > | null } };

export type SystemStatsBasicFragment = { __typename?: 'SystemStats', hostname: string, cpuUsage: number, memoryUsage: number, memoryTotal: number };

export type SystemStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type SystemStatsQuery = { __typename?: 'Query', systemStats: { __typename?: 'SimpleResult', ok: boolean, node?:
      | { __typename?: 'AiExecution' }
      | { __typename?: 'AiMeta' }
      | { __typename?: 'AiMetaType' }
      | { __typename?: 'LocalLog' }
      | { __typename?: 'PhyIdealPartner' }
      | { __typename?: 'SajuProfile' }
      | { __typename?: 'SajuProfileLog' }
      | { __typename?: 'SystemStats', hostname: string, cpuUsage: number, memoryUsage: number, memoryTotal: number }
     | null } };

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
  partnerEmbeddingText
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
  embeddingModel
  embeddingText
  similarityScore
  hasImage
}
    `;
export const AiMetaBasicFragmentDoc = gql`
    fragment aiMetaBasic on AiMeta {
  uid
  createdAt
  updatedAt
  name
  desc
  metaType
  prompt
  model
  temperature
  maxTokens
  size
  inUse
}
    `;
export const AiExecutionBasicFragmentDoc = gql`
    fragment aiExecutionBasic on AiExecution {
  uid
  status
  metaUid
  metaType
  prompt
  valued_prompt
  inputkvs {
    k
    v
  }
  outputkvs {
    k
    v
  }
  model
  temperature
  maxTokens
  size
  inputImageBase64
  outputText
  errorMessage
  outputImageBase64
  createdAt
  updatedAt
  elapsedTime
  inputTokens
  outputTokens
  totalTokens
  runBy
  runSajuProfileUid
}
    `;
export const LocalLogBasicFragmentDoc = gql`
    fragment localLogBasic on LocalLog {
  uid
  createdAt
  expiresAt
  status
  text
}
    `;
export const SystemStatsBasicFragmentDoc = gql`
    fragment systemStatsBasic on SystemStats {
  hostname
  cpuUsage
  memoryUsage
  memoryTotal
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
export const SajuProfileLogsDocument = gql`
    query sajuProfileLogs($input: SajuProfileLogSearchInput!) {
  sajuProfileLogs(input: $input) {
    ok
    msg
    nodes {
      ... on SajuProfileLog {
        uid
        createdAt
        status
        text
      }
    }
  }
}
    `;

/**
 * __useSajuProfileLogsQuery__
 *
 * To run a query within a React component, call `useSajuProfileLogsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSajuProfileLogsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSajuProfileLogsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSajuProfileLogsQuery(baseOptions: Apollo.QueryHookOptions<SajuProfileLogsQuery, SajuProfileLogsQueryVariables> & ({ variables: SajuProfileLogsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SajuProfileLogsQuery, SajuProfileLogsQueryVariables>(SajuProfileLogsDocument, options);
      }
export function useSajuProfileLogsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SajuProfileLogsQuery, SajuProfileLogsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SajuProfileLogsQuery, SajuProfileLogsQueryVariables>(SajuProfileLogsDocument, options);
        }
// @ts-ignore
export function useSajuProfileLogsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SajuProfileLogsQuery, SajuProfileLogsQueryVariables>): Apollo.UseSuspenseQueryResult<SajuProfileLogsQuery, SajuProfileLogsQueryVariables>;
export function useSajuProfileLogsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SajuProfileLogsQuery, SajuProfileLogsQueryVariables>): Apollo.UseSuspenseQueryResult<SajuProfileLogsQuery | undefined, SajuProfileLogsQueryVariables>;
export function useSajuProfileLogsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SajuProfileLogsQuery, SajuProfileLogsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SajuProfileLogsQuery, SajuProfileLogsQueryVariables>(SajuProfileLogsDocument, options);
        }
export type SajuProfileLogsQueryHookResult = ReturnType<typeof useSajuProfileLogsQuery>;
export type SajuProfileLogsLazyQueryHookResult = ReturnType<typeof useSajuProfileLogsLazyQuery>;
export type SajuProfileLogsSuspenseQueryHookResult = ReturnType<typeof useSajuProfileLogsSuspenseQuery>;
export type SajuProfileLogsQueryResult = Apollo.QueryResult<SajuProfileLogsQuery, SajuProfileLogsQueryVariables>;
export const AiMetasDocument = gql`
    query aiMetas($input: AiMetaSearchInput!) {
  aiMetas(input: $input) {
    ok
    nodes {
      ... on AiMeta {
        ...aiMetaBasic
      }
    }
  }
}
    ${AiMetaBasicFragmentDoc}`;

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
export const SetAiMetaInUseDocument = gql`
    mutation setAiMetaInUse($uid: String!) {
  setAiMetaInUse(uid: $uid) {
    ok
    err
    msg
  }
}
    `;
export type SetAiMetaInUseMutationFn = Apollo.MutationFunction<SetAiMetaInUseMutation, SetAiMetaInUseMutationVariables>;

/**
 * __useSetAiMetaInUseMutation__
 *
 * To run a mutation, you first call `useSetAiMetaInUseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetAiMetaInUseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setAiMetaInUseMutation, { data, loading, error }] = useSetAiMetaInUseMutation({
 *   variables: {
 *      uid: // value for 'uid'
 *   },
 * });
 */
export function useSetAiMetaInUseMutation(baseOptions?: Apollo.MutationHookOptions<SetAiMetaInUseMutation, SetAiMetaInUseMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetAiMetaInUseMutation, SetAiMetaInUseMutationVariables>(SetAiMetaInUseDocument, options);
      }
export type SetAiMetaInUseMutationHookResult = ReturnType<typeof useSetAiMetaInUseMutation>;
export type SetAiMetaInUseMutationResult = Apollo.MutationResult<SetAiMetaInUseMutation>;
export type SetAiMetaInUseMutationOptions = Apollo.BaseMutationOptions<SetAiMetaInUseMutation, SetAiMetaInUseMutationVariables>;
export const DelAiMetaDocument = gql`
    mutation delAiMeta($uid: String!) {
  delAiMeta(uid: $uid) {
    ok
    msg
  }
}
    `;
export type DelAiMetaMutationFn = Apollo.MutationFunction<DelAiMetaMutation, DelAiMetaMutationVariables>;

/**
 * __useDelAiMetaMutation__
 *
 * To run a mutation, you first call `useDelAiMetaMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDelAiMetaMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [delAiMetaMutation, { data, loading, error }] = useDelAiMetaMutation({
 *   variables: {
 *      uid: // value for 'uid'
 *   },
 * });
 */
export function useDelAiMetaMutation(baseOptions?: Apollo.MutationHookOptions<DelAiMetaMutation, DelAiMetaMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DelAiMetaMutation, DelAiMetaMutationVariables>(DelAiMetaDocument, options);
      }
export type DelAiMetaMutationHookResult = ReturnType<typeof useDelAiMetaMutation>;
export type DelAiMetaMutationResult = Apollo.MutationResult<DelAiMetaMutation>;
export type DelAiMetaMutationOptions = Apollo.BaseMutationOptions<DelAiMetaMutation, DelAiMetaMutationVariables>;
export const AiExecutionDocument = gql`
    query aiExecution($uid: String!) {
  aiExecution(uid: $uid) {
    ok
    node {
      ... on AiExecution {
        ...aiExecutionBasic
      }
    }
  }
}
    ${AiExecutionBasicFragmentDoc}`;

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
        ...aiExecutionBasic
      }
    }
  }
}
    ${AiExecutionBasicFragmentDoc}`;

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
    err
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
export const GetAiMetaTypesDocument = gql`
    query getAiMetaTypes {
  aiMetaTypes {
    ok
    nodes {
      ... on AiMetaType {
        type
        inputFields
        outputFields
        hasInputImage
        hasOutputImage
      }
    }
  }
}
    `;

/**
 * __useGetAiMetaTypesQuery__
 *
 * To run a query within a React component, call `useGetAiMetaTypesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAiMetaTypesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAiMetaTypesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAiMetaTypesQuery(baseOptions?: Apollo.QueryHookOptions<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>(GetAiMetaTypesDocument, options);
      }
export function useGetAiMetaTypesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>(GetAiMetaTypesDocument, options);
        }
// @ts-ignore
export function useGetAiMetaTypesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>): Apollo.UseSuspenseQueryResult<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>;
export function useGetAiMetaTypesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>): Apollo.UseSuspenseQueryResult<GetAiMetaTypesQuery | undefined, GetAiMetaTypesQueryVariables>;
export function useGetAiMetaTypesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>(GetAiMetaTypesDocument, options);
        }
export type GetAiMetaTypesQueryHookResult = ReturnType<typeof useGetAiMetaTypesQuery>;
export type GetAiMetaTypesLazyQueryHookResult = ReturnType<typeof useGetAiMetaTypesLazyQuery>;
export type GetAiMetaTypesSuspenseQueryHookResult = ReturnType<typeof useGetAiMetaTypesSuspenseQuery>;
export type GetAiMetaTypesQueryResult = Apollo.QueryResult<GetAiMetaTypesQuery, GetAiMetaTypesQueryVariables>;
export const GetAiMetaKVsDocument = gql`
    query getAiMetaKVs($input: AiMetaKVsInput!) {
  aiMetaKVs(input: $input) {
    ok
    err
    msg
    value
    kvs {
      k
      v
    }
  }
}
    `;

/**
 * __useGetAiMetaKVsQuery__
 *
 * To run a query within a React component, call `useGetAiMetaKVsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAiMetaKVsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAiMetaKVsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetAiMetaKVsQuery(baseOptions: Apollo.QueryHookOptions<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables> & ({ variables: GetAiMetaKVsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables>(GetAiMetaKVsDocument, options);
      }
export function useGetAiMetaKVsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables>(GetAiMetaKVsDocument, options);
        }
// @ts-ignore
export function useGetAiMetaKVsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables>): Apollo.UseSuspenseQueryResult<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables>;
export function useGetAiMetaKVsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables>): Apollo.UseSuspenseQueryResult<GetAiMetaKVsQuery | undefined, GetAiMetaKVsQueryVariables>;
export function useGetAiMetaKVsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables>(GetAiMetaKVsDocument, options);
        }
export type GetAiMetaKVsQueryHookResult = ReturnType<typeof useGetAiMetaKVsQuery>;
export type GetAiMetaKVsLazyQueryHookResult = ReturnType<typeof useGetAiMetaKVsLazyQuery>;
export type GetAiMetaKVsSuspenseQueryHookResult = ReturnType<typeof useGetAiMetaKVsSuspenseQuery>;
export type GetAiMetaKVsQueryResult = Apollo.QueryResult<GetAiMetaKVsQuery, GetAiMetaKVsQueryVariables>;
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
export const LoginDocument = gql`
    mutation login($email: String!, $password: String!, $otp: String!) {
  login(email: $email, password: $password, otp: $otp) {
    ok
    value
    err
    msg
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *      otp: // value for 'otp'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const CreateAdminUserDocument = gql`
    mutation createAdminUser($email: String!, $password: String!) {
  createAdminUser(email: $email, password: $password) {
    ok
    uid
    value
    err
    msg
  }
}
    `;
export type CreateAdminUserMutationFn = Apollo.MutationFunction<CreateAdminUserMutation, CreateAdminUserMutationVariables>;

/**
 * __useCreateAdminUserMutation__
 *
 * To run a mutation, you first call `useCreateAdminUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAdminUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAdminUserMutation, { data, loading, error }] = useCreateAdminUserMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useCreateAdminUserMutation(baseOptions?: Apollo.MutationHookOptions<CreateAdminUserMutation, CreateAdminUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateAdminUserMutation, CreateAdminUserMutationVariables>(CreateAdminUserDocument, options);
      }
export type CreateAdminUserMutationHookResult = ReturnType<typeof useCreateAdminUserMutation>;
export type CreateAdminUserMutationResult = Apollo.MutationResult<CreateAdminUserMutation>;
export type CreateAdminUserMutationOptions = Apollo.BaseMutationOptions<CreateAdminUserMutation, CreateAdminUserMutationVariables>;
export const LocalLogsDocument = gql`
    query localLogs($input: LocalLogSearchInput!) {
  localLogs(input: $input) {
    ok
    msg
    total
    limit
    offset
    nodes {
      ... on LocalLog {
        ...localLogBasic
      }
    }
  }
}
    ${LocalLogBasicFragmentDoc}`;

/**
 * __useLocalLogsQuery__
 *
 * To run a query within a React component, call `useLocalLogsQuery` and pass it any options that fit your needs.
 * When your component renders, `useLocalLogsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLocalLogsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLocalLogsQuery(baseOptions: Apollo.QueryHookOptions<LocalLogsQuery, LocalLogsQueryVariables> & ({ variables: LocalLogsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LocalLogsQuery, LocalLogsQueryVariables>(LocalLogsDocument, options);
      }
export function useLocalLogsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LocalLogsQuery, LocalLogsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LocalLogsQuery, LocalLogsQueryVariables>(LocalLogsDocument, options);
        }
// @ts-ignore
export function useLocalLogsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<LocalLogsQuery, LocalLogsQueryVariables>): Apollo.UseSuspenseQueryResult<LocalLogsQuery, LocalLogsQueryVariables>;
export function useLocalLogsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LocalLogsQuery, LocalLogsQueryVariables>): Apollo.UseSuspenseQueryResult<LocalLogsQuery | undefined, LocalLogsQueryVariables>;
export function useLocalLogsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LocalLogsQuery, LocalLogsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<LocalLogsQuery, LocalLogsQueryVariables>(LocalLogsDocument, options);
        }
export type LocalLogsQueryHookResult = ReturnType<typeof useLocalLogsQuery>;
export type LocalLogsLazyQueryHookResult = ReturnType<typeof useLocalLogsLazyQuery>;
export type LocalLogsSuspenseQueryHookResult = ReturnType<typeof useLocalLogsSuspenseQuery>;
export type LocalLogsQueryResult = Apollo.QueryResult<LocalLogsQuery, LocalLogsQueryVariables>;
export const SystemStatsDocument = gql`
    query systemStats {
  systemStats {
    ok
    node {
      ... on SystemStats {
        ...systemStatsBasic
      }
    }
  }
}
    ${SystemStatsBasicFragmentDoc}`;

/**
 * __useSystemStatsQuery__
 *
 * To run a query within a React component, call `useSystemStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSystemStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSystemStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSystemStatsQuery(baseOptions?: Apollo.QueryHookOptions<SystemStatsQuery, SystemStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SystemStatsQuery, SystemStatsQueryVariables>(SystemStatsDocument, options);
      }
export function useSystemStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SystemStatsQuery, SystemStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SystemStatsQuery, SystemStatsQueryVariables>(SystemStatsDocument, options);
        }
// @ts-ignore
export function useSystemStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SystemStatsQuery, SystemStatsQueryVariables>): Apollo.UseSuspenseQueryResult<SystemStatsQuery, SystemStatsQueryVariables>;
export function useSystemStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SystemStatsQuery, SystemStatsQueryVariables>): Apollo.UseSuspenseQueryResult<SystemStatsQuery | undefined, SystemStatsQueryVariables>;
export function useSystemStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SystemStatsQuery, SystemStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SystemStatsQuery, SystemStatsQueryVariables>(SystemStatsDocument, options);
        }
export type SystemStatsQueryHookResult = ReturnType<typeof useSystemStatsQuery>;
export type SystemStatsLazyQueryHookResult = ReturnType<typeof useSystemStatsLazyQuery>;
export type SystemStatsSuspenseQueryHookResult = ReturnType<typeof useSystemStatsSuspenseQuery>;
export type SystemStatsQueryResult = Apollo.QueryResult<SystemStatsQuery, SystemStatsQueryVariables>;