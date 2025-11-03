import { CurrencyPipe, DecimalPipe, formatNumber, getCurrencySymbol } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';

const CURRENCY_SYM: Map<string, string> = new Map([
  ['INR', '₹'],
  ['SAR', 'ر.س'],
  ['AED', 'د.إ'],
  ['TRY', '₺'],
  ['QAR', 'ر.ق'],
  ['CHN', '¥'],
  ['SGD', 'S$'],
]);

@Pipe({
  name: 'accuracy',
})
export class AccuracyPipe extends CurrencyPipe implements PipeTransform {
  private defaultCurrency = 'USD';
  private viewNumberStrict: any = '0.2-2';
  accuracyData: any = null;
  scalingLimit: any = '00';
  locale: any = 'en-un';

  constructor(private storageService: StorageService, private decimalPipe: DecimalPipe, private _alert: AlertService) {
    super('en', 'USD');
  }

  /*
    @param value : value to be formatted
    @param accuracyType : type of rounding
    @param config?.currencyCode : currency code
    @param config?.display : display type or symbol type ('code' | 'symbol' | 'symbol-narrow' | string | boolean)
    @param config?.valueType : type of value
    @param config?.locale : locale
    @param config?.isEdit : boolean
    @param config?.view_accurate : boolean
    @return : formatted value
  */
  transform(value: any, accuracyType?: string, config?: any): any {
    /**************************************************************************************************
    Sample usage Example (Considering the accuracyType 'amount' and 'amount_percentage' has scale as 2):
    1) For value as currency just replace the amount with respective value of accuracyType
    -> {{ 1234 | accuracy : 'amount' : { currencyCode: 'USD' } }} --> $1,234.00

    2) For value as percentage just replace the amount_percentage with respective value of accuracyType
    -> {{ 25 | accuracy : 'amount_percentage' : { currencyCode: 'USD' } }} --> 25.00%

    Note : passing config?.currencyCode is optional, if not passed default currency code will be used
           from local storage
    Ex: {{ 1234 | accuracy : 'amount' }} --> $1,234.00
    Ex: {{ 25 | accuracy : 'amount_percentage' }} --> 25.00%

    3) For currency symbol just replace the currency code.
    -> For INR - {{ '' | accuracy : '' : { currencyCode: 'INR', display: 'symbol' } }} --> ₹
    -> For USD - {{ '' | accuracy : '' : { currencyCode: 'USD', display: 'symbol' } }} --> $
    -> For SAR - {{ '' | accuracy : '' : { currencyCode: 'SAR', display: 'symbol' } }} --> ر.س

    4) For the numbers to be patched in the time of edit, whill have is edit as true and the number
       will be returned by maintaning the accuracy but no formatting shall be done!
    -> (1234.123456, 'amount', { isEdit: true }) --> 1234.12
    -> (1234.123456, 'amount_percentage', { isEdit: true }) --> 1234.12
    **************************************************************************************************/

    this.initAccuracyConfig();

    let currencyCode: string,
      valueType: string,
      display: 'code' | 'symbol' | 'symbol-narrow' | string,
      locale: string,
      isEdit: boolean,
      digitInfo: String,
      view_accurate: boolean;

    if (typeof config === 'undefined' || typeof config === 'object') {
      currencyCode = config?.currencyCode;
      valueType = config?.valueType;
      display = config?.display;
      this.locale = locale = config?.locale || this.locale;
      isEdit = config?.isEdit;
      digitInfo = config?.digitInfo;
      view_accurate = config?.view_accurate;
    } else {
      this._alert.error('Please send the config in Accuracy pipe as an Object or skip, if not required!');
    }

    if (currencyCode) {
      currencyCode = currencyCode?.toUpperCase();
    }

    if (display?.toLocaleLowerCase() === 'symbol' && (value === '' || value === undefined || value === null)) {
      // If value is empty and value type is symbol then return symbol
      const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      if (CURRENCY_SYM.has(currencyCode)) {
        return CURRENCY_SYM.get(currencyCode);
      } else {
        return getCurrencySymbol(
          currencyCode ?? currentProgram['defaultCurrency']?.toUpperCase() ?? this.defaultCurrency,
          'narrow',
          locale,
        );
      }
    }

    /* If accuracyType is not null and accuracyData is not null
       then implement the logic of accuracyType and return the value */
    accuracyType = accuracyType?.toLowerCase();

    //  if view_accurate is false then return the value without any formatting or accuracy logic

    if (!view_accurate) {
      this.viewNumberStrict = this.showOriginalValues(value, accuracyType);
    }

    // check if accuracyType includes 'percentage'
    valueType =
      valueType ??
      (accuracyType ? (accuracyType.includes('percentage') ? 'percentage' : accuracyType === 'hour' ? 'hour' : 'currency') : '');
    if (this.accuracyData && view_accurate) {
      value = this.roundByType(
        value,
        this.accuracyData?.[accuracyType]?.precision_type || null,
        this.accuracyData?.[accuracyType]?.scale || null,
        this.accuracyData?.[accuracyType]?.threshold || null,
      );
    }

    // When isEdit is true, number formatting will not happen
    if (isEdit) {
      if (
        !this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.accuracy_config ||
        !this.storageService.get(StorageKeys.ACCURACY_CONFIG)
      ) {
        let edit_accuracy = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.currency?.edit_accuracy;
        this.viewNumberStrict = edit_accuracy ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewNumberStrict;
      }
      return this.decimalPipe.transform(value, this.viewNumberStrict, locale)?.replace(/\,/g, '');
    }
    // if (isEdit) return +value;

    switch (valueType?.toLocaleLowerCase()) {
      case 'currency':
        if (!currencyCode) {
          const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
          currencyCode = currentProgram?.['defaultCurrency'] ? currentProgram?.['defaultCurrency'].toUpperCase() : this.defaultCurrency;
        }
        /* NOT REQUIURED */
        // if (CURRENCY_SYM.has(currencyCode)) {
        //   return this.convertToFormat(currencyCode, value);
        // else {
        value = super.transform(
          value,
          currencyCode || this.defaultCurrency,
          display || 'symbol-narrow',
          digitInfo || this.viewNumberStrict,
          locale || 'en-un',
        );
        return value;
      // }

      case 'percentage':
        if (this.viewNumberStrict) {
          value = this.decimalPipe.transform(value, this.viewNumberStrict, locale);
        }
        return value + '%';

      case 'hour':
        if (this.viewNumberStrict) {
          value = this.decimalPipe.transform(value, this.viewNumberStrict, locale);
        }
        return value;

      default:
        // For Default case return the value as it is with 2 decimal places
        value = this.truncate(value, 2);
        return value;
    }
  }

