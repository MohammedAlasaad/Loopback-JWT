import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { Getter, inject } from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param,
  patch, post,
  put,
  Request, requestBody,
  RestBindings,
  SchemaObject
} from '@loopback/rest';
import { toJSON } from '@loopback/testlab';
import { compareSync, genSalt, hash } from 'bcryptjs';
import * as _ from 'lodash';
import { MyAuthBindings, RefreshTokenServiceBindings, TokenServiceConstants } from '../authorization/keys';
import { PermissionKey } from '../authorization/permission-key';
import { User } from '../models';
import { UserRepository } from '../repositories';
import { JWTService } from './../authorization/services/JWT.service';
import { Credential, CredentialsRequestBody, MyUserProfile, RefreshTokenService, TokenObject, UserRequestBody } from './../authorization/types';


// Describes the type of grant object taken in by method "refresh"
type RefreshGrant = {
  refreshToken: string;
};

// Describes the schema of grant object
const RefreshGrantSchema: SchemaObject = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: {
      type: 'string',
    },
  },
};

// Describes the request body of grant object
const RefreshGrantRequestBody = {
  description: 'Reissuing Acess Token',
  required: true,
  content: {
    'application/json': { schema: RefreshGrantSchema },
  },
};

const NewUserRequestSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email'
    },
    password: {
      type: 'string',
      minLength: 8,
    },
    first_name: {
      type: 'string',
    },
    last_name: {
      type: 'string',
    }
  },
};

export const NewUserRequestBody = {
  description: 'Create new user',
  required: true,
  content: {
    'application/json': { schema: NewUserRequestSchema },
  },
};

export type NewUserRequest = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
};

@authenticate({ strategy: 'jwt', options: { required: [PermissionKey.SuperUser] } })
export class UserController {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @inject(MyAuthBindings.TOKEN_SERVICE) public jwtService: JWTService,
    @inject.getter(AuthenticationBindings.CURRENT_USER) public getCurrentUser: Getter<MyUserProfile>,
    @inject(RestBindings.Http.REQUEST) private request: Request,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE) public refreshService: RefreshTokenService,
  ) { }

  /**
     * A login function that returns refresh token and access token.
     * @param credentials User email and password
     */
  @post('/user/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                },
                refreshToken: {
                  type: 'string',
                },
                expiresIn: {
                  type: 'string',
                }
              },
            },
          },
        },
      },
    },
  })
  @authenticate.skip() // this endpoint is accessible for everyone
  async refreshLogin(
    @requestBody(CredentialsRequestBody) credentials: Credential,
  ): Promise<TokenObject> {
    // ensure the user exists, and the password is correct

    const foundUser = await this.userRepository.findOne({
      where: { email: credentials.email },
    });
    if (!foundUser || !foundUser.password) {
      throw new HttpErrors.Unauthorized(
        `Authentication failed. You entered an incorrect username or password.`,
      );
    }
    if (!foundUser.status) {
      throw new HttpErrors.Unauthorized(
        `Authentication failed. This account has not been activated yet.`,
      );
    }

    var compareResult = compareSync(credentials.password, foundUser.password);

    if (!compareResult) {
      throw new HttpErrors.Unauthorized('Authentication failed. You entered an incorrect username or password.');
    }

    const userProfile: MyUserProfile = _.pick(toJSON(foundUser), ['id', 'email', 'first_name', 'last_name', 'permissions']) as MyUserProfile;

    const accessToken = await this.jwtService.generateToken(userProfile);
    const tokens = await this.refreshService.generateToken(
      userProfile,
      accessToken
    );

    tokens.expiresIn = TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE // Return expiresIn with object
    return tokens;
  }

  @post('/user/refresh', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
  })
  @authenticate.skip() // this endpoint is accessible for everyone
  async refresh(
    @requestBody(RefreshGrantRequestBody) refreshGrant: RefreshGrant,
  ): Promise<TokenObject> {
    return this.refreshService.refreshToken(refreshGrant.refreshToken);
  }


  @authenticate.skip() // this endpoint is accessible for everyone
  @post('/user/signup', {
    responses: {
      '200': {
        description: 'Create new User',
      },
    },
  })
  async signUp(
    @requestBody(NewUserRequestBody)
    newUserRequest: NewUserRequest,
  ): Promise<any> {
    const password = await hash(newUserRequest.password, await genSalt());
    const newUser = {
      email: newUserRequest.email,
      first_name: newUserRequest.first_name,
      last_name: newUserRequest.last_name,
      password: password,
      status: false,
    }

    const savedUser = await this.userRepository.create(newUser)
    delete savedUser.password
    delete savedUser.id
    delete savedUser.status

    return savedUser;
  }

  @post('/users', {
    responses: {
      '200': {
        description: 'User model instance',
        content: { 'application/json': { schema: getModelSchemaRef(User) } },
      },
    },
  })
  async create(
    @requestBody({ UserRequestBody }) user: User
  ): Promise<User> {
    user.permissions = [PermissionKey.ViewOwnUser,
    PermissionKey.CreateUser,
    PermissionKey.UpdateOwnUser,
    PermissionKey.DeleteOwnUser];

    const savedCharacter = await this.userRepository.create(user);
    return savedCharacter;
  }

  @get('/users', {
    responses: {
      '200': {
        description: 'Array of User model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(User, { includeRelations: true }),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @patch('/users', {
    responses: {
      '200': {
        description: 'User PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, { partial: true }),
        },
      },
    })
    user: User,
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.updateAll(user, where);
  }

  @get('/users/{id}', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User, { includeRelations: true }),
          },
        },
      },
    },
  })
  findById(
    @param.path.number('id') id: number,
    @param.filter(User, { exclude: 'where' }) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @get('/users/me', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User, { includeRelations: true }),
          },
        },
      },
    },
  })
  @authenticate({ strategy: 'jwt', options: { required: [] } }) // TODO
  async currentUser(
  ): Promise<MyUserProfile> {
    return this.getCurrentUser()
  }

  @patch('/users/{id}', {
    responses: {
      '204': {
        description: 'User PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, { partial: true }),
        },
      },
    })
    user: User,
  ): Promise<void> {
    await this.userRepository.updateById(id, user);
  }

  @put('/users/{id}', {
    responses: {
      '204': {
        description: 'User PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() user: User,
  ): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }

  @del('/users/{id}', {
    responses: {
      '204': {
        description: 'User DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userRepository.deleteById(id);
  }
}
