import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LoginInput, RegisterInput } from "./dto";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

interface SignableUser {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone ?? null,
        role: input.role
      }
    });
    return { user: this.toAuthUser(user), token: await this.sign(user) };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    // Same error for unknown email vs wrong password — no account enumeration.
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return { user: this.toAuthUser(user), token: await this.sign(user) };
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: Role;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role
    };
  }

  private async sign(user: SignableUser): Promise<string> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.signAsync(payload);
  }
}
