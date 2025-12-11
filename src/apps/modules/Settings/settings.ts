
import mongoose from "mongoose";



const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed }, // can store boolean, string, number, etc.
}, { timestamps: true });

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;





