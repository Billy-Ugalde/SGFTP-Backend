export interface IReportFairService {
  createReport(params: ReportFairParams);
  getReportByFair()
  getReportFair()
}

 export interface ReportFairParams {
  year: number;              // Ej: 2025
  quarter: 1 | 2 | 3 | 4;    // Q1..Q4
}