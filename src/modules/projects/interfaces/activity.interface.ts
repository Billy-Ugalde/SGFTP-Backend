import { ActivityStatusDto } from "../dto/activityStatus.dto";
import { CreateActivityDto } from "../dto/createActivity.dto";
import { UpdateActivityDto } from "../dto/updateActivity.dto";
import { Activity } from "../entities/activity.entity";


export interface IActivityService {
  createActivity(createActivityDto: CreateActivityDto, image?: Express.Multer.File): Promise<Activity>;
  updateActivity(id_activity: number,
    updateActivityDto: UpdateActivityDto, images?: Express.Multer.File[]): Promise<Activity>;
  getbyIdActivity(id_activity: number): Promise<Activity>
  getAllActivities();
  statusActivity(id_activity: number, activityStatusDto: ActivityStatusDto);
}