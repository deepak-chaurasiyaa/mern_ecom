import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            default: "Admin",
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
        last_login_date: {
            type: Date,
        },
        avatar: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const AdminModel = mongoose.model("Admin", adminSchema);
export default AdminModel;
