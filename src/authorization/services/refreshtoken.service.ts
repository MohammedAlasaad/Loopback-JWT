import { TokenService } from '@loopback/authentication';
import { inject, uuid } from '@loopback/core';
import { repository } from '@loopback/repository';
import { HttpErrors } from '@loopback/rest';
import { UserProfile } from '@loopback/security';
import { toJSON } from '@loopback/testlab';
import * as _ from 'lodash';
import { promisify } from 'util';
import {
  MyAuthBindings,
  RefreshTokenServiceBindings,
  TokenServiceConstants
} from '../keys';
import { TokenObject } from '../types';
import { RefreshToken, RefreshTokenRelations } from './../../models/refresh-token.model';
import { RefreshTokenRepository } from './../../repositories/refresh-token.repository';
import { UserRepository } from './../../repositories/user.repository';
import { MyUserProfile } from './../types';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class RefreshtokenService {
  constructor(
    @inject(RefreshTokenServiceBindings.REFRESH_SECRET) private refreshSecret: string,
    @inject(RefreshTokenServiceBindings.REFRESH_EXPIRES_IN) private refreshExpiresIn: string,
    @inject(RefreshTokenServiceBindings.REFRESH_ISSUER) private refreshIssure: string,
    @repository(RefreshTokenRepository) public refreshTokenRepository: RefreshTokenRepository,
    @repository(UserRepository) protected userRepository: UserRepository,
    @inject(MyAuthBindings.TOKEN_SERVICE) public jwtService: TokenService,
  ) { }
  /**
   * Generate a refresh token, bind it with the given user profile + access
   * token, then store them in backend.
   */
  async generateToken(
    userProfile: UserProfile,
    token: string,
  ): Promise<TokenObject> {

    const data = {
      token: uuid(),
    };
    const refreshToken = await signAsync(data, this.refreshSecret, {
      expiresIn: Number(this.refreshExpiresIn),
      issuer: this.refreshIssure,
    });
    const result = {
      accessToken: token,
      refreshToken: refreshToken,
      expiresIn: TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE
    };

    // TODO userProfile[securityId]
    if (userProfile.id) {

      var existingRefreshToken = await this.refreshTokenRepository.find({
        where: {
          user_id: parseInt(userProfile.id)
        }
      })

      // add 2 hours to now date, maybe bug in loopback-mysql?
      var now = new Date();
      now = new Date(now.setHours(now.getHours() + 2))
      var dateString = now.toString()

      if (existingRefreshToken && existingRefreshToken.length > 0 && existingRefreshToken[0].id) {
        this.refreshTokenRepository.updateById(existingRefreshToken[0].id, {
          user_id: parseInt(userProfile.id),
          refresh_token: result.refreshToken,
        })
      } else {
        await this.refreshTokenRepository.create({
          user_id: parseInt(userProfile.id),
          created_at: dateString,
          refresh_token: result.refreshToken,
        });
      }

    }

    return result;
  }

  /*
   * Refresh the access token bound with the given refresh token.
   */
  async refreshToken(refreshToken: string): Promise<TokenObject> {
    try {
      if (!refreshToken) {
        throw new HttpErrors.Unauthorized(
          `Error verifying token : 'refresh token' is null`,
        );
      }

      const userRefreshData = await this.verifyToken(refreshToken);

      const user = await this.userRepository.findById(userRefreshData.user_id)

      const userProfile: MyUserProfile = _.pick(toJSON(user), ['id', 'email', 'first_name', 'last_name', 'permissions']) as MyUserProfile;

      // create a JSON Web Token based on the user profile
      const token = await this.jwtService.generateToken(userProfile);

      // also create new refresh token
      const tokens = await this.generateToken(
        userProfile,
        token,
      );
      return tokens
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }
  }

  /*
   * [TODO] test and endpoint
   */
  async revokeToken(refreshToken: string) {
    try {
      await this.refreshTokenRepository.delete(
        new RefreshToken({ refresh_token: refreshToken }),
      );
    } catch (e) {
      // ignore
    }
  }

  /**
   * Verify the validity of a refresh token, and make sure it exists in backend.
   * @param refreshToken
   */
  async verifyToken(
    refreshToken: string,
  ): Promise<RefreshToken & RefreshTokenRelations> {
    try {
      await verifyAsync(refreshToken, this.refreshSecret);
      const userRefreshData = await this.refreshTokenRepository.findOne({
        where: { refresh_token: refreshToken },
      });


      if (!userRefreshData) {
        throw new HttpErrors.Unauthorized(
          `Error verifying token : Invalid Token`,
        );
      }
      return userRefreshData;
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }
  }
}
