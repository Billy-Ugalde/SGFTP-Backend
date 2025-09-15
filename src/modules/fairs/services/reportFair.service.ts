import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ExcelJS from 'exceljs'; // o: import * as ExcelJS from 'exceljs';
import { Fair_enrollment } from '../entities/Fair_enrollment.entity';
import { IReportFairService, ReportFairParams } from '../interfaces/report.interface';

@Injectable()
export class ReportFairService implements IReportFairService {
  constructor(
    @InjectRepository(Fair_enrollment)
    private readonly enrRepo: Repository<Fair_enrollment>,
  ) { }

  private quarterRange(year: number, quarter: 1 | 2 | 3 | 4) {
    const m = (quarter - 1) * 3;          // 0,3,6,9
    const start = new Date(year, m, 1, 0, 0, 0, 0);        // local
    const next = new Date(year, m + 3, 1, 0, 0, 0, 0);    // inicio del siguiente trimestre
    return { start, next };
  }

  getReportByFair() { }//por el momento
  getReportFair() { } //por el momento
  async createReport(params: ReportFairParams): Promise<Buffer> {
    const { start, next } = this.quarterRange(params.year, params.quarter);

    // Opción A: Between (incluye bordes) con fin = next - 1ms
    // const end = new Date(next.getTime() - 1);
    // const rows = await this.enrRepo.find({
    //   where: { registration_date: Between(start, end) },
    //   relations: ['fair','entrepreneur','entrepreneur.person','entrepreneur.person.phones','entrepreneur.entrepreneurship'],
    // });

    // Opción B (recomendada): semiabierto [start, next)
    const rows = await this.enrRepo.createQueryBuilder('enr')
      .leftJoinAndSelect('enr.fair', 'fair')
      .leftJoinAndSelect('enr.entrepreneur', 'ent')
      .leftJoinAndSelect('ent.person', 'person')
      .leftJoinAndSelect('person.phones', 'phone')
      .leftJoinAndSelect('ent.entrepreneurship', 'biz')
      .where('enr.registration_date >= :start AND enr.registration_date < :next', { start, next })
      .getMany();

    // 1) Transformar entidades -> filas planas para el Excel
    const data = rows.map(r => {
      const p = r.entrepreneur.person;
      const ph = p?.phones?.find(x => x.is_primary) ?? p?.phones?.[0];
      const e = r.entrepreneur;
      const b = e.entrepreneurship;
      const f = r.fair;

      return {
        quarter: `Q${params.quarter}`,
        year: params.year,
        registration_date: r.registration_date,     // Date (Excel lo entiende)
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

    // 2) Crear workbook/worksheet
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Q${params.quarter}-${params.year}`);

    // 3) Definir columnas (encabezados y keys)
    const HEADERS: { header: string; key: keyof typeof data[number]; width?: number }[] = [
      { header: 'quarter', key: 'quarter', width: 8 },
      { header: 'year', key: 'year', width: 6 },
      { header: 'registration_date', key: 'registration_date', width: 20 },
      { header: 'fair_name', key: 'fair_name', width: 28 },
      { header: 'fair_type', key: 'fair_type', width: 10 },
      { header: 'fair_date', key: 'fair_date', width: 20 },
      { header: 'fair_location', key: 'fair_location', width: 24 },
      { header: 'fair_conditions', key: 'fair_conditions', width: 30 },
      { header: 'fair_stand_capacity', key: 'fair_stand_capacity', width: 14 },
      { header: 'fair_status', key: 'fair_status', width: 10 },
      { header: 'person_first_name', key: 'person_first_name', width: 18 },
      { header: 'person_first_lastname', key: 'person_first_lastname', width: 18 },
      { header: 'person_email', key: 'person_email', width: 28 },
      { header: 'person_primary_phone', key: 'person_primary_phone', width: 16 },
      { header: 'entrepreneur_experience', key: 'entrepreneur_experience', width: 12 },
      { header: 'entrepreneur_status', key: 'entrepreneur_status', width: 12 },
      { header: 'entrepreneur_active', key: 'entrepreneur_active', width: 10 },
      { header: 'entrepreneur_registration', key: 'entrepreneur_registration', width: 20 },
      { header: 'business_name', key: 'business_name', width: 24 },
      { header: 'business_location', key: 'business_location', width: 20 },
      { header: 'business_category', key: 'business_category', width: 16 },
      { header: 'business_approach', key: 'business_approach', width: 14 },
    ];

    ws.columns = HEADERS as any;

    // 4) Insertar datos (aquí "ponés la info")
    ws.addRows(data);

    // 5) Encabezado en negrita y formatos
    ws.getRow(1).font = { bold: true };
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: HEADERS.length },
    };
    ws.getColumn('registration_date').numFmt = 'yyyy-mm-dd hh:mm';
    ws.getColumn('fair_date').numFmt = 'yyyy-mm-dd hh:mm';
    ws.getColumn('entrepreneur_registration').numFmt = 'yyyy-mm-dd hh:mm';
    ws.getColumn('fair_stand_capacity').numFmt = '#,##0';

    // 6) Exportar buffer (si tu build devuelve ArrayBuffer, normalizá a Buffer)
    const raw = await wb.xlsx.writeBuffer();
    const nodeBuffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
    return nodeBuffer;

  }
}
