import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import type { JwtFromRequestFunction } from 'passport-jwt';
import { Strategy } from 'passport-jwt';
import { UserService } from 'src/modules/users/user.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/entities/user-role.enum';

interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

const jwtFromHeader: JwtFromRequestFunction = (req: Request | undefined) => {
  if (!req) return null;

  const auth = req.headers.authorization;
  if (!auth || typeof auth !== 'string') {
    return null;
  }

  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const jwtFromCookieOrHeader: JwtFromRequestFunction = (
  req: Request | undefined,
) => {
  if (!req) return null;

  const cookieToken =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (req as any).cookies?.access_token ?? null;
  if (cookieToken) return cookieToken;

  return jwtFromHeader(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UserService,
    private readonly configService: ConfigService,
  ) {
    // ExtractJwt typings are too loose for our eslint setup, so we use a custom extractor instead.
    const options: {
      jwtFromRequest: JwtFromRequestFunction;
      ignoreExpiration: boolean;
      secretOrKey: string;
    } = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: jwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(options);
  }

  async validate(payload: JwtPayload) {
    return this.usersService.findById(payload.sub);
  }
}
