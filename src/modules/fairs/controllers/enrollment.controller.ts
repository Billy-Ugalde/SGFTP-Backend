import { Body, Controller, Injectable, Post } from "@nestjs/common";
import { Fair_enrollment } from "../entities/Fair_enrollment.entity";
import { EnrollmentFairDto } from "../dto/enrrolmentFair.dto";
import { EnrrolmentService } from "../services/Enrollment.service";

@Controller('enrrolment')

export class EnrollmentController {

    constructor(private readonly fair_enrollmentservice: EnrrolmentService) { }

    @Post()
    create(@Body() enrollmentFairdto: EnrollmentFairDto) {
        return this.fair_enrollmentservice.create(enrollmentFairdto);
    }



}