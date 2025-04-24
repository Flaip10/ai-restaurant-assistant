import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  @MinLength(3)
  username!: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Field()
  @IsString()
  @MinLength(6)
  password!: string;

  @Field(() => String, { nullable: true })
  @IsEnum(['admin', 'staff'] as const)
  @IsOptional()
  role?: 'admin' | 'staff';
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(['admin', 'staff'] as const)
  @IsOptional()
  role?: 'admin' | 'staff';
}
