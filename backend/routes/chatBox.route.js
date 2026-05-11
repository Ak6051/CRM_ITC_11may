const express = require('express');
const router = express.Router();
const ChatBox = require('../models/chatbox.modal');
const {protect} = require('../middleware/Hr.data.middleware');

// Get all messages for a user
router.get('/messages/:userId', protect, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Find all messages where the user is either sender or receiver
        const messages = await ChatBox.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        })
        .sort({ timestamp: -1 }) // Sort by newest first
        .limit(50) // Limit to 50 most recent messages
        .populate('senderId', 'firstName lastName')
        .populate('receiverId', 'firstName lastName');
        
        // Process messages to include sender/receiver names
        const processedMessages = messages.map(msg => ({
            _id: msg._id,
            senderId: msg.senderId._id,
            senderName: msg.senderId ? `${msg.senderId.firstName} ${msg.senderId.lastName}` : 'Unknown',
            receiverId: msg.receiverId._id,
            receiverName: msg.receiverId ? `${msg.receiverId.firstName} ${msg.receiverId.lastName}` : 'Unknown',
            message: msg.message,
            role: msg.role,
            isRead: msg.isRead,
            timestamp: msg.timestamp
        }));
        
        res.json(processedMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark messages as read
router.post('/mark-read', protect, async (req, res) => {
    try {
        const { messageIds } = req.body;
        const userId = req.user.id;
        
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ error: 'Invalid message IDs' });
        }
        
        // Update all messages where the user is the receiver
        await ChatBox.updateMany(
            {
                _id: { $in: messageIds },
                receiverId: userId
            },
            { $set: { isRead: true } }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
