import {AuthenticationBindings, AuthenticationMetadata} from '@loopback/authentication';
import {
  globalInterceptor,
  inject,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise
} from '@loopback/context';
import {Getter} from '@loopback/core';
import {HttpErrors, Request, RestBindings} from '@loopback/rest';
import {MyAuthBindings} from '../authorization/keys';
import {MyUserProfile, RequiredPermissions, UserPermissionsFn} from './../authorization/types';


/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@globalInterceptor('', {tags: {name: 'authorize'}})
export class AuthorizationInterceptor implements Provider<Interceptor> {

  constructor(
    @inject(AuthenticationBindings.METADATA) public metadata: AuthenticationMetadata[],
    @inject(MyAuthBindings.USER_PERMISSIONS) protected checkPermissons: UserPermissionsFn,
    @inject.getter(AuthenticationBindings.CURRENT_USER) public getCurrentUser: Getter<MyUserProfile>,
    @inject(RestBindings.Http.REQUEST) private request: Request,
  ) {

  }

  /**
   * This method is used by LoopBack context to produce an interceptor function
   * for the binding.
   *
   * @returns An interceptor function
   */
  value() {
    return this.intercept.bind(this);
  }

  /**
   * The logic to intercept an invocation
   * @param invocationCtx - Invocation context
   * @param next - A function to invoke next interceptor or the target method
   */
  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {

    if (!this.metadata || !this.metadata.length) return await next();

    const requiredPermissions = this.metadata[0].options as RequiredPermissions;

    const user = await this.getCurrentUser();

    var permission = this.checkPermissons(user.permissions, requiredPermissions)
    if (!permission) {
      throw new HttpErrors.Forbidden('INVALID_ACCESS_PERMISSION');
    }

    return await next();
  }
}
