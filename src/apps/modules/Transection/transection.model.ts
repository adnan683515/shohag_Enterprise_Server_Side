import mongoose from "mongoose";


// TRANSACTION MODEL
const TxSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now   // auto today date
    },
    year: {
        type: Number,
        default: () => new Date().getFullYear()  // auto year
    },
    sender: {
        type: String,
        required: true
    },

    receiver: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    medium : {
        type : String,
        required : true

    }
});


export const Transaction = mongoose.model("Transaction", TxSchema);
