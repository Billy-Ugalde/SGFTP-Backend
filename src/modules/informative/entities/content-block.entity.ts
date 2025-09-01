import { Entity, Column, Index ,PrimaryGeneratedColumn } from 'typeorm';
@Index(['page', 'section', 'block_key'], { unique: true })
@Entity('content_blocks')
export class ContentBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  page: string; // 'home', 'about', 'contact'

  @Column({ type: 'varchar', length: 100 })
  section: string; // 'hero', 'value_prop', 'involve_section'

  @Column({ type: 'varchar', length: 100 })
  block_key: string; // 'title', 'description', 'card_1', 'card_2'

  @Column({ type: 'text', nullable: true })
  text_content: string; // Para textos cortos o largos

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string; // Solo para imágenes cuando sean necesarias

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    name: 'last_updated'
  })
  lastUpdated: Date;
}