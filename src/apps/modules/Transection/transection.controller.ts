import { NextFunction, Request, Response } from "express";
import { Transaction } from "./transection.model";

import { AuthRequest } from "apps/middlewares/middleware";
import { createTransactionSchema } from "../../validations/TransectionValidation/validation";
import mongoose from "mongoose";
import { AppError } from './../../errorHelper/AppError'
import { User } from "../user/user.model";
import { appendTransactionToSheet } from "../../utils/googleSheet/appendGoogleSheet";
import { generateTransactionId } from "../../utils/transectionId";
import { getTransactionsFromSheet } from "../../utils/googleSheet/getDataFromGoogleSheet";
import { updateSheetTransaction } from "../../utils/googleSheet/updateGoogleSheet";

import { insertMergedTitle } from "../../utils/googleSheet/titleCreate";
import { DailySummary } from '../../modules/UserSummary/userSummary.model'
import nodeCron from "node-cron";
import { SeeSummary } from "../UserSummary/userSummary.controller";
import { google } from "googleapis";
import { auth } from '../../utils/googleSheet/appendGoogleSheet'
import env from "../../config/env";






// admin and subadmin add transaction create
const parseSheetDate = (dateStr: string): string | null => {
    // Assuming the sheet format is DD-MM-YY (e.g., 13-12-25)
    try {
        const parts = dateStr.trim().split(/[-/.]/); // Split by '-', '/', or '.'
        if (parts.length < 3) return null;

        // Extract and clean parts
        const [dayStr, monthStr, yearStr] = parts.map(p => p.padStart(2, '0'));

        // Convert YY to YYYY (e.g., 25 -> 2025). Assumes 21st century.
        let fullYear: number;
        if (yearStr.length === 2) {
            fullYear = parseInt(`20${yearStr}`);
        } else if (yearStr.length === 4) {
            fullYear = parseInt(yearStr);
        } else {
            return null; // Invalid year format
        }

        const paddedMonth = monthStr.padStart(2, '0');
        const paddedDay = dayStr.padStart(2, '0');

        return `${fullYear}-${paddedMonth}-${paddedDay}`; // Returns YYYY-MM-DD
    } catch (e) {
        console.error("Error parsing sheet date:", e);
        return null;
    }
};

