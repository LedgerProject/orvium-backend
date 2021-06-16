import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesController } from './communities.controller';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { DepositService } from '../deposit/deposit.service';
import { CommunitiesService } from './communities.service';
import { COMMUNITY_TYPE, CommunityDocument, CommunitySchema } from './communities.schema';
import { AuthorizationService } from '../authorization/authorization.service';

describe('Communities Controller', () => {
  let controller: CommunitiesController;
  let communityService: CommunitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunitiesController],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: CommunityDocument.name, schema: CommunitySchema, collection: 'community-community' }]),
        UsersModule,
      ],
      providers: [
        CommunitiesService,
        { provide: DepositService, useValue: {} },
        { provide: AuthorizationService, useValue: {} },
      ],
    }).compile();

    controller = module.get<CommunitiesController>(CommunitiesController);
    communityService = module.get<CommunitiesService>(CommunitiesService);

    await communityService.communityModel.deleteMany();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get communities', async () => {
    await communityService.communityModel.insertMany([
      {
        name: 'The Evolving Scholar',
        description: '',
        users: [{ userId: 'myuser', role: 'contributor' }],
        country: 'Delft, Netherlands',
        type: COMMUNITY_TYPE.university,
        dataciteEnabled: true,
        callForPapers: {
          title: 'ThES Call for Papers',
          deadline: undefined,
          description: 'Some text',
          scope: 'Scope',
          guestEditors: '',
          disciplines: ['engineering', 'technology', 'applied sciences'],
          contact: 'Contact',
          contactEmail: 'email@example.delft.com',
          visible: true,
        },
        acknowledgement: '',
        twitterURL: 'https://twitter.com/TUDelftOpen',
        facebookURL: 'https://www.facebook.com/TUDelft/',
        websiteURL: 'https://openpublishing.tudl.tudelft.nl/',
        logoURL: 'https://assets.orvium.io/TU-Delft/TU-Delft-OPEN-Publishing-The-Evolving-Scholar-Logo.png',
        guidelinesURL: 'https://journals.open.tudelft.nl/thes/index',
        codename: 'thes',
        views: 185,
      },
    ]);

    const communities = await controller.communities();
    expect(communities.length).toBe(1);
    expect(communities[0].name).toBe('The Evolving Scholar');
  });
});
