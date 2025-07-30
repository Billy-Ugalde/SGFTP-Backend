import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('section_descriptions')
export class SectionDescription {
  @PrimaryColumn()
  id: string; // e.g. "news_section", "events_section", etc.

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  lastUpdated: Date;
}
