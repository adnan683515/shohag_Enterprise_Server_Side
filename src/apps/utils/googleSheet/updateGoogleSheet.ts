import { google } from "googleapis";
import { auth } from "../../utils/googleSheet/appendGoogleSheet";
import env from "../../config/env";




export const updateSheetTransaction = async (transactionId: string, updates: any) => {
    const sheets = google.sheets({ version: "v4", auth });

    // 1Get full sheet data
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: env.SHEET_ID,
        range: "Sheet1!A:G",
    });

    const rows = response.data.values || [];
    const header = rows[0];
    const dataRows = rows.slice(1);

    // Find index of row with matching transactionId
    const rowIndex = dataRows.findIndex(row => row[4] === transactionId);

    if (rowIndex === -1) {
        console.log("Transaction ID not found in Google Sheet");
        return false;
    }

    // Actual row number in sheet (header is row 1)
    const sheetRowNumber = rowIndex + 2;

    // Build updated row
    const original = dataRows[rowIndex];

    const updatedRow = [
        updates.sender ?? original[0],
        updates.receiver ?? original[1],
        updates.amount ?? original[2],
        updates.medium ?? original[3],
        transactionId, 
        original[5],
        updates.date ? new Date(updates.date).toLocaleDateString("en-US") : original[6],
    ];

    // Write back to sheet
    await sheets.spreadsheets.values.update({
        spreadsheetId: env.SHEET_ID,
        range: `Sheet1!A${sheetRowNumber}:G${sheetRowNumber}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updatedRow] },
    });

    return true;
};
