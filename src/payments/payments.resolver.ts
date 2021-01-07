import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { AuthUser } from '../auth/auth-user.decorator';
import { Role } from '../auth/role.decorator';
import { UserRole } from '../users/dtos/role.dto';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { PaymentOutput } from './dtos/payment.dto';
import { Payment } from './entites/payment.entity';
import { PaymentsService } from './payments.service';

@Resolver(() => Payment)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Query(() => PaymentOutput)
  @Role([UserRole.Owner])
  payments(@AuthUser() user: User): Promise<PaymentOutput> {
    return this.paymentsService.getPayments(user);
  }

  @Mutation(() => CreatePaymentOutput)
  @Role([UserRole.Owner])
  createPayment(
    @AuthUser() owner: User,
    @Args('input') createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    return this.paymentsService.createPayment(owner, createPaymentInput);
  }
}
