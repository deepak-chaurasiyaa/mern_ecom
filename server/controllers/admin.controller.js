import AdminModel from "../models/admin.model.js";
import bcryptjs from "bcryptjs";
import generatedAccessToken from "../utils/generatedAccessToken.js";
import genertedRefreshToken from "../utils/generatedRefreshToken.js";
import sendEmail from "../config/sendEmail.js";
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";

// Admin Registration Controller
export async function adminRegisterController(request, response) {
    try {
        const { name, email, password } = request.body;

        if (!name || !email || !password) {
            return response.status(400).json({
                message: "Provide name, email, and password",
                error: true,
                success: false,
            });
        }

        // Check if admin already exists
        const existingAdmin = await AdminModel.findOne({ email });

        if (existingAdmin) {
            return response.status(400).json({
                message: "Email is already registered",
                error: true,
                success: false,
            });
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        // Create admin
        const newAdmin = new AdminModel({
            name,
            email,
            password: hashPassword,
        });

        const savedAdmin = await newAdmin.save();

        // Generate email verification link
        const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${savedAdmin._id}`;

        // Send verification email
        await sendEmail({
            sendTo: email,
            subject: "Verify Your Admin Account - Binkeyit",
            html: verifyEmailTemplate({
                name,
                url: verifyEmailUrl,
            }),
        });

        return response.json({
            message: "Admin registered successfully. Please verify your email.",
            error: false,
            success: true,
            data: savedAdmin,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Something went wrong",
            error: true,
            success: false,
        });
    }
}

// Admin Login Controller
export async function adminLoginController(request, response) {
    try {
        const { email, password } = request.body;

        if (!email || !password) {
            return response.status(400).json({
                message: "Provide email and password",
                error: true,
                success: false,
            });
        }

        const admin = await AdminModel.findOne({ email });

        if (!admin) {
            return response.status(400).json({
                message: "Admin not registered",
                error: true,
                success: false,
            });
        }

        if (admin.status !== "Active") {
            return response.status(400).json({
                message: "Contact Super Admin for activation",
                error: true,
                success: false,
            });
        }

        const checkPassword = await bcryptjs.compare(password, admin.password);

        if (!checkPassword) {
            return response.status(400).json({
                message: "Incorrect password",
                error: true,
                success: false,
            });
        }

        const accessToken = await generatedAccessToken(admin._id, admin.role);
        const refreshToken = await genertedRefreshToken(admin._id);

        // Update last login date
        await AdminModel.findByIdAndUpdate(admin._id, {
            last_login_date: new Date(),
        });

        // Secure cookie options
        const cookiesOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        };

        // Set cookies properly
        response.cookie("accessToken", accessToken, cookiesOption);
        response.cookie("refreshToken", refreshToken, cookiesOption);

        return response.json({
            message: "Admin login successful",
            error: false,
            success: true,
            data: {
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Internal Server Error",
            error: true,
            success: false,
        });
    }
}

// Get Admin Details
export async function adminDetails(request, response) {
    try {
        const adminId = request.userId; // Auth middleware to get admin ID

        const admin = await AdminModel.findById(adminId).select("-password -refresh_token");

        if (!admin) {
            return response.status(404).json({
                message: "Admin not found",
                error: true,
                success: false,
            });
        }

        return response.json({
            message: "Admin details retrieved successfully",
            data: admin,
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Something went wrong",
            error: true,
            success: false,
        });
    }
}

// Logout Admin
export async function adminLogoutController(request, response) {
    try {
        const adminId = request.userId; // Auth middleware to get admin ID

        const cookiesOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        };

        // Clear cookies
        response.clearCookie("accessToken", cookiesOption);
        response.clearCookie("refreshToken", cookiesOption);

        // Remove refresh token from DB
        await AdminModel.findByIdAndUpdate(adminId, {
            refresh_token: "",
        });

        return response.json({
            message: "Admin logout successful",
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Something went wrong",
            error: true,
            success: false,
        });
    }
}


