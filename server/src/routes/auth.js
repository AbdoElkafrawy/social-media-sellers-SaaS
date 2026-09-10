import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { authenticateToken, loginRateLimiter } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_prod';

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 1. REGISTER NEW SELLER
router.post('/register', async (req, res) => {
  try {
    const { email, password, storeName, currency } = req.body;

    // Server-side Input Validation
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters long.' });
    }

    if (!storeName || storeName.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: 'Please enter your Social Media Store Name.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanStoreName = storeName.trim();
    const storeCurrency = (currency === 'USD' || currency === 'EGP') ? currency : 'EGP';

    // Check if user already exists
    const existingUser = await db.orm.public.User.where({ email: cleanEmail }).first();
    if (existingUser) {
      return res.status(409).json({ status: 'error', message: 'An account with this email already exists.' });
    }

    // Hash Password with Salt (10 rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in PostgreSQL database via Prisma
    const newUser = await db.orm.public.User.create({
      email: cleanEmail,
      password: hashedPassword,
      storeName: cleanStoreName,
      currency: storeCurrency,
    });

    // Generate JWT Token (expires in 7 days)
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, storeName: newUser.storeName, currency: newUser.currency },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        storeName: newUser.storeName,
        currency: newUser.currency,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during registration. Please try again.' });
  }
});

// 2. LOGIN SELLER (Protected by Rate Limiter)
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Please enter both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await db.orm.public.User.where({ email: cleanEmail }).first();
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    // Compare Hashed Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const userCurrency = user.currency || 'EGP';

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, storeName: user.storeName, currency: userCurrency },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        email: user.email,
        storeName: user.storeName,
        currency: userCurrency,
        whatsappNumber: user.whatsappNumber || '',
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during login. Please try again.' });
  }
});

// 3. GET CURRENT LOGGED-IN SELLER (Protected Route)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.orm.public.User.where({ id: req.user.id }).first();
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    res.json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        storeName: user.storeName,
        currency: user.currency || 'EGP',
        whatsappNumber: user.whatsappNumber || '',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error fetching user profile.' });
  }
});

// 4. UPDATE STORE CURRENCY
router.put('/currency', authenticateToken, async (req, res) => {
  try {
    const { currency } = req.body;
    if (currency !== 'USD' && currency !== 'EGP') {
      return res.status(400).json({ status: 'error', message: 'Currency must be USD or EGP.' });
    }

    const updatedUser = await db.orm.public.User
      .where({ id: req.user.id })
      .update({ currency });

    res.json({
      status: 'success',
      message: 'Store currency updated!',
      currency: updatedUser.currency || currency,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update currency.' });
  }
});

// 5. UPDATE SELLER PROFILE (STORE NAME, WHATSAPP NUMBER)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { storeName, whatsappNumber } = req.body;
    const updateData = {};
    if (storeName && storeName.trim()) updateData.storeName = storeName.trim();
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber.trim();

    const updatedUser = await db.orm.public.User
      .where({ id: req.user.id })
      .update(updateData);

    res.json({
      status: 'success',
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        storeName: updatedUser.storeName,
        currency: updatedUser.currency,
        whatsappNumber: updatedUser.whatsappNumber || '',
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update profile.' });
  }
});

export default router;
