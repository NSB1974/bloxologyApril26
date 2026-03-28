import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// In-memory storage for contact submissions
const contactSubmissions = [];

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate required fields
const validateContactForm = (name, email, subject, message) => {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('email is required and must be a non-empty string');
  } else if (!isValidEmail(email)) {
    errors.push('email must be a valid email format');
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    errors.push('subject is required and must be a non-empty string');
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errors.push('message is required and must be a non-empty string');
  }

  return errors;
};

router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validate all required fields
  const validationErrors = validateContactForm(name, email, subject, message);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors,
    });
  }

  // Store contact submission in memory
  const submission = {
    id: contactSubmissions.length + 1,
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
    submittedAt: new Date().toISOString(),
  };

  contactSubmissions.push(submission);

  // Log the submission
  logger.info(`Contact form submitted: ${submission.id} from ${submission.email}`);

  res.json({
    success: true,
    message: 'Contact form received',
  });
});

export default router;