  initAccuracyConfig() {
    // check the accuracy config status from local storage
    if (
      this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.accuracy_config &&
      this.storageService.get(StorageKeys.ACCURACY_CONFIG)
    ) {
      // if accuracy config is present in local storage then get the accuracy config from local storage
      this.accuracyData = this.storageService.get(StorageKeys.ACCURACY_CONFIG);
    } else if (this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.currency?.view_accuracy >= 0) {
      this.accuracyData = null;
      const accuracyVal = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.currency?.view_accuracy;
      this.viewNumberStrict = `0.${accuracyVal}-${accuracyVal}`;
    }
  }

  showOriginalValues(value, accuracyType) {
    if (!accuracyType) {
      let decimalPlaces = this.getDecimalPlaces(value);
      this.viewNumberStrict = `0.${decimalPlaces ?? 2}-${decimalPlaces ?? 2}`;
      return this.viewNumberStrict;
    }
    value = +value + '';
    let decimalPlaces = this.getDecimalPlaces(value);
    if (
      this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.accuracy_config &&
      this.storageService.get(StorageKeys.ACCURACY_CONFIG)
    ) {
      if (decimalPlaces >= this.accuracyData?.[accuracyType]?.scale) {
        this.viewNumberStrict = `0.${decimalPlaces}-${decimalPlaces}`;
      } else {
        if(this.accuracyData?.[accuracyType]?.scale)
          this.viewNumberStrict = `0.${this.accuracyData?.[accuracyType]?.scale}-${this.accuracyData?.[accuracyType]?.scale}`;
        else {
          let view_accuracy = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.currency?.view_accuracy;
          view_accuracy = view_accuracy == undefined || view_accuracy == null ? 2 : view_accuracy;
          this.viewNumberStrict = `0.${view_accuracy}-${view_accuracy}`;
        }
      }
    } else {
      let view_accuracy = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.currency?.view_accuracy;
      view_accuracy = view_accuracy == undefined || view_accuracy == null ? 2 : view_accuracy;
      // if (value) {
      //   if (decimalPlaces >= view_accuracy) {
      //     this.viewNumberStrict = `0.${decimalPlaces}-${decimalPlaces}`;
      //   } else {
      //     this.viewNumberStrict = `0.${view_accuracy}-${view_accuracy}`;
      //   }
      // }
      this.viewNumberStrict = `0.${view_accuracy}-${view_accuracy}`;
    }
    return this.viewNumberStrict;
  }

