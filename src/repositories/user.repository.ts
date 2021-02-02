import { DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory } from '@loopback/repository';
import { User, UserRelations, Permission } from '../models';
import { DbDataSource } from '../datasources';
import { inject, Getter } from '@loopback/core';
import { PermissionRepository } from './permission.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
  > {

  public readonly permission: BelongsToAccessor<Permission, typeof User.prototype.id>;



  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @repository.getter('PermissionRepository') protected permissionRepositoryGetter: Getter<PermissionRepository>,
  ) {
    super(User, dataSource);

    this.permission = this.createBelongsToAccessorFor('permission', permissionRepositoryGetter,);
    this.registerInclusionResolver('permission', this.permission.inclusionResolver);
  }
}
