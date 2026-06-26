const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Message, User } = require('../models');

const formatUser = (user) => ({
  id: user?._id?.toString?.() || user?.id,
  firstName: user?.firstName,
  lastName: user?.lastName,
  email: user?.email,
  profileImage: user?.profileImage
});

const formatMessage = (message) => ({
  id: message._id?.toString?.() || message.id,
  subject: message.subject,
  content: message.content,
  isRead: message.isRead,
  createdAt: message.createdAt,
  senderId: message.senderId?._id?.toString?.() || message.senderId,
  receiverId: message.receiverId?._id?.toString?.() || message.receiverId,
  sender: formatUser(message.senderId),
  receiver: formatUser(message.receiverId)
});

router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messages = await Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] })
      .sort({ createdAt: -1 })
      .populate('senderId', 'firstName lastName email profileImage')
      .populate('receiverId', 'firstName lastName email profileImage')
      .lean();

    const conversationsMap = new Map();
    messages.forEach((message) => {
      const partnerId = String(message.senderId._id) === String(userId) ? String(message.receiverId._id) : String(message.senderId._id);
      const partner = String(message.senderId._id) === String(userId) ? formatUser(message.receiverId) : formatUser(message.senderId);
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, { id: partnerId, partner, lastMessage: null, unreadCount: 0, messages: [] });
      }
      const conversation = conversationsMap.get(partnerId);
      conversation.messages.push(formatMessage(message));
      conversation.lastMessage = formatMessage(message);
      if (String(message.receiverId._id) === String(userId) && !message.isRead) conversation.unreadCount += 1;
    });
    res.json({ conversations: Array.from(conversationsMap.values()) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations', message: error.message });
  }
});

router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;
    const messages = await Message.find({ $or: [{ senderId: currentUserId, receiverId: otherUserId }, { senderId: otherUserId, receiverId: currentUserId }] })
      .sort({ createdAt: 1 })
      .populate('senderId', 'firstName lastName email profileImage')
      .populate('receiverId', 'firstName lastName email profileImage')
      .lean();

    await Message.updateMany({ senderId: otherUserId, receiverId: currentUserId, isRead: false }, { $set: { isRead: true } });
    res.json({ messages: messages.map(formatMessage) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation', message: error.message });
  }
});

router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, subject, content } = req.body;
    const receiver = await User.findOne({ _id: receiverId, isActive: true }).lean();
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    const createdMessage = await Message.create({ senderId: req.user.userId, receiverId, subject: subject || 'No Subject', content, isRead: false });
    const completeMessage = await Message.findById(createdMessage._id).populate('senderId', 'firstName lastName email profileImage').populate('receiverId', 'firstName lastName email profileImage').lean();
    res.status(201).json({ message: 'Message sent successfully', data: formatMessage(completeMessage) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', message: error.message });
  }
});

router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const result = await Message.updateOne({ _id: req.params.messageId, receiverId: req.user.userId }, { $set: { isRead: true } });
    if (!result.modifiedCount) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as read', message: error.message });
  }
});

router.get('/unread/count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({ receiverId: req.user.userId, isRead: false });
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count', message: error.message });
  }
});

module.exports = router;
