import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('products')
// NOTE: controller-level `api/` prefix is intentional. The app has NO global
// `/api` prefix (adding one would break the already-shipped `/auth/*` routes
// that the frontend calls directly). See story 2.1 dev notes.
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  // MUST be declared before ':id' so "categories" is not captured as an id.
  @Get('categories')
  async getCategories() {
    return { data: await this.productsService.getCategories() };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.productsService.findOne(id) };
  }
}
