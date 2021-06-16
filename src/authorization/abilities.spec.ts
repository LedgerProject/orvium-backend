import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { DepositService } from '../deposit/deposit.service';
import { CommunitiesService } from '../communities/communities.service';
import { UsersService } from '../users/users.service';
import { ACCESS_RIGHT, DEPOSIT_STATUS, DepositDocument, DepositSchema, PUBLICATION_TYPE, REVIEW_TYPE } from '../deposit/deposit.schema';
import { DocumentDefinition } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { COMMUNITY_TYPE, CommunityDocument, CommunitySchema } from '../communities/communities.schema';
import { USER_TYPE, UserDocument, UserSchema } from '../users/user.schema';
import { defineAbilityFor } from './abilities';
import { CallForPapers } from '../dtos/community-callforpapers.dto';
import { REVIEW_STATUS, ReviewDocument, ReviewSchema } from '../review/review.schema';
import { ReviewService } from '../review/review.service';
import { InviteService } from '../invite/invite.service';
import { INVITE_STATUS, INVITE_TYPE, InviteDocument, InviteSchema } from '../invite/invite.schema';

describe('Abilities', () => {
  let depositService: DepositService;
  let communityService: CommunitiesService;
  let userService: UsersService;
  let reviewService: ReviewService;
  let inviteService: InviteService;

  const depositBase: DocumentDefinition<DepositDocument> = {
    owner: 'user.userId',
    nickname: 'user.nickname',
    gravatar: 'user.gravatar',
    authors: [],
    comments: [],
    references: [],
    title: 'newDeposit.title',
    accessRight: ACCESS_RIGHT.CC0,
    publicationType: PUBLICATION_TYPE.article,
    disciplines: [],
    status: DEPOSIT_STATUS.draft,
    peerReviews: [],
    reviewType: REVIEW_TYPE.openReview,
    files: [],
    keywords: [],
    createdOn: new Date(),
    isLatestVersion: true,
    version: 1,
    parent: uuidv4(),
    canBeReviewed: true
  };

  const userBase: DocumentDefinition<UserDocument> = {
    userId: 'user.userId',
    nickname: 'user.nickname',
    gravatar: 'user.gravatar',
    email: 'email@orvium.io',
    userType: USER_TYPE.business,
    isReviewer: false,
    isOnboarded: true,
    emailConfirmed: true,
    percentageComplete: 0,
    roles: [],
    disciplines: [],
    acceptedTC: true,
    communities: [],
    invitationsAvailable: 5,
    inviteToken: 'user.inviteToken',
    starredDeposits: [],
  };

  const communityBase: DocumentDefinition<CommunityDocument> = {
    name: 'Community',
    description: 'Description',
    country: 'Testlandia',
    twitterURL: 'https://twitter.com/test',
    facebookURL: 'https://www.facebook.com/test/',
    websiteURL: 'https://www.test.com/',
    users: [],
    logoURL: '',
    acknowledgement: '',
    guidelinesURL: '',
    codename: 'community',
    type: COMMUNITY_TYPE.university,
    callForPapers: new CallForPapers(),
    dataciteEnabled: false,
  };

  const reviewBase: DocumentDefinition<ReviewDocument> = {
    owner: 'user.userId',
    gravatar: 'user.gravatar',
    revealReviewerIdentity: true,
    deposit: '5fdd3c22eaf7860008874c43',
    author: 'authorname',
    wasInvited: false,
    status: REVIEW_STATUS.draft,
    creationDate: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([
          { name: DepositDocument.name, schema: DepositSchema },
          { name: CommunityDocument.name, schema: CommunitySchema },
          { name: UserDocument.name, schema: UserSchema },
          { name: ReviewDocument.name, schema: ReviewSchema },
          { name: InviteDocument.name, schema: InviteSchema }
        ]),
      ],
      providers: [
        DepositService,
        CommunitiesService,
        UsersService,
        ReviewService,
        InviteService
      ]
    }).compile();

    depositService = module.get<DepositService>(DepositService);
    communityService = module.get<CommunitiesService>(CommunitiesService);
    userService = module.get<UsersService>(UsersService);
    reviewService = module.get<ReviewService>(ReviewService);
    inviteService = module.get<InviteService>(InviteService);

    await depositService.depositModel.deleteMany();
    await communityService.communityModel.deleteMany();
    await userService.userModel.deleteMany();
    await reviewService.reviewModel.deleteMany();
    await inviteService.inviteModel.deleteMany();
  });

  it('should not read private deposits', async () => {
    const userVisitor = null;
    const draft: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.draft });
    const pendingApproval: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.pendingApproval });
    const ability = defineAbilityFor(userVisitor);
    expect(ability.can('read', draft)).toBe(false);
    expect(ability.can('read', pendingApproval)).toBe(false);
  });

  it('should read public deposits', async () => {
    const userVisitor = null;
    const publish = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.published });
    const preprint = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.preprint });
    const ability = defineAbilityFor(userVisitor);
    expect(ability.can('read', publish)).toBeTruthy();
    expect(ability.can('read', preprint)).toBeTruthy();
  });

  it('should read owner private deposits', async () => {
    let user = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true });
    user = await user.save();
    const draft = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.draft });
    const draftNotOwner = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.draft });
    const pendingApproval = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.pendingApproval });
    const ability = defineAbilityFor(user);
    expect(ability.can('read', draft)).toBe(true);
    expect(ability.can('read', draftNotOwner)).toBe(false);
    expect(ability.can('read', pendingApproval)).toBe(true);
  });

  it('should create deposits', async () => {
    let completeRegisteredUser = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability1 = defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('create', DepositDocument.name)).toBe(true);
    let incompleteRegisteredUser = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: false,
      emailConfirmed: true
    });
    incompleteRegisteredUser = await incompleteRegisteredUser.save();
    const ability2 = defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('create', DepositDocument.name)).toBe(false);
    const userVisitor = null;
    const abilityVisitor3 = defineAbilityFor(userVisitor);
    expect(abilityVisitor3.can('create', DepositDocument.name)).toBe(false);
  });

  it('should update deposits', async () => {
    const draft = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.draft });
    const pendingApproval = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.pendingApproval });
    const publish = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.published });
    const preprint = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.preprint });
    const draftNotOwner = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.draft });
    let completeRegisteredUser = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability1 = defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('update', preprint)).toBe(false);
    expect(ability1.can('update', publish)).toBe(false);
    expect(ability1.can('update', pendingApproval)).toBe(false);
    expect(ability1.can('update', draft)).toBe(true);
    expect(ability1.can('update', draftNotOwner)).toBe(false);
    let incompleteRegisteredUser = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: false,
      emailConfirmed: true
    });
    incompleteRegisteredUser = await incompleteRegisteredUser.save();
    const ability2 = defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('update', draft)).toBe(false);
    const userVisitor = null;
    const abilityVisitor3 = defineAbilityFor(userVisitor);
    expect(abilityVisitor3.can('update', preprint)).toBe(false);
  });

  it('should delete deposits', async () => {
    const draft = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.draft });
    const draftNotOwner = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.draft });
    const pendingApproval = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.pendingApproval });
    const publish = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.published });
    const preprint = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.preprint });
    let completeRegisteredUser = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability1 = defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('delete', preprint)).toBe(false);
    expect(ability1.can('delete', publish)).toBe(false);
    expect(ability1.can('delete', pendingApproval)).toBe(false);
    expect(ability1.can('delete', draft)).toBe(true);
    expect(ability1.can('delete', draftNotOwner)).toBe(false);
    let incompleteRegisteredUser = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: false,
      emailConfirmed: true
    });
    incompleteRegisteredUser = await incompleteRegisteredUser.save();
    const ability2 = defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('delete', draft)).toBe(false);
    const userVisitor = null;
    const abilityVisitor3 = defineAbilityFor(userVisitor);
    expect(abilityVisitor3.can('delete', preprint)).toBe(false);
  });

  it('should create new deposit version', async () => {
    const draft: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.draft });
    const pendingApproval: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.pendingApproval });
    const publish: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.published });
    const preprint: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.preprint });
    let completeRegisteredUser = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability1 = defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('createVersion', preprint)).toBe(true);
    expect(ability1.can('createVersion', publish)).toBe(true);
    expect(ability1.can('createVersion', pendingApproval)).toBe(false);
    expect(ability1.can('createVersion', draft)).toBe(false);
    let incompleteRegisteredUser = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: false,
      emailConfirmed: true
    });
    incompleteRegisteredUser = await incompleteRegisteredUser.save();
    const ability2 = defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('createVersion', draft)).toBe(false);
    const userVisitor = null;
    const abilityVisitor3 = defineAbilityFor(userVisitor);
    expect(abilityVisitor3.can('createVersion', preprint)).toBe(false);
  });

  it('should create comments', async () => {
    const draft: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.draft });
    const pendingApproval: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.pendingApproval });
    const publish: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.published });
    const preprint: DepositDocument = await depositService.create({ ...depositBase, status: DEPOSIT_STATUS.preprint });
    let completeRegisteredUser = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability1 = defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('createComment', preprint)).toBe(true);
    expect(ability1.can('createComment', publish)).toBe(true);
    expect(ability1.can('createComment', pendingApproval)).toBe(false);
    expect(ability1.can('createComment', draft)).toBe(false);
    let incompleteRegisteredUser = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: false,
      emailConfirmed: true
    });
    incompleteRegisteredUser = await incompleteRegisteredUser.save();
    const ability2 = defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('createComment', draft)).toBe(false);
    const userVisitor = null;
    const abilityVisitor3 = defineAbilityFor(userVisitor);
    expect(abilityVisitor3.can('createComment', preprint)).toBe(false);
  });

  it('should moderate community deposits', async () => {
    let community: CommunityDocument = new communityService.communityModel({ ...communityBase });
    community = await community.save();
    const draft = await depositService.create({ ...depositBase, owner: 'user.otherUserId', community: community._id, status: DEPOSIT_STATUS.draft });
    const pendingApproval = await depositService.create({ ...depositBase, owner: 'user.otherUserId', community: community._id, status: DEPOSIT_STATUS.pendingApproval });
    const publish = await depositService.create({ ...depositBase, owner: 'user.otherUserId', community: community._id, status: DEPOSIT_STATUS.published });
    const preprint = await depositService.create({ ...depositBase, owner: 'user.otherUserId', community: community._id, status: DEPOSIT_STATUS.preprint });
    const preprintNotCommunity = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.preprint });
    let moderator = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true, roles: ['moderator:' + community._id] });
    moderator = await moderator.save();
    const ability = defineAbilityFor(moderator);
    expect(ability.can('read', draft)).toBe(false);
    expect(ability.can('read', preprint)).toBe(true);
    expect(ability.can('delete', draft)).toBe(false);
    expect(ability.can('delete', preprint)).toBe(false);
    expect(ability.can('update', draft)).toBe(false);
    expect(ability.can('update', publish)).toBe(true);
    expect(ability.can('update', pendingApproval)).toBe(true);
    expect(ability.can('update', preprintNotCommunity)).toBe(false);
    expect(ability.can('update', community)).toBe(true);
  });

  it('should not read private reviews', async () => {
    const userVisitor = null;
    const depositPublished = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.published });
    const reviewDraft: ReviewDocument = await reviewService.create({ ...reviewBase, deposit: depositPublished._id, status: REVIEW_STATUS.draft});
    const ability = defineAbilityFor(userVisitor);
    expect(ability.can('read', reviewDraft)).toBe(false);
    expect(ability.can('create', reviewDraft)).toBe(false);
    expect(ability.can('update', reviewDraft)).toBe(false);
    expect(ability.can('delete', reviewDraft)).toBe(false);
  });

  it('should read public reviews', async () => {
    const userVisitor = null;
    const depositPublished = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.published });
    const reviewPublished: ReviewDocument = await reviewService.create({ ...reviewBase, deposit: depositPublished._id, status: REVIEW_STATUS.published});
    const ability = defineAbilityFor(userVisitor);
    expect(ability.can('read', reviewPublished)).toBe(true);
    expect(ability.can('create', reviewPublished)).toBe(false);
    expect(ability.can('create', reviewPublished)).toBe(false);
    expect(ability.can('delete', reviewPublished)).toBe(false);
  });

  it('should review deposits', async () => {
    const depositPublished = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.published });
    const depositDraft= await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.draft });
    let completeRegisteredUser = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true, isReviewer: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability1 = defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('review', depositPublished)).toBe(true);
    expect(ability1.can('review', depositDraft)).toBe(false);
    let incompleteRegisteredUser = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: false,
      emailConfirmed: true,
      isReviewer: true
    });
    incompleteRegisteredUser = await incompleteRegisteredUser.save();
    const ability2 = defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('review', depositPublished)).toBe(false);
    expect(ability2.can('review', depositDraft)).toBe(false);
  });

  it('should manage owner reviews', async () => {
    let completeRegisteredUser = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true, isReviewer: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability = defineAbilityFor(completeRegisteredUser);
    const depositPublished = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.published });
    const reviewPublishedOwner: ReviewDocument = await reviewService.create({ ...reviewBase, deposit: depositPublished._id, owner: 'user.userId', status: REVIEW_STATUS.published});
    const reviewDraftOwner: ReviewDocument = await reviewService.create({ ...reviewBase, deposit: depositPublished._id, owner: 'user.userId', status: REVIEW_STATUS.draft});
    const reviewPublishedNotOwner: ReviewDocument = await reviewService.create({ ...reviewBase, deposit: depositPublished._id, owner: 'user.otherUserId', status: REVIEW_STATUS.published});
    const reviewDraftNotOwner: ReviewDocument = await reviewService.create({ ...reviewBase, deposit: depositPublished._id, owner: 'user.otherUserId', status: REVIEW_STATUS.draft});
    expect(ability.can('read', reviewPublishedOwner)).toBe(true);
    expect(ability.can('delete', reviewPublishedOwner)).toBe(false);
    expect(ability.can('update', reviewPublishedOwner)).toBe(false);
    expect(ability.can('read', reviewDraftOwner)).toBe(true);
    expect(ability.can('delete', reviewDraftOwner)).toBe(true);
    expect(ability.can('update', reviewDraftOwner)).toBe(true);
    expect(ability.can('read', reviewPublishedNotOwner)).toBe(true);
    expect(ability.can('delete', reviewPublishedNotOwner)).toBe(false);
    expect(ability.can('update', reviewPublishedNotOwner)).toBe(false);
    expect(ability.can('read', reviewDraftNotOwner)).toBe(false);
    expect(ability.can('delete', reviewDraftNotOwner)).toBe(false);
    expect(ability.can('update', reviewDraftNotOwner)).toBe(false);
  });

  it('should join and submit papers to a community', async () => {
    let completeRegisteredUser = new userService.userModel(
      { ...userBase, isOnboarded: true, emailConfirmed: true, isReviewer: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability1 = defineAbilityFor(completeRegisteredUser);
    let incompleteRegisteredUser = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: false,
      emailConfirmed: true,
      isReviewer: true
    });
    incompleteRegisteredUser = await incompleteRegisteredUser.save();
    const ability2 = defineAbilityFor(incompleteRegisteredUser);
    const userVisitor = null;
    const ability3 = defineAbilityFor(incompleteRegisteredUser);
    let community: CommunityDocument = new communityService.communityModel({ ...communityBase });
    community = await community.save();
    expect(ability1.can('join', community)).toBe(true);
    expect(ability2.can('join', community)).toBe(false);
    expect(ability3.can('join', community)).toBe(false);
    expect(ability1.can('submit', community)).toBe(false);
    expect(ability2.can('submit', community)).toBe(false);
    expect(ability3.can('submit', community)).toBe(false);
    community.users.push({ userId: completeRegisteredUser.userId, role: '' });
    community = await community.save();
    expect(ability1.can('join', community)).toBe(false);
    expect(ability2.can('join', community)).toBe(false);
    expect(ability3.can('join', community)).toBe(false);
    expect(ability1.can('submit', community)).toBe(false);
    expect(ability2.can('submit', community)).toBe(false);
    expect(ability3.can('submit', community)).toBe(false);
  });

  it('should update a community', async () => {
    let completeRegisteredUser = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true, isReviewer: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    let ability1 = defineAbilityFor(completeRegisteredUser);
    let incompleteRegisteredUser = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: false,
      emailConfirmed: true,
      isReviewer: true
    });
    incompleteRegisteredUser = await incompleteRegisteredUser.save();
    const ability2 = defineAbilityFor(incompleteRegisteredUser);
    const userVisitor = null;
    const ability3 = defineAbilityFor(incompleteRegisteredUser);
    let community: CommunityDocument = new communityService.communityModel({ ...communityBase });
    community = await community.save();
    expect(ability1.can('update', community)).toBe(false);
    expect(ability2.can('update', community)).toBe(false);
    expect(ability3.can('update', community)).toBe(false);
    community.users.push({ userId: completeRegisteredUser.userId, role: '' });
    community = await community.save();
    completeRegisteredUser.roles.push(`moderator:${community._id}`);
    ability1 = defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('update', community)).toBe(true);
    expect(ability2.can('update', community)).toBe(false);
    expect(ability3.can('update', community)).toBe(false);
  });

  it('should update and delete user', async () => {
    let completeRegisteredUser = new userService.userModel(
      { ...userBase, isOnboarded: true, emailConfirmed: true, isReviewer: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability1 = defineAbilityFor(completeRegisteredUser);
    let incompleteRegisteredUser = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: false,
      emailConfirmed: true,
      isReviewer: true
    });
    incompleteRegisteredUser = await incompleteRegisteredUser.save();
    const ability2 = defineAbilityFor(incompleteRegisteredUser);
    const userVisitor = null;
    const ability3 = defineAbilityFor(userVisitor);
    expect(ability1.can('update', completeRegisteredUser)).toBe(true);
    expect(ability2.can('update', completeRegisteredUser)).toBe(false);
    expect(ability3.can('update', completeRegisteredUser)).toBe(false);
    expect(ability1.can('delete', completeRegisteredUser)).toBe(false);
    expect(ability2.can('delete', completeRegisteredUser)).toBe(false);
    expect(ability3.can('delete', completeRegisteredUser)).toBe(false);
  });

  it('should invite reviewers', async () => {
    let completeRegisteredUser = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true, isReviewer: true });
    completeRegisteredUser = await completeRegisteredUser.save();
    const ability = defineAbilityFor(completeRegisteredUser);
    const draft = await depositService.create({ ...depositBase, owner: completeRegisteredUser.userId, status: DEPOSIT_STATUS.draft });
    const pendingApproval = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.pendingApproval });
    const publish = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.published });
    const preprint = await depositService.create({ ...depositBase, owner: completeRegisteredUser.userId, status: DEPOSIT_STATUS.preprint });
    expect(ability.can('inviteReviewers', draft)).toBe(false);
    expect(ability.can('inviteReviewers', pendingApproval)).toBe(false);
    expect(ability.can('inviteReviewers', publish)).toBe(false);
    expect(ability.can('inviteReviewers', preprint)).toBe(true);
    let community: CommunityDocument = new communityService.communityModel({ ...communityBase });
    community = await community.save();
    const draftCommunity = await depositService.create({ ...depositBase, owner: 'user.otherUserId', community: community._id, status: DEPOSIT_STATUS.draft });
    const pendingApprovalCommunity = await depositService.create({ ...depositBase, owner: 'user.otherUserId', community: community._id, status: DEPOSIT_STATUS.pendingApproval });
    const publishCommunity = await depositService.create({ ...depositBase, owner: 'user.otherUserId', community: community._id, status: DEPOSIT_STATUS.published });
    const preprintCommunity = await depositService.create({ ...depositBase, owner: 'user.otherUserId', community: community._id, status: DEPOSIT_STATUS.preprint });
    const preprintNotCommunity = await depositService.create({ ...depositBase, owner: 'user.otherUserId', status: DEPOSIT_STATUS.preprint });
    let moderator = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true, roles: ['moderator:' + community._id], email: 'emailmoderator@email.com', nickname: 'moderator' });
    moderator = await moderator.save();
    const abilityModerator = defineAbilityFor(moderator);
    expect(abilityModerator.can('inviteReviewers', draftCommunity)).toBe(false);
    expect(abilityModerator.can('inviteReviewers', pendingApprovalCommunity)).toBe(false);
    expect(abilityModerator.can('inviteReviewers', publishCommunity)).toBe(true);
    expect(abilityModerator.can('inviteReviewers', preprintCommunity)).toBe(true);
    expect(abilityModerator.can('inviteReviewers', preprintNotCommunity)).toBe(false);
  });

  it('should update and read invite', async () => {
    let completeRegisteredUserOwner = new userService.userModel({ ...userBase, isOnboarded: true, emailConfirmed: true, isReviewer: true });
    completeRegisteredUserOwner = await completeRegisteredUserOwner.save();
    const abilityOwner = defineAbilityFor(completeRegisteredUserOwner);
    let completeRegisteredUserReviewer = new userService.userModel({
      ...userBase,
      email: 'email2@orvium.io',
      nickname: 'user.nickname2',
      userId: 'user.userId2',
      isOnboarded: true,
      emailConfirmed: true,
      isReviewer: true
    });
    completeRegisteredUserReviewer = await completeRegisteredUserReviewer.save();
    const abilityReviewer = defineAbilityFor(completeRegisteredUserReviewer);
    const userVisitor = null;
    const abilityVisitor = defineAbilityFor(userVisitor);
    let invitePending = new inviteService.inviteModel({
      status: INVITE_STATUS.pending,
      inviteType: INVITE_TYPE.review,
      sender: completeRegisteredUserOwner._id,
      addressee: completeRegisteredUserReviewer.email!,
      deadline: new Date(),
      createdOn: new Date(),
    });
    invitePending = await invitePending.save();
    let inviteAccepted = new inviteService.inviteModel({
      status: INVITE_STATUS.accepted,
      inviteType: INVITE_TYPE.review,
      sender: completeRegisteredUserOwner._id,
      addressee: completeRegisteredUserReviewer.email!,
      deadline: new Date(),
      createdOn: new Date(),
    });
    inviteAccepted = await inviteAccepted.save();
    expect(abilityOwner.can('read', invitePending)).toBe(true);
    expect(abilityOwner.can('update', invitePending)).toBe(false);
    expect(abilityReviewer.can('read', invitePending)).toBe(true);
    expect(abilityReviewer.can('update', invitePending)).toBe(true);
    expect(abilityVisitor.can('read', invitePending)).toBe(false);
    expect(abilityVisitor.can('update', invitePending)).toBe(false);

    expect(abilityOwner.can('read', inviteAccepted)).toBe(true);
    expect(abilityOwner.can('update', inviteAccepted)).toBe(false);
    expect(abilityReviewer.can('read', inviteAccepted)).toBe(true);
    expect(abilityReviewer.can('update', inviteAccepted)).toBe(false);
    expect(abilityVisitor.can('read', inviteAccepted)).toBe(false);
    expect(abilityVisitor.can('update', inviteAccepted)).toBe(false);
  });
});
