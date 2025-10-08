import { Controller, Get, Param, ParseIntPipe, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ReportProjectService } from '../services/reportProject.service';

@Controller('reports/projects')
export class ReportProjectController {
    constructor(
        private readonly reportService: ReportProjectService
    ) { }

    /**
     * GET /reports/projects/:id/pdf
     * Genera y descarga el reporte PDF completo del proyecto
     */
    @Get(':id/pdf')
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

    /**
     * GET /reports/projects/:id/excel
     * Genera y descarga el reporte Excel con métricas principales
     */
    @Get(':id/excel') //por hacer
    async getProjectReportExcel(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response
    ) {
        const excelBuffer = await this.reportService.createReportProjectXLSX(id);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=project-${id}-report.xlsx`);
        res.setHeader('Content-Length', excelBuffer.length);

        res.status(HttpStatus.OK).send(excelBuffer);
    }

    /**
     * GET /reports/projects/:id/data
     * Obtiene los datos del proyecto para el reporte (sin generar archivo)
     * Útil para preview o uso en frontend
     */
    @Get(':id/data')  
    async getProjectReportData(  
        @Param('id', ParseIntPipe) id: number
    ) {
        return await this.reportService.getByProjectReport(id); 
    }
}