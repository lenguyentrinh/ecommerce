import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Linen Shirt',
    description: 'A shirt',
    price: 189000,
    stockQuantity: 5,
    category: 'Tops',
    imageKeys: ['tops-1.svg', 'tops-2.svg'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as Product;
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 10,
    userId: 1,
    productId: 1,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as CartItem;
}

describe('CartService', () => {
  let service: CartService;
  let cartRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let productRepo: { find: jest.Mock; findOne: jest.Mock };
  let manager: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: typeof manager;
  };
  let dataSource: { createQueryRunner: jest.Mock };

  beforeEach(async () => {
    cartRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn((x: unknown) => Promise.resolve(x)),
      remove: jest.fn((x: unknown) => Promise.resolve(x)),
    };
    productRepo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() };
    manager = {
      findOne: jest.fn(),
      create: jest.fn((_entity: unknown, data: unknown) => data),
      save: jest.fn((x: unknown) => Promise.resolve(x)),
    };
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager,
    };
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(CartItem), useValue: cartRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: DataSource, useValue: dataSource },
        {
          provide: ConfigService,
          useValue: { get: () => '/images/placeholders' },
        },
      ],
    }).compile();

    service = module.get(CartService);
  });

  // Route manager.findOne by the entity class it's called with.
  function routeManagerFindOne(
    product: Product | null,
    cartItem: CartItem | null,
  ) {
    manager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === Product ? product : cartItem),
    );
  }

  describe('getCart', () => {
    it('returns an empty cart with subtotal 0 when there are no items', async () => {
      cartRepo.find.mockResolvedValue([]);
      const result = await service.getCart(1);
      expect(result).toEqual({ items: [], subtotal: 0 });
    });

    it('computes subtotal and a read-time imageUrl', async () => {
      cartRepo.find.mockResolvedValue([makeCartItem({ id: 10, quantity: 2 })]);
      productRepo.find.mockResolvedValue([makeProduct({ price: 189000 })]);

      const result = await service.getCart(1);

      expect(result.subtotal).toBe(378000);
      expect(result.items).toHaveLength(1);
      // The cart_items row id is exposed so the frontend can target
      // PATCH/DELETE /api/cart/:itemId.
      expect(result.items[0].id).toBe(10);
      expect(result.items[0].product.id).toBe(1);
      expect(result.items[0].product.imageUrl).toBe(
        '/images/placeholders/tops-1.svg',
      );
      expect(result.items[0].product.stockQuantity).toBe(5);
      expect(result.items[0].quantity).toBe(2);
    });
  });

  describe('addItem', () => {
    it('creates a new line within stock and commits', async () => {
      routeManagerFindOne(makeProduct({ stockQuantity: 5 }), null);

      await service.addItem(1, { productId: 1, quantity: 2 });

      expect(manager.create).toHaveBeenCalledWith(CartItem, {
        userId: 1,
        productId: 1,
        quantity: 2,
      });
      expect(manager.save).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('increments an existing line', async () => {
      routeManagerFindOne(
        makeProduct({ stockQuantity: 10 }),
        makeCartItem({ quantity: 3 }),
      );

      await service.addItem(1, { productId: 1, quantity: 2 });

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5 }),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('rejects when the resulting quantity exceeds stock and rolls back', async () => {
      routeManagerFindOne(
        makeProduct({ stockQuantity: 5 }),
        makeCartItem({ quantity: 4 }),
      );

      await expect(
        service.addItem(1, { productId: 1, quantity: 2 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('throws NotFound for a missing/inactive product and rolls back', async () => {
      routeManagerFindOne(null, null);

      await expect(
        service.addItem(1, { productId: 999, quantity: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('removes the item when quantity is 0', async () => {
      cartRepo.findOne.mockResolvedValue(makeCartItem({ id: 10, userId: 1 }));

      await service.updateItem(1, 10, { quantity: 0 });

      expect(cartRepo.remove).toHaveBeenCalled();
    });

    it('rejects when the new quantity exceeds stock', async () => {
      cartRepo.findOne.mockResolvedValue(makeCartItem({ id: 10, userId: 1 }));
      productRepo.findOne.mockResolvedValue(makeProduct({ stockQuantity: 3 }));

      await expect(
        service.updateItem(1, 10, { quantity: 5 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound for another user’s item (no leakage)', async () => {
      cartRepo.findOne.mockResolvedValue(makeCartItem({ id: 10, userId: 999 }));

      await expect(
        service.updateItem(1, 10, { quantity: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('removes an owned item', async () => {
      cartRepo.findOne.mockResolvedValue(makeCartItem({ id: 10, userId: 1 }));
      await service.removeItem(1, 10);
      expect(cartRepo.remove).toHaveBeenCalled();
    });

    it('throws NotFound for another user’s item', async () => {
      cartRepo.findOne.mockResolvedValue(makeCartItem({ id: 10, userId: 999 }));
      await expect(service.removeItem(1, 10)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
