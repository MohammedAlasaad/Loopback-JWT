import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {JWTAuthenticationComponent, SECURITY_SCHEME_SPEC} from '@loopback/authentication-jwt';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MyAuthBindings, RefreshTokenConstants, RefreshTokenServiceBindings} from './authorization/keys';
import {JWTService} from './authorization/services/JWT.service';
import {RefreshtokenService} from './authorization/services/refreshtoken.service';
//import {MyUserService} from './authorization/services/user.service';
import {JWTStrategy} from './authorization/strategies/JWT.strategy';
import {UserPermissionsProvider} from './providers/user-permissions.provider';
import {MySequence} from './sequence';

export {ApplicationConfig};

export class AppApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Bind authentication component related elements
    this.component(AuthenticationComponent)

    this.addSecuritySpec();

    this.component(JWTAuthenticationComponent);


    // Keep this bind after this.component(JWTAuthenticationComponent)
    this.bind(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE).toClass(RefreshtokenService);
    this.bind(RefreshTokenServiceBindings.REFRESH_SECRET).to(RefreshTokenConstants.REFRESH_SECRET_VALUE)
    this.bind(RefreshTokenServiceBindings.REFRESH_ISSUER).to(RefreshTokenConstants.REFRESH_ISSUER_VALUE)
    this.bind(RefreshTokenServiceBindings.REFRESH_EXPIRES_IN).to(RefreshTokenConstants.REFRESH_EXPIRES_IN_VALUE)

    // Bind JWT & permission authentication strategy related elements
    registerAuthenticationStrategy(this as any, JWTStrategy);
    this.bind(MyAuthBindings.TOKEN_SERVICE).toClass(JWTService);
    this.bind(MyAuthBindings.USER_PERMISSIONS).toProvider(UserPermissionsProvider);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }

  // Add this function so that we can later test the
  // JWT authentication using API Explorer
  addSecuritySpec(): void {
    this.api({
      openapi: '3.0.0',
      info: {
        title: 'JWT Test',
        version: '1.0.0',
      },
      paths: {},
      components: {securitySchemes: SECURITY_SCHEME_SPEC},
      security: [
        {
          // secure all endpoints with 'jwt'
          jwt: [],
        },
      ],
      servers: [{url: '/'}],
    });
  }

}
