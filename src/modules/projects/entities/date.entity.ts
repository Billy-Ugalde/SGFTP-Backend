import { Activity } from "src/modules/projects/entities/activity.entity";
import {
    Column, Entity, JoinColumn, ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";

@Entity()
export class DateActivity {

    @PrimaryGeneratedColumn()
    Id_dateActivity: number;

    @Column({ type: 'datetime' })
    Start_date: Date;

    @Column({ type: 'datetime', nullable: true })
    End_date: Date;

    @ManyToOne(() => Activity, (activity) => activity.dateActivities, { nullable: false })
    @JoinColumn({ name: 'Id_activity' })
    activity: Activity;
}