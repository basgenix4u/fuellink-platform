import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthResult, AuthService } from "./auth.service";
import { loginSchema, LoginInput, registerSchema, RegisterInput } from "./dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthRequest } from "./request.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput
  ): Promise<AuthResult> {
    return this.auth.register(body);
  }

  @Post("login")
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput
  ): Promise<AuthResult> {
    return this.auth.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: AuthRequest) {
    return { user: req.user ?? null };
  }
}
