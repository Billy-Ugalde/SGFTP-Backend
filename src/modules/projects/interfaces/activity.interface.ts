import { ActivityStatusDto } from "../dto/activityStatus.dto";
import { CreateActivityDto } from "../dto/createActivity.dto";
import { UpdateActivityDto } from "../dto/updateActivity.dto";
import { Activity } from "../entities/activity.entity";



export type ActivityFiles = {
  url_1_file?: Express.Multer.File[],
  url_2_file?: Express.Multer.File[],
  url_3_file?: Express.Multer.File[],
  images?: Express.Multer.File[]
};

export interface IActivityService {
  createActivity(createActivityDto: CreateActivityDto, images?: Express.Multer.File[]): Promise<Activity>
  updateActivity(id_activity: number,
    updateActivityDto: UpdateActivityDto, files?: ActivityFiles): Promise<Activity>;
  getbyIdActivity(id_activity: number): Promise<Activity>
  getAllActivities();
  statusActivity(id_activity: number, activityStatusDto: ActivityStatusDto);
  updateActive(id_activity: number, active: boolean): Promise<Activity>;
}