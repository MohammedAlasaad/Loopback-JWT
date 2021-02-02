import {belongsTo, Entity, model, property} from '@loopback/repository';
import {User} from '.';

@model({name: 'refresh_token'})
export class RefreshToken extends Entity {
  @property({
    type: 'number',
    id: 1,
    generated: true,
  })
  id: number;

  @belongsTo(() => User, {keyFrom: 'user_id'}, {name: 'user_id'})
  userId: number;

  @property({
    type: 'string',
    required: true,
    name: 'refresh_token',
  })
  refreshToken: string;

  @property({
    type: 'date',
  })
  created_at?: string;

  @property({
    type: 'date',
  })
  updated_at?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<RefreshToken>) {
    super(data);
  }
}

export interface RefreshTokenRelations {
  // describe navigational properties here
}

export type RefereshTokenWithRelations = RefreshToken & RefreshTokenRelations;
