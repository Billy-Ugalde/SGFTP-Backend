import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dto/user.dto";


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
    
      @Post()
      @HttpCode(HttpStatus.CREATED)
      async create(
        @Body()createUserDto: CreateUserDto): Promise<User> {
        return await this.userService.create(createUserDto);
      }
}