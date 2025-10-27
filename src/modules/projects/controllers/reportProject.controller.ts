import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { ReportProjectService } from '../services/reportProject.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Controller('reports/projects')
@UseGuards(AuthGuard)
export class ReportProjectController {
    constructor(
        private readonly reportService: ReportProjectService
    ) { }

    @Get(':id/pdf')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
    async getProjectReportPDF(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response
    ) {
        const pdfBuffer = await this.reportService.createReportProjectPDF(id);
        const projectData = await this.reportService.getByProjectReport(id);
        const fileName = `Reporte de ${projectData.project.Name}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.status(HttpStatus.OK).send(pdfBuffer);
    }

    @Get(':id/excel')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
    async getProjectReportExcel(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response
    ) {
        const excelBuffer = await this.reportService.createReportProjectXLSX(id);
        const projectData = await this.reportService.getByProjectReport(id);
        const fileName = `Reporte de ${projectData.project.Name}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);

        res.status(HttpStatus.OK).send(excelBuffer);
    }

    /**
     * GET /reports/projects/:id/data
     * Obtiene los datos del proyecto para el reporte (sin generar archivo)
     * Útil para preview o uso en frontend
     */
    @Get(':id/data')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
    async getProjectReportData(
        @Param('id', ParseIntPipe) id: number
    ) {
        return await this.reportService.getByProjectReport(id);
    }
}