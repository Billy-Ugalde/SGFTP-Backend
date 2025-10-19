import {
    Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne,
    PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import { Activity } from "./activity.entity";
import { DateActivity } from "./date.entity";

@Entity()

export class Metric_value {
    @PrimaryGeneratedColumn()
    Id_activity_value: number;

    @CreateDateColumn()
    Registration_date: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

    @Column({ type: 'int', default: 0 })
    Value: number;

    @ManyToOne(() => Activity, (activity) => activity.metric_value)
    @JoinColumn({ name: 'Id_activity' })
    activity: Activity;

    @ManyToOne(() => DateActivity, { nullable: true })
    @JoinColumn({ name: 'Id_date_activity' })
    dateActivity: DateActivity;
}