import {TokenService} from '@loopback/authentication';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId} from '@loopback/security';
import {promisify} from 'util';
import {TokenServiceConstants} from '../keys';
import {UserRepository} from './../../repositories/user.repository';
import {MyUserProfile} from './../types';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTService implements TokenService {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) { }

  async verifyToken(token: string): Promise<MyUserProfile> {

    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : 'token' is null`,
      );
    }

    const decryptedToken = await verifyAsync(token, TokenServiceConstants.TOKEN_SECRET_VALUE);
    var userProfile: MyUserProfile = Object.assign(
      {id: '', [securityId]: '', first_name: '', last_name: '', email: '', permissions: []},
      {
        [securityId]: decryptedToken.id,
        id: decryptedToken.id,
        first_name: decryptedToken.first_name,
        last_name: decryptedToken.last_name,
        email: decryptedToken.email,
        permissions: decryptedToken.permissions
      }
    )

    return userProfile;
  }

  async generateToken(userProfile: MyUserProfile): Promise<string> {
    const token = await signAsync(userProfile, TokenServiceConstants.TOKEN_SECRET_VALUE, {
      expiresIn: TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE,
    });

    return token;
  }
}
