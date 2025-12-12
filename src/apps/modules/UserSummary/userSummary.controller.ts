import { Request, Response } from "express";
import { DailySummary } from "./userSummary.model";
import { User } from "../user/user.model";
import { google } from "googleapis";
import { auth } from "../../utils/googleSheet/appendGoogleSheet";
import env from "../../config/env";
import { insertSummaryRow } from "../../utils/googleSheet/summaryAddedgooogleSheet";
import { insertMergedTitle } from "../../utils/googleSheet/titleCreate";
import nodeCron from "node-cron";



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

        console.log(summaries)


        for (const s of summaries) {
            const sender = await User.findById(s.senderSummaryId).select("name");
            const receiver = await User.findById(s.receiverSummaryId).select("name");


            console.log(s.receiverSentAmount)

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
        await insertMergedTitle("Opening ShohagEnterpise",2)

    } catch (err) {
        console.error(err)
    }
};




