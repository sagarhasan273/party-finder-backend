import express from "express";

import { AuthRoutes } from "./auth-router";
import { MatchRoutes } from "./match.router";
import { UserRoutes } from "./user-router";

const app = express();

const authRouters = new AuthRoutes();
app.use('/auth', authRouters.router);

const userRouters = new UserRoutes();
app.use('/user', userRouters.router);

const matchRouters = new MatchRoutes();
app.use('/api/matches', matchRouters.router);

export const rootRouter = app;