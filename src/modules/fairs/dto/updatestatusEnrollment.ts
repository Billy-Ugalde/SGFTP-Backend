import { IsEnum, IsNotEmpty } from "class-validator";
import { EnrollmentStatus } from "../entities/Fair_enrollment.entity";

export class StatusEnrollmentDto {
  @IsEnum(EnrollmentStatus)
  @IsNotEmpty()
  status: EnrollmentStatus;
}