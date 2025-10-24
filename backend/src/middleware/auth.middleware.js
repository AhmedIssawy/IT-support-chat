import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies["__Security-auth"];
    if (!token)
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded)
      return res.status(401).json({ message: "Unauthorized - Invalid token" });

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const authorizeAdmin = (req, res, next) => {
  // console.log(req?.user);

  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden - Admins only" });
  }
};

// to make sure no user send message to a normal user if he knows the _id
export const authorizeMessageSender = async (req, res, next) => {
  try {
    const sender = req.user;          // populated by protectRoute middleware
    const receiverId = req.params.id; // from URL param

    if (!sender || !receiverId) {
      return res.status(400).json({ message: "Sender and receiver IDs are required" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // ❌ Reject if both are admins or both are normal users
    if ((sender.isAdmin && receiver.isAdmin) || (!sender.isAdmin && !receiver.isAdmin)) {
      return res.status(403).json({ message: "Admins can only message users and vice versa." });
    }

    // ✅ Allow only admin ↔ user
    next();
  } catch (error) {
    console.error("Error in authorizeMessageSender:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};


