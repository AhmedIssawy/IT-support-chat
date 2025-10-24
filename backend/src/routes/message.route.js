import express from "express";
import {
  getAllUsers,
  getAvailAdmin,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
} from "../controllers/message.controller.js";
import { protectRoute, authorizeAdmin, authorizeMessageSender } from "../middleware/auth.middleware.js";
// import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/users", authorizeAdmin, getAllUsers);
router.get("/avail-admin", getAvailAdmin);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", authorizeMessageSender, sendMessage);

export default router;
