import { AppError } from './../errorHelper/AppError';
import dotenv from "dotenv";
dotenv.config();

interface EnvTypes {
    PORT: number;
    DB_NAME: string;
    DB_PASS: string;
    DB_URL: string;
    NODE_ENV: 'development' | 'production';
    JWT_SECRET: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    EMAIL_USER: string;
    EMAIL_PASS: string;
    ADMIN_NAME: string;
    ADMIN_PASS: string;
    ADMIN_EMAIL: string;



    // spread sheet id 
    spreadsheetId : string;
    // Google Fields
    GOOGLE_PROJECT_ID: string;
    GOOGLE_PRIVATE_KEY_ID: string;
    GOOGLE_PRIVATE_KEY: string;
    GOOGLE_CLIENT_EMAIL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_AUTH_URI: string;
    GOOGLE_TOKEN_URI: string;
    GOOGLE_AUTH_PROVIDER_CERT_URL: string;
    GOOGLE_CLIENT_CERT_URL: string;
    GOOGLE_UNIVERSE_DOMAIN: string;
}

const EnvConfigValue = () => {

    const requiredEnvFields = [
        "PORT",
        "DB_NAME",
        "DB_PASS",
        "DB_URL",
        "NODE_ENV",
        "JWT_SECRET",
        "ACCESS_TOKEN_SECRET",
        "REFRESH_TOKEN_SECRET",
        "EMAIL_USER",
        "EMAIL_PASS",
        "ADMIN_NAME",
        "ADMIN_PASS",
        "ADMIN_EMAIL",

        "spreadsheetId",
        // Google configs
        "GOOGLE_PROJECT_ID",
        "GOOGLE_PRIVATE_KEY_ID",
        "GOOGLE_PRIVATE_KEY",
        "GOOGLE_CLIENT_EMAIL",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_AUTH_URI",
        "GOOGLE_TOKEN_URI",
        "GOOGLE_AUTH_PROVIDER_CERT_URL",
        "GOOGLE_CLIENT_CERT_URL",
        "GOOGLE_UNIVERSE_DOMAIN",
    ];

    requiredEnvFields.forEach((field) => {
        if (!process.env[field]) {
            throw new AppError(400, `Missing required environment variable: ${field}`);
        }
    });

    return {
        PORT: Number(process.env.PORT),
        DB_NAME: process.env.DB_NAME!,
        DB_PASS: process.env.DB_PASS!,
        DB_URL: process.env.DB_URL!,
        NODE_ENV: process.env.NODE_ENV as 'development' | 'production',
        JWT_SECRET: process.env.JWT_SECRET!,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
        EMAIL_USER: process.env.EMAIL_USER!,
        EMAIL_PASS: process.env.EMAIL_PASS!,
        ADMIN_NAME: process.env.ADMIN_NAME!,
        ADMIN_PASS: process.env.ADMIN_PASS!,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL!,

        // SHEET ID
        SHEET_ID : process.env.spreadsheetId,
        
        //Google Config Returned Here
        GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID!,
        GOOGLE_PRIVATE_KEY_ID: process.env.GOOGLE_PRIVATE_KEY_ID!,
        GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL!,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
        GOOGLE_AUTH_URI: process.env.GOOGLE_AUTH_URI!,
        GOOGLE_TOKEN_URI: process.env.GOOGLE_TOKEN_URI!,
        GOOGLE_AUTH_PROVIDER_CERT_URL: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL!,
        GOOGLE_CLIENT_CERT_URL: process.env.GOOGLE_CLIENT_CERT_URL!,
        GOOGLE_UNIVERSE_DOMAIN: process.env.GOOGLE_UNIVERSE_DOMAIN!,
    };
};

export default EnvConfigValue();
