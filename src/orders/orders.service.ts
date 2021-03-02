import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Repository } from 'typeorm';
import {
  NEW_COOKED_ORDER,
  NEW_PENDING_ORDER,
  NEW_UPDATED_ORDER,
  PUB_SUB,
} from '../common/pubsub.constants';
import { Dish } from '../restaurants/entities/dish.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { UserRole } from '../users/dtos/role.dto';
import { User } from '../users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrderInput, OrderOutput, OrderStatus } from './dtos/order.dto';
import { OrdersInput, OrdersOutput } from './dtos/orders.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { UpdateOrderInput, UpdateOrderOutput } from './dtos/update-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async getOrder(user: User, { orderId }: OrderInput): Promise<OrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          result: false,
          error: 'Order not found.',
        };
      }

      if (!this.willAllowOrder(user, order)) {
        return {
          result: false,
          error: "You don't have permission to see this order.",
        };
      }

      return {
        result: true,
        order,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not get order. ${error}`,
      };
    }
  }

  async getOrders(user: User, { status }: OrdersInput): Promise<OrdersOutput> {
    try {
      let orders: Order[];
      switch (user.role) {
        case UserRole.Client: {
          orders = await this.orders.find({
            where: {
              customer: user,
              ...(status && { status }),
            },
          });
          break;
        }
        case UserRole.Owner: {
          const restaurants = await this.restaurants.find({
            where: {
              owner: user,
            },
            relations: ['orders'],
          });
          orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
          if (status) {
            orders = orders.filter((order) => order.status === status);
          }
          return {
            result: true,
            orders,
          };
        }
        case UserRole.Delivery:
          {
            orders = await this.orders.find({
              where: {
                driver: user,
                ...(status && { status }),
              },
            });
          }

          break;
      }
      return {
        result: true,
        orders,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not get orders. ${error}`,
      };
    }
  }

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          result: false,
          error: 'Restaurant not found.',
        };
      }
      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return {
            result: false,
            error: 'Dish not found.',
          };
        }
        let dishFinalPrice: number = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices?.find(
                (optionChoice) => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice += dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrder: { order, ownerId: restaurant.ownerId },
      });
      return {
        result: true,
        orderId: order.id,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not create order. ${error}`,
      };
    }
  }

  async updateOrder(
    user: User,
    { id: orderId, status }: UpdateOrderInput,
  ): Promise<UpdateOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          result: false,
          error: 'Order not found.',
        };
      }

      if (!this.willAllowOrder(user, order)) {
        return {
          result: false,
          error: "You don't have permission to see this order.",
        };
      }

      let allowed = true;
      switch (user.role) {
        case UserRole.Owner: {
          if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
            allowed = false;
          }
          break;
        }
        case UserRole.Delivery: {
          if (
            status !== OrderStatus.PickedUp &&
            status !== OrderStatus.Delivered
          ) {
            allowed = false;
          }
          break;
        }
      }
      if (!allowed) {
        return {
          result: false,
          error: "You don't have permission to see this order.",
        };
      }
      // owner이면서, Cooking || Cooked, Delivery이면서, PickedUp || Delivered

      order.status = status;
      await this.orders.save(order);

      if (user.role === UserRole.Owner && status === OrderStatus.Cooked) {
        await this.pubSub.publish(NEW_COOKED_ORDER, {
          cookedOrder: order,
        });
      }

      await this.pubSub.publish(NEW_UPDATED_ORDER, {
        updatedOrder: order,
      });

      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not update order. ${error}`,
      };
    }
  }

  async takeOrder(
    user: User,
    { id: orderId }: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          result: false,
          error: 'Order not found.',
        };
      }
      if (order.driver) {
        return {
          result: false,
          error: 'Sorry... Order already has been taken.',
        };
      }
      order.driver = user;
      order.status = OrderStatus.PickedUp;
      await this.orders.save(order);

      await this.pubSub.publish(NEW_UPDATED_ORDER, {
        updatedOrder: order,
      });
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not take order. ${error}`,
      };
    }
  }

  willAllowOrder(user: User, order: Order): boolean {
    let allowed = true;
    switch (user.role) {
      case UserRole.Client: {
        if (user.id !== order.customerId) {
          allowed = false;
        }
        break;
      }
      case UserRole.Owner: {
        if (user.id !== order.restaurant.ownerId) {
          allowed = false;
        }
        break;
      }
      case UserRole.Delivery: {
        if (user.id !== order.driverId) {
          allowed = false;
        }
        break;
      }
      default:
        allowed = false;
    }
    return allowed;
  }
}
