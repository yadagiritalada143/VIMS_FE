import { Component, Input, OnDestroy, OnInit, Output,EventEmitter } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';

@Component({
  selector: 'app-impacted-timesheet-table',
  templateUrl: './impacted-timesheet-table.component.html',
  styleUrls: ['./impacted-timesheet-table.component.scss']
})
export class ImpactedTimesheetTableComponent implements OnInit, OnDestroy {

  private subscriptions = [];
  showTimesheets:boolean = false;
  timesheets:any= undefined;
  is_work_week_change : any;
  @Input() renderForm;
  @Input() configData;
  public months = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
  ]; 
  @Output() impactedTimesheetData = new EventEmitter();
  constructor(private eventStream: EventStreamService, private timesheetService: TimesheetService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.SHOW_IMPACTED_TIMESHEETS).subscribe((data) => {
      if (data) {
        this.is_work_week_change = data?.is_work_week_change;
        data.impactedTimesheets?.forEach(duration=>{
          duration.selected= data?.mdtChange?.length ? true : (data?.isFinancialChange ? true : !duration?.is_enable);
          duration.is_enable = data?.mdtChange?.length ? false : (data?.isFinancialChange ? false : duration?.is_enable);
          duration.display_timesheet_code= duration?.code;     
          duration.display_value = this.timesheetService.getFormattedDate(duration?.start_date, duration?.end_date, duration?.meta_data?.layout?.duration);       
        }​​​​);
        this.timesheets= data.impactedTimesheets;
        if(this.timesheets && this.timesheets.length > 0){
        this.impactedTimesheetData.emit(true);
        }else{
          this.impactedTimesheetData.emit(false);
        }
        if(data?.showTable ){
          this.showTimesheets= true;
        }
        if(data?.showTable === false){
          this.showTimesheets= false;
        }
        if( this.is_work_week_change?.is_work_week_change) {
          this.showTimesheets= true;
        }
      } 
    }));

  }
  
  updateControl(timesheet){
    timesheet.selected= !timesheet.selected;
    this.renderForm?.get('impacted_timesheet_data')?.setValue(this.timesheets);
  }

  shortTimesheetId(timesheetId = '') {
    if (timesheetId?.includes("TS-")) {
      timesheetId = timesheetId?.substr(timesheetId?.lastIndexOf("TS-"))
    }
    return timesheetId;
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