  /*
    @param currency : currency code
    @param value : amount to be formatted
    @return : formatted amount with currency symbol
  */
  convertToFormat(currency: string, value: any) {
    value = parseFloat(value);
    if (value !== null && value !== undefined) {
      const point = value.toString()?.split('.');
      let afterPoint = formatNumber(Number(`.${point[1]}`), 'en-un', this.viewNumberStrict)?.split('.')[1];
      if (!afterPoint) {
        afterPoint = this.scalingLimit?.toString()?.substring(1, this.scalingLimit);
      }
      value = point[0];
      var lastThree = value.substring(value.length - 3);
      var otherNumbers = value.substring(0, value.length - 3);
      if (otherNumbers != '') lastThree = ',' + lastThree;
      var result = `${CURRENCY_SYM.get(currency)}${otherNumbers?.replace(/\B(?=(\d{2})+(?!\d))/g, ',')}${lastThree}.${afterPoint}`;
      return result;
    } else {
      return value;
    }
  }

  /*
    @param value : value to be rounded
    @param scale : number of digits after decimal point
    @param precision_type : type of rounding
    @param threshold : threshold value for rounding up and down
    @param isFunction : boolean to check if the function is called directly or from pipe
    viewNumberStrict : number of digits after decimal point depending on scale
  */

  roundByType(value: any, precision_type: string, scale: number, threshold?: number, isFunction?: boolean): number {
    if (scale === 0) {
      return this.truncate(value, 0);
    } else if (scale === null || scale === undefined || !precision_type) {
      return value;
    }

    this.viewNumberStrict = `0.${scale}-${scale}`;
    this.scalingLimit = Math.pow(10, scale);

    if (typeof value === 'number') {
      value = value?.toString();
    }

    // Add extra zero till scale if there is only one digit after decimal point
    if (value?.split('.')[1]?.length === 1) {
      value = value + '0'.repeat(scale - 1);
    }

    var newValue: any;

    //  Pass isFunction as true if you want to use this function directly else normal pipe flow will be executed
    if (isFunction) {
      if (precision_type === 'truncate') {
        newValue = this.truncate(value, scale);
      } else if (precision_type === 'round_up') {
        newValue = this.roundUp(value, scale, threshold);
      } else if (precision_type === 'round_down') {
        newValue = this.roundDown(value, scale, threshold);
      }
      newValue = this.decimalPipe.transform(newValue, this.viewNumberStrict, this.locale)?.replace(/\,/g, '');
    } else {
      newValue = this.truncate(value, scale);
    }
    return newValue;
  }

  roundUp(value: any, scale: number, threshold: number): number {
    const decimal = this.getDecimalPlaces(value);
    if (decimal <= scale) {
      return value;
    }
    value = this.truncate(value, scale + 1);
    let lastDigitvalue = parseInt(value?.toString()?.charAt(value.toString()?.length - 1));
    if (lastDigitvalue >= threshold) {
      return Math.ceil(value * Math.pow(10, scale)) / Math.pow(10, scale);
    }
    return this.truncate(value, scale);
  }

  roundDown(value: any, scale: number, threshold: number): number {
    const decimal = this.getDecimalPlaces(value);
    if (decimal <= scale) {
      return value;
    }
    value = this.truncate(value, scale + 1);
    let lastDigitvalue = parseInt(value?.toString()?.charAt(value.toString()?.length - 1));
    if (lastDigitvalue <= threshold) {
      value = (Math.floor(value * Math.pow(10, scale)) / Math.pow(10, scale)).toString();
      return value.substr(0, value.length - 1) + (+value.charAt(value.length - 1) - 1);
    }
    return this.truncate(value, scale);
  }

  truncate(value: any, scale: number): number {
    var re = new RegExp('^-?\\d+(?:.\\d{0,' + (scale || -1) + '})?');
    return value?.toString()?.match(re)?.[0];
  }

  getDecimalPlaces(value: string) {
    return value?.toString()?.split('.')[1]?.length || 0;
  }
}
