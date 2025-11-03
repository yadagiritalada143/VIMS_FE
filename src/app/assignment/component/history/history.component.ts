import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Subscription } from 'rxjs';
import { AssignmentService } from '../../assignment.service';
import { ApprovalStatus } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {
  @Input() assignmentId;
  @Input() currency;
  @Input() rateModel;
  @Input() public set assignmentListData(value : any) {
    if(Object.keys(value)?.length) {
      this.assignmentService.populateCustomFields(this.programId , value?.assignment?.hierarchy?.id).then((data) => {
        this.customFields = data;
        this.getHistoryList();
      });
    }
    this.assignmentDetail = value;
  }
  public pendingItem;
  public historyData: any;
  ViewHistoryPanel = 'hidden';
  private subscrptions: Subscription[] = [];
  logs:any= undefined;
  public totalRecords = 0;
  public itemsPerPage: any;
  public currentPage = 1;
  public pageNumber = 1;
  recordsPerPageSetting?= [10, 25, 50, 75, 100];
  public maxPages = 1;
  public limit= 10;
  public _assignmentConfig: any;
  public assignmentDetail:any;
  public programId : any;
  customFields: void;
  @Input('assignmentConfig') set assignmentConfig(value:any){
    this._assignmentConfig = value;
  }
  get assignmentConfig() {
    return this._assignmentConfig;
  }
  get  assignmentListData() {
    return this.assignmentDetail;
  }
  constructor(
    public assignmentService: AssignmentService,
    private storageService: StorageService,
    public loaderService: LoaderService,
    public eventStream: EventStreamService,
    public alert: AlertService,
    private datePipe: LocalDateFormatPipe,
  ) { }

  ngOnInit(): void {
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.loaderService.show();
    this.subscrptions.push(this.eventStream.on(Events.HIDE_HISTORY).subscribe((data: any) => {
      this.ViewHistoryPanel = 'hidden';
    }));
  }

  getHistoryList() {
    this.logs= undefined;
    this.subscrptions.push(this.assignmentService.getAssignmentHistory(this.programId, this.assignmentId, this.pageNumber, this.limit).subscribe(
      {next: (data: any) => {
        if (data) {  
        this.pendingItem = data?.data?.assignment.find(({ status }) => status.toLowerCase() === ApprovalStatus.pending);
        let dateFormat: any = this.assignmentService.getDefaultDateFormat();
          data?.data?.assignment.forEach(item => {
            const updatedDateTime = this.datePipe?.transform(item?.updated_at, dateFormat + ' hh:mm:ss a z');
            item['updatedDate'] = updatedDateTime?.slice(0, updatedDateTime?.indexOf(' '));
            item['updatedTime'] = updatedDateTime?.slice(updatedDateTime?.indexOf(' ') + 1);

            const rejectUpdatedDateTime = this.datePipe?.transform(item?.action?.performed_at, dateFormat + ' hh:mm:ss a z');
            item['rejectUpdatedDate'] = rejectUpdatedDateTime?.slice(0, rejectUpdatedDateTime?.indexOf(' '));
            item['rejectUpdatedTime'] = rejectUpdatedDateTime?.slice(rejectUpdatedDateTime?.indexOf(' ') + 1);
          })//revision
          this.historyData = data?.data?.assignment;
          this.itemsPerPage = data?.data?.per_page;
          this.totalRecords = data?.data?.total_records;
          this.pagination();
          this.loaderService.hide();
        }
      },
      error: (err) => {
        // this.alert.error(err?.error?.message)
        this.logs= { type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
        this.loaderService.hide();
    }}));
  }

  showErrorMessges(err){
    let messages= [];
    err?.error?.error?.errors?.forEach(msg => {      
      if (msg?.message) {      
       messages.push(msg?.message);
      }
    });
    return messages;
  }

  viewHistory(event) {
    const history = this.historyData.find(history => history.revision === event?.revision);
    if(event && history.request_type == 'create'){
      this.eventStream.emit(new EmitEvent(Events.VIEW_ASSIGNMENT_SIDEBAR, { 'revisionId': event?.revision, currency: this.currency, 'revisionDetails': event ,'pendingItem':this.pendingItem}));
    }else if (event && history.request_type !== 'evaluate') {
      this.eventStream.emit(new EmitEvent(Events.VIEW_HISTORY_OF_ASSIGNMENT, { 'revisionId': event?.revision, currency: this.currency, 'revisionDetails': event }));
    } else {
      this.eventStream.emit(new EmitEvent(Events.VIEW_HISTORY_OF_ASSIGNMENT_EVALUATION, { history }));
    }
  }
  sidebarClose() {
    this.ViewHistoryPanel = 'hidden';
  }

  onPaginationClick(e) {
    this.pageNumber = e;
    this.limit = 10;
    this.getHistoryList();
  }

  onClickRecords(e) {
    this.limit = e;
    this.pageNumber = 1;
    this.getHistoryList();
  }

  pagination() {
    if (this.itemsPerPage < 1) {
      this.itemsPerPage = 10;
    }
    this.maxPages = Math.ceil(this.totalRecords / this.itemsPerPage);   
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
}
