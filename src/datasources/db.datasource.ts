import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

/**
 * DB schema, updated 2020-08-27:
 * https://dbdiagram.io/d/5ef9a79e0425da461f03fdcd
 */

var config = {}
if (process.env.NODE_ENV === 'development') {
  config = {
    name: 'DB',
    connector: 'mysql',
    url: '',
    host: 'localhost',
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'ams'
  };
} else if (process.env.NODE_ENV === 'production') {
  config = {
    name: 'DB',
    connector: 'mysql',
    url: '',
    host: 'localhost',
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'ams'
  };
} else {
  config = {
    name: 'DB',
    connector: 'mysql',
    url: '',
    host: '',
    port: 0,
    user: 'root',
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD : '',
    database: 'ams'
  };
}

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class DbDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'DB';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.DB', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
