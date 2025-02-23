import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class TestResolver {
  @Query(() => String)
  sayHello() {
    return 'Hello from GraphQL!';
  }
}
