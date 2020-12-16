import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
      // Default Incoming context is http context.
      // so, we have to convert http context to Gql context!
      const gqlContext = GqlExecutionContext.create(context).getContext();
      const user = gqlContext['user'];
      if (!user) {
        return false;
      }
      return true;
    }
}