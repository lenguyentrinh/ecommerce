import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from '../../../common/utils/column-numeric.transformer';

@Entity('products')
@Index('idx_products_category', ['category'])
@Index('idx_products_isActive', ['isActive'])
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  price!: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity!: number;

  @Column()
  category!: string;

  /**
   * Storage object keys only (e.g. "dresses-1.svg") — NEVER full URLs.
   * Public URLs are generated at read time in ProductsService.
   */
  @Column({ type: 'json' })
  imageKeys!: string[];

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
