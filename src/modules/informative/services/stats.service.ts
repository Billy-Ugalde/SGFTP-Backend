import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Activity } from '../../projects/entities/activity.entity';
import { Volunteer } from '../../volunteers/entities/volunteer.entity';
import { Donor } from '../../donations/entities/donor.entity';
import { User } from '../../users/entities/user.entity';
import { Entrepreneur } from '../../entrepreneurs/entities/entrepreneur.entity';
import { ProjectStatus } from '../../projects/enums/project.enum';
import { TypeActivity, TypeFavorite, MetricType } from '../../projects/enums/activity.enum';

export interface PublicStats {
  waste_kg: number;
  beneficiaries: number;
  workshops: number;
  school_population: number;
  trees_planted: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Volunteer)
    private readonly volunteerRepository: Repository<Volunteer>,
    @InjectRepository(Donor)
    private readonly donorRepository: Repository<Donor>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Entrepreneur)
    private readonly entrepreneurRepository: Repository<Entrepreneur>,
  ) {}

  async getPublicStats(): Promise<PublicStats> {
    // ── Reciclaje: kg recolectados sumados desde proyectos activos ────────
    const projectMetrics = await this.projectRepository
      .createQueryBuilder('project')
      .select('COALESCE(SUM(project.METRIC_TOTAL_WASTE_COLLECTED), 0)', 'waste_kg')
      .where('project.Active = :active', { active: true })
      .andWhere('project.Status IN (:...statuses)', {
        statuses: [ProjectStatus.EXECUTION, ProjectStatus.FINISHED],
      })
      .getRawOne();

    // ── Talleres: total de actividades tipo workshop activas ──────────────
    const workshops = await this.activityRepository.count({
      where: {
        Type_activity: TypeActivity.WORKSHOP,
        Active: true,
      },
    });

    // ── Población estudiantil: asistencia en actividades de escuelas ──────
    const schoolMetric = await this.activityRepository
      .createQueryBuilder('activity')
      .select('COALESCE(SUM(activity.Total_metric_value), 0)', 'school_population')
      .where('activity.IsFavorite = :favorite', { favorite: TypeFavorite.SCHOOL })
      .andWhere('activity.Metric_activity = :metric', { metric: MetricType.ATTENDANCE })
      .andWhere('activity.Active = :active', { active: true })
      .getRawOne();

    // ── Árboles plantados: suma de Total_metric_value en actividades con
    //    métrica trees_planted ─────────────────────────────────────────────
    const treesMetric = await this.activityRepository
      .createQueryBuilder('activity')
      .select('COALESCE(SUM(activity.Total_metric_value), 0)', 'trees_planted')
      .where('activity.Metric_activity = :metric', { metric: MetricType.TREES_PLANTED })
      .andWhere('activity.Active = :active', { active: true })
      .getRawOne();

    // ── Personas involucradas: conteo de todas las personas en el sistema
    //    (voluntarios + donadores + usuarios admin + emprendedores) ─────────
    const [volunteers, donors, users, entrepreneurs] = await Promise.all([
      this.volunteerRepository.count(),
      this.donorRepository.count(),
      this.userRepository.count(),
      this.entrepreneurRepository.count(),
    ]);
    const beneficiaries = volunteers + donors + users + entrepreneurs;

    return {
      waste_kg:         Number(projectMetrics?.waste_kg)        || 0,
      workshops,
      school_population: Number(schoolMetric?.school_population) || 0,
      trees_planted:    Number(treesMetric?.trees_planted)       || 0,
      beneficiaries,
    };
  }
}
