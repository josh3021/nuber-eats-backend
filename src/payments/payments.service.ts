import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { User } from '../users/entities/user.entity';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { PaymentOutput } from './dtos/payment.dto';
import { Payment } from './entites/payment.entity';
@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,

    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async getPayments(user: User): Promise<PaymentOutput> {
    try {
      const payments = await this.payments.find({ where: { user } });
      return {
        result: true,
        payments,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not get payments. ${error}`,
      };
    }
  }

  async createPayment(
    owner: User,
    { restaurantId, transactionId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          result: false,
          error: 'Restaurant not found.',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          result: false,
          error: "You don't have permission to do that.",
        };
      }
      await this.payments.save(
        this.payments.create({
          restaurant,
          transactionId,
          user: owner,
        }),
      );
      restaurant.isPromoted = true;
      const date = new Date();
      date.setDate(new Date().getDate() + 7);
      restaurant.promotedUntil = date;
      await this.restaurants.save(restaurant);
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not create Payment. ${error}`,
      };
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkUnpromotedRestaurants(): Promise<void> {
    const willUnpromoteRestaurants = await this.restaurants.find({
      where: {
        isPromoted: true,
        promotedUntil: LessThan(new Date()),
      },
    });

    willUnpromoteRestaurants.forEach(async (restaurant) => {
      restaurant.isPromoted = false;
      restaurant.promotedUntil = null;
      await this.restaurants.save(restaurant);
    });
  }
}
