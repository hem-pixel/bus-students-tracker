const express = require('express');
const router = express.Router();
const {
  login,
  loginStep1,
  loginStep2,
  forgotPassword,
  resetPassword,
  googleVerify,
  getMe
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/login-step1', loginStep1);
router.post('/login-step2', loginStep2);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google/verify', googleVerify);
router.get('/me', authenticate, getMe);

module.exports = router;

