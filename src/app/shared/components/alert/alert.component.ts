import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { LOG_TYPE, Log, hideType } from './alert.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  @Input() log: Log;
  @Output() onClose = new EventEmitter();
  @Output() onCollapse = new EventEmitter();
  @Output() onExpand = new EventEmitter();

  constructor(private _eventStreamService: EventStreamService, private router: Router) {}

  ngOnInit(): void {}

  getLogsClass() {
    let logClass: string = '';
    switch (this.log?.type?.toLowerCase()) {
      case LOG_TYPE.ERROR?.toLowerCase():
        logClass = 'alert_error';
        break;
      case LOG_TYPE.INFO?.toLowerCase():
        logClass = 'alert_info';
        break;
      case LOG_TYPE.WARNING?.toLowerCase():
        logClass = 'alert_pending';
        break;
      case LOG_TYPE.SUCCESS?.toLowerCase():
        logClass = 'alert_success';
        break;
      default:
        logClass = 'alert_error';
        break;
    }
    return logClass;
  }
  reportError() {
    this.router.navigate(['/dashboard/contact-support']);
    setTimeout(() => {
      this._eventStreamService.emit(new EmitEvent(Events.REPORT_ERROR, this.log));
    }, 0);
  }

  get isClosable(){ return this.log?.hideType === hideType.Close }
  get isCollapsable(){ return this.log?.hideType === hideType.Collapse }

  closeAlertMessage() {
    this.log.isShown = false;
    this.onClose.emit();
  }
  expandAlertMessage(){
    this.log.isCollapsed = false;
    this.onExpand.emit();
  }
  collapseAlertMessage() {
    this.log.isCollapsed = true;
    this.onCollapse.emit();
  }
}
