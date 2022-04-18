import { Router } from "express";
import * as cardsController from "../controllers/cardsController.js";

const cardsRouter = Router();

cardsRouter.post("/card/create", cardsController.createCard)
cardsRouter.post("/card/activate/:id", cardsController.activateCard)
cardsRouter.get("/card/view/:id", cardsController.viewCardTransactionsAndBalance)
cardsRouter.post("/card/recharge/:id", cardsController.rechargeCard)
cardsRouter.post("/card/buy/:id", cardsController.buyWithCard)

export default cardsRouter;