import { IsInt, IsPositive, Max } from 'class-validator';
import { Type } from 'class-transformer';

export default class AddCartItemDto {
  @Type(() => Number)
  @IsInt({ message: 'productId must be an integer' })
  @IsPositive({ message: 'productId must be a positive integer' })
  productId!: number;

  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @IsPositive({ message: 'quantity must be at least 1' })
  @Max(99, { message: 'quantity must not exceed 99' })
  quantity!: number;
}
