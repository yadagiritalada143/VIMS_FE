import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Log, LOG_TYPE } from '../logs.model';

@Component({
  selector: 'app-logs',
  templateUrl: './log-list.component.html',
  styleUrls: ['./log-list.component.scss']
})
export class LogListComponent implements OnInit {
  @Input() log: Log;
  constructor(private _eventStreamService:EventStreamService, private router:Router) { }

  ngOnInit(): void {
  }

  getLogsClass(){
    let logClass:string= '';
    switch (this.log?.type?.toLowerCase()){
      case LOG_TYPE.ERROR?.toLowerCase():
        logClass= 'alert_error';
        break;
      case LOG_TYPE.INFO?.toLowerCase():
        logClass= 'alert_info';
        break;
      case LOG_TYPE.WARNING?.toLowerCase():
        logClass= 'alert_pending';
        break;
      case LOG_TYPE.SUCCESS?.toLowerCase():
        logClass= 'alert_success';
        break;
      default:
        logClass= 'alert_error';
        break;
    }
    return logClass;
  }
  reportError(){
      this.router.navigate(['/dashboard/contact-support']);
      setTimeout(() => {
        this._eventStreamService.emit(new EmitEvent(Events.REPORT_ERROR,this.log));
      },0);
  }
  closeAlertMessage() {
    this.log.isShown = false;
  }
}
