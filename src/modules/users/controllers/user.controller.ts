import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UseGuards, Delete } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserService } from "../services/user.service";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";
import { CreateUserDto } from "../dto/user.dto";
import { UpdateUserDto } from "../dto/userUpdateDto";
import { RoleGuard } from "src/modules/auth/guards/role.guard";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { UserRole } from "src/modules/auth/enums/user-role.enum";
import { AuthGuard } from "src/modules/auth/guards/auth.guard";
import { CurrentUser } from "src/modules/auth/decorators/current-user.decorator";

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {

  constructor(
    private readonly userService: UserService,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) { }

  @Get()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.userService.findOne(id);
  }

  @Put('update/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return await this.userService.update(id, updateUserDto);
  }

  @Patch('status/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatestatus: UpdateUserDto
  ): Promise<User> {
    return await this.userService.updateStatus(id, updatestatus);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto): Promise<User> {
      return await this.userService.create(createUserDto); 
  }

  @Get('roles/all')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find({
      order: { name: 'ASC' }
    });
  }

  @Post(':id/roles')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
  async addRole(
      @Param('id', ParseIntPipe) userId: number,
      @Body() { roleId }: { roleId: number },
      @CurrentUser() admin: User
  ): Promise<User> {
      return await this.userService.addRoleToUser(userId, roleId, admin.id_user);
  }

  @Delete(':id/roles/:roleId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
  async removeRole(
      @Param('id', ParseIntPipe) userId: number,
      @Param('roleId', ParseIntPipe) roleId: number,
      @CurrentUser() admin: User
  ): Promise<User> {
      return await this.userService.removeRoleFromUser(userId, roleId, admin.id_user);
  }

}