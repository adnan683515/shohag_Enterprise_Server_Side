


import env from "../../config/env";
import { google } from "googleapis";



interface TransactionRow {
    sender: string;
    receiver: string;
    amount: number;
    medium: string;
    transactionId: string;
    createdBy?: string; // optional now
    date: Date;
}





const creadentTialsValue =
{
    "type": "service_account",
    "project_id":`${env.GOOGLE_PROJECT_ID}`,
    "private_key_id": `${env.GOOGLE_PRIVATE_KEY_ID}`,
    "private_key": `${env.GOOGLE_PRIVATE_KEY}`,
    "client_email": `${env.GOOGLE_CLIENT_EMAIL}`,
    "client_id": `${env.GOOGLE_CLIENT_ID}`,
    "auth_uri": `${env.GOOGLE_AUTH_URI}`,
    "token_uri": `${env.GOOGLE_TOKEN_URI}`,
    "auth_provider_x509_cert_url": `${env.GOOGLE_AUTH_PROVIDER_CERT_URL}`,
    "client_x509_cert_url": `${env.GOOGLE_CLIENT_CERT_URL}`,
    "universe_domain": `${env.GOOGLE_UNIVERSE_DOMAIN}`
}


export async function appendTransactionToSheet(data: TransactionRow) {

    try {
        // Google Auth
        const auth = new google.auth.GoogleAuth({
            credentials : creadentTialsValue,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const sheets = google.sheets({ version: "v4", auth });

        // Format date: MM-DD-YY
        const formattedDate = `${String(data.date.getMonth() + 1).padStart(2, "0")}-${String(
            data.date.getDate()
        ).padStart(2, "0")}-${String(data.date.getFullYear()).slice(2)}`;

        // Prepare row
        const row = [
            data.sender,
            data.receiver,
            data.amount,
            data.medium,
            data.transactionId,
            data.createdBy,
            formattedDate,
        ];

        // Append to sheet (A:G)

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId : env.SHEET_ID,
            range: "sheet1!A1:G",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [row],
            },
        });

  

        return response.data;
    } catch (err) {
        console.error("Google Sheet append failed:", err);
        throw err;
    }
}
