// src/modules/fairs/controllers/fair-report.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportFairService } from '../services/reportFair.service';
import { ReportFairDto } from '../dto/ReportFairDto ';
import { quarterToRoman } from '../utils/quarter.util';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { UserRole } from 'src/modules/auth/enums/user-role.enum';
@Controller('reports')
//@UseGuards(AuthGuard)
export class FairReportController {
  constructor(private readonly service: ReportFairService) { }

  @Post('quarterly')
  /*@UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  @HttpCode(HttpStatus.CREATED)*/
  async downloadQuarterly(@Body() dto: ReportFairDto, @Res() res: Response) {
    const currentYear = new Date().getFullYear();

    const buf = await this.service.createReport({ quarter: dto.quarter });

    const trimestre = quarterToRoman(dto.quarter); 
    const filename = `Reporte de ferias ${trimestre} trimestre ${currentYear}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Content-Length': String(buf.length),
    });
    res.end(buf);
  }

}
