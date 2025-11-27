import { Controller, Get, Param, ParseIntPipe, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportActivityService } from '../services/reportActivity.service';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { UserRole } from 'src/modules/auth/enums/user-role.enum';

@Controller('reports/activities')
@UseGuards(AuthGuard, RoleGuard)
export class ReportActivityController {
    constructor(
        private readonly reportActivityService: ReportActivityService
    ) { }

    @Get(':id/pdf')
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
    async getActivityReportPDF(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response
    ) {
        const pdfBuffer = await this.reportActivityService.createReportActivityPDF(id);
        const activityData = await this.reportActivityService.getByActivityReport(id);
        const fileName = `Reporte_Actividad_${activityData.activity.Name.replace(/\s+/g, '_')}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.status(HttpStatus.OK).send(pdfBuffer);
    }

    @Get(':id/excel')
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
    async getActivityReportExcel(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response
    ) {
        const excelBuffer = await this.reportActivityService.createReportActivityXLSX(id);
        const activityData = await this.reportActivityService.getByActivityReport(id);
        const fileName = `Reporte_Actividad_${activityData.activity.Name.replace(/\s+/g, '_')}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);

        res.status(HttpStatus.OK).send(excelBuffer);
    }

    @Get(':id/data')
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.AUDITOR)
    async getActivityReportData(
        @Param('id', ParseIntPipe) id: number
    ) {
        return await this.reportActivityService.getByActivityReport(id);
    }
}
