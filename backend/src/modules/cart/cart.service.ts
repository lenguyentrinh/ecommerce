import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import AddCartItemDto from './dto/add-cart-item.dto';
import UpdateCartItemDto from './dto/update-cart-item.dto';

export interface CartLine {
  // The cart_items row id — the frontend needs this to target
  // PATCH/DELETE /api/cart/:itemId (NOT the product id below).
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string | null;
    stockQuantity: number;
    isActive: boolean;
  };
  quantity: number;
}

export interface CartView {
  items: CartLine[];
  subtotal: number;
}

@Injectable()
export class CartService {
  private readonly imageBaseUrl: string;

  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.imageBaseUrl =
      this.configService.get<string>('PRODUCT_IMAGE_BASE_URL') ??
      '/images/placeholders';
  }

  // Read the authenticated user's cart. Returns items even when a product is
  // inactive or out of stock (incl. soft-deleted) so the UI can warn (Story 3.3).
  async getCart(userId: number): Promise<CartView> {
    const items = await this.cartItemRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });

    if (items.length === 0) {
      return { items: [], subtotal: 0 };
    }

    const productIds = items.map((i) => i.productId);
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      withDeleted: true,
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lines: CartLine[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = byId.get(item.productId);
      // FK is ON DELETE CASCADE, so a hard-deleted product removes its cart
      // rows; a missing product here means a data anomaly — skip defensively.
      if (!product) continue;

      const price = Number(product.price);
      subtotal += price * item.quantity;

      lines.push({
        id: item.id,
        product: {
          id: product.id,
          name: product.name,
          price,
          imageUrl: this.firstImageUrl(product.imageKeys),
          stockQuantity: product.stockQuantity,
          isActive: product.isActive,
        },
        quantity: item.quantity,
      });
    }

    return { items: lines, subtotal };
  }

  // Add a product to the cart (or increment an existing line). Wrapped in a
  // transaction so the stock check and the row upsert can't interleave with a
  // concurrent add and overbook (carry-forward from the 1.5 atomicity finding).
  async addItem(userId: number, dto: AddCartItemDto): Promise<CartView> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: dto.productId, isActive: true },
      });
      if (!product) {
        throw new NotFoundException(`Product ${dto.productId} not found`);
      }

      const existing = await queryRunner.manager.findOne(CartItem, {
        where: { userId, productId: dto.productId },
      });
      const targetQuantity = (existing?.quantity ?? 0) + dto.quantity;

      if (targetQuantity > product.stockQuantity) {
        throw new BadRequestException('Insufficient stock');
      }

      if (existing) {
        existing.quantity = targetQuantity;
        await queryRunner.manager.save(existing);
      } else {
        const item = queryRunner.manager.create(CartItem, {
          userId,
          productId: dto.productId,
          quantity: dto.quantity,
        });
        await queryRunner.manager.save(item);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw this.toHttpException(error);
    } finally {
      await queryRunner.release();
    }

    return this.getCart(userId);
  }

  // Update a cart line's quantity. quantity === 0 removes the line.
  async updateItem(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartView> {
    const item = await this.findOwnedItem(userId, itemId);

    try {
      if (dto.quantity === 0) {
        await this.cartItemRepository.remove(item);
        return this.getCart(userId);
      }

      const product = await this.productRepository.findOne({
        where: { id: item.productId },
        withDeleted: true,
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      if (dto.quantity > product.stockQuantity) {
        throw new BadRequestException('Insufficient stock');
      }

      item.quantity = dto.quantity;
      await this.cartItemRepository.save(item);
    } catch (error) {
      throw this.toHttpException(error);
    }

    return this.getCart(userId);
  }

  async removeItem(userId: number, itemId: number): Promise<CartView> {
    const item = await this.findOwnedItem(userId, itemId);
    try {
      await this.cartItemRepository.remove(item);
    } catch (error) {
      throw this.toHttpException(error);
    }
    return this.getCart(userId);
  }

  // Ownership check — never leak another user's rows (generic 404).
  private async findOwnedItem(
    userId: number,
    itemId: number,
  ): Promise<CartItem> {
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId },
    });
    if (!item || item.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }
    return item;
  }

  private firstImageUrl(keys: string[] | null | undefined): string | null {
    const first = keys?.[0];
    return first ? `${this.imageBaseUrl}/${first}` : null;
  }

  // Preserve HTTP exceptions; convert DB-level failures to a clean 400.
  private toHttpException(error: unknown): unknown {
    if (error instanceof HttpException) {
      return error;
    }
    if (error instanceof QueryFailedError) {
      return new BadRequestException('Cart operation failed');
    }
    return error;
  }
}
