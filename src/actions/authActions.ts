"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";

/**
 * Checks if any user exists in the database
 */
export async function checkHasUsers() {
  try {
    await dbConnect();
    const count = await User.countDocuments();
    return count > 0;
  } catch (error) {
    console.error("Error checking for users:", error);
    return true; // Return true on error to avoid showing registration form
  }
}

/**
 * Registers the first administrator
 */
export async function registerFirstAdmin(formData: FormData) {
  try {
    await dbConnect();
    
    // Check if any users already exist
    const count = await User.countDocuments();
    if (count > 0) {
      return { error: "Admin already exists" };
    }

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password || !name) {
      return { error: "Missing required fields" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      email,
      password: hashedPassword,
      name,
      role: "admin",
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to register admin" };
  }
}

/**
 * Login action
 */
export async function loginAction(prevState: any, formData: FormData) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}

/**
 * Get all users (Admins)
 */
export async function getUsers() {
  try {
    await dbConnect();
    const users = await User.find({}).lean();
    return { success: true, users: JSON.parse(JSON.stringify(users)) };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

/**
 * Create a new user (Admin)
 */
export async function createUser(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    await dbConnect();
    
    const existing = await User.findOne({ email });
    if (existing) return { error: "Email already in use" };

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      email,
      password: hashedPassword,
      name,
      role: "admin",
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create user" };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string) {
  try {
    await dbConnect();
    
    // Protection: can't delete the last admin
    const count = await User.countDocuments();
    if (count <= 1) return { error: "Cannot delete the last admin" };

    await User.findByIdAndDelete(id);
    
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete user" };
  }
}
