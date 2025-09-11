



export interface IReportFairService {
  createReport(params: ReportFairParams): Promise<Buffer>; 
  getReportByFair()
  getReportFair()
}

 interface ReportFairParams {
  year: number;              // Ej: 2025
  quarter: 1 | 2 | 3 | 4;    // Q1..Q4
}
