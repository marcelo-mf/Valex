import { Request, Response } from "express";
import * as cardsServices from "../services/cardsServices.js";

export async function createCard(req: Request, res: Response) {

    const APIKey = req.headers['x-api-key']; // Não consigo colocar o type: string no header
    if(!APIKey) {
        throw {message: 'API Key required'}
    } 

    const cardType = req.body.cardType
    if(cardType !== 'groceries' && cardType !== 'restaurant' && cardType !== 'transport' && cardType !== 'education' && cardType !== 'health') {
        throw {message: 'Invalid type'} //pq da pau quando eu coloco um res.sendStatus ou re.send aqui?????
    }

    await cardsServices.verifyCompanyOwnsAPI(APIKey);
    await cardsServices.checkEmployeeIsRegistered(parseInt(req.body.employeeId));
    await cardsServices.checkEmployeeAlreadyHasThisTypeOfCard(req.body.employeeId, req.body.cardType);
    const cardNumber = await cardsServices.generateCardNumber();
    const cardName = await cardsServices.generateCardName(parseInt(req.body.employeeId));
    const expirationDate = await cardsServices.generateExpirationDate();
    const encryptedCvc = await cardsServices.generateCvc();
    await cardsServices.insertCard(parseInt(req.body.employeeId), req.body.cardType, cardNumber, cardName, expirationDate, encryptedCvc);

    res.status(200).send('Card cretaed!');
}

export async function activateCard(req: Request, res: Response) {

    const {cvc, password} = req.body;
    const cardId: number = parseInt(req.params.id);
    
    await cardsServices.checkIfCardIsRegistered(cardId);
    await cardsServices.checkIfCardIsExpired(cardId);
    await cardsServices.checkIfCardIsActivated(cardId);
    await cardsServices.verifyCvc(cvc, cardId);
    await cardsServices.verifyPassword(password,cardId);
    await cardsServices.activateCard(password, cardId);

    res.status(200).send('Card activated!')

}

export async function viewCardTransactionsAndBalance(req: Request, res: Response) {

    const cardId: number = parseInt(req.params.id);

    await cardsServices.checkIfCardIsRegistered(cardId);
    const response: object = await cardsServices.showBalance(cardId);

    res.status(200).send(response);
}

export async function rechargeCard(req: Request, res: Response) {

    const cardId: number = parseInt(req.params.id);
    const rechargeValue: number = req.body.rechargeValue;

    if(rechargeValue <= 0) {
        throw {message: 'recharge value must be higher than 0'} 
    }

    await cardsServices.checkIfCardIsRegistered(cardId);
    await cardsServices.checkIfCardIsExpired(cardId);
    await cardsServices.rechargeCard(rechargeValue, cardId);

    res.status(200).send('card recharged');
    
}

export async function buyWithCard(req: Request, res: Response) {

    const cardId = parseInt(req.params.id);
    const {purchaseValue, password, businessId} = req.body

    if(purchaseValue <= 0) {
        throw {message: 'purchase value must be higher than 0'} 
    }

    await cardsServices.checkIfCardIsRegistered(cardId);
    await cardsServices.checkIfCardIsExpired(cardId);
    await cardsServices.checkIfPasswordIsRight(password, cardId);
    await cardsServices.checkIfBusinessIsRegistered(businessId);
    await cardsServices.checkBusinessType(businessId, cardId);
    await cardsServices.checkIfThereIsEnoughBalance(cardId, purchaseValue);
    await cardsServices.purchase(cardId, businessId, purchaseValue);

    res.status(200).send('successful payment');
    
}