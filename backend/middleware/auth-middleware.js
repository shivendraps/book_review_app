// middleware/auth.js
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Validation schemas
const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('content')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review must be between 10 and 1000 characters')
];

const userValidation = [
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters and contain both letters and numbers')
];

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  authenticate,
  authLimiter,
  apiLimiter,
  reviewValidation,
  userValidation,
  validate
};

// routes/reviews.js
const express = require('express');
const router = express.Router();

// Get reviews for a book
router.get('/', async (req, res) => {
  try {
    const { bookId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ bookId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ bookId });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new review
router.post('/', 
  authenticate, 
  reviewValidation,
  validate,
  async (req, res) => {
    try {
      const { bookId, rating, content } = req.body;

      // Check if user has already reviewed this book
      const existingReview = await Review.findOne({
        bookId,
        userId: req.user.id
      });

      if (existingReview) {
        return res.status(400).json({ 
          error: 'You have already reviewed this book' 
        });
      }

      const review = new Review({
        bookId,
        userId: req.user.id,
        rating,
        content
      });

      await review.save();

      // Update book rating and review count
      const bookReviews = await Review.find({ bookId });
      const averageRating = bookReviews.reduce((acc, review) => acc + review.rating, 0) / bookReviews.length;

      await Book.findByIdAndUpdate(bookId, {
        rating: averageRating,
        reviewCount: bookReviews.length
      });

      // Populate user data before sending response
      await review.populate('userId', 'username');
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Update a review
router.put('/:id',
  authenticate,
  reviewValidation,
  validate,
  async (req, res) => {
    try {
      const review = await Review.findOne({
        _id: req.params.id,
        userId: req.user.id
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      const { rating, content } = req.body;
      review.rating = rating;
      review.content = content;
      review.updatedAt = Date.now();

      await review.save();

      // Update book rating
      const bookReviews = await Review.find({ bookId: review.bookId });
      const averageRating = bookReviews.reduce((acc, review) => acc + review.rating, 0) / bookReviews.length;

      await Book.findByIdAndUpdate(review.bookId, {
        rating: averageRating
      });

      await review.populate('userId', 'username');
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Delete a review
router.delete('/:id',
  authenticate,
  async (req, res) => {
    try {
      const review = await Review.findOne({
        _id: req.params.id,
        userId: req.user.id
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      await review.remove();

      // Update book rating and review count
      const bookReviews = await Review.find({ bookId: review.bookId });
      const averageRating = bookReviews.length > 0
        ? bookReviews.reduce((acc, review) => acc + review.rating, 0) / bookReviews.length
        : 0;

      await Book.findByIdAndUpdate(review.bookId, {
        rating: averageRating,
        reviewCount: bookReviews.length
      });

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register new user
router.post('/register',
  userValidation,
  validate,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'User with this email or username already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = new User({
        username,
        email,
        password: hashedPassword
      });

      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Login user
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString()
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Get current user
router.get('/me',
  authenticate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

module.exports = router;
