import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { User } from '../users/entities/user.entity';
import { CategoriesOutput } from './dtos/category/categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/dish/create-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/dish/delete-dish.dto';
import { UpdateDishInput, UpdateDishOutput } from './dtos/dish/update-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/restaurant/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/restaurant/delete-restaurant.dto';
import { MyRestaurantOutput } from './dtos/restaurant/my-restaurant.dto';
import { MyRestaurantsOutput } from './dtos/restaurant/my-restaurants.dto';
import {
  RestaurantInput,
  RestaurantOutput,
} from './dtos/restaurant/restaurant.dto';
import {
  RestaurantsInput,
  RestaurantsOutput,
} from './dtos/restaurant/restaurants.dto';
import {
  SearchRestaurantsInput,
  SearchRestaurantsOutput,
} from './dtos/restaurant/search-restaurants.dto';
import {
  UpdateRestaurantInput,
  UpdateRestaurantOutput,
} from './dtos/restaurant/update-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    private readonly commonService: CommonService,
  ) {}

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu'],
      });
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
        order: {
          isPromoted: 'DESC',
        },
        relations: ['category'],
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

  async myRestaurant(
    owner: User,
    { restaurantId: id }: RestaurantInput,
  ): Promise<MyRestaurantOutput> {
    try {
      console.log(typeof id);
      if (typeof id !== 'number') {
        return {
          result: false,
          error: `Could not load restaurant. Unexpected Request.`,
        };
      }
      const restaurant = await this.restaurants.findOne(
        { id, owner },
        {
          relations: ['menu', 'orders'],
        },
      );
      return {
        result: true,
        restaurant,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not load restaurant. ${error}`,
      };
    }
  }

  async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
    try {
      const restaurants = await this.restaurants.find({
        where: {
          owner,
        },
      });
      return {
        result: true,
        results: restaurants,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not find my restaurants. ${error}`,
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
        order: {
          isPromoted: 'DESC',
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
        restaurantId: newRestaurant.id,
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

  async allCategories(): Promise<CategoriesOutput> {
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
        order: {
          isPromoted: 'DESC',
        },
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

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        createDishInput.restaurantId,
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
          error: "You can't create dish",
        };
      }
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not create dish. ${error}`,
      };
    }
  }

  async updateDish(
    owner: User,
    updateDishInput: UpdateDishInput,
  ): Promise<UpdateDishOutput> {
    try {
      const dish = await this.dishes.findOne(updateDishInput.dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return {
          result: false,
          error: 'Dish does not found.',
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          result: false,
          error: "You don't have permission to update this dish.",
        };
      }
      await this.dishes.save([
        {
          ...dish,
          ...updateDishInput,
        },
      ]);
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not update dish. ${error}`,
      };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne(dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return {
          result: false,
          error: `Could not find dish you want.`,
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          result: false,
          error: "You don't have permission to delete this dish.",
        };
      }
      await this.dishes.delete(dishId);
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not delete dish. ${error}`,
      };
    }
  }
}
