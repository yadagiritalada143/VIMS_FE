import { Component, OnInit, Output, EventEmitter, OnDestroy, Input} from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-monthly-hour-based-copy-timesheet',
  templateUrl: './monthly-hour-based-copy-timesheet.component.html',
  styleUrls: ['./monthly-hour-based-copy-timesheet.component.scss']
})

export class MonthlyHourBasedCopyTimesheetComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  copyModal:boolean = false;
  currentTimesheetData:any=undefined;
  calendar: any = [];
  billingData:any=[];
  days:any=[];
  showCopyTimesheetButton:boolean= false;
  allowCopyPasteCheck:any=[];
  copyIndex:number=undefined;
  pasteIndexes:any=[]; 
  holidayName:string=undefined;
  disableSave:boolean= false;
  @Input() set disableButton(disableSave){
    this.disableSave= disableSave;
    if(!this.disableSave){
      this.closeCopyTimesheet();
    }
  };
  @Output() onClose = new EventEmitter();
  @Output() onCopy= new EventEmitter();

    constructor(private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_CURRENT_TIMESHEET_DETAILS).subscribe((data:any) => {
      if(data?.updateCalendar && data?.calendar != undefined){
        this.calendar= data.calendar;
      }
      if(data?.updateCalendar && data?.days != undefined){
        this.days= data.days;
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_BILLING_AND_WORKING_DAYS_DETAILS).subscribe((data:any) => {
      if(data){
        if(data.billingData){
          this.billingData= data.billingData;
        }
        if(data.showCopyTimesheetOption != undefined){
          this.showCopyTimesheetButton= data?.showCopyTimesheetOption;
        }
        if(data.allowCopyPasteCheck){
          this.allowCopyPasteCheck= data?.allowCopyPasteCheck;
        }
      }
    }));
  }

  copyTimesheetModal() {
    this.copyModal = true;
  }

  closeCopyTimesheet() {
    this.copyModal = false;
    this.resetData();
  }

  copyData(index){
    if(this.copyIndex === index){
      this.pasteIndexes=[];
      this.copyIndex= undefined;
      return;
    }
    if(index >= 0){
      this.copyIndex= index;
    }
  }

  pasteData(index){
    if(index >= 0 && !this.pasteIndexes.includes(index) && this.copyIndex != undefined){
      this.pasteIndexes?.push(index);
    }
  }

  checkIfSelected(index){
    return this.pasteIndexes?.includes(index);
  }

  undoData(index){
    if(index >= 0 && this.pasteIndexes.includes(index)){
      this.pasteIndexes.forEach((item, i) => {
        if(item === index) {
          this.pasteIndexes.splice(i,1);
        }
      });
    }
  }

  updateTimesheet(){
    this.onCopy.emit({pasteIndexes: this.pasteIndexes, copyIndex:this.copyIndex});
  }
  
  getCurrentIndex(i, j){
    return (7*i+j);
  }

  resetData(){
    this.copyIndex=undefined;
    this.pasteIndexes=[];
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
