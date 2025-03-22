import express from "express";
import {
    adminLoginController,
    adminDetails,
    adminLogoutController,
} from "../controllers/admin.controller.js";
import { admin } from "../middleware/Admin.js";

const router = express.Router();

// Admin Login
router.post("/login", adminLoginController);

// Get Admin Details (Protected)
router.get("/details", admin, adminDetails);

// Admin Logout (Protected)
router.post("/logout", admin, adminLogoutController);

export default router;
