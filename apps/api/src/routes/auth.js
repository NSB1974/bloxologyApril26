import express from 'express';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const router = express.Router();

router.post('/verify-signature', async (req, res) => {
  const { signature, address, walletType, nonce, message } = req.body;

  // Validate input
  if (!signature || !address || !walletType || !nonce || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: signature, address, walletType, nonce, message',
    });
  }

  try {
    // SIWE message sanity checks
    if (!message.includes(`${address}`)) {
      return res.status(400).json({
        success: false,
        error: 'SIWE message does not match address',
      });
    }

    const nonceMatch = message.match(/Nonce:\s+([^\n]+)/i);
    const messageNonce = nonceMatch?.[1]?.trim();

    if (!messageNonce || messageNonce !== nonce) {
      return res.status(400).json({
        success: false,
        error: 'SIWE nonce mismatch',
      });
    }

    // Validate issued-at freshness (within 5 minutes)
    const issuedAtMatch = message.match(/Issued At:\s+([^\n]+)/i);
    const issuedAtRaw = issuedAtMatch?.[1]?.trim();
    const issuedAt = issuedAtRaw ? Date.parse(issuedAtRaw) : NaN;
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;

    if (Number.isNaN(issuedAt) || now - issuedAt > fiveMinutesMs) {
      return res.status(400).json({
        success: false,
        error: 'SIWE message expired or invalid issued time',
      });
    }

    // Recover signer address from signature
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Compare recovered address with provided address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        address: address.toLowerCase(),
        walletType,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    logger.info(`JWT token generated for address: ${address}`);

    res.json({
      jwtToken,
      address: address.toLowerCase(),
      walletType,
    });
  } catch (error) {
    logger.error('SIWE verification failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal error while verifying signature',
    });
  }
});

export default router;
