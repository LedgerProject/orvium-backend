# orvium-backend
## Description

This is the backend api for Orvium project.

This version corresponds to the LEDGER deliverable Prototype #2. In this version, the application uses the Orvium backend to interact and persist data.

The Orvium API uses [Nest](https://github.com/nestjs/nest) framework. Nest supports dependency injection so you can provide
your own service providers for testing and running the API (check `LocalStorageService` as example).

## Dependencies

This api uses expects a mongo database available to store persistent data.
You can run mongo db using docker:

```bash
docker run -d -p 27017:27017 --name ledger-mongo -v ledgervol:/data/db mongo:4.2.5

```

## Install

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

## Execute init database script

This script adds some test data.

```bash
# Install ts-node
npm i -g ts-node

# execute bd migration script to fill the database with some data
export MONGO_URI='mongodb://localhost:27017/orvium'
ts-node-script scripts/bd-data.ts
```
