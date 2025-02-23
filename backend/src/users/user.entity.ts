import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Reservation } from '../reservations/reservation.entity';

@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  name!: string;

  @Field(() => [Reservation], { nullable: true })
  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations!: Reservation[];
}
