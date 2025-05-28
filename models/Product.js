import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  billingAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BillingAccount' },
});

export default mongoose.model('Product', productSchema);
