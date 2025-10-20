import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import {
  CreateVolunteerDto,
  UpdateVolunteerDto,
  EnrollVolunteerDto,
  UpdateEnrollmentDto,
  CancelEnrollmentDto,
  PublicRegisterVolunteerDto,
  PublicEnrollActivityDto,
  UpdateOwnProfileDto,
  SelfEnrollActivityDto
} from './dto/volunteer.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@Controller('volunteers')
@UseGuards(AuthGuard, RoleGuard)
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  // ========== CRUD Volunteers ==========

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async findAll() {
    return await this.volunteerService.findAll();
  }

  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async findAllActive() {
    return await this.volunteerService.findAllActive();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.VOLUNTEER)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.volunteerService.findOne(id);
  }

  @Get('person/:id_person')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.VOLUNTEER)
  async findByPerson(@Param('id_person', ParseIntPipe) id_person: number) {
    return await this.volunteerService.findByPerson(id_person);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async create(@Body() createDto: CreateVolunteerDto) {
    return await this.volunteerService.create(createDto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVolunteerDto
  ) {
    return await this.volunteerService.update(id, updateDto);
  }

  // ========== Activity Enrollments ==========

  @Post('activity-enrollment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.VOLUNTEER)
  async enrollToActivity(@Body() enrollDto: EnrollVolunteerDto) {
    return await this.volunteerService.enrollToActivity(enrollDto);
  }

  @Patch('activity-enrollment/:id_enrollment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async updateEnrollmentStatus(
    @Param('id_enrollment', ParseIntPipe) id_enrollment: number,
    @Body() updateDto: UpdateEnrollmentDto
  ) {
    return await this.volunteerService.updateEnrollmentStatus(id_enrollment, updateDto);
  }

  @Patch('activity-enrollment/:id_enrollment/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.VOLUNTEER)
  async cancelEnrollment(
    @Param('id_enrollment', ParseIntPipe) id_enrollment: number
  ) {
    return await this.volunteerService.cancelEnrollment(id_enrollment);
  }

  @Get(':id_volunteer/activity-enrollments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.VOLUNTEER)
  async getVolunteerEnrollments(@Param('id_volunteer', ParseIntPipe) id_volunteer: number) {
    return await this.volunteerService.getVolunteerEnrollments(id_volunteer);
  }

  @Get('activity/:id_activity/activity-enrollments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async getActivityEnrollments(@Param('id_activity', ParseIntPipe) id_activity: number) {
    return await this.volunteerService.getActivityEnrollments(id_activity);
  }

  // ========== PUBLIC ENDPOINTS (Sin Auth) ==========

  @Post('public/register')
  @Public()
  async publicRegister(@Body() dto: PublicRegisterVolunteerDto) {
    return await this.volunteerService.publicRegister(dto);
  }

  @Post('public/enroll-activity')
  @Public()
  async publicEnrollActivity(@Body() dto: PublicEnrollActivityDto) {
    return await this.volunteerService.publicEnrollToActivity(dto);
  }

  // ========== VOLUNTEER SELF-MANAGEMENT ENDPOINTS ==========

  @Get('me')
  @Roles(UserRole.VOLUNTEER)
  async getMyProfile(@CurrentUser() user: User) {
    return await this.volunteerService.findByUserId(user.id_user);
  }

  @Put('me')
  @Roles(UserRole.VOLUNTEER)
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateOwnProfileDto
  ) {
    return await this.volunteerService.updateOwnProfile(user.id_user, dto);
  }

  @Get('me/activity-enrollments')
  @Roles(UserRole.VOLUNTEER)
  async getMyEnrollments(@CurrentUser() user: User) {
    return await this.volunteerService.getMyEnrollments(user.id_user);
  }

  @Post('me/activity-enrollment')
  @Roles(UserRole.VOLUNTEER)
  async selfEnrollToActivity(
    @CurrentUser() user: User,
    @Body() dto: SelfEnrollActivityDto
  ) {
    return await this.volunteerService.selfEnrollToActivity(user.id_user, dto);
  }

  @Patch('me/activity-enrollment/:id_enrollment/cancel')
  @Roles(UserRole.VOLUNTEER)
  async cancelMyEnrollment(
    @CurrentUser() user: User,
    @Param('id_enrollment', ParseIntPipe) id_enrollment: number
  ) {
    return await this.volunteerService.cancelMyEnrollment(user.id_user, id_enrollment);
  }
}
