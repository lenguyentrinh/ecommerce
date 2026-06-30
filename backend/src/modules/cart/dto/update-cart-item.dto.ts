import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export default class UpdateCartItemDto {
  // 0 is allowed and means "remove the item" (see AC5).
  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(0, { message: 'quantity must not be negative' })
  @Max(99, { message: 'quantity must not exceed 99' })
  quantity!: number;
}
