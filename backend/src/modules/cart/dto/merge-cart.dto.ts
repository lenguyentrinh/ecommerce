import { IsArray, IsInt, IsPositive, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MergeCartItem {
  @Type(() => Number)
  @IsInt({ message: 'productId must be an integer' })
  @IsPositive({ message: 'productId must be a positive integer' })
  productId!: number;

  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @IsPositive({ message: 'quantity must be at least 1' })
  quantity!: number;
}

export default class MergeCartDto {
  @IsArray({ message: 'items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => MergeCartItem)
  items!: MergeCartItem[];
}
