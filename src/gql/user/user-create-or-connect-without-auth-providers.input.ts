import { Field } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { UserWhereUniqueInput } from './user-where-unique.input';
import { Type } from 'class-transformer';
import { UserCreateWithoutAuth_providersInput } from './user-create-without-auth-providers.input';

@InputType()
export class UserCreateOrConnectWithoutAuth_providersInput {

    @Field(() => UserWhereUniqueInput, {nullable:false})
    @Type(() => UserWhereUniqueInput)
    where!: Prisma.AtLeast<UserWhereUniqueInput, 'id' | 'email'>;

    @Field(() => UserCreateWithoutAuth_providersInput, {nullable:false})
    @Type(() => UserCreateWithoutAuth_providersInput)
    create!: UserCreateWithoutAuth_providersInput;
}