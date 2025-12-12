import env from "./../../config/env";
import { google } from "googleapis";
import {auth} from '../../utils/googleSheet/appendGoogleSheet'



export const insertSummaryRow = async (rowNumber: number, text: string) => {
    const sheets = google.sheets({ version: "v4", auth });

    // Insert text
    await sheets.spreadsheets.values.update({
        spreadsheetId: env.SHEET_ID,
        range: `Sheet1!A${rowNumber}:G${rowNumber}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[text]]
        }
    });

    // Merge row A-G
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: env.SHEET_ID,
        requestBody: {
            requests: [
                {
                    mergeCells: {
                        range: {
                            sheetId: 0,
                            startRowIndex: rowNumber - 1,
                            endRowIndex: rowNumber,
                            startColumnIndex: 0,
                            endColumnIndex: 7
                        },
                        mergeType: "MERGE_ALL"
                    }
                },
                {
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: rowNumber - 1,
                            endRowIndex: rowNumber,
                            startColumnIndex: 0,
                            endColumnIndex: 7
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.9, green: 0.95, blue: 1 },
                                horizontalAlignment: "CENTER",
                                textFormat: { bold: true }
                            }
                        },
                        fields:
                            "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
                    }
                }
            ]
        }
    });
};
