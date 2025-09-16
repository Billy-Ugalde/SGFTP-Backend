// src/modules/fairs/controllers/fair-report.controller.ts
import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportFairService } from '../services/reportFair.service';
import { ReportFairDto } from '../dto/ReportFairDto ';

@Controller('reports')
export class FairReportController {
    constructor(private readonly service: ReportFairService) { }

    @Post('quarterly')
    async downloadQuarterly(@Body() dto: ReportFairDto, @Res() res: Response) {
        const buf = await this.service.createReport({ year: dto.year, quarter: dto.quarter });
        const filename = `Ferias_Q${dto.quarter}_${dto.year}.xlsx`;
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buf.length,
        });
        res.end(buf);
    }
}
