import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('value_proposition')
export class ValueProposition {
  @PrimaryColumn()
  id: string = 'value_proposition';

  @Column()
  sectionTitle: string;

  @Column()
  missionTitle: string;

  @Column()
  missionContent: string;

  @Column()
  visionTitle: string;

  @Column()
  visionContent: string;

  @Column()
  impactTitle: string;

  @Column("simple-array")
  impactTags: string[];

  @Column()
  dimensionsTitle: string;

  @Column("simple-array")
  dimensionsTags: string[];

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  lastUpdated: Date;
}
