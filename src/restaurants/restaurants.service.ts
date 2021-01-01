import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { User } from '../users/entities/user.entity';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import {
  SearchRestaurantsInput,
  SearchRestaurantsOutput,
} from './dtos/search-restaurants.dto';
import {
  UpdateRestaurantInput,
  UpdateRestaurantOutput,
} from './dtos/update-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
    private readonly commonService: CommonService,
  ) {}

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          result: false,
          error: `Restaurant not found.`,
        };
      }
      return {
        result: true,
        restaurant,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not find restaurant by id. ${error}`,
      };
    }
  }
  async allRestaurants({
    page,
    take,
  }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        take,
        skip: this.commonService.getPaginationOffset(page, take),
      });

      return {
        result: true,
        results: restaurants,
        totalPages: this.commonService.getTotalPages(totalResults, take),
        totalResults,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not load restaurants. ${error}`,
      };
    }
  }

  async searchRestaurantsByName({
    page,
    query,
    take,
  }: SearchRestaurantsInput): Promise<SearchRestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          name: ILike(`%${query}%`),
        },
        skip: this.commonService.getPaginationOffset(page, take),
        take,
      });
      return {
        result: true,
        results: restaurants,
        totalPages: this.commonService.getTotalPages(totalResults, take),
        totalResults,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not search restaurants by name. ${error}`,
      };
    }
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not create a restaurant. ${error}`,
      };
    }
  }

  async updateRestaurant(
    owner: User,
    updateRestaurantInput: UpdateRestaurantInput,
  ): Promise<UpdateRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        updateRestaurantInput.restaurantId,
        { loadRelationIds: true },
      );
      if (!restaurant) {
        return {
          result: false,
          error: 'Restaurant not found.',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          result: false,
          error: 'You can not update restaurant what you not own.',
        };
      }
      let category: Category = null;
      if (updateRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          updateRestaurantInput.categoryName,
        );
      }
      await this.restaurants.save([
        {
          id: updateRestaurantInput.restaurantId,
          ...updateRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not update a restaurant. ${error}`,
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        loadRelationIds: true,
      });
      if (!restaurant) {
        return {
          result: false,
          error: `Restaurant not found.`,
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          result: false,
          error: 'You can not delete restaurant what you not own.',
        };
      }
      await this.restaurants.delete(restaurantId);
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not delete a restaurant. ${error}`,
      };
    }
  }

  async countRestaurants(category: Category): Promise<number> {
    return this.restaurants.count({ category });
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        result: true,
        categories,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not load categories. ${error}`,
      };
    }
  }

  async findCategoryBySlug({
    slug,
    take,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne(
        { slug },
        { relations: ['restaurants'] },
      );
      if (!category) {
        return {
          result: false,
          error: `Category not found.`,
        };
      }
      const restaurants = await this.restaurants.find({
        where: { category },
        take,
        skip: this.commonService.getPaginationOffset(page, take),
      });
      const totalResults = await this.countRestaurants(category);
      return {
        result: true,
        category,
        restaurants,
        totalPages: this.commonService.getTotalPages(totalResults, take),
        totalResults,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not find category by slug. ${error}`,
      };
    }
  }
}
