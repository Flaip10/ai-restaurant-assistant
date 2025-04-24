import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userService = app.get(UserService);

    // Create admin user
    const admin = await userService.createUser(
      'admin',
      'admin@example.com',
      'password123',
      'admin',
    );
    console.log('Admin user created successfully:', admin);
  } catch (error: any) {
    if (error instanceof Error) {
      console.error('Failed to create admin user:', error.message);
    } else {
      console.error('Failed to create admin user:', error);
    }
  } finally {
    await app.close();
  }
}

bootstrap();
