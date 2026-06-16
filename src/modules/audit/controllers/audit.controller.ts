import { Controller, Get, HttpStatus, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from '../services/audit.service';
import { QueryAuditDto } from '../dto/query-audit.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Controller('audit')
@UseGuards(AuthGuard, RoleGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.AUDITOR)
export class AuditController {

    constructor(private readonly auditService: AuditService) {}

    // GET /audit — lista paginada con filtros
    @Get()
    findAll(@Query() query: QueryAuditDto) {
        return this.auditService.findAll(query);
    }

    // GET /audit/stats — KPIs del dashboard
    @Get('stats')
    getStats() {
        return this.auditService.getStats();
    }

    // GET /audit/:id/pdf — PDF de un registro individual
    @Get(':id/pdf')
    async downloadPdfById(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
        const buffer = await this.auditService.generatePdfById(id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Registro_Auditoria_${id}.pdf"`);
        res.setHeader('Content-Length', buffer.length);
        res.status(HttpStatus.OK).send(buffer);
    }

    // GET /audit/pdf — reporte PDF descargable
    @Get('pdf')
    async downloadPdf(@Query() query: QueryAuditDto, @Res() res: Response) {
        const buffer = await this.auditService.generatePdf(query);
        const fecha  = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Auditoria_${fecha}.pdf"`);
        res.setHeader('Content-Length', buffer.length);
        res.status(HttpStatus.OK).send(buffer);
    }
}
