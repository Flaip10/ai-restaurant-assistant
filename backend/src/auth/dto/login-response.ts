import { Field, ObjectType } from '@nestjs/graphql';
import { UserResponse } from '../../user/user.entity';

@ObjectType()
export class LoginResponse {
  @Field()
  access_token: string = '';

  @Field(() => UserResponse)
  user: Omit<UserResponse, 'password'> = {} as Omit<UserResponse, 'password'>;
}
