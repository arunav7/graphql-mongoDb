import { gql } from 'apollo-server-express';

export default gql`
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

  type Query {
    getUsers: [User]
    getBillingAccounts(userId: ID!): [BillingAccount]
    getProducts(accountId: ID!): [Product]
    getUser(id: ID!): User
    getBillingAccount(id: ID!): BillingAccount
    getProduct(id: ID!): Product
  }

  type Mutation {
    createUser(name: String!, email: String!): User
    createBillingAccount(userId: ID!, name: String!): BillingAccount
    createProduct(accountId: ID!, name: String!, price: Float!): Product
  }
`;
