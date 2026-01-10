// Razorpay SDK Configuration
// Uses environment variables for keys - easy switch from sandbox to production

import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Signature from Razorpay callback
 * @returns {boolean} - Whether signature is valid
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    return expectedSignature === signature;
}

export default razorpay;
