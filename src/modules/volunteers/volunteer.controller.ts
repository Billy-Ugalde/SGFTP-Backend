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
  CancelEnrollmentDto
} from './dto/volunteer.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

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

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.volunteerService.remove(id);
  }

  // ========== Activity Enrollments ==========

  @Post('enroll')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.VOLUNTEER)
  async enrollToActivity(@Body() enrollDto: EnrollVolunteerDto) {
    return await this.volunteerService.enrollToActivity(enrollDto);
  }

  @Patch('enrollment/:id_enrollment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async updateEnrollmentStatus(
    @Param('id_enrollment', ParseIntPipe) id_enrollment: number,
    @Body() updateDto: UpdateEnrollmentDto
  ) {
    return await this.volunteerService.updateEnrollmentStatus(id_enrollment, updateDto);
  }

  @Patch('enrollment/:id_enrollment/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.VOLUNTEER)
  async cancelEnrollment(
    @Param('id_enrollment', ParseIntPipe) id_enrollment: number,
    @Body() cancelDto: CancelEnrollmentDto
  ) {
    return await this.volunteerService.cancelEnrollment(id_enrollment, cancelDto.notes);
  }

  @Get(':id_volunteer/enrollments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.VOLUNTEER)
  async getVolunteerEnrollments(@Param('id_volunteer', ParseIntPipe) id_volunteer: number) {
    return await this.volunteerService.getVolunteerEnrollments(id_volunteer);
  }

  @Get('activity/:id_activity/enrollments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async getActivityEnrollments(@Param('id_activity', ParseIntPipe) id_activity: number) {
    return await this.volunteerService.getActivityEnrollments(id_activity);
  }
}
