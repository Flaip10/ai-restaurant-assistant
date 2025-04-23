import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/user.entity';

@ObjectType()
export class LoginResponse {
  @Field(() => User)
  user!: Omit<User, 'password'>;

  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;
}
