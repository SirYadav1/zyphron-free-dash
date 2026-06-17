import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async findAll() {
    const roles = await this.roleRepo.find({ order: { name: 'ASC' } });
    const results: any[] = [];
    for (const role of roles) {
      const perms = await this.rolePermRepo.find({
        where: { role_id: role.id },
        relations: { permission: true },
      });
      const userCount = await this.userRoleRepo.count({ where: { role_id: role.id } });
      results.push({
        ...role,
        permissions: perms.map(p => p.permission?.name).filter(Boolean),
        userCount,
      });
    }
    return results;
  }

  async findOne(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    const perms = await this.rolePermRepo.find({
      where: { role_id: id },
      relations: { permission: true },
    });
    const userCount = await this.userRoleRepo.count({ where: { role_id: id } });
    return {
      ...role,
      permissions: perms.map(p => p.permission?.name).filter(Boolean),
      userCount,
    };
  }

  async create(dto: Partial<Role>, permissionNames?: string[]) {
    const role = await this.roleRepo.save(this.roleRepo.create(dto));
    if (permissionNames && permissionNames.length > 0) {
      await this.syncPermissions(role.id, permissionNames);
    }
    return this.findOne(role.id);
  }

  async update(id: number, dto: Partial<Role>, permissionNames?: string[]) {
    await this.findOne(id);
    await this.roleRepo.update(id, dto);
    if (permissionNames !== undefined) {
      await this.syncPermissions(id, permissionNames);
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.roleRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Role not found');
  }

  async findAllPermissions() {
    return this.permissionRepo.find({ order: { name: 'ASC' } });
  }

  async seedPermissions() {
    const defaultPermissions = [
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'servers.view', 'servers.create', 'servers.edit', 'servers.delete',
      'products.view', 'products.create', 'products.edit', 'products.delete',
      'payments.view', 'settings.view', 'settings.edit',
      'roles.view', 'roles.edit',
      'tickets.view', 'tickets.edit',
      'tickets.accept', 'tickets.reject', 'tickets.chat',
      'coins.approve',
      'vouchers.view', 'vouchers.edit',
    ];
    for (const name of defaultPermissions) {
      const exists = await this.permissionRepo.findOne({ where: { name } });
      if (!exists) {
        await this.permissionRepo.save(this.permissionRepo.create({ name }));
      }
    }
    return this.permissionRepo.find({ order: { name: 'ASC' } });
  }

  private async syncPermissions(roleId: number, permissionNames: string[]) {
    await this.rolePermRepo.delete({ role_id: roleId });
    for (const name of permissionNames) {
      let perm = await this.permissionRepo.findOne({ where: { name } });
      if (!perm) {
        perm = await this.permissionRepo.save(this.permissionRepo.create({ name }));
      }
      await this.rolePermRepo.save(this.rolePermRepo.create({
        role_id: roleId,
        permission_id: perm.id,
      }));
    }
  }

  async assignRoleToUser(userId: string, roleId: number) {
    const exists = await this.userRoleRepo.findOne({ where: { user_id: userId, role_id: roleId } });
    if (exists) return exists;
    return this.userRoleRepo.save(this.userRoleRepo.create({ user_id: userId, role_id: roleId }));
  }

  async removeRoleFromUser(userId: string, roleId: number) {
    await this.userRoleRepo.delete({ user_id: userId, role_id: roleId });
  }

  async getUserRoles(userId: string) {
    const userRoles = await this.userRoleRepo.find({
      where: { user_id: userId },
      relations: { role: true },
    });
    return userRoles.map(ur => ur.role);
  }

  async getUsersWithRole(roleId: number) {
    const userRoles = await this.userRoleRepo.find({
      where: { role_id: roleId },
      relations: { user: true },
    });
    return userRoles.map(ur => ur.user);
  }
}
