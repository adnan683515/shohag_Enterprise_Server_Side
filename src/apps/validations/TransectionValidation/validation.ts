import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  date: z.string().optional(), // will convert later to Date
  sender: z.string().min(1, "Sender is required"),
  receiver: z.string().min(1, "Receiver is required"),
  medium  : z.string().min(1,'Medium is required')
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
