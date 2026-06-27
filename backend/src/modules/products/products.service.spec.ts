import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductQueryDto, ProductSort } from './dto/product-query.dto';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Test Product',
    description: 'A product',
    price: 100,
    stockQuantity: 5,
    category: 'Dresses',
    imageKeys: ['dresses-1.svg', 'dresses-2.svg'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('ProductsService', () => {
  let service: ProductsService;
  let qb: {
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    select: jest.Mock;
    getManyAndCount: jest.Mock;
    getRawMany: jest.Mock;
  };
  let repo: { createQueryBuilder: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getRawMany: jest.fn(),
    };
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repo },
        {
          provide: ConfigService,
          useValue: { get: () => '/images/placeholders' },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('returns a paginated payload and generates image URLs', async () => {
      qb.getManyAndCount.mockResolvedValue([[makeProduct()], 1]);
      const query: ProductQueryDto = { page: 2, limit: 10 };

      const result = await service.findAll(query);

      expect(result.total).toBe(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.data[0].imageUrls).toEqual([
        '/images/placeholders/dresses-1.svg',
        '/images/placeholders/dresses-2.svg',
      ]);
      // Always filters to active products.
      expect(qb.where).toHaveBeenCalledWith('product.isActive = :isActive', {
        isActive: true,
      });
      // Pagination offset = (page - 1) * limit.
      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('applies category, search, price and inStock filters', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        page: 1,
        limit: 12,
        category: 'Fashion',
        search: 'dress',
        minPrice: 50,
        maxPrice: 200,
        inStock: true,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('product.category = :category', {
        category: 'Fashion',
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(product.name LIKE :search OR product.description LIKE :search)',
        { search: '%dress%' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('product.price >= :minPrice', {
        minPrice: 50,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('product.price <= :maxPrice', {
        maxPrice: 200,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('product.stockQuantity > 0');
    });

    it.each([
      [ProductSort.PRICE_ASC, 'product.price', 'ASC'],
      [ProductSort.PRICE_DESC, 'product.price', 'DESC'],
      [ProductSort.NEWEST, 'product.createdAt', 'DESC'],
      [ProductSort.POPULARITY, 'product.createdAt', 'DESC'],
    ])('sorts by %s', async (sort, column, dir) => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ page: 1, limit: 12, sort });
      expect(qb.orderBy).toHaveBeenCalledWith(column, dir);
    });

    it('does not apply the stock filter when inStock is false', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ page: 1, limit: 12, inStock: false });
      expect(qb.andWhere).not.toHaveBeenCalledWith('product.stockQuantity > 0');
    });

    it('escapes LIKE wildcards in the search term', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ page: 1, limit: 12, search: '50%_off' });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(product.name LIKE :search OR product.description LIKE :search)',
        { search: '%50\\%\\_off%' },
      );
    });

    it('rejects an inverted price range without querying', async () => {
      await expect(
        service.findAll({ page: 1, limit: 12, minPrice: 200, maxPrice: 50 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('excludes internal flags (isActive, deletedAt) from responses', async () => {
      qb.getManyAndCount.mockResolvedValue([[makeProduct()], 1]);
      const result = await service.findAll({ page: 1, limit: 12 });
      expect(result.data[0]).not.toHaveProperty('isActive');
      expect(result.data[0]).not.toHaveProperty('deletedAt');
    });
  });

  describe('findOne', () => {
    it('returns an active product with image URLs', async () => {
      repo.findOne.mockResolvedValue(makeProduct({ id: 7 }));
      const result = await service.findOne(7);
      expect(result.id).toBe(7);
      expect(result.imageUrls[0]).toBe('/images/placeholders/dresses-1.svg');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 7, isActive: true },
      });
    });

    it('throws 404 when the product is missing or inactive', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getCategories', () => {
    it('returns distinct active category names', async () => {
      qb.getRawMany.mockResolvedValue([
        { category: 'Electronics' },
        { category: 'Fashion' },
        { category: 'Lifestyle' },
      ]);
      const result = await service.getCategories();
      expect(result).toEqual(['Electronics', 'Fashion', 'Lifestyle']);
      expect(qb.where).toHaveBeenCalledWith('product.isActive = :isActive', {
        isActive: true,
      });
    });
  });
});

describe('ProductQueryDto validation', () => {
  it('rejects a limit above the 100 cap', async () => {
    const dto = plainToInstance(ProductQueryDto, { limit: '500' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('accepts a limit at the cap and applies page/limit defaults', async () => {
    const capped = plainToInstance(ProductQueryDto, { limit: '100' });
    expect((await validate(capped)).length).toBe(0);

    const defaults = plainToInstance(ProductQueryDto, {});
    expect(defaults.page).toBe(1);
    expect(defaults.limit).toBe(12);
  });

  it('trims and drops empty/whitespace-only search and category', () => {
    const dto = plainToInstance(ProductQueryDto, {
      search: '  dress  ',
      category: '   ',
    });
    expect(dto.search).toBe('dress');
    expect(dto.category).toBeUndefined();
  });
});
