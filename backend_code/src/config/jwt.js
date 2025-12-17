const JWT_SECRET = process.env.JWT_SECRET || "replace-with-strong-secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES,
  BCRYPT_ROUNDS,
};
