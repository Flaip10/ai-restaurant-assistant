import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

export type UserRole = 'admin' | 'staff';

@Entity()
@ObjectType()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id!: string;

  @Column({ unique: true })
  @Field()
  username!: string;

  @Column({ unique: true })
  @Field()
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'staff'],
    default: 'staff',
  })
  @Field()
  role!: UserRole;

  // Add timestamps for better record keeping
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Field()
  createdAt!: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class UserResponse {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field()
  email!: string;

  @Field()
  role!: UserRole;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
