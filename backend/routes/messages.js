const express = require("express");
const { auth } = require("../middleware/auth");
const Message = require("../models/Message");
const User = require("../models/User");

const router = express.Router();


const formatUser = (user) => ({
  id: user?._id?.toString() || user?.id,
  firstName: user?.firstName,
  lastName: user?.lastName,
  email: user?.email,
  profileImage: user?.profileImage,
});

const formatMessage = (message) => ({
  id: message._id?.toString(),
  subject: message.subject,
  content: message.content,
  isRead: message.isRead,
  createdAt: message.createdAt,
  senderId: message.senderId?._id?.toString() || message.senderId,
  receiverId: message.receiverId?._id?.toString() || message.receiverId,
  sender: formatUser(message.senderId),
  receiver: formatUser(message.receiverId),
});

// Get all conversations for current user
router.get("/conversations", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "firstName lastName email profileImage")
      .populate("receiverId", "firstName lastName email profileImage");

    const conversationsMap = new Map();

    messages.forEach((message) => {
      const isSender = String(message.senderId._id) === String(userId);
      const partnerId = isSender
        ? String(message.receiverId._id)
        : String(message.senderId._id);
      const partner = isSender ? formatUser(message.receiverId) : formatUser(message.senderId);

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          id: partnerId,
          partner,
          lastMessage: null,
          unreadCount: 0,
          messages: [],
        });
      }

      const conversation = conversationsMap.get(partnerId);
      conversation.messages.push(formatMessage(message));
      conversation.lastMessage = formatMessage(message);

      if (!isSender && !message.isRead) {
        conversation.unreadCount += 1;
      }
    });

    res.json({ conversations: Array.from(conversationsMap.values()) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations", message: error.message });
  }
});

// Get messages between current user and another user
router.get("/conversation/:userId", auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "firstName lastName email profileImage")
      .populate("receiverId", "firstName lastName email profileImage");

    // Mark received messages as read
    await Message.updateMany(
      { senderId: otherUserId, receiverId: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ messages: messages.map(formatMessage) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversation", message: error.message });
  }
});

// Send a message
router.post("/send", auth, async (req, res) => {
  try {
    const { receiverId, subject, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Receiver and content are required" });
    }

    const receiver = await User.findOne({ _id: receiverId, isActive: true });
    if (!receiver) return res.status(404).json({ error: "Receiver not found" });

    const created = await Message.create({
      senderId: req.user.id,
      receiverId,
      subject: subject || "No Subject",
      content,
      isRead: false,
    });

    const populated = await Message.findById(created._id)
      .populate("senderId", "firstName lastName email profileImage")
      .populate("receiverId", "firstName lastName email profileImage");

    res.status(201).json({ message: "Message sent successfully", data: formatMessage(populated) });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message", message: error.message });
  }
});

// Mark a message as read
router.put("/:messageId/read", auth, async (req, res) => {
  try {
    const result = await Message.updateOne(
      { _id: req.params.messageId, receiverId: req.user.id },
      { $set: { isRead: true } }
    );
    if (!result.modifiedCount) return res.status(404).json({ error: "Message not found" });
    res.json({ message: "Message marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark message as read", message: error.message });
  }
});

// Get unread message count
router.get("/unread/count", auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiverId: req.user.id,
      isRead: false,
    });
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to get unread count", message: error.message });
  }
});

module.exports = router;
