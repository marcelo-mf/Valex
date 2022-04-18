import express, { json } from "express";
import cors from "cors";
import "express-async-errors";
import cardsRouter from "./routers/cardsRouter.js";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware.js";


const app = express();
app.use(json());
app.use(cors());
app.use(cardsRouter);
app.use(errorHandlerMiddleware);


const PORT  = process.env.PORT || 5000;
app.listen(PORT, () => console.log("running on port " + PORT));