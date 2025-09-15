import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from "@nestjs/common";
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

@Controller('users')
@UseGuards(AuthGuard)
@UseGuards(RoleGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
export class UserController {

  constructor(
    private readonly userService: UserService,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) { }

  @Get()
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.userService.findOne(id);
  }

  @Put('update/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return await this.userService.update(id, updateUserDto);
  }

  @Patch('status/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatestatus: UpdateUserDto
  ): Promise<User> {
    return await this.userService.updateStatus(id, updatestatus);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.userService.create(createUserDto);
  }

  @Get('roles/all')
  async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find({
      order: { name: 'ASC' }
    });
  }
}