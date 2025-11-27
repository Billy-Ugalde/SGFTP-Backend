import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from 'typeorm';

export enum NewsStatus {
    PUBLISHED = 'published',
    DRAFT = 'draft',
    ARCHIVED = 'archived'
}

@Entity('news')
export class News {
    @PrimaryGeneratedColumn()
    id_news: number;  

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    content: string;            

    @Column({ type: 'varchar', length: 255,nullable: true })
    image_url?: string;   

    @Column({ type: 'date', default: () => '(CURDATE())' })
    publicationDate: Date;

    @Column({ type: 'varchar', length: 255 })
    author: string; 

    @Column({ type: 'enum',
            enum: NewsStatus,
            default: NewsStatus.DRAFT })
    status: NewsStatus;

    @CreateDateColumn()
    createdAt: Date;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
        name: 'last_updated'
    })
    lastUpdated: Date;
}