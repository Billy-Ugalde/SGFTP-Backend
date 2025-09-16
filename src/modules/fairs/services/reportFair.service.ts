// src/modules/fairs/services/reportFair.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';      // ✅
const wb = new ExcelJS.Workbook();

import { Buffer } from 'buffer';
import { Fair_enrollment } from '../entities/Fair_enrollment.entity';
import { IReportFairService, ReportFairParams } from '../interfaces/report.interface';

@Injectable()
export class ReportFairService implements IReportFairService {
  constructor(
    @InjectRepository(Fair_enrollment)
    private readonly enrRepo: Repository<Fair_enrollment>,
  ) { }

  // DATETIME en MySQL: usar horas locales para evitar corrimientos
  private quarterRange(year: number, quarter: 1 | 2 | 3 | 4) {
    const m = (quarter - 1) * 3;              // 0,3,6,9
    const start = new Date(year, m, 1, 0, 0, 0, 0);
    const next = new Date(year, m + 3, 1, 0, 0, 0, 0); // inicio Q siguiente
    return { start, next };
  }

  private romanQuarter(q: 1 | 2 | 3 | 4): 'I' | 'II' | 'III' | 'IV' {
    const ROMANS = ['I', 'II', 'III', 'IV'] as const;
    return ROMANS[q - 1];
  }



  async createReport(params: ReportFairParams): Promise<Buffer> {
    const { start, next } = this.quarterRange(params.year, params.quarter);
    const trimestre = this.romanQuarter(params.quarter);
    // [start, next) → robusto para bordes y usa índices
    const rows = await this.enrRepo
      .createQueryBuilder('enr')
      .leftJoinAndSelect('enr.fair', 'fair')
      .leftJoinAndSelect('enr.entrepreneur', 'ent')
      .leftJoinAndSelect('ent.person', 'person')
      .leftJoinAndSelect('person.phones', 'phone')
      .leftJoinAndSelect('ent.entrepreneurship', 'biz')
      .where('enr.registration_date >= :start AND enr.registration_date < :next', { start, next })
      .getMany();

    // Map → filas planas (aplicando exclusiones)
    const data = rows.map(r => {
      const p = r.entrepreneur.person;
      const e = r.entrepreneur;
      const b = e.entrepreneurship;
      const f = r.fair;
      const ph = p?.phones?.find(x => x.is_primary) ?? p?.phones?.[0];

      return {
        quarter: trimestre,
        year: params.year,
        registration_date: r.registration_date,

        fair_name: f.name,
        fair_type: f.typeFair,
        fair_date: f.date,
        fair_location: f.location,
        fair_conditions: f.conditions,
        fair_stand_capacity: f.stand_capacity,
        fair_status: f.status,

        person_first_name: p.first_name,
        person_first_lastname: p.first_lastname,
        person_email: p.email,
        person_primary_phone: ph?.number ?? '',

        entrepreneur_experience: e.experience,
        entrepreneur_status: e.status,
        entrepreneur_active: e.is_active,
        entrepreneur_registration: e.registration_date,

        business_name: b?.name ?? '',
        business_location: b?.location ?? '',
        business_category: b?.category ?? '',
        business_approach: b?.approach ?? '',
      };
    });

    // Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Q${params.quarter}-${params.year}`);

    const HEADERS: { header: string; key: keyof (typeof data extends Array<infer U> ? U : never); width?: number }[] = [
      { header: 'Trimestre', key: 'quarter', width: 10 },
      { header: 'Año', key: 'year', width: 8 },
      { header: 'Fecha de solicitud', key: 'registration_date', width: 22 },
      { header: 'Nombre de la feria', key: 'fair_name', width: 30 },
      { header: 'Tipo de feria', key: 'fair_type', width: 14 },
      { header: 'Fecha de la feria', key: 'fair_date', width: 22 },
      { header: 'Ubicación de la feria', key: 'fair_location', width: 26 },
      { header: 'Condiciones', key: 'fair_conditions', width: 36 },
      { header: 'Capacidad de stands', key: 'fair_stand_capacity', width: 18 },
      { header: 'Estado de la feria', key: 'fair_status', width: 14 },
      { header: 'Nombre', key: 'person_first_name', width: 18 },
      { header: 'Primer apellido', key: 'person_first_lastname', width: 18 },
      { header: 'Correo electrónico', key: 'person_email', width: 30 },
      { header: 'Teléfono', key: 'person_primary_phone', width: 18 },
      { header: 'Experiencia (años)', key: 'entrepreneur_experience', width: 16 },
      { header: 'Estado del emprendedor', key: 'entrepreneur_status', width: 20 },
      { header: 'Activo', key: 'entrepreneur_active', width: 10 },
      { header: 'Fecha de registro (empr.)', key: 'entrepreneur_registration', width: 24 },
      { header: 'Emprendimiento', key: 'business_name', width: 28 },
      { header: 'Ubicación del emprendimiento', key: 'business_location', width: 28 },
      { header: 'Categoría', key: 'business_category', width: 16 },
      { header: 'Enfoque', key: 'business_approach', width: 14 },
    ];

    ws.columns = HEADERS as any;
    ws.addRows(data);
    ws.getRow(1).font = { bold: true };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: HEADERS.length } };
    ws.getColumn('registration_date').numFmt = 'dd/mm/yyyy hh:mm';
    ws.getColumn('fair_date').numFmt = 'dd/mm/yyyy hh:mm';
    ws.getColumn('entrepreneur_registration').numFmt = 'dd/mm/yyyy hh:mm';
    ws.getColumn('fair_stand_capacity').numFmt = '#,##0';

    const raw = await wb.xlsx.writeBuffer();               // ArrayBuffer | Buffer
    const nodeBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
    return nodeBuffer;
  }
}
