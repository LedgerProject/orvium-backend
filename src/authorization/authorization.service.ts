import { Injectable } from '@nestjs/common';
import { actionsMap, defineAbilityFor } from '../authorization/abilities';
import { InviteDocument } from '../invite/invite.schema';
import { UserDocument } from '../users/user.schema';
import { CommentDocument, DepositDocument } from '../deposit/deposit.schema';
import { CommunityDocument } from '../communities/communities.schema';
import { ReviewDocument } from '../review/review.schema';

@Injectable()
export class AuthorizationService {
  getSubjectActions(
    user: UserDocument | null,
    subject: DepositDocument | CommentDocument | CommunityDocument | ReviewDocument | UserDocument | InviteDocument | string
  ): string[] {
    const ability = defineAbilityFor(user);
    const detectSubjectType = ability.detectSubjectType(subject);
    const actions = actionsMap.get(detectSubjectType);
    const allowedActions: string[] = [];

    if (actions) {
      for (const action of actions) {
        if (ability.can(action, subject)) {
          allowedActions.push(action);
        }
      }
    }

    return allowedActions;
  }
}
