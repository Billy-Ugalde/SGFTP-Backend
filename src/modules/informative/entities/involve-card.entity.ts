import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('involve_cards')
export class InvolveCard {
  @PrimaryColumn()
  id: string; // e.g. "volunteer", "donation", etc.

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  buttonText: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  lastUpdated: Date;
}
