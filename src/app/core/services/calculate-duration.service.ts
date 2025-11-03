import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CalculateDurationService {

  constructor() { }


  calculateTimeValue(time: any) {
    let hours = Number(time.split(':')[0])
    let minutes = Number(time.split(':')[1])
    return (hours*60) + minutes;
  }
  
  parseFromAmPmToTwentyFour(time: string): any {
    let hours = Number(time.match(/^(\d+)/)[1]);
    let minutes = Number(time.match(/:(\d+)/)[1]);
    const AMPM = time.match(/\s(.*)$/)[1];
    if ((AMPM == "PM" || AMPM == "pm") && hours < 12) hours = hours + 12;
    if ((AMPM == "AM" || AMPM == "am")&& hours == 12) hours = hours - 12;
    let sHours = hours.toString();
    let sMinutes = minutes.toString();
    if (hours < 10) sHours = "0" + sHours;
    if (minutes < 10) sMinutes = "0" + sMinutes;
    return this.calculateTimeValue(`${sHours}:${sMinutes}`);
  }

  calculateDuration(sTime: any, eTime: any) {
    let startTime = this.parseFromAmPmToTwentyFour(sTime);
    let endTime = this.parseFromAmPmToTwentyFour(eTime);
    let duration;
    duration = endTime - startTime;
    if(duration > 60) {
        let hours = Math.trunc(duration/60);
        let minute = duration%60;
        duration = `${hours} h ${minute}`
      }
      // this.editDuration = duration;
      return duration;
  }

}
