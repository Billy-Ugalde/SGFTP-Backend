import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Activity } from '../../projects/entities/activity.entity';
import { ProjectStatus } from '../../projects/enums/project.enum';
import { TypeActivity, TypeFavorite, MetricType } from '../../projects/enums/activity.enum';

export interface PublicStats {
  waste_kg: number;
  beneficiaries: number;
  workshops: number;
  school_population: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async getPublicStats(): Promise<PublicStats> {
    const projectMetrics = await this.projectRepository
      .createQueryBuilder('project')
      .select('COALESCE(SUM(project.METRIC_TOTAL_WASTE_COLLECTED), 0)', 'waste_kg')
      .addSelect('COALESCE(SUM(project.METRIC_TOTAL_BENEFICIATED), 0)', 'beneficiaries')
      .where('project.Active = :active', { active: true })
      .andWhere('project.Status IN (:...statuses)', {
        statuses: [ProjectStatus.EXECUTION, ProjectStatus.FINISHED],
      })
      .getRawOne();

    const workshops = await this.activityRepository.count({
      where: {
        Type_activity: TypeActivity.WORKSHOP,
        Active: true,
      },
    });

    const schoolMetric = await this.activityRepository
      .createQueryBuilder('activity')
      .select('COALESCE(SUM(activity.Total_metric_value), 0)', 'school_population')
      .where('activity.IsFavorite = :favorite', { favorite: TypeFavorite.SCHOOL })
      .andWhere('activity.Metric_activity = :metric', { metric: MetricType.ATTENDANCE })
      .andWhere('activity.Active = :active', { active: true })
      .getRawOne();

    return {
      waste_kg: Number(projectMetrics?.waste_kg) || 0,
      beneficiaries: Number(projectMetrics?.beneficiaries) || 0,
      workshops,
      school_population: Number(schoolMetric?.school_population) || 0,
    };
  }
}
