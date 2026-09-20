import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListUsersQuery, SetRoleInput, SetStatusInput } from "./dto";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQuery): Promise<{ data: UserRow[]; page: number; pageSize: number; total: number }> {
    const where: Prisma.UserWhereInput = { role: query.role ?? undefined };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      })
    ]);
    return { data, page: query.page, pageSize: query.pageSize, total };
  }

  async get(id: string): Promise<UserRow> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async setRole(id: string, input: SetRoleInput): Promise<UserRow> {
    await this.ensureExists(id);
    return this.prisma.user.update({ where: { id }, data: { role: input.role }, select: USER_SELECT });
  }

  async setStatus(id: string, input: SetStatusInput): Promise<UserRow> {
    await this.ensureExists(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: input.isActive },
      select: USER_SELECT
    });
  }

  private async ensureExists(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException("User not found");
  }
}
