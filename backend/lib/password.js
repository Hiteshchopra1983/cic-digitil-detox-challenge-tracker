/**
 * Pure-JS password hashing for serverless (Vercel) — bcrypt native builds often fail there.
 * Hashes remain compatible with bcrypt / bcryptjs $2a$ hashes.
 */
const bcryptjs = require("bcryptjs");

async function hashPassword(plain, rounds = 10) {
  return bcryptjs.hash(String(plain), rounds);
}

async function verifyPassword(plain, hash) {
  return bcryptjs.compare(String(plain), String(hash));
}

module.exports = { hashPassword, verifyPassword };
