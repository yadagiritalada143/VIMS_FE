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
  
  @Input() set timeFormat(format: string){
    if(format?.toLowerCase() == "24"){
      this.times= [{"id":"00-0","time":"00:00"},{"id":"00-15","time":"00:15"},{"id":"00-30","time":"00:30"},{"id":"00-45","time":"00:45"},{"id":"01-0","time":"01:00"},{"id":"01-15","time":"01:15"},{"id":"01-30","time":"01:30"},{"id":"01-45","time":"01:45"},{"id":"02-0","time":"02:00"},{"id":"02-15","time":"02:15"},{"id":"02-30","time":"02:30"},{"id":"02-45","time":"02:45"},{"id":"03-0","time":"03:00"},{"id":"03-15","time":"03:15"},{"id":"03-30","time":"03:30"},{"id":"03-45","time":"03:45"},{"id":"04-0","time":"04:00"},{"id":"04-15","time":"04:15"},{"id":"04-30","time":"04:30"},{"id":"04-45","time":"04:45"},{"id":"05-0","time":"05:00"},{"id":"05-15","time":"05:15"},{"id":"05-30","time":"05:30"},{"id":"05-45","time":"05:45"},{"id":"06-0","time":"06:00"},{"id":"06-15","time":"06:15"},{"id":"06-30","time":"06:30"},{"id":"06-45","time":"06:45"},{"id":"07-0","time":"07:00"},{"id":"07-15","time":"07:15"},{"id":"07-30","time":"07:30"},{"id":"07-45","time":"07:45"},{"id":"08-0","time":"08:00"},{"id":"08-15","time":"08:15"},{"id":"08-30","time":"08:30"},{"id":"08-45","time":"08:45"},{"id":"09-0","time":"09:00"},{"id":"09-15","time":"09:15"},{"id":"09-30","time":"09:30"},{"id":"09-45","time":"09:45"},{"id":"10-0","time":"10:00"},{"id":"10-15","time":"10:15"},{"id":"10-30","time":"10:30"},{"id":"10-45","time":"10:45"},{"id":"11-0","time":"11:00"},{"id":"11-15","time":"11:15"},{"id":"11-30","time":"11:30"},{"id":"11-45","time":"11:45"},{"id":"12-0","time":"12:00"},{"id":"12-15","time":"12:15"},{"id":"12-30","time":"12:30"},{"id":"12-45","time":"12:45"},{"id":"13-0","time":"13:00"},{"id":"13-15","time":"13:15"},{"id":"13-30","time":"13:30"},{"id":"13-45","time":"13:45"},{"id":"14-0","time":"14:00"},{"id":"14-15","time":"14:15"},{"id":"14-30","time":"14:30"},{"id":"14-45","time":"14:45"},{"id":"15-0","time":"15:00"},{"id":"15-15","time":"15:15"},{"id":"15-30","time":"15:30"},{"id":"15-45","time":"15:45"},{"id":"16-0","time":"16:00"},{"id":"16-15","time":"16:15"},{"id":"16-30","time":"16:30"},{"id":"16-45","time":"16:45"},{"id":"17-0","time":"17:00"},{"id":"17-15","time":"17:15"},{"id":"17-30","time":"17:30"},{"id":"17-45","time":"17:45"},{"id":"18-0","time":"18:00"},{"id":"18-15","time":"18:15"},{"id":"18-30","time":"18:30"},{"id":"18-45","time":"18:45"},{"id":"19-0","time":"19:00"},{"id":"19-15","time":"19:15"},{"id":"19-30","time":"19:30"},{"id":"19-45","time":"19:45"},{"id":"20-0","time":"20:00"},{"id":"20-15","time":"20:15"},{"id":"20-30","time":"20:30"},{"id":"20-45","time":"20:45"},{"id":"21-0","time":"21:00"},{"id":"21-15","time":"21:15"},{"id":"21-30","time":"21:30"},{"id":"21-45","time":"21:45"},{"id":"22-0","time":"22:00"},{"id":"22-15","time":"22:15"},{"id":"22-30","time":"22:30"},{"id":"22-45","time":"22:45"},{"id":"23-0","time":"23:00"},{"id":"23-15","time":"23:15"},{"id":"23-30","time":"23:30"},{"id":"23-45","time":"23:45"}]
    }else{
      this.times= [{"id":"12-0am","time":"12:00 AM"},{"id":"12-15am","time":"12:15 AM"},{"id":"12-30am","time":"12:30 AM"},{"id":"12-45am","time":"12:45 AM"},{"id":"01-0am","time":"01:00 AM"},{"id":"01-15am","time":"01:15 AM"},{"id":"01-30am","time":"01:30 AM"},{"id":"01-45am","time":"01:45 AM"},{"id":"02-0am","time":"02:00 AM"},{"id":"02-15am","time":"02:15 AM"},{"id":"02-30am","time":"02:30 AM"},{"id":"02-45am","time":"02:45 AM"},{"id":"03-0am","time":"03:00 AM"},{"id":"03-15am","time":"03:15 AM"},{"id":"03-30am","time":"03:30 AM"},{"id":"03-45am","time":"03:45 AM"},{"id":"04-0am","time":"04:00 AM"},{"id":"04-15am","time":"04:15 AM"},{"id":"04-30am","time":"04:30 AM"},{"id":"04-45am","time":"04:45 AM"},{"id":"05-0am","time":"05:00 AM"},{"id":"05-15am","time":"05:15 AM"},{"id":"05-30am","time":"05:30 AM"},{"id":"05-45am","time":"05:45 AM"},{"id":"06-0am","time":"06:00 AM"},{"id":"06-15am","time":"06:15 AM"},{"id":"06-30am","time":"06:30 AM"},{"id":"06-45am","time":"06:45 AM"},{"id":"07-0am","time":"07:00 AM"},{"id":"07-15am","time":"07:15 AM"},{"id":"07-30am","time":"07:30 AM"},{"id":"07-45am","time":"07:45 AM"},{"id":"08-0am","time":"08:00 AM"},{"id":"08-15am","time":"08:15 AM"},{"id":"08-30am","time":"08:30 AM"},{"id":"08-45am","time":"08:45 AM"},{"id":"09-0am","time":"09:00 AM"},{"id":"09-15am","time":"09:15 AM"},{"id":"09-30am","time":"09:30 AM"},{"id":"09-45am","time":"09:45 AM"},{"id":"10-0am","time":"10:00 AM"},{"id":"10-15am","time":"10:15 AM"},{"id":"10-30am","time":"10:30 AM"},{"id":"10-45am","time":"10:45 AM"},{"id":"11-0am","time":"11:00 AM"},{"id":"11-15am","time":"11:15 AM"},{"id":"11-30am","time":"11:30 AM"},{"id":"11-45am","time":"11:45 AM"},{"id":"12-0pm","time":"12:00 PM"},{"id":"12-15pm","time":"12:15 PM"},{"id":"12-30pm","time":"12:30 PM"},{"id":"12-45pm","time":"12:45 PM"},{"id":"01-0pm","time":"01:00 PM"},{"id":"01-15pm","time":"01:15 PM"},{"id":"01-30pm","time":"01:30 PM"},{"id":"01-45pm","time":"01:45 PM"},{"id":"02-0pm","time":"02:00 PM"},{"id":"02-15pm","time":"02:15 PM"},{"id":"02-30pm","time":"02:30 PM"},{"id":"02-45pm","time":"02:45 PM"},{"id":"03-0pm","time":"03:00 PM"},{"id":"03-15pm","time":"03:15 PM"},{"id":"03-30pm","time":"03:30 PM"},{"id":"03-45pm","time":"03:45 PM"},{"id":"04-0pm","time":"04:00 PM"},{"id":"04-15pm","time":"04:15 PM"},{"id":"04-30pm","time":"04:30 PM"},{"id":"04-45pm","time":"04:45 PM"},{"id":"05-0pm","time":"05:00 PM"},{"id":"05-15pm","time":"05:15 PM"},{"id":"05-30pm","time":"05:30 PM"},{"id":"05-45pm","time":"05:45 PM"},{"id":"06-0pm","time":"06:00 PM"},{"id":"06-15pm","time":"06:15 PM"},{"id":"06-30pm","time":"06:30 PM"},{"id":"06-45pm","time":"06:45 PM"},{"id":"07-0pm","time":"07:00 PM"},{"id":"07-15pm","time":"07:15 PM"},{"id":"07-30pm","time":"07:30 PM"},{"id":"07-45pm","time":"07:45 PM"},{"id":"08-0pm","time":"08:00 PM"},{"id":"08-15pm","time":"08:15 PM"},{"id":"08-30pm","time":"08:30 PM"},{"id":"08-45pm","time":"08:45 PM"},{"id":"09-0pm","time":"09:00 PM"},{"id":"09-15pm","time":"09:15 PM"},{"id":"09-30pm","time":"09:30 PM"},{"id":"09-45pm","time":"09:45 PM"},{"id":"10-0pm","time":"10:00 PM"},{"id":"10-15pm","time":"10:15 PM"},{"id":"10-30pm","time":"10:30 PM"},{"id":"10-45pm","time":"10:45 PM"},{"id":"11-0pm","time":"11:00 PM"},{"id":"11-15pm","time":"11:15 PM"},{"id":"11-30pm","time":"11:30 PM"},{"id":"11-45pm","time":"11:45 PM"}];
    }
  }
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
