import mongoose from "mongoose";

const DailySummarySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, index: true },


    senderSummaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    senderSentAmount: { type: Number, default: 0 },
    senderReceivedAmount: { type: Number, default: 0 },


    receiverSummaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    receiverSentAmount: { type: Number, default: 0 },
    receiverReceivedAmount: { type: Number, default: 0 },


    topSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);


DailySummarySchema.index(
  { date: 1, senderSummaryId: 1, receiverSummaryId: 1 },
  { unique: true }
);

export const DailySummary = mongoose.model("DailySummary", DailySummarySchema);
