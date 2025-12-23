import { Router } from "express";
import { AssignUserUnderAdminController, ForgetPasswordController, GetAllUsersController, LoginController, LogoutController, RegisterUserController, ResendOTPController, UpdateUserRoleController, VerifyOTPController } from "./user.controller";
import { auth } from "../../middlewares/middleware";

import {admin} from '../../middlewares/adminMiddleware'



export const userRouter   = Router()




userRouter.post('/register',RegisterUserController) //Register
userRouter.post('/login',LoginController) //Login Route
userRouter.post('/verify-otp',VerifyOTPController) //verify-otp
userRouter.post('/resendOtp',ResendOTPController) //resend otp
userRouter.post('/logout',LogoutController) //logout
userRouter.get('/allUsers', auth,  GetAllUsersController) //all users see 
userRouter.patch('/userRolechange/:userId',auth,admin,UpdateUserRoleController)   //role Change Only Admin
userRouter.post('/forgetPass',ForgetPasswordController) //forget password
userRouter.patch('/userAssignOfAdmin/:userId',auth,admin,AssignUserUnderAdminController)  //assign user under admin