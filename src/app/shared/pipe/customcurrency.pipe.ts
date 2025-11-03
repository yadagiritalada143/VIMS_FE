import { CurrencyPipe, formatNumber, getCurrencySymbol } from "@angular/common";
import { Pipe, PipeTransform } from "@angular/core";
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
const CURRENCY_SYM: Map<string, string> = new Map([
  ['INR', '₹'],
  ['SAR', 'ر.س'],
  ['AED', 'د.إ'],
  ['TRY', '₺'],
  ['QAR', 'ر.ق'],
  ['CHN', '¥'],
  ['SGD', 'S$']
]);
@Pipe({
  name: "customcurrency"
})
export class CustomcurrencyPipe extends CurrencyPipe implements PipeTransform {
  private defaultCurrency = 'USD';
  private viewCurrencyStrict: any = '0.2-2';
  private view_accuracy: any;
  constructor(private storageService: StorageService) {
    super('en', 'USD');
    this.view_accuracy = this.storageService.get("CurrentProgram")?.config?.currency?.view_accuracy;
    this.viewCurrencyStrict = this.view_accuracy ? `0.${this.view_accuracy}-${this.view_accuracy}`: `0.2-2`;
  }
  transform(
    value: any,
    currencyCode?: string,
    display?: "code" | "symbol" | "symbol-narrow" | string | boolean,
    digitsInfo?: string,
    locale?: string,
    isEditView?: boolean
  ): any {
    if (isEditView) {
      let edit_accuracy = this.storageService.get("CurrentProgram")?.config?.currency?.edit_accuracy;
      this.viewCurrencyStrict = edit_accuracy ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewCurrencyStrict;
    }
    if (currencyCode) {
      currencyCode = currencyCode?.toUpperCase();
    }
    if (!isEditView) {
      if (value !== '' && value !== undefined && value !== null && value !== 0) {
        value = this.trimValue(value);
      }
    }
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (currencyCode === 'SYMBOL') {
      currencyCode = display ? display : (currentProgram['defaultCurrency'] ? currentProgram['defaultCurrency']?.toUpperCase(): this.defaultCurrency);
      let currencyValue = super.transform(0, currencyCode, true, this.viewCurrencyStrict);
      return currencyValue?.replace(/[0-9.]/g, '');
    } else if (value === '' || value === undefined || value === null) {
      return getCurrencySymbol(currencyCode ?? currentProgram['defaultCurrency']?.toUpperCase() ?? this.defaultCurrency, 'narrow', locale);
    } else if (!currencyCode) {
      currencyCode = currentProgram['defaultCurrency'] ? currentProgram['defaultCurrency'].toUpperCase() : this.defaultCurrency;
    } else if (CURRENCY_SYM.has(currencyCode)) {
      return this.convertToFormat(currencyCode, value);
    }
    if (isEditView) {
      let returnVal: string = super.transform(
        value,
        undefined,
        undefined,
        digitsInfo || this.viewCurrencyStrict,
        undefined
      );
      if (returnVal?.length > 1) {
        returnVal = returnVal?.replace(/,/g, '');
        return returnVal?.substr(1, returnVal?.length - 1);
      }
      else {
        return "";
      }
    }
    else {
        return super.transform(
          value,
          currencyCode || this.defaultCurrency,
          display || "symbol",
          digitsInfo || this.viewCurrencyStrict,
          locale
        );
    }
  }
  convertToFormat(currency, amt) {
    amt = parseFloat(amt);
    if (amt !== null && amt !== undefined) {
      const point = (amt.toString())?.split(".");
      let afterPoint = formatNumber(Number(`.${point[1]}`), 'en-un', this.viewCurrencyStrict)?.split('.')[1]
      if (!afterPoint) {
        afterPoint = '00'
      }
      amt = point[0]
      var lastThree = amt.substring(amt.length - 3);
      var otherNumbers = amt.substring(0, amt.length - 3);
      if (otherNumbers != "") lastThree = "," + lastThree;
      var result = `${CURRENCY_SYM.get(currency)}${otherNumbers?.replace(/\B(?=(\d{2})+(?!\d))/g, ",")}${lastThree}.${afterPoint}`;
      return result;
    } else {
      return amt;
    }
  }
  trimValue(num) {
    num = num?.toString();
    if (num && num?.indexOf(".") !== -1) {
      return (num?.split('.')[0] || []) + '.' + (num?.split('.')[1])?.substring(0, this.view_accuracy);
    }
    return (+num);
  }
}