import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    username: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },

    type: { type: String, enum: ["company", "employee"], required: true },

    // companyId references the company for employees; for company user it's same as _id
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return this.type === "employee";
      },
      default: null
    },

    is_active: { type: Boolean, default: true },

    joining_date: { type: Date },
    age: { type: Number },
    sex: { type: String, enum: ["male", "female", "other"] },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zip: { type: String }
    }
  },
  { timestamps: true }
);

// Virtual to get companyId for companies as their own _id
UserSchema.virtual("effectiveCompanyId").get(function() {
  if (this.type === "company") {
    return this._id;
  }
  return this.companyId;
});

// To include virtuals in JSON response
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
