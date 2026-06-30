import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

// Tentative stock holds during checkout. This story creates the table + the
// expiry-cleanup cron only; reserve/release logic is Epic 4 (checkout).
@Entity('inventory_reserves')
@Index('idx_inventory_reserves_product_id', ['productId'])
@Index('idx_inventory_reserves_session_id', ['sessionId'])
export class InventoryReserve {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'product_id' })
  productId!: number;

  @Column({ name: 'session_id' })
  sessionId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
