import { NextFunction, Request, Response } from "express";
import { AppError } from "../errorHelper/AppError";
import env from "../config/env";
import { TErrorSources } from "../interface/error.types";




export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction
) => {


    let statusCode = 500;
    let message = `Something went wrong ${err.message}`;
    let errorSources: TErrorSources[] = [];

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }


    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        err: env.NODE_ENV === 'development' ? err : null,
        stack: env.NODE_ENV === 'development' ? err.stack : null,
    })
}