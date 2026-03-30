// models/user.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { UserType } from 'src/types/user.type';

// Main User Schema
const UserModalSchema = new Schema<UserType & Document>({
  googleId: { type: String, required: true, unique: true },
  userId: {
    type: String,
    required: true,
    unique: true,
    match: [/^USR\d{6}\d{4}$/, 'User ID must follow the format USRYYMMDDCOUNTER']
  },

  name: String,
  username: String,

  email: {
    type: String,
    required: true,
    unique: true,
  },

  profilePhoto: String,

  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },

  verified: { type: Boolean, default: false },

  // 🔥 NEW FIELDS
  country: { type: String },
  rank: { type: String },
  pickRank: { type: String },

  mainRole: {
    type: String,
    enum: ["Any", "Duelist", "Initiator", "Controller", "Sentinel"],
  },

  gamename: { type: String },
  tagline: { type: String },

  playstyle: {
    type: String,
    enum: ["😌 Chill", "⚖️ Balanced", "⚔️ Competitive", "🎯 Serious", "🔥 Tryhard"],
    default: "😌 Chill",
  },

  region: {
    type: String,
    default: "ap",
  },

  agents: {
    type: [String],
    default: [],
  },

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