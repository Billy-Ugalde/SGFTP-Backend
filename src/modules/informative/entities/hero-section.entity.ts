import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('hero_section')
export class HeroSection {
  @PrimaryColumn()
  id: string = 'hero';

  @Column()
  title: string;

  @Column()
  subtitle: string;

  @Column()
  description: string;

  @Column()
  backgroundImage: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  lastUpdated: Date;
}
