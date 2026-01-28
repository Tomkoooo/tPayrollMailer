import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmployee extends Document {
  name: string;
  email: string;
  passwordHint: string;
  pdfName: string;
  password: string; // Confidential code for PDF encryption
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    passwordHint: {
      type: String,
      required: [true, "Password hint is required"],
      trim: true,
    },
    pdfName: {
      type: String,
      required: [true, "PDF name is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);

export default Employee;
