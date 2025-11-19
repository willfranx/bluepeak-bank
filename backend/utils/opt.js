import crypto from 'crypto'
// Helper to create OPT
export const generateOTP = () => crypto.randomInt(100000, 999999).toString();
