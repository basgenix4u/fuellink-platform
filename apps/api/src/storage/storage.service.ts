import { Injectable, Logger } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { env } from "../config/env";
import { BusinessRuleError, ErrorCode, NotFoundError, ValidationError } from "../common/errors";

export interface StoredFile {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
}

export interface FileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

/**
 * Document storage.
 *
 * KYC certificates, waybills and dispute evidence are sensitive and must
 * never be publicly addressable: files are written under a private root and
 * only ever served through an authorised API route.
 *
 * The local-disk implementation is what runs today. It is deliberately
 * behind this narrow interface so S3/R2 can replace it without touching
 * callers — the storage key format is already opaque and collision-free.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly root: string;

  /** Only formats a human reviewer can actually read. */
  private static readonly ALLOWED_MIME = new Map<string, string[]>([
    ["application/pdf", [".pdf"]],
    ["image/jpeg", [".jpg", ".jpeg"]],
    ["image/png", [".png"]],
    ["image/webp", [".webp"]],
  ]);

  /** Magic bytes, checked against the declared MIME type. */
  private static readonly SIGNATURES: { mime: string; bytes: number[]; offset: number }[] = [
    { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 }, // %PDF
    { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff], offset: 0 },
    { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
    { mime: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP" after RIFF
  ];

  constructor() {
    this.root = resolve(process.env.STORAGE_ROOT ?? join(process.cwd(), ".storage"));
  }

  /**
   * Validates and stores a file.
   *
   * Validation is defence-in-depth: size, declared MIME, and actual magic
   * bytes must all agree. A .pdf that is really an executable is rejected.
   */
  async store(scope: string, file: FileInput): Promise<StoredFile> {
    if (file.buffer.length === 0) throw new ValidationError("The uploaded file is empty");

    if (file.buffer.length > env.MAX_UPLOAD_BYTES) {
      throw new BusinessRuleError(
        `File exceeds the ${Math.floor(env.MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit`,
        ErrorCode.PAYLOAD_TOO_LARGE
      );
    }

    const allowedExtensions = StorageService.ALLOWED_MIME.get(file.mimeType);
    if (!allowedExtensions) {
      throw new BusinessRuleError(
        `Unsupported file type. Upload a PDF, JPEG, PNG or WebP.`,
        ErrorCode.UNSUPPORTED_MEDIA_TYPE
      );
    }

    if (!this.matchesSignature(file.buffer, file.mimeType)) {
      throw new BusinessRuleError(
        "The file content does not match its declared type",
        ErrorCode.UNSUPPORTED_MEDIA_TYPE
      );
    }

    const extension = this.safeExtension(file.originalName, allowedExtensions);
    const checksum = createHash("sha256").update(file.buffer).digest("hex");

    // Opaque, unguessable key. Scoped by entity for operational clarity only —
    // access control is always enforced in the application, never by path.
    const storageKey = `${this.sanitizeScope(scope)}/${randomUUID()}${extension}`;
    const absolute = this.resolveKey(storageKey);

    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, file.buffer, { mode: 0o600 });

    return {
      storageKey,
      fileName: this.sanitizeFileName(file.originalName),
      mimeType: file.mimeType,
      sizeBytes: file.buffer.length,
      checksum,
    };
  }

  async retrieve(storageKey: string): Promise<Buffer> {
    try {
      return await readFile(this.resolveKey(storageKey));
    } catch {
      throw new NotFoundError("File");
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(this.resolveKey(storageKey));
    } catch (err) {
      // Deleting an already-absent file is not an error worth failing on.
      this.logger.warn({ storageKey, err }, "Failed to delete stored file");
    }
  }

  /**
   * Resolves a key to an absolute path, refusing anything that escapes the
   * storage root (path traversal).
   */
  private resolveKey(storageKey: string): string {
    const absolute = resolve(this.root, storageKey);
    if (absolute !== this.root && !absolute.startsWith(this.root + "/")) {
      throw new ValidationError("Invalid storage key");
    }
    return absolute;
  }

  private matchesSignature(buffer: Buffer, mimeType: string): boolean {
    const signature = StorageService.SIGNATURES.find((s) => s.mime === mimeType);
    if (!signature) return false;
    if (buffer.length < signature.offset + signature.bytes.length) return false;
    return signature.bytes.every((byte, i) => buffer[signature.offset + i] === byte);
  }

  private safeExtension(originalName: string, allowed: string[]): string {
    const match = /\.[a-zA-Z0-9]+$/.exec(originalName);
    const ext = match ? match[0].toLowerCase() : "";
    // Fall back to the canonical extension rather than trusting the filename.
    return allowed.includes(ext) ? ext : allowed[0];
  }

  private sanitizeFileName(name: string): string {
    return (
      name
        .replace(/[/\\]/g, "_")
        .replace(/[^\w.\- ]/g, "")
        .trim()
        .slice(0, 200) || "document"
    );
  }

  private sanitizeScope(scope: string): string {
    return scope.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "misc";
  }
}
