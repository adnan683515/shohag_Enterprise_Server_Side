import { Router } from "express";
import { CreateTransectionController, transactionDetailsController, updateTransaction, viewallTransectionController } from "./transection.controller";
import { auth } from "../../middlewares/middleware";
import { adminOrSubadmin } from "../../middlewares/adminSubadminMiddleware";






export const transectionRouter = Router()



transectionRouter.get('/all-transection', auth, viewallTransectionController) //view all transection


transectionRouter.post('/createTransection',auth,adminOrSubadmin, CreateTransectionController ) //create transection


transectionRouter.post('/createTransection',auth,adminOrSubadmin, CreateTransectionController ) //create transection


transectionRouter.get('/detailsTransection/:id',auth,transactionDetailsController) //details of transection


transectionRouter.put('/editTransection/:id',auth,adminOrSubadmin, updateTransaction) // update transection


