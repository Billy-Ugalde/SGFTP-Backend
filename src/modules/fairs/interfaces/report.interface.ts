// src/modules/fairs/interfaces/report.interface.ts
export interface ReportFairParams {
  year: number;
  quarter: 1 | 2 | 3 | 4;
}

export interface IReportFairService {
  createReport(params: ReportFairParams): Promise<Buffer>;
}
