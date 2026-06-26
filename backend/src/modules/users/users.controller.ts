import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { UserService } from './user.service';
import type { User } from './entities/user.entity';
import UpdateProfileDto from './dto/update-profile.dto';
import CreateAddressDto from './dto/create-address.dto';

// Routes are UNPREFIXED (/users/...), mirroring the live /auth/* routes — the
// architecture's aspirational /api global prefix was never wired up.
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private userService: UserService) {}

  private currentUser(req: Request): User {
    // The JWT strategy attaches the full user entity to req.user (see auth me()).
    return (req as Request & { user: User }).user;
  }

  @Patch('profile')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(this.currentUser(req).id, dto);
  }

  @Get('addresses')
  async getAddresses(@Req() req: Request) {
    const data = await this.userService.getAddresses(this.currentUser(req).id);
    return { data };
  }

  @Post('addresses')
  addAddress(@Req() req: Request, @Body() dto: CreateAddressDto) {
    return this.userService.addAddress(this.currentUser(req).id, dto);
  }

  @Patch('addresses/:id/default')
  async setDefaultAddress(@Req() req: Request, @Param('id') id: string) {
    const data = await this.userService.setDefaultAddress(
      this.currentUser(req).id,
      +id,
    );
    return { data };
  }

  @Patch('addresses/:id')
  editAddress(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.userService.editAddress(this.currentUser(req).id, +id, dto);
  }

  @Delete('addresses/:id')
  removeAddress(@Req() req: Request, @Param('id') id: string) {
    return this.userService.removeAddress(this.currentUser(req).id, +id);
  }
}
