import { DatePipe } from '@angular/common';
import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';

@Pipe({
  name: 'localDateFormat',
})
export class LocalDateFormatPipe extends DatePipe implements PipeTransform {
  localeLang = navigator.language;
  localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  defaultTimeZone = 'UTC';
  constructor(@Inject(LOCALE_ID) locale: string, private locStorage: StorageService) {
    super(locale);
  }

  localDateFormat = [
    { location: 'asia', format: 'dd/MM/yyyy' },
    { location: 'america', format: 'MM/dd/yyyy' },
  ];

  isSafari: boolean = !!(
    window.navigator.userAgent.toLowerCase().indexOf('safari') !== -1 && window.navigator.userAgent.toLowerCase().indexOf('chrome') === -1
  );

  transform(value: any, format?: string, timezone?: string, locale?: string, noDateConversion?: boolean, existingDateFormat?: string): any {
    if (typeof value === 'number') {
      let dateString: string = ('' + value).split('.').join('').slice(0, 13);
      while (dateString.length < 13) {
        dateString += '0';
      }

      let datestamp = Number.parseInt(dateString);
      if (Number.isInteger(datestamp)) {
        value = datestamp;
      }
    }

    var localData = this.locStorage.get(StorageKeys.CURRENT_ACCOUNT)?.['preferred_time_zone'];
    var code = noDateConversion ? this.defaultTimeZone : localData?.region ? localData?.region : this.defaultTimeZone;
    if (noDateConversion && value instanceof Date) {
      if (this.isSafari) {
        const tzoffset = value.getTimezoneOffset() * 60000; //offset in milliseconds
        value = new Date(value.valueOf() - tzoffset)?.toISOString()?.slice(0, -1)?.toLowerCase()?.split('t')?.[0];
      } else {
        value = value?.getFullYear() + '-' + (value.getMonth() + 1) + '-' + value.getDate() + ' 00:00:00.000Z';
      }
    } else if (Number.isInteger(value)) {
      if (noDateConversion) {
        value = new Date(value).toISOString().substr(0, 10);
      } else {
        value = new Date(value).toISOString();
      }
    } else if (typeof value === 'string') {
      if (this.is_valid_date(value)) {
        value += '.000Z';
      } else if (noDateConversion) {
        if (existingDateFormat) {
          let convertedValue = moment(value, existingDateFormat?.toUpperCase()).format('YYYY-MM-DD hh:mm:ss');
          if (this.is_valid_date(convertedValue)) {
            value = convertedValue += '.000Z';
          }
        } else {
          let convertedValue = moment(value).format('YYYY-MM-DD hh:mm:ss'); //wont work for dd/mm/yyyy
          if (this.is_valid_date(convertedValue)) {
            value = convertedValue += '.000Z';
          }
        }
      }
    }
    let dateFormat: any = format ? format : this.locStorage.get(StorageKeys.CURRENT_PROGRAM)?.['defaultDateFormat'] ?? 'MM/dd/yyyy';

    const dateFormatArr = dateFormat?.split(' ');
    if (dateFormatArr?.length > 1) {
      //if date format = "EX. YYYY-mm-dd h:m a "
      dateFormatArr.forEach((key, index) => {
        if (index == 0) {
          dateFormat = key
            .toLowerCase()
            .replaceAll('mm/', 'MM/')
            .replaceAll('mm-', 'MM-')
            .replaceAll('mmmm', 'MMMM')
            .replaceAll('mmm', 'MMM');
        } else {
          dateFormat = dateFormat + ' ' + key;
        }
      });
    } else {
      dateFormat = dateFormat
        ? dateFormat.toLowerCase().replaceAll('mm/', 'MM/').replaceAll('mm-', 'MM-').replaceAll('mmmm', 'MMMM').replaceAll('mmm', 'MMM')
        : 'dd/MM/yyyy';
    }

    try {
      if (noDateConversion && this.isSafari) {
        value = moment(value, DATE_FORMAT.FORMATYMD).format(dateFormat?.toUpperCase()) ?? value;
        return value;
      }
      let showCode = false;
      if (dateFormat?.includes(' z')) {
        showCode = true;
        dateFormat = dateFormat?.replace(' z', ' ');
      }
      const timezoneOffset = moment(value).tz(code).format('Z');
      let formattedDate = super.transform(
        new Date(value),
        dateFormat || this.getLocalFormatByLocation(this.localTimezone),
        timezone || timezoneOffset, // ? timezone : "America/New_York",
        locale || 'en-US',
      );
      if (showCode) {
        formattedDate += this.getNoZoneFormatedValue(value, code, localData);
      }
      return formattedDate;
    } catch (e) {
      return value;
    }
  }

  getNoZoneFormatedValue(dateValue, code, localData) {
    var zoneValue = moment(dateValue)?.tz(code)?.format('z');
    var lastTwoChars = zoneValue?.toString()?.substring(zoneValue?.length - 2, zoneValue?.length);
    if (!/^[a-zA-Z]+$/.test(lastTwoChars)) {
      return localData?.code || zoneValue;
    } else {
      return zoneValue;
    }
  }

  getLocalFormatByLocation(location) {
    const currentLocation = location.split('/')[0];
    return this.localDateFormat.find(d => d.location === currentLocation.toLowerCase())?.format || 'MM/dd/yyyy';
  }

  is_valid_date(value) {
    //var matches = value?.match(/^d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]) (\d{2}):(\d{2}):(\d{2})$/);
    var date_regex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]) (\d{2}):(\d{2}):(\d{2})$/; // YYYY-mm-dd hh:mm:ss
    return !!date_regex?.test(value);
  }
}
