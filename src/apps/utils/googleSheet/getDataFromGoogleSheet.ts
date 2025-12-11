import { google } from "googleapis";
import { auth } from '../../utils/googleSheet/appendGoogleSheet'
import env from '../../config/env'




export async function getTransactionsFromSheet(name: string) {

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: env.SHEET_ID,
        range: "sheet1!A:G", // adjust based on your columns
    });

    const rows = response.data.values || [];
    const header = rows[0]; // assuming first row is header
    const dataRows = rows.slice(1);

    // Filter rows by name (either sender or receiver)
    const filtered = dataRows.filter(row => {
        const sender = row[0];   // assuming sender in column A
        const receiver = row[1]; // assuming receiver in column B
        return sender === name || receiver === name;
    });

    // Map to TransactionRow objects
    return filtered.map(row => ({
        sender: row[0],
        receiver: row[1],
        amount: Number(row[2]),
        medium: row[3],
        transactionId: row[4],
        createdBy: row[5],
        date: new Date(row[6]),
    }));
}
