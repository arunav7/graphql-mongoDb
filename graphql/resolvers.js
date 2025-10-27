import { GraphQLScalarType, Kind } from 'graphql';

import { PubSub } from 'graphql-subscriptions';
import BillingAccount from '../models/BillingAccount.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

export const pubsub = new PubSub();
export const COUNTS_UPDATED = 'COUNTS_UPDATED';

const StrNum = new GraphQLScalarType({
    name: 'StrNum',
    description: 'A custom scalar that accepts only string or integer values.',

    // For values coming from client input
    parseValue(value) {
        if (typeof value === 'string' || Number.isInteger(value)) {
            return value;
        }
        throw new Error('StrNum must be a string or integer');
    },

    // For values sent to the client
    serialize(value) {
        if (typeof value === 'string' || Number.isInteger(value)) {
            return value;
        }
        throw new Error('StrNum must be a string or integer');
    },

    // For inline literals in queries (e.g. name: "abc" or name: 123)
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
            return ast.value;
        }
        throw new Error('StrNum must be a string or integer literal');
    },
});

async function getCounts() {
    const [users, billingAccounts] = await Promise.all([
        User.estimatedDocumentCount(),
        BillingAccount.estimatedDocumentCount(),
    ]);
    return { users, billingAccounts };
}

export default {
    StrNum,
    Query: {
        getUsers: async () =>
            await User.find().populate({
                path: 'billingAccounts',
                populate: { path: 'products' },
            }),
        getBillingAccounts: async (_, { userId }) => {
            const user = await User.findById(userId).populate({
                path: 'billingAccounts',
                populate: { path: 'products' },
            });
            return user.billingAccounts;
        },
        getProducts: async (_, { accountId }) => {
            const account = await BillingAccount.findById(accountId).populate('products');
            return account.products;
        },
        getUser: async (_, { id }) => {
            return await User.findById(id).populate({
                path: 'billingAccounts',
                populate: { path: 'products' },
            });
        },
        getBillingAccount: async (_, { id }) => {
            return await BillingAccount.findById(id).populate('products');
        },
        getProduct: async (_, { id }) => {
            return await Product.findById(id);
        },
        counts: async () => getCounts(),
    },
    Mutation: {
        createUser: async (_, payload) => {
            const { name, email } = payload.input ?? {};
            console.log({ payload, name, email });
            const created = await User.create({ name, email });
            pubsub.publish(COUNTS_UPDATED, { countsUpdated: await getCounts() });
            return created;
        },
        createBillingAccount: async (_, payload) => {
            const { name, userId } = payload.input ?? {};
            const account = await BillingAccount.create({ name, user: userId });
            await User.findByIdAndUpdate(userId, { $push: { billingAccounts: account._id } });
            pubsub.publish(COUNTS_UPDATED, { countsUpdated: await getCounts() });
            return account;
        },
        createProduct: async (_, payload) => {
            const { accountId, name, price } = payload.input ?? {};
            const product = await Product.create({ name, price, billingAccount: accountId });
            await BillingAccount.findByIdAndUpdate(accountId, { $push: { products: product._id } });
            return product;
        },
    },
    Subscription: {
        countsUpdated: {
            subscribe: () => pubsub.asyncIterableIterator([COUNTS_UPDATED]),
        },
    },
};
