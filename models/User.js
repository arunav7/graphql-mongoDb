import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // ensures no duplicate emails
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
  },
  billingAccounts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingAccount',
    },
  ],
});

export default mongoose.model('User', userSchema);
