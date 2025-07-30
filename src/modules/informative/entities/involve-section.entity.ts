import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('involve_sections')
export class InvolveSection {
  @PrimaryColumn()
  id: string = 'involve_section';

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  lastUpdated: Date;
}
