import {Provider} from '@loopback/context';
import {intersection} from 'lodash';
import {PermissionKey} from '../authorization/permission-key';
import {RequiredPermissions, UserPermissionsFn} from './../authorization/types';

export class UserPermissionsProvider implements Provider<UserPermissionsFn> {
  constructor() {}

  value(): UserPermissionsFn {
    return (userPermissions: PermissionKey[], requiredPermissions: RequiredPermissions) =>
      this.action(userPermissions, requiredPermissions);
  }

  action(
    userPermissions: PermissionKey[],
    requiredPermissions: RequiredPermissions,
  ): boolean {
    return intersection(userPermissions, requiredPermissions.required).length
      === requiredPermissions.required.length;
  }
}
