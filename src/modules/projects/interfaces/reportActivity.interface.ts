
export interface IReportActivityService {
    createReportActivityPDF(id_activity: number): Promise<Buffer>;
    createReportActivityXLSX(id_activity: number): Promise<Buffer>;
    getByActivityReport(id_activity: number): Promise<ActivityReportData>;
}

export interface ActivityReportData {
    activity: ActivityBasicInfo;
    enrollments: EnrollmentReportData;
    statistics: ActivityStatisticsData;
}

export interface ActivityBasicInfo {
    Id_activity: number;
    Name: string;
    Description: string;
    Aim: string;
    Location: string;
    Type_activity: string;
    Status_activity: string;
    Approach: string;
    OpenForRegistration: boolean;
    Metric_activity: string;
    Metric_value: number;
    Start_date?: string;
    End_date?: string;
    Registration_date: string;
    Project_name?: string;
}

export interface EnrollmentReportData {
    total_enrolled: number;
    total_attended: number;
    total_not_attended: number;
    total_cancelled: number;
    volunteers: VolunteerEnrollmentInfo[];
}

export interface VolunteerEnrollmentInfo {
    id_enrollment: number;
    volunteer_name: string;
    volunteer_email: string;
    volunteer_phone: string;
    enrollment_date: string;
    status: string;
    attendance_date?: string;
}

export interface ActivityStatisticsData {
    total_volunteers: number;
    attendance_rate: number;  
    cancellation_rate: number; 
    pending_confirmations: number; 
}
