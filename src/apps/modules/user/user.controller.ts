import e, { NextFunction, Request, Response } from "express";
import { User } from "./user.model";
import bcrypt from 'bcryptjs';
import sendOtpEmail from "../../utils/sendOTP";
import jwt from 'jsonwebtoken';
import env from "../../config/env";
import { AppError } from "../../errorHelper/AppError";
import { AuthRequest } from "apps/middlewares/middleware";
import z from "zod";





// register controller
export const RegisterUserController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpiresAt = new Date(Date.now() + 30 * 1000); // 20 seconds

        await User.create({
            name,
            email,
            password: hashed,
            isVerified: false,
            otp,
            otpExpiresAt
        });

        await sendOtpEmail(email, otp);

        res.json({ msg: "OTP sent to email" });

    } catch (err) {
        next(err);
    }
};

// login controller
export const LoginController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) throw new AppError(400, "Invalid email or password")

        if (!user?.isVerified) throw new AppError(401, "Your gmail is not varified")

        const ok = await bcrypt.compare(password, user.password as string);
        if (!ok) throw new AppError(400, "Invalid email or password")


        // CREATE ACCESS + REFRESH TOKEN
        const accessToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            env.ACCESS_TOKEN_SECRET!,
            { expiresIn: "1h" }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            env.ACCESS_TOKEN_SECRET!,
            { expiresIn: "7d" }
        );


        // SET REFRESH TOKEN IN COOKIE
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,      // production e TRUE 
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.cookie('AccessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        // SEND ACCESS TOKEN
        res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                user: {
                    name: user?.name,
                    email: user?.email,
                    role: user?.role,
                    isVerified: user?.isVerified
                },
                tokens: {
                    accessToken,
                    type: "Bearer",
                    expiresIn: 3600 // optional, seconds
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (err: any) {
        next(err)
    }
}

// verify otp
export const VerifyOTPController = async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!user.otpExpiresAt || Date.now() > user.otpExpiresAt.getTime()) {
        user.otp = "";
        user.otpExpiresAt = null;
        await user.save();
        return res.status(400).json({ msg: "OTP expired" });
    }

    if (user.otp !== otp) {
        return res.status(400).json({ msg: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = "";
    user.otpExpiresAt = null;

    await user.save();

    res.json({ msg: "Verification successful!" });
};

// resend otp
export const ResendOTPController = async (req: Request, res: Response , next :  NextFunction) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) throw new AppError(404,"User not found" )

        if (user.isVerified)
            throw new AppError(400,"User already verified")

        // Generate new 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        user.otp = otp;
        user.otpExpiresAt =  new Date(Date.now() + 30 * 1000); // 20 seconds

        await user.save();

        await sendOtpEmail(email, otp);

        return res.json({ msg: "New OTP sent" });

    } catch (error) {
        next(error)
    }
};

// logout
export const LogoutController = (req: Request, res: Response) => {
    res.clearCookie("refreshToken")
    res.clearCookie("AccessToken")
    res.json({ msg: "Logged out" })
}

// GET ALL USERS WITH SEARCH/FILTER
export const GetAllUsersController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.query;
        const query: any = {};
        if (name) {
            query.name = { $regex: name as string, $options: "i" };
        }
        const users = await User.find(query).select("-password");
        res.json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (err) {
        next(new AppError(500, "Failed to fetch users"));
    }
}

// Zod schema to validate role input
const updateRoleSchema = z.object({
    role: z.enum(["user", "subadmin"], {
        message: "Invalid role value. Allowed roles: user, subadmin",
    }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// Controller to update user role
export const UpdateUserRoleController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        if (!userId) throw new AppError(400, "User ID is required");
        // Validate request body
        const parsed = updateRoleSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(400, "zod validation error");
        }
        const user = await User.findById(userId);
        if (!user) throw new AppError(404, "User not found");
        // Update role
        user.role = parsed.data.role;
        await user.save();
        res.json({
            success: true,
            msg: `Role updated to '${parsed.data.role}' successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
};

// forget password daw
export const ForgetPasswordController = async (req: Request, res: Response, next: any) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        // Required fields
        if (!email || !newPassword || !confirmPassword) {
            return next(new AppError(400, 'All fields are required'));
        }

        // Passwords match
        if (newPassword !== confirmPassword) {
            return next(new AppError(400, 'Passwords do not match'));
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError(404, 'User not found'));
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Response
        return res.status(200).json({
            status: "success",
            message: "Password has been successfully updated",
            data: {
                email: user.email,
                name: user.name
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        return next(new AppError(500, 'Server Error'));
    }
};




export const AssignUserUnderAdminController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const { userId } = req.params;
        if (!userId) throw new AppError(400, "User ID is required");


        const user = await User.findById(userId);
        if (!user) throw new AppError(404, "User not found");


        // Find an admin to assign as parent
        const admin = await User.findOne({ role: "admin" });
        if (!admin) throw new AppError(404, "No admin found to assign under");


        // Update parentId
        user.parentId = admin._id;
        await user.save();

        
        res.json({
            success: true,
            msg: `User assigned under admin '${admin.name}' successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                parentId: user.parentId,
            },
        });
    } catch (err) {
        next(err);
    }
};
