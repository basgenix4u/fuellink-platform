import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { OrgRole, Role } from "@prisma/client";
import type { Response } from "express";
import { zodPipe } from "../common/zod-validation.pipe";
import { ValidationError } from "../common/errors";
import { env } from "../config/env";
import { ActiveOrg, CurrentUser, OrgRoles, Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import type { RequestOrg, RequestUser } from "../auth/request.types";
import { OrganizationsService } from "./organizations.service";
import {
  addBankAccountSchema,
  inviteMemberSchema,
  listOrganizationsSchema,
  reviewDocumentSchema,
  reviewOrganizationSchema,
  updateMemberRoleSchema,
  updateOrganizationSchema,
  uploadKycDocumentSchema,
} from "./dto";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  // ---- The caller's own organisation ----

  @Get("organizations/me")
  getOwn(@ActiveOrg() org: RequestOrg) {
    return this.orgs.getOwn(org.orgId);
  }

  @Patch("organizations/me")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER)
  update(
    @ActiveOrg() org: RequestOrg,
    @Body(zodPipe(updateOrganizationSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.orgs.update(org.orgId, body, user);
  }

  // ---- KYC ----

  @Post("organizations/me/documents")
  @OrgRoles(OrgRole.OWNER, OrgRole.MANAGER)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 } }))
  uploadDocument(
    @ActiveOrg() org: RequestOrg,
    @Body(zodPipe(uploadKycDocumentSchema)) body: Record<string, unknown>,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: RequestUser
  ) {
    if (!file) throw new ValidationError("A file is required");
    return this.orgs.uploadDocument(
      org.orgId,
      body as never,
      { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype },
      user
    );
  }

  @Get("documents/:id/file")
  async downloadDocument(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response
  ) {
    const { buffer, mimeType, fileName } = await this.orgs.getDocumentFile(id, user);
    res.setHeader("Content-Type", mimeType);
    // Always an attachment: never render user-supplied content inline.
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.send(buffer);
  }

  // ---- Members ----

  @Get("organizations/me/members")
  listMembers(@ActiveOrg() org: RequestOrg) {
    return this.orgs.listMembers(org.orgId);
  }

  @Patch("organizations/me/members/:memberId")
  @OrgRoles(OrgRole.OWNER)
  updateMemberRole(
    @ActiveOrg() org: RequestOrg,
    @Param("memberId") memberId: string,
    @Body(zodPipe(updateMemberRoleSchema)) body: { role: OrgRole },
    @CurrentUser() user: RequestUser
  ) {
    return this.orgs.updateMemberRole(org.orgId, memberId, body.role, user);
  }

  @Post("organizations/me/members/invite")
  @OrgRoles(OrgRole.OWNER)
  inviteMember(
    @ActiveOrg() org: RequestOrg,
    @Body(zodPipe(inviteMemberSchema)) body: { email: string; role: OrgRole },
    @CurrentUser() user: RequestUser
  ) {
    return this.orgs.inviteMember(org.orgId, body.email, body.role, user);
  }

  @Delete("organizations/me/members/:memberId")
  @OrgRoles(OrgRole.OWNER)
  removeMember(
    @ActiveOrg() org: RequestOrg,
    @Param("memberId") memberId: string,
    @CurrentUser() user: RequestUser
  ) {
    return this.orgs.removeMember(org.orgId, memberId, user);
  }

  // ---- Bank accounts ----

  @Get("organizations/me/bank-accounts")
  @OrgRoles(OrgRole.OWNER, OrgRole.FINANCE)
  listBankAccounts(@ActiveOrg() org: RequestOrg) {
    return this.orgs.listBankAccounts(org.orgId);
  }

  @Post("organizations/me/bank-accounts")
  @OrgRoles(OrgRole.OWNER, OrgRole.FINANCE)
  addBankAccount(
    @ActiveOrg() org: RequestOrg,
    @Body(zodPipe(addBankAccountSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.orgs.addBankAccount(org.orgId, body as never, user);
  }

  // ---- Admin review queue ----

  @Get("admin/organizations")
  @Roles(Role.ADMIN)
  listForReview(@Query(zodPipe(listOrganizationsSchema)) query: Record<string, unknown>) {
    return this.orgs.listForReview(query as never);
  }

  @Get("admin/organizations/:id")
  @Roles(Role.ADMIN)
  getForReview(@Param("id") id: string) {
    return this.orgs.getOwn(id);
  }

  @Post("admin/organizations/:id/review")
  @Roles(Role.ADMIN)
  review(
    @Param("id") id: string,
    @Body(zodPipe(reviewOrganizationSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.orgs.review(id, body as never, user);
  }

  @Post("admin/documents/:id/review")
  @Roles(Role.ADMIN)
  reviewDocument(
    @Param("id") id: string,
    @Body(zodPipe(reviewDocumentSchema)) body: Record<string, unknown>,
    @CurrentUser() user: RequestUser
  ) {
    return this.orgs.reviewDocument(id, body as never, user);
  }
}
