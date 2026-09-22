import type { OrgRole, Role, VerificationStatus } from "@prisma/client";
import type { Request } from "express";

export interface RequestOrg {
  orgId: string;
  orgRole: OrgRole;
  verificationStatus: VerificationStatus;
}

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  sessionId: string;
  /** Every organisation the user belongs to. */
  organizations: RequestOrg[];
  /**
   * The organisation this request acts for. Resolved from the X-Org-Id header
   * when supplied, otherwise the user's single organisation.
   */
  activeOrg: RequestOrg | null;
}

export interface AuthRequest extends Request {
  user?: RequestUser;
  id?: string;
}
