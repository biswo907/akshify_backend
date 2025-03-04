import bcrypt from "bcryptjs"; // ✅ Use bcryptjs (safer for Node.js)
import jwt from "jsonwebtoken";
import "dotenv/config";
import UserModel from "../models/user.js";

const SECRET_KEY = process.env.SECRET_KEY;

//  Signup Function
export const signup = async (req, res) => {
  console.log("SECRET_KEY", SECRET_KEY);

  const {
    full_name,
    username,
    phone,
    email,
    password,
    confirm_password
  } = req.body;

  try {
    // 🔹 Check if the user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    // 🔹 Confirm Password Validation (before hashing)
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // 🔹 Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Create New User
    const newUser = await UserModel.create({
      full_name, // ✅ Now included in signup
      username,
      phone,
      email,
      password_hash: hashedPassword // ✅ Matches schema field
    });

    // 🔹 Generate Token
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      SECRET_KEY,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

//  Signin Function
export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔹 Check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ message: `No account found with email: ${email}` });
    }

    // 🔹 Compare Password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password_hash
    ); // ✅ Matches field name
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // 🔹 Generate Token
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      SECRET_KEY,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    res.status(200).json({ user: existingUser, token });
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
