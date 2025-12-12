import { NextFunction, Request, Response } from "express";
import { DailySummary } from "./userSummary.model";
import { User } from "../user/user.model";
import { google } from "googleapis";
import { auth } from "../../utils/googleSheet/appendGoogleSheet";
import env from "../../config/env";
import { insertSummaryRow } from "../../utils/googleSheet/summaryAddedgooogleSheet";
import { insertMergedTitle } from "../../utils/googleSheet/titleCreate";
import nodeCron from "node-cron";
import { AppError } from '../../errorHelper/AppError';


export const SeeSummary = async () => {
    try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const date = `${yyyy}-${mm}-${dd}`;

        const summaries = await DailySummary.find({ date });
        const sheets = google.sheets({ version: "v4", auth });

        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId: env.SHEET_ID,
            range: "Sheet1!A:A"
        });

        const rows = sheetData.data.values || [];
        let nextRow = rows.length + 2;

        await insertSummaryRow(nextRow, `দৈনিক সারসংক্ষেপ (${date})`);
        nextRow++;

        for (const s of summaries) {
            const sender = await User.findById(s.senderSummaryId).select("name");
            const receiver = await User.findById(s.receiverSummaryId).select("name");

            let text = `${sender?.name || "অজানা"} পাঠাল: ${s.senderSentAmount} Tk, ` +
                `  ${receiver?.name || "অজানা"} পাঠাল: ${s.receiverSentAmount} Tk`;

            const baki = Math.abs(s.senderSentAmount - s.receiverSentAmount);

            if (baki > 0 && s.topSenderId) {
                const topSender = await User.findById(s.topSenderId).select("name");
                text += `,      ${topSender?.name || "অজানা"} বাকি: ${baki} Tk পাবেন`;
            }

            await insertSummaryRow(nextRow, text);
            nextRow++;
        }

        await insertMergedTitle("Ending Shohag EnterPrise", 1);
        await insertMergedTitle("Opening ShohagEnterpise", 2);

    } catch (err: any) {
        // Log original error for debugging
        console.error("SeeSummary error:", err);

        // Wrap and rethrow as AppError so caller can handle centrally
        throw new AppError(500, "Failed to generate daily summary sheet");
    }
};






// search by date of summary
export const searchSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date, senderId, receiverId } = req.query;

        const filter: any = {};

        if (date) {
            filter.date = date;
        }

        if (senderId && receiverId) {
        
            filter.senderSummaryId = { $in: [senderId, receiverId] };
            filter.receiverSummaryId = { $in: [senderId, receiverId] };
        }

        // No parameter passed -> use AppError
        if (Object.keys(filter).length === 0) {
            return next(new AppError(400, "Please provide date, senderId or receiverId"));
        }

        const result = await DailySummary.find(filter)
            .populate("senderSummaryId", "name")
            .populate("receiverSummaryId", "name")
            .populate("topSenderId", "name");

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result,
        });

    } catch (error: any) {
        return next(new AppError(500, error?.message || "Something went wrong while searching summaries"));
    }
};
