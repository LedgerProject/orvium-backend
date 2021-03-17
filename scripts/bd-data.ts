import * as mongoose from 'mongoose';
import { DepositSchema, Deposit, ACCESS_RIGHT, PUBLICATION_TYPE, DEPOSIT_STATUS, REVIEW_TYPE } from '../src/deposit/deposit.schema';
import { environment } from '../src/environments/environment';
import { UserSchema, User, USER_TYPE } from '../src/users/user.schema';
import { DisciplineSchema, Discipline } from '../src/discipline/discipline.schema';
import { disciplines } from './disciplines';

const DepositModel = mongoose.model<Deposit>(Deposit.name, DepositSchema);
const UserModel = mongoose.model<User>(User.name, UserSchema);
const DisciplineModel = mongoose.model<Discipline>(Discipline.name, DisciplineSchema);

const execute = async () => {
    console.log('Executing');
    await mongoose.connect(environment.mongoUri);
    const user = await UserModel.create({
        starredDeposits: [],
        userType: USER_TYPE.researcher,
        isOnboarded: true,
        isReviewer: false,
        disciplines: [],
        percentageComplete: 44.44444444444444,
        invitationsAvailable: 20,
        emailConfirmed: true,
        communities: [],
        userId: "123456",
        firstName: "Jhon",
        lastName: "Doe",
        email: "exampleemail@orvium.io",
        roles: [],
        inviteToken: "c0984defea8d64eec365bd1f74059564",
        gravatar: "2e7854c294602808422223306eff0e33",
    });
    const deposits = await DepositModel.create({
        owner: "118218125510733000000",
        title: "Managing cybersecurity resources: a cost-benefit analysis",
        abstract: "Cybersecurity is a broadly used term, whose definitions are highly variable, often subjective, and at times, uninformative. The absence of a concise, broadly acceptable definition that captures the multidimensionality of cybersecurity impedes technological and scientific advances by reinforcing the predominantly technical view of cybersecurity while separating disciplines that should be acting in concert to resolve complex cybersecurity challenges. In conjunction with an in-depth literature review, we led multiple discussions on cybersecurity with a diverse group of practitioners, academics, and graduate students to examine multiple perspectives of what should be included in a definition of cybersecurity. In this article, we propose a resulting new definition: \"Cybersecurity is the organization and collection of resources, processes, and structures used to protect cyberspace and cyberspace-enabled systems from occurrences that misalign de jure from de facto property rights.\" Articulating a concise, inclusive, meaningful, and unifying definition will enable an enhanced and enriched focus on interdisciplinary cybersecurity dialectics and thereby will influence the approaches of academia, industry, and government and non-governmental organizations to cybersecurity challenges.",
        authors: [{
            name: "Dan",
            surname: "Craigen",
            email: "dan@email.com",
            orcid: ""
        }],
        files: [{
            filename: "articlecyber.pdf",
            contentType: "application/pdf",
            keccak256: "0x064ba2f754ede7e1fe8df4dfe49cccc1b94eca817897625a99e86567eb37b9b0",
            contentLength: "6781"
        }, {
            filename: "ex.png",
            contentType: "image/png",
            contentLength: 15513,
            tags: []
        }],
        status: DEPOSIT_STATUS.published,
        keywords: ["cybersecurity", "science", "engineering"],
        disciplines: ["Cloud computing", "Engineering cybernetics"],
        keccak256: "0x064ba2f754ede7e1fe8df4dfe49cccc1b94eca817897625a99e86567eb37b9b0",
        accessRight: ACCESS_RIGHT.CCBY,
        peerReviews: [],
        publicationDate: "2020-03-31T22:00:00.000Z",
        publicationType: PUBLICATION_TYPE.article,
        reviewType: REVIEW_TYPE.openReview,
        gravatar: "76697df5874c854e3cc8fde1200b4298",
        isLatestVersion: true,
        parent: "245c6521-045a-4d2c-9c98-f59f70211897",
        version: 0,
        references: [],
        createdOn: "2020-11-06T09:23:18.281Z",
    });
    const deposits2 = await DepositModel.create({
        owner: "118218125510733000000",
        title: "Molecular dynamics analysis of N-acetyl-D-glucosamine against specific SARS-CoV-2's pathogenicity factors",
        abstract: "Background: The causative agent of virus disease outbreak in the world identified as SARS-CoV-2 leads to a severe respiratory illness similar to that of SARS and MERS. The pathogen outbreak was declared as a pandemic and by the time of this article, it has claimed 2.19 million lives. ",
        authors: [{
            name: "John",
            surname: "Doe",
            email: "Doe@email.com",
            orcid: ""
        }],
        files: [{
            filename: "article.pdf",
            contentType: "application/pdf",
            keccak256: "0x064ba2f754ede7e1fe8df4dfe49cccc1b94eca817897625a99e86567eb37b9b0",
            contentLength: "6781"
        }, {
            filename: "example.png",
            contentType: "image/png",
            contentLength: 15513,
            tags: []
        }],
        status: DEPOSIT_STATUS.preprint,
        keywords: ["science", "covid", "europe"],
        disciplines: ["Engineering"],
        keccak256: "0x064ba2f754ede7e1fe8df4dfe49cccc1b94eca817897625a99e86567eb37b977",
        accessRight: ACCESS_RIGHT.CCBY,
        peerReviews: [],
        publicationDate: "2020-03-31T22:00:00.000Z",
        publicationType: PUBLICATION_TYPE.article,
        reviewType: REVIEW_TYPE.openReview,
        gravatar: "76697df5874c854e3cc8fde1200b4784",
        isLatestVersion: true,
        parent: "245c6521-045a-4d2c-9c98-f59f70211897",
        version: 0,
        references: [],
        createdOn: "2020-11-06T09:23:18.281Z",
    });
    for (const discipline of disciplines) {
        console.log(`Creating discipline ${discipline}`);
        await DisciplineModel.create({name: discipline});
      }
    process.exit();
};

execute().then();