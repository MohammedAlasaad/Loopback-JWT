import { belongsTo, Entity, hasMany, model, property } from '@loopback/repository';
import { PermissionKey } from '../authorization/permission-key';
import { Permission } from './permission.model';

@model({ name: 'user' })
export class User extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  email?: string;

  @property({
    type: 'string',
  })
  first_name?: string;

  @property({
    type: 'string',
  })
  last_name?: string;

  @property({
    type: 'string',
    required: true,
  })
  password?: string;

  @property({
    type: 'boolean',
    required: true,
  })
  status?: boolean;

  @belongsTo(() => Permission, { name: 'permission' })
  permission_id: number;

  @property.array(String)
  permissions: PermissionKey[]

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
