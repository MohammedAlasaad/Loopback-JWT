import { TokenService } from '@loopback/authentication';
import { BindingKey } from '@loopback/context';
import { RefreshTokenService, UserPermissionsFn } from './types';

/**
 * Binding keys used by this component.
 */
export namespace MyAuthBindings {
  export const USER_PERMISSIONS = BindingKey.create<UserPermissionsFn>(
    'userAuthorization.actions.userPermissions',
  );

  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

export namespace TokenServiceConstants {
  export const TOKEN_SECRET_VALUE = process.env.ACCESS_TOKEN ?? '';
  export const TOKEN_EXPIRES_IN_VALUE = '900000'; // use default millisecond format for consistency (900 000 = 15 minutes)
  export const TOKEN_EXPIRED = 'TOKEN_EXPIRED';
}

/**
 * Constant values used when generating refresh token.
 */
export namespace RefreshTokenConstants {
  export const REFRESH_SECRET_VALUE = process.env.REFRESH_TOKEN ?? '';
  export const REFRESH_EXPIRES_IN_VALUE = '2629743'; // 1 month in seconds
  export const REFRESH_ISSUER_VALUE = 'JWT_test';
}

/**
 * Bindings related to token refresh service. The omitted explanation can be
 * found in namespace `RefreshTokenConstants`.
 */
export namespace RefreshTokenServiceBindings {
  export const REFRESH_TOKEN_SERVICE = BindingKey.create<RefreshTokenService>(
    'services.authentication.jwt.refresh.tokenservice',
  );
  export const REFRESH_SECRET = BindingKey.create<string>(
    'authentication.jwt.refresh.secret',
  );
  export const REFRESH_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.refresh.expires.in.seconds',
  );
  export const REFRESH_ISSUER = BindingKey.create<string>(
    'authentication.jwt.refresh.issuer',
  );

}
