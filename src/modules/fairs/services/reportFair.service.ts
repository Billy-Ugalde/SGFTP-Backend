import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';     
import { quarterToRoman } from '../utils/quarter.util';
import { Buffer } from 'buffer';
import { Fair_enrollment } from '../entities/Fair_enrollment.entity';
import { IReportFairService, ReportFairParams } from '../interfaces/report.interface';
@Injectable()
export class ReportFairService implements IReportFairService {
  constructor(
    @InjectRepository(Fair_enrollment)
    private readonly enrRepo: Repository<Fair_enrollment>,
  ) { }

  private quarterRange(year: number, quarter: 1 | 2 | 3 | 4) {
    const m = (quarter - 1) * 3;
    const start = new Date(year, m, 1, 0, 0, 0, 0);
    const next = new Date(year, m + 3, 1, 0, 0, 0, 0);
    return { start, next };
  }

  async createReport(params: ReportFairParams): Promise<Buffer> {

    const wb = new ExcelJS.Workbook();
    const currentYear = new Date().getFullYear();   //obtiene el año actual para el reporte.
    const { start, next } = this.quarterRange(currentYear, params.quarter);
    const trimestre = quarterToRoman(params.quarter);     //  recibe el parametro del trimestre en número romano.

    const rows = await this.enrRepo
      .createQueryBuilder('enr')
      .leftJoinAndSelect('enr.fair', 'fair')
      .leftJoinAndSelect('enr.entrepreneur', 'ent')
      .leftJoinAndSelect('ent.person', 'person')
      .leftJoinAndSelect('person.phones', 'phone')
      .leftJoinAndSelect('ent.entrepreneurship', 'biz')
      .where('enr.registration_date >= :start AND enr.registration_date < :next', { start, next })
      .getMany();

    const data = rows.map(r => {
      const p = r.entrepreneur.person;
      const e = r.entrepreneur;
      const b = e.entrepreneurship;
      const f = r.fair;
      const ph = p?.phones?.find(x => x.is_primary) ?? p?.phones?.[0];

      return {

        year: currentYear,
        registration_date: r.registration_date,

        fair_name: f.name,
        fair_location: f.location,
        fair_date: f.date,
        fair_type: f.typeFair,

        person_first_name: p.first_name,
        person_first_lastname: p.first_lastname,
        person_email: p.email,
        person_primary_phone: ph?.number ?? '',

        entrepreneur_experience: e.experience,

        business_name: b?.name ?? '',
        business_location: b?.location ?? '',
        business_category: b?.category ?? '',
        business_approach: b?.approach ?? '',
      };
    });

    const ws = wb.addWorksheet(`${trimestre} trimestre ${currentYear}`);

    const HEADERS: { header: string; key: keyof (typeof data extends Array<infer U> ? U : never); width?: number }[] = [
      { header: 'Año', key: 'year', width: 8 },
      { header: 'Fecha de solicitud', key: 'registration_date', width: 22 },
      { header: 'Nombre de la feria', key: 'fair_name', width: 30 },
      { header: 'Ubicación de la feria', key: 'fair_location', width: 26 },
      { header: 'Fecha de la feria', key: 'fair_date', width: 22 },
      { header: 'Tipo de feria', key: 'fair_type', width: 14 },
      { header: 'Nombre', key: 'person_first_name', width: 18 },
      { header: 'Primer apellido', key: 'person_first_lastname', width: 18 },
      { header: 'Correo electrónico', key: 'person_email', width: 30 },
      { header: 'Teléfono', key: 'person_primary_phone', width: 18 },
      { header: 'Experiencia (años)', key: 'entrepreneur_experience', width: 16 },
      { header: 'Nombre de emprendimiento', key: 'business_name', width: 28 },
      { header: 'Ubicación del emprendimiento', key: 'business_location', width: 28 },
      { header: 'Categoría', key: 'business_category', width: 16 },
      { header: 'Enfoque', key: 'business_approach', width: 14 },
    ];

    ws.columns = HEADERS as any;
    ws.addRows(data);

    const PADDING = 4;

    for (let c = 1; c <= ws.columnCount; c++) {
      const column = ws.getColumn(c);
      const header = String(column.header ?? '');
      let max = header.length;

      column.eachCell({ includeEmpty: true }, (cell, row) => {
        if (row === 1) return;
        const v = cell.value as any;
        const s = v instanceof Date ? '00/00/0000 00:00' : (v ?? '').toString();
        max = Math.max(max, s.length);
      });

      column.width = Math.min(Math.max(max + PADDING, 12), 60);
    }
    ws.getRow(1).font = { bold: true };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: HEADERS.length } };
    ws.getColumn('registration_date').numFmt = 'dd/mm/yyyy hh:mm';
    ws.getColumn('fair_date').numFmt = 'dd/mm/yyyy hh:mm';

    const raw = await wb.xlsx.writeBuffer();               // ArrayBuffer | Buffer
    const nodeBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
    return nodeBuffer;
  }
}
