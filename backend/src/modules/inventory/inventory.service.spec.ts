import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryReserve } from './entities/inventory-reserve.entity';

describe('InventoryService', () => {
  let service: InventoryService;
  let repo: { delete: jest.Mock };

  beforeEach(async () => {
    repo = { delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(InventoryReserve), useValue: repo },
      ],
    }).compile();

    service = module.get(InventoryService);
  });

  describe('releaseExpired', () => {
    it('deletes reserves whose expiresAt is in the past and returns the count', async () => {
      repo.delete.mockResolvedValue({ affected: 3, raw: [] });

      const removed = await service.releaseExpired();

      expect(removed).toBe(3);
      expect(repo.delete).toHaveBeenCalledTimes(1);
    });

    it('returns 0 (no throw) when the delete fails', async () => {
      repo.delete.mockRejectedValue(new Error('db down'));
      const removed = await service.releaseExpired();
      expect(removed).toBe(0);
    });

    it('returns 0 when nothing was affected', async () => {
      repo.delete.mockResolvedValue({ affected: 0, raw: [] });
      const removed = await service.releaseExpired();
      expect(removed).toBe(0);
    });
  });
});
