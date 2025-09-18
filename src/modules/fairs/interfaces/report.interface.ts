export interface ReportFairParams {
  quarter: 1 | 2 | 3 | 4;
}

export interface IReportFairService {
  createReport(params: ReportFairParams): Promise<Buffer>;
}
