import 'dotenv/config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import cors from 'cors';

import typeDefs from './graphql/typeDefs.js';
import resolvers from './graphql/resolvers.js';

const startServer = async () => {
    const app = express();
    app.use(cors());
    const server = new ApolloServer({ typeDefs, resolvers, introspection: true });

    await server.start();
    server.applyMiddleware({ app });

    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    app.listen({ port: 4000 }, () =>
        console.log(`Server ready at http://localhost:4000${server.graphqlPath}`)
    );
};

startServer();
