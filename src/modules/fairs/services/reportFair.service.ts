import { Injectable } from "@nestjs/common";
import { IReportFairService, ReportFairParams } from "../interfaces/report.interface";

@Injectable()
export class ReportFairService implements IReportFairService {


createReport(params: ReportFairParams){}

  getReportByFair(){}
  getReportFair(){}

}