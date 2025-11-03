import { Injectable } from '@angular/core';
import { CustomcurrencyPipe } from '../pipe/customcurrency.pipe';

@Injectable({
    providedIn: 'root'
})
export class CurrencyService {

    constructor(private currency: CustomcurrencyPipe) { }

    public getCurrencySymbol(currencyCode: string) {
        return this.currency.transform("0", currencyCode?.toUpperCase()).replace(/[0-9]/g, '').replace('.', '');
    }
    public getCurrency(currency: string) {
        return this.currency.transform(currency);
    }
    public getCurrencyFromCode(amount: string, code: string) {
        var position = '';
        if (amount && amount !== 'NaN' && amount.charAt(0) === '-') {
            amount = amount.substring(1, amount.length);
            position = '-';
        }
        if (amount !== 'NaN') {
            return position + this.currency.transform(amount, code);
        } else {
            return '';
        }
    }

}
