import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductQueryDto, ProductSort } from './dto/product-query.dto';

export type ProductResponse = Product & { imageUrls: string[] };

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

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true });

    if (category) {
      qb.andWhere('product.category = :category', { category });
    }

    if (search) {
      qb.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search)',
        { search: `%${search}%` },
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

  /** Generate public image URLs at read time — keys are never stored as URLs. */
  private toResponse(product: Product): ProductResponse {
    const keys = product.imageKeys ?? [];
    return {
      ...product,
      imageUrls: keys.map((key) => `${this.imageBaseUrl}/${key}`),
    };
  }
}
