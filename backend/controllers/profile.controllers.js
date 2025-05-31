// controllers/profile.controller.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get User Profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId; // Extract user ID from the JWT payload
        const user = await User.findById(userId).select('-password'); // Exclude password from the result

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user); // Send the user data as response
    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).send('Server error');
    }
};





// Update User Profile
const updateUserProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.userId, req.body, { // Change here
            new: true,
            runValidators: true,
        }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Change Password
const changeUserPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both fields are required' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = { getUserProfile, updateUserProfile,changeUserPassword  };
