import { DatePipe } from '@angular/common';
import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import * as moment from 'moment-timezone';
@Pipe({
  name: 'localDateTimeFormat',
})
export class LocalDateTimeFormatPipe extends DatePipe implements PipeTransform {
  localeLang = navigator.language;
  localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  defaultTimeZone:string= "UTC";
  
  constructor(@Inject(LOCALE_ID) locale: string, private locStorage: StorageService) {
    super(locale);
  }

  localDateFormat = [
    { location: 'asia', format: 'dd/MM/yyyy h:mm a' },
    { location: 'america', format: 'MM/dd/yyyy h:mm a' },
  ];

  transform(value: any, format?: string, timezone?: string, locale?: string, noDateConversion?:boolean): any {
    /* let dateFormat: any = format ? format : this.locStorage.get(StorageKeys.CURRENT_PROGRAM)['defaultDateFormat'];
    dateFormat = dateFormat ? dateFormat.toLowerCase().replaceAll('m', 'M') : 'dd/MM/yyyy';

    try {
      const formattedDate = super.transform(
        value,
        (dateFormat || this.getLocalFormatByLocation(this.localTimezone)) + ' h:mm a',
        timezone,
        locale,
      );
      return formattedDate;
    } catch (e) {
      return value;
    } */
    var localData = this.locStorage.get(StorageKeys.CURRENT_ACCOUNT)['preferred_time_zone'];
    var code =  noDateConversion ? this.defaultTimeZone :  (localData?.region ? localData?.region : this.defaultTimeZone) ;
    if(noDateConversion && value instanceof Date){
      value= value?.getFullYear()+"-"+(value.getMonth()+1)+"-"+value.getDate()+" 00:00:00.000Z";
    }else if (Number.isInteger(value)) {
      if(noDateConversion){
        value = new Date(value).toISOString().substr(0, 10);
      }else{
        value = new Date(value).toISOString();
      }
    } else if (typeof value === "string"){
      if(this.is_valid_date(value)){
        value += ".000Z";
      }
    }
    let dateFormat: any = format ? format : this.locStorage.get(StorageKeys.CURRENT_PROGRAM)['defaultDateFormat'];

    const dateFormatArr=dateFormat?.split(" ");
    if(dateFormatArr.length>1){  //if date format = "EX. YYYY-mm-dd h:m a "
      dateFormatArr.forEach((key,index) => {
        if(index==0){
          dateFormat =  key.toLowerCase().replaceAll('mm/', 'MM/').replaceAll('mm-', 'MM-').replaceAll('mmmm', 'MMMM')
        }else{
          dateFormat =dateFormat+' '+key;
        }
      });
    }else{
      dateFormat = dateFormat ? dateFormat.toLowerCase().replaceAll('mm/', 'MM/').replaceAll('mm-', 'MM-').replaceAll('mmmm', 'MMMM') : 'dd/MM/yyyy';
    }


    try {
      let showCode= false;
      if(dateFormat?.includes(" z")){
        showCode= true;
        dateFormat=dateFormat?.replace(" z", " ");
      }
      const timezoneOffset = moment(value).tz(code).format('Z');
      let formattedDate = super.transform(
        new Date(value),
        dateFormat || this.getLocalFormatByLocation(this.localTimezone) + ' hh:mm a z',
         timezone || timezoneOffset,// ? timezone : "America/New_York",
        locale,
      );
      if(showCode){
        formattedDate += this.getNoZoneFormatedValue(value, code, localData);
      }
      return formattedDate;
    } catch (e) {
      return value;
    }
  }

  getNoZoneFormatedValue(dateValue,code,localData){
    var zoneValue = moment(dateValue)?.tz(code)?.format('z');
    var lastTwoChars = zoneValue?.toString()?.substring(zoneValue?.length-2, zoneValue?.length);
    if(!(/^[a-zA-Z]+$/.test(lastTwoChars))){
      return (localData?.code || zoneValue);
    }else{
      return zoneValue;
    }
  }

  is_valid_date(value) {
   //var matches = value?.match(/^d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]) (\d{2}):(\d{2}):(\d{2})$/);
    var date_regex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]) (\d{2}):(\d{2}):(\d{2})$/; // YYYY-mm-dd hh:mm:ss
    if ((date_regex?.test(value))) {
        return true;
    }else{
      return false;
    }
  }

  getLocalFormatByLocation(location) {
    if (location) {
      const currentLocation = location.split('/')[0];
      return this.localDateFormat.find(d => d.location === currentLocation.toLowerCase())?.format || 'MM/dd/yyyy';
    }
  }
}
