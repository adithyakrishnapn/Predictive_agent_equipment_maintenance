const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST register
router.post('/register', userController.register);

// POST login
router.post('/login', userController.login);

// GET profile (requires auth)
// router.get('/profile', protect, userController.getProfile);

// PUT update profile (requires auth)
// router.put('/profile', protect, userController.updateProfile);

// GET all users (admin only)
// router.get('/', protect, authorize('admin'), userController.getAllUsers);

module.exports = router;
