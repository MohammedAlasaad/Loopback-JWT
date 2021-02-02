import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {RefreshToken, RefreshTokenRelations} from './../models/refresh-token.model';

export class RefreshTokenRepository extends DefaultCrudRepository<
  RefreshToken,
  typeof RefreshToken.prototype.id,
  RefreshTokenRelations
  > {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(RefreshToken, dataSource);
  }
}
