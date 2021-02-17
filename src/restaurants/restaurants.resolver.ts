import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from '../auth/auth-user.decorator';
import { Role } from '../auth/role.decorator';
import { UserRole } from '../users/dtos/role.dto';
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
import {
  MyRestaurantInput,
  MyRestaurantOutput,
} from './dtos/restaurant/my-restaurant.dto';
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
import { RestaurantsService } from './restaurants.service';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Query(() => RestaurantOutput)
  restaurant(
    @Args('input') restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantsService.findRestaurantById(restaurantInput);
  }

  @Query(() => RestaurantsOutput)
  restaurants(
    @Args('input') restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    return this.restaurantsService.allRestaurants(restaurantsInput);
  }

  @Query(() => MyRestaurantOutput)
  @Role([UserRole.Owner])
  myRestaurant(
    @AuthUser() owner: User,
    @Args('input') restaurantInput: MyRestaurantInput,
  ): Promise<MyRestaurantOutput> {
    return this.restaurantsService.myRestaurant(owner, restaurantInput);
  }

  @Query(() => MyRestaurantsOutput)
  @Role([UserRole.Owner])
  myRestaurants(
    @AuthUser() authorizedUser: User,
  ): Promise<MyRestaurantsOutput> {
    return this.restaurantsService.myRestaurants(authorizedUser);
  }

  @Query(() => SearchRestaurantsOutput)
  searchRestaurants(
    @Args('input') searchRestaurantsInput: SearchRestaurantsInput,
  ): Promise<SearchRestaurantsOutput> {
    return this.restaurantsService.searchRestaurantsByName(
      searchRestaurantsInput,
    );
  }

  @Mutation(() => CreateRestaurantOutput)
  @Role([UserRole.Owner])
  async createRestaurant(
    @AuthUser() authorizedUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantsService.createRestaurant(
      authorizedUser,
      createRestaurantInput,
    );
  }

  @Mutation(() => UpdateRestaurantOutput)
  @Role([UserRole.Owner])
  async updateRestaurant(
    @AuthUser() authorizedUser: User,
    @Args('input') updateRestaurantInput: UpdateRestaurantInput,
  ): Promise<UpdateRestaurantOutput> {
    return this.restaurantsService.updateRestaurant(
      authorizedUser,
      updateRestaurantInput,
    );
  }

  @Mutation(() => DeleteRestaurantOutput)
  @Role([UserRole.Owner])
  async deleteRestaurant(
    @AuthUser() authorizedUser: User,
    @Args() deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantsService.deleteRestaurant(
      authorizedUser,
      deleteRestaurantInput,
    );
  }
}

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Query(() => CategoryOutput)
  category(
    @Args('input') categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.restaurantsService.findCategoryBySlug(categoryInput);
  }

  @Query(() => CategoriesOutput)
  categories(): Promise<CategoriesOutput> {
    return this.restaurantsService.allCategories();
  }

  @ResolveField(() => Int)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantsService.countRestaurants(category);
  }
}

@Resolver(() => Dish)
export class DishesResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Mutation(() => CreateDishOutput)
  @Role([UserRole.Owner])
  createDish(
    @AuthUser() owner: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.restaurantsService.createDish(owner, createDishInput);
  }

  @Mutation(() => UpdateDishOutput)
  @Role([UserRole.Owner])
  updateDish(
    @AuthUser() owner: User,
    @Args('input') updateDishInput: UpdateDishInput,
  ): Promise<UpdateDishOutput> {
    return this.restaurantsService.updateDish(owner, updateDishInput);
  }

  @Mutation(() => DeleteDishOutput)
  @Role([UserRole.Owner])
  deleteDish(
    @AuthUser() owner: User,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    return this.restaurantsService.deleteDish(owner, deleteDishInput);
  }
}
