import { config } from 'dotenv';

config();

export const environment = {
  name: process.env.ENVIRONMENT || 'development',
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost/orvium',
  senderEmail: process.env.SENDER_EMAIL,
  adminEmail: process.env.ADMIN_EMAIL,
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:4200',
  test: {
    mongoUri: process.env.TEST_MONGO_URI || 'mongodb://localhost/testdb'
  },
  crypto: {
    key: process.env.SECRET_KEY
  },
  push_notifications_private_key: process.env.PUSH_NOTIFICATIONS_PRIVATE_KEY,
  push_notifications_public_key: process.env.PUSH_NOTIFICATIONS_PUBLIC_KEY,
  datacite: {
    url: process.env.DATACITE_URL || '',
    enable: process.env.DATACITE_ENABLE || false,
  },
  smtp: {
    host: 'email-smtp.example.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  },
};
