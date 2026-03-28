import express from "express";

import { AuthRoutes } from "./auth-router";
import { UserRoutes } from "./user-routes";

const app = express();

const authRouters = new AuthRoutes();
app.use('/auth', authRouters.router);

const userRouters = new UserRoutes();
app.use('/user', userRouters.router);

export const rootRouter = app;