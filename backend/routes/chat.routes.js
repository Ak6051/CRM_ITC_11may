const express = require('express');
const router = express.Router();
const ChatBox = require('../models/chatbox.modal');
const { protect } = require('../middleware/Hr.data.middleware');

// Send a new message
router.post('/send', protect, async (req, res) => {
  try {
    const { senderId, receiverId, role, message } = req.body;
    
    if (!senderId || !receiverId || !role || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newMessage = new ChatBox({
      senderId,
      receiverId,
      role,
      message,
      isRead: false,
      timestamp: new Date()
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

// Get messages between two users
router.get('/messages/:userId1/:userId2', protect, async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    const messages = await ChatBox.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
});

// Get all conversations for a user
router.get('/conversations/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get unique user IDs that the current user has chatted with
    const conversations = await ChatBox.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $project: {
          otherUserId: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          message: 1,
          timestamp: 1,
          isRead: 1,
          role: 1
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: { $first: '$message' },
          timestamp: { $first: '$timestamp' },
          isRead: { $first: '$isRead' },
          role: { $first: '$role' }
        }
      }
    ]);

    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversations', details: err.message });
  }
});

// Mark messages as read
router.put('/mark-read', protect, async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    await ChatBox.updateMany(
      { senderId, receiverId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ error: 'Failed to mark messages as read', details: err.message });
  }
});

module.exports = router;
