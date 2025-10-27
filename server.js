import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';

import { makeExecutableSchema } from '@graphql-tools/schema';
import { useServer } from 'graphql-ws/use/ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import resolvers, { pubsub } from './graphql/resolvers.js';
import typeDefs from './graphql/typeDefs.js';
import BillingAccount from './models/BillingAccount.js';
import User from './models/User.js';

const startServer = async () => {
    const app = express();
    app.use(
        cors({
            origin: '*',
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        })
    );
    app.options('*', cors());

    const httpServer = createServer(app);

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    const apollo = new ApolloServer({ schema, introspection: true });

    await apollo.start();
    apollo.applyMiddleware({ app, path: '/graphql', cors: false });

    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });

    const serverCleanup = useServer({ schema }, wsServer);

    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    try {
        const userStream = User.watch([], { fullDocument: 'default' });
        userStream.on('change', async () => {
            const [users, billingAccounts] = await Promise.all([
                User.estimatedDocumentCount(),
                BillingAccount.estimatedDocumentCount(),
            ]);
            pubsub.publish('COUNTS_UPDATED', { countsUpdated: { users, billingAccounts } });
        });

        const billingStream = BillingAccount.watch([], { fullDocument: 'default' });
        billingStream.on('change', async () => {
            const [users, billingAccounts] = await Promise.all([
                User.estimatedDocumentCount(),
                BillingAccount.estimatedDocumentCount(),
            ]);
            pubsub.publish('COUNTS_UPDATED', { countsUpdated: { users, billingAccounts } });
        });
    } catch (e) {
        console.warn(
            'Change Streams not available. Ensure MongoDB is a replica set / Atlas.\n',
            e?.message
        );
    }

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, (data) => {
        console.log('data ---', data);
        console.log(`HTTP  ready at http://localhost:${PORT}${apollo.graphqlPath}`);
        console.log(`WS    ready at ws://localhost:${PORT}${apollo.graphqlPath}`);
    });

    ['SIGINT', 'SIGTERM'].forEach((sig) => {
        process.on(sig, async () => {
            await serverCleanup.dispose();
            await apollo.stop();
            process.exit(0);
        });
    });
};

startServer();
