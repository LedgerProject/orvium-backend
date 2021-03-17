import { config } from 'dotenv';

config();

export const environment = {
  name: process.env.ENVIRONMENT || 'development',
  production: false,
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost/orvium',
  publicUrl: process.env.PUBLIC_URL || 'https://dapp.orvium.io',
  test: {
    mongoUri: process.env.TEST_MONGO_URI || 'mongodb://localhost/testdb'
  },
  crypto: {
    key: process.env.SECRET_KEY
  },
};
