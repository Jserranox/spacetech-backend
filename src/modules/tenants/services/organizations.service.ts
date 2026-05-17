import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, User, MemberRole } from '@aero-agent/database';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';
import { OrganizationResponseDto } from '../dtos/organization-response.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getById(id: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async getBySlug(slug: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { slug } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async getMyOrganization(orgId: string): Promise<OrganizationResponseDto> {
    const org = await this.getById(orgId);
    const memberCount = await this.userRepo.count({ where: { organizationId: orgId } });
    return this.toResponse(org, memberCount);
  }

  async update(
    orgId: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const org = await this.getById(orgId);

    if (dto.slug && dto.slug !== org.slug) {
      const existing = await this.orgRepo.findOne({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('Slug already taken');
    }

    Object.assign(org, dto);
    const saved = await this.orgRepo.save(org);
    return this.toResponse(saved);
  }

  async transferOwnership(
    orgId: string,
    targetUserId: string,
    requesterId: string,
  ): Promise<void> {
    const requester = await this.userRepo.findOne({
      where: { id: requesterId, organizationId: orgId },
    });
    if (!requester || requester.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only the owner can transfer ownership');
    }

    const target = await this.userRepo.findOne({
      where: { id: targetUserId, organizationId: orgId },
    });
    if (!target) throw new NotFoundException('Target user not found in this organization');

    await this.orgRepo.manager.transaction(async (manager) => {
      await manager.update(User, requesterId, { role: MemberRole.ADMIN });
      await manager.update(User, targetUserId, { role: MemberRole.OWNER });
    });
  }

  async softDelete(orgId: string, requesterId: string): Promise<void> {
    const requester = await this.userRepo.findOne({
      where: { id: requesterId, organizationId: orgId },
    });
    if (!requester || requester.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only the owner can delete the organization');
    }
    await this.orgRepo.softDelete(orgId);
  }

  private toResponse(org: Organization, memberCount?: number): OrganizationResponseDto {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      isActive: org.isActive,
      memberCount,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }
}
