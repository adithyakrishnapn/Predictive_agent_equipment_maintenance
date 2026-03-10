import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

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

export default router;
