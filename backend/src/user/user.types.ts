import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field(() => String)
  role!: 'admin' | 'staff';

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class UserResponse {
  @Field(() => User)
  user!: User;
}

@ObjectType()
export class UsersResponse {
  @Field(() => [User])
  users!: User[];
}
