import { findByTypeAndEmployeeId, insert, update } from "../repositories/cardRepository.js";
import { findByApiKey } from "../repositories/companyRepository.js";
import { findByCardId as findAllRechargesById } from "../repositories/rechargeRepository.js";
import { findById } from "../repositories/employeeRepository.js";
import { findByCardId as findAllPurchasesById } from "../repositories/paymentRepository.js";
import { findById as findByCardId } from "../repositories/cardRepository.js";
import { insert as insertRecharge } from "../repositories/rechargeRepository.js";
import { insert as insertPayment } from "../repositories/paymentRepository.js";
import { findById as findBussinesById} from "../repositories/businessRepository.js";
import { faker } from '@faker-js/faker';
import dayjs from "dayjs";
import bcrypt from 'bcrypt';

export async function verifyCompanyOwnsAPI(APIKey) {
    
    const APIKeyExists = await findByApiKey(APIKey)

    if(!APIKeyExists) {
        throw {message: 'Invalid API Key'}
    }
}

export async function checkEmployeeIsRegistered(id: number) {
    
    const registeredEmployee = await findById(id)

    if(!registeredEmployee) {
        throw {message: 'This enployee do not exists'}
    }
}

export async function checkEmployeeAlreadyHasThisTypeOfCard(id: number, type) {
    
    const alreadyHas = await findByTypeAndEmployeeId(type, id)

    if(alreadyHas) {
        throw {message:'Employee already has this type of card'};
    }
}

export async function generateCardNumber() {
    
    const cardNumber = faker.finance.creditCardNumber('visa');
    
    return cardNumber;
}

export async function generateCardName(id: number) {
    
    const name = (await findById(id)).fullName
    const nameArray = name.split(' ');
    const cardNameArray = [];

    for(let i = 0; i < nameArray.length; i++) {
        if(i === 0 || i === nameArray.length - 1) {
            cardNameArray.push(nameArray[i])
        } else if ((i !== 0 && i !== nameArray.length - 1) && nameArray[i].length < 4) {
            continue
        } else if (i !== 0 && i !== nameArray.length - 1) {
            const firstLetter = nameArray[i].substr(0, 1);
            cardNameArray.push(firstLetter)
        }
    }

    const cardName = cardNameArray.join(' ').toUpperCase(); 
    
    return cardName;
}

export async function generateExpirationDate() {

    const expirationDate = dayjs().add(5, 'year').format('MM/YY');
    
    return expirationDate;
}

export async function generateCvc() {

    const cvc = faker.finance.creditCardCVV();
    const encryptedCvc = bcrypt.hashSync(cvc, 10);
    console.log(cvc);
    
    return encryptedCvc;
}

export async function insertCard(employeeId: number, cardType, cardNumber: string, cardName: string, expirationDate: string, encryptedCvc: string) {

    const cardData = {
        employeeId: employeeId, 
        number: cardNumber,
        cardholderName: cardName,
        securityCode: encryptedCvc,
        expirationDate: expirationDate,
        isVirtual: true,
        isBlocked: true,
        type: cardType}
    
    await insert(cardData);

}

export async function checkIfCardIsRegistered(id: number) {

    const isRegistered = await findByCardId(id);

    if(!isRegistered) {
        throw {message: 'card is not registered'};
    }
}

export async function checkIfCardIsExpired(id: number) {

    const card = await findByCardId(id);
    const expirationDate = card.expirationDate;
    const currentDate = dayjs().format('MM/YY');
    const isntExpired = dayjs(currentDate).isBefore(expirationDate);
    const isExpired = !isntExpired;

    if(isExpired) {
        throw {message: 'expired card'};
    }
}

export async function checkIfCardIsActivated(id: number) {

    const card = await findByCardId(id);

    if(card.password) {
        throw {message: 'card is already activated'};
    }
}

export async function verifyCvc(cvc, id: number) {

    const card = await findByCardId(id);
    const isCvcCorrect = bcrypt.compareSync(cvc, card.securityCode)
    const incorrectCvc = !isCvcCorrect

    if(incorrectCvc) {
        throw {message: 'cvc is wrong'};
    }
}

export async function verifyPassword(password, id: number) {

    const card = await findByCardId(id);
    const validPassword = /^[0-9]{4}$/.test(password)

    if(!validPassword) {
        throw {message: 'invalid password'};
    }
}

export async function activateCard(password, id: number) {

    const encryptedPassword = bcrypt.hashSync(password, 10);

    await update(id, {password: encryptedPassword});

}

export async function rechargeCard(rechargeValue:number, id: number) {

    await insertRecharge({cardId: id, amount: rechargeValue})

}

export async function checkIfPasswordIsRight(password, id: number) {

    const card = await findByCardId(id);
    const isPasswordCorrect = bcrypt.compareSync(password, card.password)
    const incorrectPassword = !isPasswordCorrect

    if(incorrectPassword) {
        throw {message: 'Password is wrong'};
    }
}

export async function checkIfBusinessIsRegistered(businessId: number) {

    const isRegistered = await findBussinesById(businessId);

    if(!isRegistered) {
        throw {message: 'Business not registered'};
    }
}

export async function checkBusinessType(businessId: number, cardId: number) {

    const businessType = (await findBussinesById(businessId)).type;
    const cardType = (await findByCardId(cardId)).type;

    if(businessType !== cardType) {
        throw {message: 'Not allowed to buy with this type of card'};
    }
}

export async function checkBalance(cardId: number) {

    const recharges = (await findAllRechargesById(cardId));
    const totalRecharges = recharges.reduce((total, recharge) => total + recharge.amount, 0);

    const purchases = (await findAllPurchasesById(cardId));
    const totalPurchases = purchases.reduce((total, purchase) => total + purchase.amount, 0);

    const balance = totalRecharges - totalPurchases;
    
    return balance;
}

export async function checkIfThereIsEnoughBalance(cardId: number, purchaseValue: number) {

    const balance = await checkBalance(cardId);

    if(balance < purchaseValue) {
        throw {message: 'insufficient balance'}
    }
}

export async function purchase(cardId, businessId, purchaseValue) {

    await insertPayment({cardId: cardId, businessId: businessId, amount: purchaseValue})
}

export async function showBalance(cardId: number) {

    const balance = await checkBalance(cardId);
    const recharges = (await findAllRechargesById(cardId));
    const purchases = (await findAllPurchasesById(cardId));
    const response = {balance: balance, transactions: purchases, recharges: recharges}
    
    return response;
}