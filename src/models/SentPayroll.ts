import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISentPayroll extends Document {
  employeeId: Types.ObjectId;
  year: number;
  month: number; // 1-12
  sentAt: Date;
  pdfNameUsed: string;
  status: "sent" | "failed";
}

const SentPayrollSchema = new Schema<ISentPayroll>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: [true, "Employee ID is required"],
  },
  year: {
    type: Number,
    required: [true, "Year is required"],
    min: 2000,
    max: 2100,
  },
  month: {
    type: Number,
    required: [true, "Month is required"],
    min: 1,
    max: 12,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  pdfNameUsed: {
    type: String,
    required: [true, "PDF name is required"],
  },
  status: {
    type: String,
    enum: ["sent", "failed"],
    default: "sent",
  },
});

// Indexes for efficient querying by year/month and employee
SentPayrollSchema.index({ year: 1, month: 1 });
SentPayrollSchema.index({ employeeId: 1 });
SentPayrollSchema.index({ sentAt: -1 });

const SentPayroll: Model<ISentPayroll> =
  mongoose.models.SentPayroll ||
  mongoose.model<ISentPayroll>("SentPayroll", SentPayrollSchema);

export default SentPayroll;
