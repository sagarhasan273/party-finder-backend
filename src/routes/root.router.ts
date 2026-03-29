import express from "express";

import { AuthRoutes } from "./auth-router";
import { InventoryRoutes } from "./inventory.router";
import { UserRoutes } from "./user-router";

const app = express();

const authRouters = new AuthRoutes();
app.use('/auth', authRouters.router);

const userRouters = new UserRoutes();
app.use('/user', userRouters.router);

const inventoryRouters = new InventoryRoutes();
app.use('/inventory', inventoryRouters.router);

export const rootRouter = app;