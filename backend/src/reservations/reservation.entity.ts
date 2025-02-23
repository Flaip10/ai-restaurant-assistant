import { ObjectType, Field } from '@nestjs/graphql';
import { User } from 'src/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
} from 'typeorm';

@ObjectType({ description: 'A reservation in the system' }) // Add class-level description
@Entity()
export class Reservation {
  @Field({ description: 'Unique ID of the reservation' })
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  @Index() // Improves search performance for reservations by date
  date!: string;

  @Field({ description: 'Time of the reservation (HH:MM)' })
  @Column()
  time!: string;

  @Field({ description: 'Number of guests for the reservation' })
  @Column()
  guests!: number;

  @Field(() => User, { description: 'User who made the reservation' })
  @ManyToOne(() => User, (user) => user.reservations, {
    eager: true,
    nullable: false,
  })
  user!: User;
}
