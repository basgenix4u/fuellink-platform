import { Injectable } from "@nestjs/common";
import { hash, verify, Algorithm } from "@node-rs/argon2";
import { ValidationError } from "../common/errors";

/**
 * Password hashing with argon2id — the algorithm recommended by OWASP for
 * new applications (memory-hard, resistant to GPU/ASIC cracking).
 *
 * Parameters follow the OWASP Password Storage Cheat Sheet minimum for
 * argon2id: 19 MiB memory, 2 iterations, 1 degree of parallelism.
 */
const ARGON_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456, // KiB
  timeCost: 2,
  parallelism: 1,
} as const;

/** Rejected outright: the most-abused passwords seen in NG credential dumps. */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "iloveyou",
  "admin123",
  "welcome1",
  "nigeria1",
  "fuellink",
  "letmein1",
]);

@Injectable()
export class PasswordService {
  async hash(plain: string): Promise<string> {
    this.assertStrong(plain);
    return hash(plain, ARGON_OPTIONS);
  }

  /**
   * Verifies a password. Returns false rather than throwing on a malformed
   * stored hash, so a corrupted row cannot be distinguished from a wrong
   * password by an attacker.
   */
  async verify(storedHash: string, plain: string): Promise<boolean> {
    try {
      return await verify(storedHash, plain, ARGON_OPTIONS);
    } catch {
      return false;
    }
  }

  /**
   * Password policy. Length is the dominant factor in resistance to
   * offline cracking, so we require 10+ characters rather than imposing
   * complex composition rules that push users towards "Password1!".
   */
  assertStrong(plain: string): void {
    const errors: string[] = [];

    if (plain.length < 10) errors.push("must be at least 10 characters");
    if (plain.length > 128) errors.push("must be at most 128 characters");
    if (!/[a-zA-Z]/.test(plain)) errors.push("must contain at least one letter");
    if (!/\d/.test(plain)) errors.push("must contain at least one number");
    if (/^\s|\s$/.test(plain)) errors.push("must not start or end with whitespace");
    if (COMMON_PASSWORDS.has(plain.toLowerCase())) errors.push("is too common");
    if (/^(.)\1+$/.test(plain)) errors.push("must not be a single repeated character");

    if (errors.length > 0) {
      throw new ValidationError(`Password ${errors.join(", ")}`, { field: "password", errors });
    }
  }
}
