import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CartService } from './cart.service';
import type { User } from '../users/entities/user.entity';
import AddCartItemDto from './dto/add-cart-item.dto';
import UpdateCartItemDto from './dto/update-cart-item.dto';

@ApiTags('cart')
// NOTE: controller-level `api/` prefix is intentional. The app has NO global
// `/api` prefix (adding one would break the already-shipped `/auth/*` routes).
// Mirrors ProductsController. See story 3.1 / 2.1 dev notes.
@Controller('api/cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private currentUser(req: Request): User {
    // The JWT strategy attaches the full user entity to req.user.
    return (req as Request & { user: User }).user;
  }

  @Get()
  getCart(@Req() req: Request) {
    return this.cartService.getCart(this.currentUser(req).id);
  }

  @Post()
  addItem(@Req() req: Request, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(this.currentUser(req).id, dto);
  }

  @Patch(':itemId')
  updateItem(
    @Req() req: Request,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(this.currentUser(req).id, itemId, dto);
  }

  @Delete(':itemId')
  removeItem(
    @Req() req: Request,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartService.removeItem(this.currentUser(req).id, itemId);
  }
}
