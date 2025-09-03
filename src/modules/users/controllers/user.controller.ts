import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dto/user.dto";
import { UpdateUserDto } from "../dto/userUpdateDto";

@Controller('users')
// @UseGuards(JwtAuthGuard)
export class UserController {

  constructor(private readonly userService: UserService) { }

  @Get()
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.userService.findOne(id);
  }

  @Put('update/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return await this.userService.update(id, updateUserDto);
  }

  @Patch('status/:id')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatestatus: UpdateUserDto
  ): Promise<User> {
    return await this.userService.updateStatus(id, updatestatus);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.userService.create(createUserDto);
  }
}