import { gql } from 'apollo-server-express';

export default gql`
    scalar StrNum

    type Product {
        id: ID!
        name: String!
        price: Float!
    }

    type BillingAccount {
        id: ID!
        name: String!
        products: [Product]
    }

    type User {
        id: ID!
        name: String!
        email: String!
        billingAccounts: [BillingAccount]
    }

    type Counts {
        users: Int!
        billingAccounts: Int!
    }

    type Query {
        getUsers: [User]
        getBillingAccounts(userId: ID!): [BillingAccount]
        getProducts(accountId: ID!): [Product]
        getUser(id: ID!): User
        getBillingAccount(id: ID!): BillingAccount
        getProduct(id: ID!): Product
        counts: Counts!
    }

    input UserInput {
        name: String!
        email: String!
    }

    input BillingAccountInput {
        name: String!
        userId: ID!
    }

    input ProductInput {
        name: String!
        price: Float!
        billingAccountId: ID!
    }

    type Mutation {
        createUser(input: UserInput!): User
        createBillingAccount(input: BillingAccountInput!): BillingAccount
        createProduct(input: ProductInput!): Product
    }

    type Subscription {
        countsUpdated: Counts!
    }
`;
