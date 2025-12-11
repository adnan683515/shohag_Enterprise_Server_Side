import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { router } from "./apps/routes/route";
import { globalErrorHandler } from './apps/middlewares/globalErrorHandler'



export const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors());



app.use('/api',router)


app.use(globalErrorHandler)