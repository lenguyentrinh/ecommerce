import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductQueryDto, ProductSort } from './dto/product-query.dto';

// Public product shape: internal flags (`isActive`, `deletedAt`) are stripped
// at read time — they are constant for returned rows and not part of the API.
export type ProductResponse = Omit<Product, 'isActive' | 'deletedAt'> & {
  imageUrls: string[];
};

export interface PaginatedProducts {
  data: ProductResponse[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ProductsService {
  private readonly imageBaseUrl: string;

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly configService: ConfigService,
  ) {
    this.imageBaseUrl =
      this.configService.get<string>('PRODUCT_IMAGE_BASE_URL') ??
      '/images/placeholders';
  }

  async findAll(query: ProductQueryDto): Promise<PaginatedProducts> {
    const { category, search, minPrice, maxPrice, inStock, sort, page, limit } =
      query;

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException(
        'minPrice must not be greater than maxPrice',
      );
    }

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true });

    if (category) {
      qb.andWhere('product.category = :category', { category });
    }

    if (search) {
      // Escape LIKE wildcards so user input is matched literally (default
      // MySQL escape char is backslash); otherwise a lone `%` matches all rows.
      const escaped = search.replace(/[\\%_]/g, (ch) => `\\${ch}`);
      qb.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search)',
        { search: `%${escaped}%` },
      );
    }

    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (inStock) {
      qb.andWhere('product.stockQuantity > 0');
    }

    this.applySort(qb, sort);

    qb.skip((page - 1) * limit).take(limit);

    const [products, total] = await qb.getManyAndCount();

    return {
      data: products.map((p) => this.toResponse(p)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<ProductResponse> {
    const product = await this.productsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return this.toResponse(product);
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.productsRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true })
      .orderBy('product.category', 'ASC')
      .getRawMany<{ category: string }>();

    return rows.map((r) => r.category);
  }

  private applySort(
    qb: ReturnType<Repository<Product>['createQueryBuilder']>,
    sort?: ProductSort,
  ): void {
    switch (sort) {
      case ProductSort.PRICE_ASC:
        qb.orderBy('product.price', 'ASC');
        break;
      case ProductSort.PRICE_DESC:
        qb.orderBy('product.price', 'DESC');
        break;
      // TODO(epic-4): real popularity sort once order/sales data exists.
      // Until then popularity falls back to newest-first.
      case ProductSort.POPULARITY:
      case ProductSort.NEWEST:
      default:
        qb.orderBy('product.createdAt', 'DESC');
        break;
    }
  }

  /**
   * Generate public image URLs at read time — keys are never stored as URLs.
   * Internal flags (`isActive`, `deletedAt`) are intentionally not exposed.
   */
  private toResponse(product: Product): ProductResponse {
    const keys = product.imageKeys ?? [];
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      category: product.category,
      imageKeys: product.imageKeys,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      imageUrls: keys.map((key) => `${this.imageBaseUrl}/${key}`),
    };
  }
}
