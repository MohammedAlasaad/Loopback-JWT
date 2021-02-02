import {Entity, hasMany, model, property} from '@loopback/repository';
import {User} from './user.model';

@model({name: 'permission'})
export class Permission extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  level: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @hasMany(() => User, {keyTo: 'permission_id'})
  users: User[];

  constructor(data?: Partial<Permission>) {
    super(data);
  }
}

export interface PermissionRelations {
  // describe navigational properties here
}

export type PermissionWithRelations = Permission & PermissionRelations;
