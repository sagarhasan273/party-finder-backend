// models/user.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { UserType } from 'src/types/user.type';

// Main User Schema
const UserModalSchema = new Schema<UserType & Document>({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    match: [/^USR\d{6}\d{4}$/, 'User ID must follow the format USRYYMMDDCOUNTER']
  },
  name: {
    type: String,
  },
  username: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  profilePhoto: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  verified: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret: any) {
      // Handle main document
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      if ('__v' in ret) delete ret.__v;
    }
  },
  toObject: {
    transform: function (doc, ret: any) {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      if ('__v' in ret) delete ret.__v;
    }
  }
});

// Indexes
UserModalSchema.index({ createdAt: -1 });

// Virtuals
UserModalSchema.virtual('fullProfile').get(function () {
  return {
    id: this._id,
    username: this.username,
    name: this.name,
    email: this.email,
    profilePhoto: this.profilePhoto,
  };
});

export const UserModel = mongoose.model<UserType & Document>('users', UserModalSchema);