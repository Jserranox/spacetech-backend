import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User, MemberRole } from '@aero-agent/database';
import { InviteMemberDto } from '../dtos/invite-member.dto';
import { UpdateMemberRoleDto } from '../dtos/update-member-role.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async listMembers(orgId: string): Promise<Partial<User>[]> {
    return this.userRepo.find({
      where: { organizationId: orgId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'avatarUrl', 'lastLoginAt', 'createdAt'],
      order: { createdAt: 'ASC' },
    });
  }

  async invite(orgId: string, dto: InviteMemberDto): Promise<Partial<User>> {
    const normalized = dto.email.toLowerCase();

    const alreadyMember = await this.userRepo.findOne({
      where: { email: normalized, organizationId: orgId },
    });
    if (alreadyMember) {
      throw new ConflictException('User is already a member of this organization');
    }

    // Single-org constraint: user can only belong to one org
    const existingElsewhere = await this.userRepo.findOne({
      where: { email: normalized },
    });
    if (existingElsewhere) {
      throw new ConflictException('A user with this email already belongs to another organization');
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const newUser = this.userRepo.create({
      organizationId: orgId,
      email: normalized,
      passwordHash: '',
      role: dto.role,
      isEmailVerified: false,
      emailVerificationToken: inviteToken,
      refreshTokenIds: [],
      refreshTokenHashes: [],
    });

    const saved = await this.userRepo.save(newUser);
    // TODO: emit InvitationSentEvent to trigger email delivery
    return { id: saved.id, email: saved.email, role: saved.role };
  }

  async remove(orgId: string, memberId: string, requesterId: string): Promise<void> {
    if (memberId === requesterId) {
      throw new BadRequestException('You cannot remove yourself');
    }

    const target = await this.userRepo.findOne({
      where: { id: memberId, organizationId: orgId },
    });
    if (!target) throw new NotFoundException('Member not found in this organization');

    if (target.role === MemberRole.OWNER) {
      const ownerCount = await this.userRepo.count({
        where: { organizationId: orgId, role: MemberRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the only owner of the organization');
      }
    }

    await this.userRepo.softDelete(memberId);
  }

  async updateRole(
    orgId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    requesterId: string,
  ): Promise<Partial<User>> {
    void requesterId;

    const target = await this.userRepo.findOne({
      where: { id: memberId, organizationId: orgId },
    });
    if (!target) throw new NotFoundException('Member not found in this organization');

    if (dto.role === MemberRole.OWNER) {
      throw new ForbiddenException('Use transfer ownership to promote a member to owner');
    }

    if (target.role === MemberRole.OWNER) {
      throw new ForbiddenException('Cannot change the owner role directly; use transfer ownership');
    }

    await this.userRepo.update(memberId, { role: dto.role });
    return { id: target.id, email: target.email, role: dto.role };
  }
}
