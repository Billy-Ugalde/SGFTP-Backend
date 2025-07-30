import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('newsletter_sections')
export class NewsletterSection {
  @PrimaryColumn()
  id: string = 'newsletter_section';

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  privacyNote: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  lastUpdated: Date;
}
