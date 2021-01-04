import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from '../auth/auth-user.decorator';
import { Role } from '../auth/role.decorator';
import { UserRole } from '../users/dtos/role.dto';
import { User } from '../users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrderInput, OrderOutput } from './dtos/order.dto';
import { OrdersInput, OrdersOutput } from './dtos/orders.dto';
import { UpdateOrderInput, UpdateOrderOutput } from './dtos/update-order.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => OrderOutput)
  @Role(['Any'])
  async order(
    @AuthUser() user: User,
    @Args() orderInput: OrderInput,
  ): Promise<OrderOutput> {
    return this.ordersService.getOrder(user, orderInput);
  }

  @Query(() => OrdersOutput)
  @Role(['Any'])
  async orders(
    @AuthUser() user: User,
    @Args('input') ordersInput: OrdersInput,
  ): Promise<OrdersOutput> {
    return this.ordersService.getOrders(user, ordersInput);
  }

  @Mutation(() => CreateOrderOutput)
  @Role([UserRole.Client])
  async createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Mutation(() => UpdateOrderOutput)
  @Role(['Owner', 'Delivery'])
  async updateOrder(
    @AuthUser() user: User,
    @Args('input') updateOrderInput: UpdateOrderInput,
  ): Promise<UpdateOrderOutput> {
    return this.ordersService.updateOrder(user, updateOrderInput);
  }
}
