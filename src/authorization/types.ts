//import {UserProfile} from '@loopback/authentication';
import {SchemaObject} from '@loopback/openapi-v3';
import {UserProfile} from '@loopback/security';
import {PermissionKey} from './permission-key';

export interface UserPermissionsFn {
  (
    userPermissions: PermissionKey[],
    requiredPermissions: RequiredPermissions,
  ): boolean;
}

export interface MyUserProfile extends UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  permissions: PermissionKey[]
}

export interface RequiredPermissions {
  required: PermissionKey[];
}

/**
 * Describes the token object that returned by the refresh token service functions.
 */
export type TokenObject = {
  accessToken: string;
  expiresIn?: string | undefined;
  refreshToken?: string | undefined;
};

/**
 * The token refresh service. An access token expires in limited time. Therefore
 * token refresh service is needed to keep replacing the old access token with
 * a new one periodically.
 */
export interface RefreshTokenService {
  /**
   * Generate a refresh token, bind it with the given user profile + access
   * token, then store them in backend.
   */
  generateToken(userProfile: UserProfile, token: string): Promise<TokenObject>;

  /**
   * Refresh the access token bound with the given refresh token.
   */

  refreshToken(refreshToken: string): Promise<TokenObject>;
}

export const UserProfileSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password', 'first_name', 'last_name'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 10,
    },
    first_name: {type: 'string'},
    last_name: {type: 'string'},
  },
};

export const UserRequestBody = {
  description: 'The input of create user function',
  required: true,
  content: {
    'application/json': {schema: UserProfileSchema},
  },
};

export interface Credential {
  email: string;
  password: string;
  permissions: PermissionKey[];
}

export const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};
