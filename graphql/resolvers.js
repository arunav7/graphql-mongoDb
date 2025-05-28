import User from '../models/User.js';
import BillingAccount from '../models/BillingAccount.js';
import Product from '../models/Product.js';

export default {
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
  },
  Mutation: {
    createUser: async (_, { name, email }) => {
      return await User.create({ name, email });
    },
    createBillingAccount: async (_, { userId, name }) => {
      const account = await BillingAccount.create({ name, user: userId });
      await User.findByIdAndUpdate(userId, { $push: { billingAccounts: account._id } });
      return account;
    },
    createProduct: async (_, { accountId, name, price }) => {
      const product = await Product.create({ name, price, billingAccount: accountId });
      await BillingAccount.findByIdAndUpdate(accountId, { $push: { products: product._id } });
      return product;
    },
  },
};