export const CreateTransectionController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1️⃣ Validate request body
        const parsed = createTransactionSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(400, "Validation Error Create Transaction!");
        }

        const { amount, date, sender, receiver, medium } = parsed.data;
        const txDate = date ? new Date(date) : new Date();
        const txDateStr = txDate.toISOString().split("T")[0]; // YYYY-MM-DD (Used for DB and comparison)

        // 2️⃣ Get sender
        const senderUser = await User.findById(sender);
        if (!senderUser) throw new AppError(404, "Sender not found");
        if (senderUser.parentId) throw new AppError(400, `Sender '${senderUser.name}' is not self-dependent`);

        // 3️⃣ Get receiver
        const receiverUser = await User.findById(receiver);
        if (!receiverUser) throw new AppError(404, "Receiver not found");
        if (receiverUser.parentId) throw new AppError(400, `Receiver '${receiverUser.name}' is not self-dependent`);

        // 4️⃣ Get medium
        let mediumName: string = "";
        let mediumValueForDB: any = "";
        if (mongoose.Types.ObjectId.isValid(medium)) {
            const mediumUser = await User.findById(medium);
            if (!mediumUser) throw new AppError(404, "Medium user not found");
            if (!mediumUser.parentId) throw new AppError(400, `Medium '${mediumUser.name}' is not valid (self-dependent)`);
            mediumName = mediumUser.name;
            mediumValueForDB = medium;
        } else {
            mediumName = medium; // Assuming 'self' or similar literal string
            mediumValueForDB = medium;
        }

        const txId = generateTransactionId();

        // 5️⃣ Save Transaction in MongoDB
        const tx = await Transaction.create({
            amount,
            date: txDate,
            sender,
            receiver,
            medium: mediumValueForDB,
            transactionId: txId,
            year: txDate.getFullYear(),
            createdBy: req.user!.role, // Assuming req.user is populated by middleware
        });

        // 6️⃣ Google Sheets Integration: Find Insertion Index
        const sheets = google.sheets({ version: "v4", auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: env.SHEET_ID,
            range: "Sheet1!A:G",
        });

        const rows = response.data.values || [];
        let insertRowIndex = rows.length; // Default: Append at bottom (if no date is provided or it's the latest date)

        // Use YYYY-MM-DD format for reliable string comparison
        const newTxDateStr = date ? txDateStr : null;

        if (newTxDateStr) {
            // Loop starts at index 1 to skip the header row (index 0)
            for (let i = 1; i < rows.length; i++) {
                const rowDateFromSheet = rows[i][6]; // Date column index (G)

                if (!rowDateFromSheet) continue; // Skip rows with missing dates

                const rowDateStr = parseSheetDate(rowDateFromSheet);
                if (!rowDateStr) continue; // Skip if date parsing failed

                // Compare the new date (YYYY-MM-DD string) with the sheet date
                if (newTxDateStr < rowDateStr) {
                    // New transaction is *chronologically earlier* → insert *before* this row
                    insertRowIndex = i;
                    break;
                } else if (newTxDateStr === rowDateStr) {
                    // New transaction is on the *same date* → insert * after * all transactions on this date
                    let lastSameDateIndex = i;

                    // Continue checking rows until the date changes or we hit the end
                    while (lastSameDateIndex + 1 < rows.length) {
                        const nextRowDateFromSheet = rows[lastSameDateIndex + 1][6];
                        if (!nextRowDateFromSheet) break;

                        const nextRowDateStr = parseSheetDate(nextRowDateFromSheet);

                        if (nextRowDateStr === newTxDateStr) {
                            lastSameDateIndex++;
                        } else {
                            break;
                        }
                    }
                    insertRowIndex = lastSameDateIndex + 1; // Insert after the last matching date row
                    break;
                }
                // If (newTxDateStr > rowDateStr), the new transaction is later, so we continue to the next row
            }
        }

        // 6a️⃣ Insert empty row at the calculated index
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: env.SHEET_ID,
            requestBody: {
                requests: [
                    {
                        insertDimension: {
                            range: {
                                sheetId: 0, // Assuming Sheet1 is the first sheet (gid=0)
                                dimension: "ROWS",
                                startIndex: insertRowIndex, // Index is 0-based
                                endIndex: insertRowIndex + 1,
                            },
                            inheritFromBefore: false,
                        },
                    },
                ],
            },
        });

        // 6b️⃣ Insert transaction row into the newly created empty row
        const txRow = [
            senderUser.name,
            receiverUser.name,
            amount,
            mediumName,
            txId,
            req.user!.role,
            date || txDateStr // Use the original user input date for the sheet if available
        ];

        // The range uses 1-based indexing (A1 notation), so we use insertRowIndex + 1
        await sheets.spreadsheets.values.update({
            spreadsheetId: env.SHEET_ID,
            range: `Sheet1!A${insertRowIndex + 1}:G${insertRowIndex + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [txRow] },
        });

        // 7️⃣ Update DailySummary
        // ... (DailySummary logic remains the same) ...
        let dailySummary = await DailySummary.findOne({
            date: txDateStr,
            $or: [
                { senderSummaryId: sender, receiverSummaryId: receiver },
                { senderSummaryId: receiver, receiverSummaryId: sender }
            ]
        });

        if (!dailySummary) {
            dailySummary = await DailySummary.create({
                date: txDateStr,
                senderSummaryId: sender,
                senderSentAmount: amount,
                senderReceivedAmount: 0,
                receiverSummaryId: receiver,
                receiverSentAmount: 0,
                receiverReceivedAmount: amount,
                topSenderId: sender
            });
        } else {
            if (dailySummary.senderSummaryId.toString() === sender.toString()) {
                dailySummary.senderSentAmount += amount;
                dailySummary.receiverReceivedAmount += amount;
            } else {
                dailySummary.receiverSentAmount += amount;
                dailySummary.senderReceivedAmount += amount;
            }

            dailySummary.topSenderId =
                dailySummary.senderSentAmount >= dailySummary.receiverSentAmount
                    ? dailySummary.senderSummaryId
                    : dailySummary.receiverSummaryId;

            await dailySummary.save();
        }

        // 8️⃣ Return response
        res.json({
            success: true,
            message: "Transaction created successfully",
            data: tx,
            sheetEntry: txRow,
        });

    } catch (err) {
        next(err);
    }
};


// view all transactions
export const viewallTransectionController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { user, sender, receiver, year, startDate, endDate } = req.query;

        const query: any = {};

        // Filter by user (sender or receiver)
        if (user) {
            if (!mongoose.Types.ObjectId.isValid(user as string)) {
                throw new AppError(400, 'Invalid User Id');
            }
            query.$or = [
                { sender: new mongoose.Types.ObjectId(user as string) },
                { receiver: new mongoose.Types.ObjectId(user as string) },
            ];
        }

        // Filter by sender + receiver pair
        if (sender && receiver) {
            if (!mongoose.Types.ObjectId.isValid(sender as string) || !mongoose.Types.ObjectId.isValid(receiver as string)) {
                throw new AppError(400, 'Invalid Sender Or Receiver Id');
            }
            query.sender = new mongoose.Types.ObjectId(sender as string);
            query.receiver = new mongoose.Types.ObjectId(receiver as string);
        }

        // Filter by year
        if (year) {
            query.year = Number(year);
        }

        // Filter by date range
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate as string); // start date inclusive
            }
            if (endDate) {
                query.date.$lte = new Date(endDate as string); // end date inclusive
            }
        }

        let list = await Transaction.find(query).sort({ date: -1 });

        // If user is provided but no MongoDB results, fallback to Google Sheet
        if (user && list.length < 1) {
            const getUserName = await User.findById(user);
            const userName = getUserName?.name;
            if (userName) {
                const transectionDataFromSheet = await getTransactionsFromSheet(userName);
                return res.json({
                    success: true,
                    count: transectionDataFromSheet.length,
                    data: transectionDataFromSheet,
                    source: "Google Sheet"
                });
            }
        }

        return res.json({
            success: true,
            count: list.length,
            source: "MongoDB",
            data: list,
        });

    } catch (err) {
        next(err);
    }
};





// Details transection
export const transactionDetailsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const tx = await Transaction.findById(id);
        if (!tx || !new mongoose.Types.ObjectId(id as string)) {
            throw new AppError(400, 'Transection Not Found Or Invalid Object Id')
        }
        res.json({
            success: true,
            data: tx,
        });
    } catch (err) {
        next(err)
    }
};




// edit transection controller
export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const parsed = createTransactionSchema.partial().safeParse(req.body);
        if (!parsed.success) return next(parsed.error);

        const updates = parsed.data;

        // Update MongoDB FIRST
        const updatedTx = await Transaction.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedTx) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Prepare Google Sheet Update Data
        let googleUpdateData: any = {};

        // sender (convert ID → name)
        if (updates.sender) {
            const s = await User.findById(updates.sender);
            googleUpdateData.sender = s ? s.name : updates.sender;
        }

        // receiver (convert ID → name)
        if (updates.receiver) {
            const r = await User.findById(updates.receiver);
            googleUpdateData.receiver = r ? r.name : updates.receiver;
        }

        // MEDIUM LOGIC (ID OR TEXT)
        if (updates.medium) {
            const isObjectId = mongoose.Types.ObjectId.isValid(updates.medium);

            if (isObjectId) {
                // Medium is user ID
                const m = await User.findById(updates.medium);
                googleUpdateData.medium = m ? m.name : "";
            } else {
                // Medium is simple text → use directly
                googleUpdateData.medium = updates.medium;
            }
        }

        // amount/date
        if (updates.amount) googleUpdateData.amount = updates.amount;
        if (updates.date) googleUpdateData.date = updates.date;

        // Update in Google Sheet
        await updateSheetTransaction(updatedTx.transactionId, googleUpdateData);

        return res.json({
            success: true,
            source: "MongoDB + Google Sheet",
            message: "Transaction updated successfully",
            updatedTx,
        });

    } catch (err) {
        next(new AppError(400, "Failed to update transaction"));
    }
};





// Controller to schedule Opening and Ending automatically
export const scheduleSheetTitles = async () => {

    // Schedule cron at 12:05 PM every day (Dhaka time)
    nodeCron.schedule(
        "14 11 * * *", // minute 14, hour 11
        async () => {
            console.log("Running Daily Summary Cron Job at 12:05 PM");
            try {
                await SeeSummary();
                console.log("Daily Summary added to Google Sheet successfully.");
            } catch (err) {
                console.error("Error in Daily Summary Cron Job:", err);
            }
        },
        {
            timezone: "Asia/Dhaka", // Make sure it runs in Dhaka time
        }
    );




    const welcomeSetting = await (await User.find()).length

    if (welcomeSetting < 1) {
        console.log("welcome")
        await insertMergedTitle("Welcome to Shohag Enterprise!", 1);
        await insertMergedTitle("Opening ShohagEnterpise", 2);
    }



    // 12:01 AM → Opening
    // nodeCron.schedule("50 16 * * *", async () => {
    //     try {
    //         await insertMergedTitle("Opening ShohagEnterpise");
    //     } catch (err) {
    //         console.error("Error inserting Opening row:", err);
    //     }
    // });


    // 12:00 PM → Ending
    // nodeCron.schedule("52 16 * * *", async () => {
    //     try {
    //         await insertMergedTitle("Ending Shohag EnterPrise");
    //     } catch (err) {
    //         console.error("Error inserting Ending row:", err);
    //     }
    // });


};




// Controller to manually insert a title
// export const insertSheetTitleController = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { title } = req.body;
//         if (!title) return res.status(400).json({ message: "Title is required" });

//         await insertMergedTitle(title);

//         return res.status(200).json({
//             success: true,
//             message: `Inserted '${title}' in Google Sheet`,
//         });
//     } catch (err) {
//         next(err);
//     }
// };





