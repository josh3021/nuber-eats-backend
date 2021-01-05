import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from '../auth/auth-user.decorator';
import { Role } from '../auth/role.decorator';
import {
  NEW_COOKED_ORDER,
  NEW_PENDING_ORDER,
  NEW_UPDATED_ORDER,
  PUB_SUB,
} from '../common/pubsub.constants';
import { UserRole } from '../users/dtos/role.dto';
import { User } from '../users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrderInput, OrderOutput } from './dtos/order.dto';
import { OrdersInput, OrdersOutput } from './dtos/orders.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import {
  UpdateOrderInput,
  UpdateOrderOutput,
  UpdateOrderPubSubInput,
} from './dtos/update-order.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

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
  @Role([UserRole.Owner, UserRole.Delivery])
  async updateOrder(
    @AuthUser() user: User,
    @Args('input') updateOrderInput: UpdateOrderInput,
  ): Promise<UpdateOrderOutput> {
    return this.ordersService.updateOrder(user, updateOrderInput);
  }

  @Mutation(() => TakeOrderOutput)
  @Role([UserRole.Delivery])
  async takeOrder(
    @AuthUser() user: User,
    @Args('input') takeOrderInput: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    return this.ordersService.takeOrder(user, takeOrderInput);
  }

  @Subscription(() => Order, {
    filter: ({ pendingOrder: { ownerId } }, _args, { user }) =>
      ownerId === user.id,
    resolve: ({ pendingOrder: { order } }) => order,
  })
  @Role([UserRole.Owner])
  pendingOrder() {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  @Subscription(() => Order)
  @Role([UserRole.Delivery])
  cookedOrder() {
    return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
  }

  @Subscription(() => Order, {
    filter: (
      { updatedOrder }: { updatedOrder: Order },
      { input: { id } }: { input: UpdateOrderPubSubInput },
      { user }: { user: User },
    ) => {
      if (
        updatedOrder.driverId !== user.id &&
        updatedOrder.customerId !== user.id &&
        updatedOrder.restaurant.ownerId !== user.id
      ) {
        return false;
      }
      return typeof id === 'number'
        ? updatedOrder.id === id
        : updatedOrder.id === parseInt(id);
    },
  })
  @Role(['Any'])
  updatedOrder(@Args('input') updateOrderPubSubInput: UpdateOrderPubSubInput) {
    return this.pubSub.asyncIterator(NEW_UPDATED_ORDER);
  }
}
