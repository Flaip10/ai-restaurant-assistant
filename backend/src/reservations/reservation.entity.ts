import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@ObjectType({ description: 'A reservation in the system' }) // Add class-level description
@Entity()
export class Reservation {
  @Field({ description: 'Unique ID of the reservation' })
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ description: 'Name of the person making the reservation' })
  @Column()
  name: string;

  @Field({ description: 'Date of the reservation (YYYY-MM-DD)' })
  @Column()
  date: string;

  @Field({ description: 'Time of the reservation (HH:MM)' })
  @Column()
  time: string;

  @Field({ description: 'Number of guests for the reservation' })
  @Column()
  guests: number;
}
