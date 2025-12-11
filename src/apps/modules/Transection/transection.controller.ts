import { NextFunction, Request, Response } from "express";
import { Transaction } from "./transection.model";

import { AuthRequest } from "apps/middlewares/middleware";
import { createTransactionSchema } from "../../validations/TransectionValidation/validation";
import mongoose from "mongoose";
import { AppError } from './../../errorHelper/AppError'
import { User } from "../user/user.model";
import { appendTransactionToSheet } from "../../utils/googleSheet/appendGoogleSheet";
import { generateTransactionId } from "../../utils/transectionId";







// admin and subadmin add transaction create
export const CreateTransectionController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Validate body
        const parsed = createTransactionSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(400, "Validation Error Create Transaction!");
        }

        const { amount, date, sender, receiver, medium } = parsed.data;

        const txDate = date ? new Date(date) : new Date();



        const senderUser = await User.findById(sender);
        if (!senderUser) throw new AppError(404, "Sender not found");

        const receiverUser = await User.findById(receiver);
        if (!receiverUser) throw new AppError(404, "Receiver not found");



        if (senderUser.parentId) {
            throw new AppError(400, `Sender '${senderUser.name}' is not self-dependent`);
        }

        if (receiverUser.parentId) {
            throw new AppError(400, `Receiver '${receiverUser.name}' is not self-dependent`);
        }

        const mediumUser = await User.findById(medium);
        if (!mediumUser) {
            throw new AppError(404, "Medium user not found");
        }

        if (!mediumUser.parentId) {
            throw new AppError(400, `Medium '${mediumUser.name}' is not valid because they are self-dependent `);
        }


        const tx = await Transaction.create({
            amount,
            date: txDate,
            sender,
            receiver,
            medium,
            year: txDate.getFullYear(),
            createdBy: req.user!.role,
        });


        const txId = generateTransactionId()

        const info = { sender: senderUser?.name, receiver: receiverUser?.name, amount, medium: mediumUser?.name, transactionId : txId, createdBy: req?.user?.role, date: txDate }
        await appendTransactionToSheet(info)
        
        res.json(tx);
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
        console.log(req?.query)
        const { user, sender, receiver } = req.query;

        const query: any = {};

        // all transactions of one user (sender or receiver)
        if (user) {
            if (!mongoose.Types.ObjectId.isValid(user as string)) {
                throw new AppError(400, 'Invalid User Id');
            }
            query.$or = [
                { sender: new mongoose.Types.ObjectId(user as string) },
                { receiver: new mongoose.Types.ObjectId(user as string) },
            ];
        }

        // sender + receiver pair
        if (sender && receiver) {
            if (!mongoose.Types.ObjectId.isValid(sender as string) || !mongoose.Types.ObjectId.isValid(receiver as string)) {
                throw new AppError(400, 'Invalid Sender Or Receiver Id');
            }
            query.sender = new mongoose.Types.ObjectId(sender as string);
            query.receiver = new mongoose.Types.ObjectId(receiver as string);
        }

        const list = await Transaction.find(query).sort({ date: -1 });

        return res.json({
            success: true,
            count: list.length,
            data: list,
        });

    } catch (err) {
        next(err); // pass to global error handler
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
        if (!parsed.success) {
            return next(parsed.error);
        }
        const updates = parsed.data;
        const updatedTx = await Transaction.findByIdAndUpdate(id, updates, { new: true, runValidators: true, });
        if (!updatedTx) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.json({
            success: true,
            message: "Transaction updated successfully",
            updatedTx,
        });
    } catch (err) {
        throw new AppError(401, 'Does not edit')
    }
};

