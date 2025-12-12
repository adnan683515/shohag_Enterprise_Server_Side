import { google } from "googleapis";
import { auth } from "../../utils/googleSheet/appendGoogleSheet";
import env from "../../config/env";

export const insertMergedTitle = async (title: string,emptyOFnumber : number) => {
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Get all values in column A to find the first empty row
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.SHEET_ID,
    range: "Sheet1!A:A",
  });

  const rows = response.data.values || [];
  const firstEmptyRow = rows.length + emptyOFnumber;

  // 2. Build the title with underscores for styling
  const fullTitle = `________________________________ ${title} __________________________________`;

  // 3. Insert the title in the first empty row
  await sheets.spreadsheets.values.update({
    spreadsheetId: env.SHEET_ID,
    range: `Sheet1!A${firstEmptyRow}:G${firstEmptyRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[fullTitle]], // single row
    },
  });

  // 4. Merge columns A-G for that row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: env.SHEET_ID,
    requestBody: {
      requests: [
        {
          mergeCells: {
            range: {
              sheetId: 0, // Sheet1 ID (usually 0)
              startRowIndex: firstEmptyRow - 1,
              endRowIndex: firstEmptyRow,
              startColumnIndex: 0,
              endColumnIndex: 7,
            },
            mergeType: "MERGE_ALL",
          },
        },
      ],
    },
  });

  console.log(`Inserted merged title "${title}" at row ${firstEmptyRow}`);
};
