import { Ability, AbilityBuilder, AbilityClass, ForbiddenError, RawRuleOf, Subject } from '@casl/ability';
import { UnauthorizedException } from '@nestjs/common';
import { REASONS_MESSAGES } from './abilities.reasons';
import { DEPOSIT_STATUS, DepositDocument } from '../deposit/deposit.schema';
import { UserDocument } from '../users/user.schema';
import { REVIEW_STATUS, ReviewDocument } from '../review/review.schema';
import { INVITE_STATUS, InviteDocument } from '../invite/invite.schema';
import { CommunityDocument } from '../communities/communities.schema';

export const actionsMap = new Map<Subject, readonly string[]>();

type AdminActions = 'manage';
type AdminAbilities = [AdminActions, 'all']

const depositActions = ['read', 'update', 'create', 'delete', 'inviteReviewers', 'createVersion',
  'submit', 'deleteComment', 'createComment', 'review'] as const;
type DepositActions = typeof depositActions[number];
type DepositAbilities = [DepositActions, DepositDocument | 'DepositDocument'];
actionsMap.set('DepositDocument', depositActions);

const reviewActions = ['read', 'update', 'delete'] as const;
type ReviewActions = typeof reviewActions[number];
type ReviewAbilities = [ReviewActions, ReviewDocument | 'ReviewDocument'];
actionsMap.set('ReviewDocument', reviewActions);

const userActions = ['read', 'update'] as const;
type UserActions = typeof userActions[number];
type UserAbilities = [UserActions, UserDocument | 'UserDocument'];
actionsMap.set('UserDocument', userActions);

const communityActions = ['read', 'update', 'join', 'moderate'] as const;
type CommunityActions = typeof communityActions[number];
type CommunityAbilities = [CommunityActions, CommunityDocument | 'CommunityDocument'];
actionsMap.set('CommunityDocument', communityActions);

const inviteActions = ['read', 'update'] as const;
type InviteActions = typeof inviteActions[number];
type InviteAbilities = [InviteActions, InviteDocument | 'InviteDocument'];
actionsMap.set('InviteDocument', inviteActions);

type Abilities = AdminAbilities | DepositAbilities | UserAbilities | CommunityAbilities | ReviewAbilities | InviteAbilities;

export type AppAbility = Ability<Abilities>;
export const AppAbility = Ability as AbilityClass<AppAbility>;

/**
 * Define the rules for a visitor (not logged user)
 *
 * @returns {RawRuleOf<AppAbility>[]} visitor user rules
 */
function visitor(): RawRuleOf<AppAbility>[] {
  const builder = new AbilityBuilder(AppAbility);
  builder.can('read', 'UserDocument');
  builder.can('read', 'DepositDocument', {
    status: {
      $in: [DEPOSIT_STATUS.preprint, DEPOSIT_STATUS.published]
    }
  });
  builder.can('read', 'ReviewDocument', { status: { $in: [REVIEW_STATUS.published] } });
  builder.can('read', 'CommunityDocument');

  return builder.rules;
}

/**
 * Define the rules for an incomplete registered user (has not completed the onboarding or has not verified email)
 *
 * @param {user} the user
 * @returns {RawRuleOf<AppAbility>[]} incomplete registered user rules
 */
function incompleteRegisteredUser(user: UserDocument): RawRuleOf<AppAbility>[] {
  const builder = new AbilityBuilder(AppAbility);
  builder.rules = builder.rules.concat(visitor());
  builder.can('update', 'UserDocument', { userId: user.userId });
  return builder.rules;
}

/**
 * Define the rules for a registered user
 *
 * @param {User} the user
 * @returns {RawRuleOf<AppAbility>[]} registered user rules
 */
function registeredUser(user: UserDocument): RawRuleOf<AppAbility>[] {
  return [
    // Deposit rules
    {
      action: 'read',
      subject: 'DepositDocument',
      conditions: {
        owner: user.userId
      },
    },
    { action: 'create', subject: 'DepositDocument' },
    {
      action: ['update', 'delete'],
      subject: 'DepositDocument',
      conditions: { owner: user.userId, status: DEPOSIT_STATUS.draft },
    },
    {
      action: ['createVersion', 'inviteReviewers'],
      subject: 'DepositDocument',
      conditions: { owner: user.userId, status: { $in: [DEPOSIT_STATUS.preprint, DEPOSIT_STATUS.published] } },
    },
    {
      action: 'createComment',
      subject: 'DepositDocument',
      conditions: { status: { $in: [DEPOSIT_STATUS.preprint, DEPOSIT_STATUS.published] } },
    },
    {
      action: 'review',
      subject: 'DepositDocument',
      conditions: {
        owner: { $ne: user.userId },
        status: { $in: [DEPOSIT_STATUS.preprint, DEPOSIT_STATUS.published] },
        canBeReviewed: true
      },
    },
    // Comment rules
    {
      action: 'deleteComment',
      subject: 'DepositDocument',
      conditions: { owner: user.userId },
    },
    // Review rules
    {
      action: 'read',
      subject: 'ReviewDocument',
      conditions: {
        owner: user.userId
      },
    },
    {
      action: 'update',
      subject: 'ReviewDocument',
      conditions: { owner: user.userId, status: REVIEW_STATUS.draft },
    },
    {
      action: 'delete',
      subject: 'ReviewDocument',
      conditions: { owner: user.userId, status: REVIEW_STATUS.draft },
    },
    // Community
    {
      action: 'join',
      subject: 'CommunityDocument',
      conditions: { 'users.userId': { $ne: user.userId } },
    },
    // User
    {
      action: 'update',
      subject: 'UserDocument',
      conditions: { userId: user.userId },
    },
    // Invite
    {
      action: 'read',
      subject: 'InviteDocument',
      conditions: { sender: user._id },
    },
    {
      action: 'read',
      subject: 'InviteDocument',
      conditions: { addressee: user.email },
    },
    {
      action: 'update',
      subject: 'InviteDocument',
      conditions: { status: INVITE_STATUS.pending, addressee: user.email },
    },
  ];
}

