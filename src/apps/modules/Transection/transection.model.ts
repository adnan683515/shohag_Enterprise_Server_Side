import mongoose, { Schema } from "mongoose";

const TxSchema = new Schema({
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    year: {
        type: Number,
        default: () => new Date().getFullYear(),
    },

    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",          // 🔥 MUST
        required: true,
    },

    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User",          // 🔥 MUST
        required: true,
    },

    createdBy: {
        type: String,
        required: true,
    },
    medium: {
        type: String,
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
    },
});

export const Transaction = mongoose.model("Transaction", TxSchema);
