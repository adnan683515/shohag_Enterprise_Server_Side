import mongoose from "mongoose";


const DailySummarySchema = new mongoose.Schema({
  date: { type: String, required: true },

  // Sender reference to User
  senderSummaryId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderSentAmount: { type: Number, default: 0 },
  senderReceivedAmount: { type: Number, default: 0 },

  // Receiver reference to User
  receiverSummaryId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverSentAmount: { type: Number, default: 0 },
  receiverReceivedAmount: { type: Number, default: 0 },


  // Who sent more today (userId reference)
  topSenderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export const DailySummary = mongoose.model("DailySummary", DailySummarySchema);