/**
 * Define the rules for a community moderator user
 *
 * @param {User} the user
 * @returns {RawRuleOf<AppAbility>[]} moderator rules
 */
function moderator(user: UserDocument): RawRuleOf<AppAbility>[] {
  const communitiesIDs = communityModeratorIDs(user);
  return [
    {
      action: ['read', 'update', 'deleteComment', 'createComment'],
      subject: 'DepositDocument',
      conditions: {
        'community._id': { $in: communitiesIDs },
        status: { $in: [DEPOSIT_STATUS.pendingApproval, DEPOSIT_STATUS.preprint, DEPOSIT_STATUS.published] }
      },
    },
    {
      action: 'inviteReviewers',
      subject: 'DepositDocument',
      conditions: { 'community._id': { $in: communitiesIDs }, status: { $in: [DEPOSIT_STATUS.preprint, DEPOSIT_STATUS.published] } },
    },
    {
      inverted: true,
      action: 'delete',
      subject: 'DepositDocument',
      conditions: { 'community._id': { $in: communitiesIDs } },
      reason: REASONS_MESSAGES.delete_deposit_moderator
    },
    {
      action: ['update', 'moderate'], subject: 'CommunityDocument', conditions: { _id: { $in: communitiesIDs } },
    }
  ];
}

/**
 * Define the rules for an admin user
 *
 * @param {User} the user
 * @returns {RawRuleOf<AppAbility>[]} admin rules
 */
function admin(): RawRuleOf<AppAbility>[] {
  return [
    { action: 'manage', subject: 'all' }
  ];
}

/**
 * Define the ability for an specific user
 *
 * @param {User} the user
 * @returns {Ability} CASL Ability
 */
export function defineAbilityFor(user: UserDocument | null): Ability {
  const builder = new AbilityBuilder(Ability);
  let rules: RawRuleOf<AppAbility>[] = [];
  const roles = getUserRoles(user);

  if (!user) {
    rules = rules.concat(visitor());
    builder.rules = rules;
    return builder.build();
  }

  for (const role of roles) {
    switch (role) {
      case 'visitor':
        rules = rules.concat(visitor());
        break;
      case 'registered':
        rules = rules.concat(registeredUser(user));
        break;
      case 'incompleteRegistered':
        rules = rules.concat(incompleteRegisteredUser(user));
        break;
      case 'admin':
        rules = rules.concat(admin());
        break;
      case 'moderator':
        rules = rules.concat(moderator(user));
        break;
    }
  }

  builder.rules = rules;
  return builder.build();
}

export function getUserRoles(user?: UserDocument | null): string[] {
  const roles = ['visitor'];
  if (user) {

    if (!user.emailConfirmed || !user.isOnboarded) {
      roles.push('incompleteRegistered');
    } else {
      roles.push('registered');
    }

    if (user.roles.includes('admin')) {
      roles.push('admin');
    }
    if (communityModeratorIDs(user).length >= 1) {
      roles.push('moderator');
    }
  }

  return roles;
}


/**
 * Check if the user is moderator returning the communities IDs
 *
 * @param {User} the user
 * @returns {string[]} the IDs of the communities that the user is a moderator
 */
function communityModeratorIDs(user: UserDocument): string[] {
  const moderatorRegex = /moderator:(.+)/;
  const communitiesIds = [];
  for (const rol of user.roles) {
    const rolType = rol.match(moderatorRegex);
    if (rolType?.[1]) {
      communitiesIds.push(rolType?.[1]);
    }
  }
  return communitiesIds;
}

/**
 * Check if the user is authorized and if is not, throws an exception
 *
 * @param {Ability} the ability
 * @param {string} the action
 * @param {any} the subject
 * @returns {boolean} true if it is authorized, exception if is not
 */
export function canDo(ability: Ability, action: string, subject: Subject): boolean {
  try {
    ForbiddenError.from(ability).throwUnlessCan(action, subject);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      if ((Object.values(REASONS_MESSAGES) as unknown as string[]).indexOf(error.message) != -1) {
        throw new UnauthorizedException(error.message);
      }
      throw new UnauthorizedException('Unauthorized');
    }
  }
  return true;
}

/**
 * Check if the user is authorized
 *
 * @param {Ability} the ability
 * @param {string} the action
 * @param {any} the subject
 * @returns {boolean} true if it is authorized, exception if is not
 */
export function checkCanDo(ability: Ability, action: string, subject: Subject): boolean {
  try {
    ForbiddenError.from(ability).throwUnlessCan(action, subject);
  } catch (error) {
    return false;
  }
  return true;
}
