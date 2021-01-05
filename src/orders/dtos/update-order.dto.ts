import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Order } from '../entities/order.entity';
@InputType()
export class UpdateOrderInput extends PickType(Order, ['id', 'status']) {}

@ObjectType()
export class UpdateOrderOutput extends CoreOutput {}

@InputType()
export class UpdateOrderPubSubInput extends PickType(Order, ['id']) {}
