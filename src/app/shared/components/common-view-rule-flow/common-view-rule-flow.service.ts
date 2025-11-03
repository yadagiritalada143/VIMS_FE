import { Injectable } from '@angular/core';
import moment from 'moment-timezone';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
/* USAGE: Contains common method implementations to be used for `common-view-rule-flow` component */
export class CommonViewRuleFlowService {

  constructor(private storageService: StorageService) { }

  getTimeStamp(created: number, modified: number, user: string = null,page?) {

    // console.log(user, created, modified);
    if(!created || !modified) {
      return '--';
    }

    let currDate: any = new Date();
    let createdDate: any = new Date(created);
    let modifiedDate: any = new Date(modified);

    if((createdDate == 'Invalid Date') || (modifiedDate == 'Invalid Date')) {
      console.error('Invalid Date: ', createdDate, modifiedDate);
      return '--';
    }

    let isUpdated: boolean = (Math.abs(createdDate - modifiedDate) > 200);
    let result: string = '';
    if(isUpdated) {
      result = 'Last Updated ';
    } else if(page=='vendor-invite-view'){
      result = 'Invited ';
    }else {
      result = 'Created ';
    }

    if(user) {
      result += ('By: ' + user + ' ');
    }

    // Change older than 1 day
    if((currDate - modifiedDate) > 86400000) {
      result += `on ${moment(modifiedDate).utcOffset(this.preferredTimezone?.utc_offset).format(this.dateFormat + ' hh:mm:ss A') + ' ' + this.preferredTimezone?.code}`;
    } else {
      let timeStamp: string = ('' + moment(modifiedDate).fromNow());
      if((timeStamp.charCodeAt(0) >= 48) && (timeStamp.charCodeAt(0) <= 57)) {
        timeStamp = 'about ' + timeStamp;
      }

      result += timeStamp;
    }

    return result;
  }

  get dateFormat(): string {
    let format: string = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat.toUpperCase() ?? 'MM/DD/YYYY';
    return format;
  }

  get preferredTimezone(): any {
    let timezone: any = this.storageService.get(StorageKeys.CURRENT_ACCOUNT)?.preferred_time_zone;
    if(!timezone?.code || !timezone?.utc_offset) {
      timezone = {
        code: (moment.tz(moment.tz.guess()).zoneAbbr()),
        utc_offset: (moment.tz(moment.tz.guess()).utcOffset())
      }
    }
    return timezone;
  }
}
