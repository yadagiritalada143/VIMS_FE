import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.scss']
})
export class TimePanelComponent implements OnInit {

  timeArray:any= [];
  times:any=[{"id":"12-0am","time":"12:00 AM"},{"id":"12-15am","time":"12:15 AM"},{"id":"12-30am","time":"12:30 AM"},{"id":"12-45am","time":"12:45 AM"},{"id":"01-0am","time":"01:00 AM"},{"id":"01-15am","time":"01:15 AM"},{"id":"01-30am","time":"01:30 AM"},{"id":"01-45am","time":"01:45 AM"},{"id":"02-0am","time":"02:00 AM"},{"id":"02-15am","time":"02:15 AM"},{"id":"02-30am","time":"02:30 AM"},{"id":"02-45am","time":"02:45 AM"},{"id":"03-0am","time":"03:00 AM"},{"id":"03-15am","time":"03:15 AM"},{"id":"03-30am","time":"03:30 AM"},{"id":"03-45am","time":"03:45 AM"},{"id":"04-0am","time":"04:00 AM"},{"id":"04-15am","time":"04:15 AM"},{"id":"04-30am","time":"04:30 AM"},{"id":"04-45am","time":"04:45 AM"},{"id":"05-0am","time":"05:00 AM"},{"id":"05-15am","time":"05:15 AM"},{"id":"05-30am","time":"05:30 AM"},{"id":"05-45am","time":"05:45 AM"},{"id":"06-0am","time":"06:00 AM"},{"id":"06-15am","time":"06:15 AM"},{"id":"06-30am","time":"06:30 AM"},{"id":"06-45am","time":"06:45 AM"},{"id":"07-0am","time":"07:00 AM"},{"id":"07-15am","time":"07:15 AM"},{"id":"07-30am","time":"07:30 AM"},{"id":"07-45am","time":"07:45 AM"},{"id":"08-0am","time":"08:00 AM"},{"id":"08-15am","time":"08:15 AM"},{"id":"08-30am","time":"08:30 AM"},{"id":"08-45am","time":"08:45 AM"},{"id":"09-0am","time":"09:00 AM"},{"id":"09-15am","time":"09:15 AM"},{"id":"09-30am","time":"09:30 AM"},{"id":"09-45am","time":"09:45 AM"},{"id":"10-0am","time":"10:00 AM"},{"id":"10-15am","time":"10:15 AM"},{"id":"10-30am","time":"10:30 AM"},{"id":"10-45am","time":"10:45 AM"},{"id":"11-0am","time":"11:00 AM"},{"id":"11-15am","time":"11:15 AM"},{"id":"11-30am","time":"11:30 AM"},{"id":"11-45am","time":"11:45 AM"},{"id":"12-0pm","time":"12:00 PM"},{"id":"12-15pm","time":"12:15 PM"},{"id":"12-30pm","time":"12:30 PM"},{"id":"12-45pm","time":"12:45 PM"},{"id":"01-0pm","time":"01:00 PM"},{"id":"01-15pm","time":"01:15 PM"},{"id":"01-30pm","time":"01:30 PM"},{"id":"01-45pm","time":"01:45 PM"},{"id":"02-0pm","time":"02:00 PM"},{"id":"02-15pm","time":"02:15 PM"},{"id":"02-30pm","time":"02:30 PM"},{"id":"02-45pm","time":"02:45 PM"},{"id":"03-0pm","time":"03:00 PM"},{"id":"03-15pm","time":"03:15 PM"},{"id":"03-30pm","time":"03:30 PM"},{"id":"03-45pm","time":"03:45 PM"},{"id":"04-0pm","time":"04:00 PM"},{"id":"04-15pm","time":"04:15 PM"},{"id":"04-30pm","time":"04:30 PM"},{"id":"04-45pm","time":"04:45 PM"},{"id":"05-0pm","time":"05:00 PM"},{"id":"05-15pm","time":"05:15 PM"},{"id":"05-30pm","time":"05:30 PM"},{"id":"05-45pm","time":"05:45 PM"},{"id":"06-0pm","time":"06:00 PM"},{"id":"06-15pm","time":"06:15 PM"},{"id":"06-30pm","time":"06:30 PM"},{"id":"06-45pm","time":"06:45 PM"},{"id":"07-0pm","time":"07:00 PM"},{"id":"07-15pm","time":"07:15 PM"},{"id":"07-30pm","time":"07:30 PM"},{"id":"07-45pm","time":"07:45 PM"},{"id":"08-0pm","time":"08:00 PM"},{"id":"08-15pm","time":"08:15 PM"},{"id":"08-30pm","time":"08:30 PM"},{"id":"08-45pm","time":"08:45 PM"},{"id":"09-0pm","time":"09:00 PM"},{"id":"09-15pm","time":"09:15 PM"},{"id":"09-30pm","time":"09:30 PM"},{"id":"09-45pm","time":"09:45 PM"},{"id":"10-0pm","time":"10:00 PM"},{"id":"10-15pm","time":"10:15 PM"},{"id":"10-30pm","time":"10:30 PM"},{"id":"10-45pm","time":"10:45 PM"},{"id":"11-0pm","time":"11:00 PM"},{"id":"11-15pm","time":"11:15 PM"},{"id":"11-30pm","time":"11:30 PM"},{"id":"11-45pm","time":"11:45 PM"}];
  // [{"id":"12-0","time":"12:00 AM"},{"id":"12-1","time":"12:30 AM"},{"id":"1-0","time":"01:00 AM"},{"id":"1-1","time":"01:30 AM"},{"id":"2-0","time":"02:00 AM"},{"id":"2-1","time":"02:30 AM"},{"id":"3-0","time":"03:00 AM"},{"id":"3-1","time":"03:30 AM"},{"id":"4-0","time":"04:00 AM"},{"id":"4-1","time":"04:30 AM"},{"id":"5-0","time":"05:00 AM"},{"id":"5-1","time":"05:30 AM"},{"id":"6-0","time":"06:00 AM"},{"id":"6-1","time":"06:30 AM"},{"id":"7-0","time":"07:00 AM"},{"id":"7-1","time":"07:30 AM"},{"id":"8-0","time":"08:00 AM"},{"id":"8-1","time":"08:30 AM"},{"id":"9-0","time":"09:00 AM"},{"id":"9-1","time":"09:30 AM"},{"id":"10-0","time":"10:00 AM"},{"id":"10-1","time":"10:30 AM"},{"id":"11-0","time":"11:00 AM"},{"id":"11-1","time":"11:30 AM"},{"id":"1-0","time":"01:00 PM"},{"id":"1-1","time":"01:30 PM"},{"id":"2-0","time":"02:00 PM"},{"id":"2-1","time":"02:30 PM"},{"id":"3-0","time":"03:00 PM"},{"id":"3-1","time":"03:30 PM"},{"id":"4-0","time":"04:00 PM"},{"id":"4-1","time":"04:30 PM"},{"id":"5-0","time":"05:00 PM"},{"id":"5-1","time":"05:30 PM"},{"id":"6-0","time":"06:00 PM"},{"id":"6-1","time":"06:30 PM"},{"id":"7-0","time":"07:00 PM"},{"id":"7-1","time":"07:30 PM"},{"id":"8-0","time":"08:00 PM"},{"id":"8-1","time":"08:30 PM"},{"id":"9-0","time":"09:00 PM"},{"id":"9-1","time":"09:30 PM"},{"id":"10-0","time":"10:00 PM"},{"id":"10-1","time":"10:30 PM"},{"id":"11-0","time":"11:00 PM"},{"id":"11-1","time":"11:30 PM"},{"id":"12-0","time":"12:00 PM"},{"id":"12-1","time":"12:30 PM"}];
  _searchTime: string;
  get searchTime(): string {
      return this._searchTime;
  }
  @Input() set searchTime(value: string) {
    if(value){
      this._searchTime = value;
      this.searchData(value);
    }
  }

  @Output() selectedTime = new EventEmitter(); 

  constructor() { }

  ngOnInit(): void {
  }

  searchData(searchString){
    let timeArray=[];
    for(let i=0;i< this.times.length; i++){
      if(this.times[i].time.startsWith(searchString?.toUpperCase())){
        timeArray.push(this.times[i].time);
      }
      if(timeArray.length > 4){
        break;
      }
    }
    if(timeArray.length < 5){
      for(let i=0;i< this.times.length; i++){
        if(this.times[i].time.includes(searchString) && !timeArray.includes(this.times[i].time)){
          timeArray.push(this.times[i].time);
        }
        if(timeArray.length > 4){
          break;
        }
      }
    }
    this.timeArray= timeArray;
  }

  selectedTimeValue(time){
    this.selectedTime.emit(time);
  }

}
