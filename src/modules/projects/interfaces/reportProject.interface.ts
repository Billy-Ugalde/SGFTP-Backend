
export interface IReportProjectService {
    createReportProjectPDF(id_project: number): Promise<Buffer>;
    createReportProjectXLSX(id_project: number): Promise<Buffer>;
    getByProjectReport(id_project: number);

    //----------------Se hace después----------------------------------------
    //createReportActivityPDF(): Promise<Buffer>;
    //createReportActivityXLSX(): Promise<Buffer>;
}

export interface ProjectReportData {
    Id_project: number;
    Name: string;
    Description: string;
    Aim: string;
    Start_date: string;
    End_date: string;
    Status: string;
    Target_population: string;
    Location: string;
    METRIC_TOTAL_BENEFICIATED: number;
    METRIC_TOTAL_WASTE_COLLECTED: number;
    METRIC_TOTAL_TREES_PLANTED: number;
}

export interface ActivityReportData {
    Id_activity: number;
    Name: string;
    Description: string;
    OpenForRegistration: boolean;
    Type_activity: string;
    Status_activity: string;
    Approach: string;
    Location: string;
    Aim: string;
    Metric_activity: string;
    Metric_value: number;
    Start_date?: string;  
    End_date?: string;    
}

export interface StatisticsReportData {
    total_activities: number;
    pending_activities: number;
    planning_activities: number;
    execution_activities: number;
    suspended_activities: number;
    finished_activities: number;
}

export interface ReportData {
    project: ProjectReportData;
    activities: ActivityReportData[];
    statistics: StatisticsReportData;
}

