import { AuthenticateFn, AuthenticationBindings } from '@loopback/authentication';
import { inject } from '@loopback/core';
import {
    ExpressRequestHandler, FindRoute,
    HttpErrors,
    InvokeMethod,
    InvokeMiddleware,
    ParseParams,
    Reject,
    RequestContext,
    RestBindings,
    Send,
    SequenceHandler
} from '@loopback/rest';
import { TokenServiceConstants } from './authorization/keys';
var swStats = require('swagger-stats');


// Add swagger-stats to middleware
const middlewareList: ExpressRequestHandler[] = [
    swStats.getMiddleware({
        uriPath: '/ams-api-stats',
    })
];

const SequenceActions = RestBindings.SequenceActions;

export class MySequence implements SequenceHandler {
    /**
     * Optional invoker for registered middleware in a chain.
     * To be injected via SequenceActions.INVOKE_MIDDLEWARE.
     */
    @inject(SequenceActions.INVOKE_MIDDLEWARE, { optional: true })
    protected invokeMiddleware: InvokeMiddleware = () => false;

    constructor(
        @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
        @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
        @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
        @inject(SequenceActions.SEND) public send: Send,
        @inject(SequenceActions.REJECT) public reject: Reject,
        @inject(AuthenticationBindings.AUTH_ACTION) protected authenticateRequest: AuthenticateFn
    ) { }

    async handle(context: RequestContext) {
        try {
            const { request, response } = context;
            const finished = await this.invokeMiddleware(context);
            if (finished) return;
            const finishedMiddleware = await this.invokeMiddleware(context, middlewareList);
            if (finishedMiddleware) return;

            const route = this.findRoute(request);
            const args = await this.parseParams(request, route);

            //add authentication actions
            await this.authenticateRequest(request);

            const result = await this.invoke(route, args);
            this.send(response, result);

        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new HttpErrors.Unauthorized(TokenServiceConstants.TOKEN_EXPIRED)
            }

            if (err.code === 'AUTHENTICATION_STRATEGY_NOT_FOUND' ||
                err.code === 'USER_PROFILE_NOT_FOUND') {
                Object.assign(err, { statusCode: 401 /* Unauthorized */ });
            }
            this.reject(context, err);
        }
    }
}
