import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import {
  EventStreamService,
  Events,
} from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'vms-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss']
})
export class VMSRowComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  expandRow: number;
  _isDescription:any;
  @Input() isRateCard = false;
  @Input() isCustomField = false;
  @Input() isImage = false;
  @Input() isNumberBadge = false;
  @Input() isVmsTableExpand: boolean = false;
  @Input() isContact = false;
  @Input() index: any;
  @Input() vmsRowDataSource: any;
  @Input() isAction = false;
  @Input() isNoOption = false;
  @Input() isDetails = false;
  @Input() isVieworEdit = false;
  @Input() isCreateJob = false;
  @Input() isWithdrawal = false;
  @Input() isViewProfile = false;
  @Input() isVieworClone = false;
  @Input() isDisableorDelete = false;
  @Input() isDelete = false;
  @Input() isDeleteInVisible = false;
  @Input() isStatusColor = false;
  @Input() isIconList = false;
  @Input() isShowCheckBox = false;
  @Input() isMultiUser = false;
  @Input() width: string;
  @Input() isProfileMatch:boolean;
  @Input() isCandidateStatus:boolean;
  @Input() isIconSrc:boolean;
  @Input() isInterview: boolean;
  @Input() isViewEnabled: boolean;
  @Input() isOptOut:boolean;
  @Input() isSubmitCandidate:boolean;
  @Input() options: any[] = [];
  @Input() isCheckBoxReadonly = false;
  @Input() doNotRehire: boolean = false;
  @Input() worker_or_not: string;
  @Input() notification_type: string = '';

  // @Input() isDescription: boolean;
  @Input() set isDescription(data) {
    if(data) {
      this._isDescription = data;
    }
 }
  @Output() viewClicked = new EventEmitter();
  @Output() removeDoNotRehire = new EventEmitter();
  @Output() cloneClicked = new EventEmitter();
  @Output() disableClicked = new EventEmitter();
  @Output() editClicked = new EventEmitter();
  @Output() onCreateJobClick = new EventEmitter();
  @Output() deleteClicked = new EventEmitter();
  @Output() optOutClicked = new EventEmitter();
  @Output() submitCandidateClicked = new EventEmitter();
  @Output() numberBadgeClicked = new EventEmitter();
  @Output() onNameClicked = new EventEmitter();
  @Output() viewProfileClicked = new EventEmitter();
  @Output() withdrawProfileClicked = new EventEmitter();
  @Output() viewDetailClicked = new EventEmitter();
  @Output() rescheduleInterviewClicked = new EventEmitter();
  @Output() cancelInterviewClicked = new EventEmitter();
  @Output() onOptionClicked = new EventEmitter();
  @Output() viewSubmittedCandidate = new EventEmitter();
  isObjectElementBig = false;
  showdropdown = false;
  svgValue = `10, 100`;
  programListing: boolean = window.location.href.includes("users/list");

  constructor(
    private eventStream: EventStreamService
  ) {
  }

  ngOnInit(): void {
    if (this.isObject() === 'object' && this.vmsRowDataSource) {
      const converArr = [this.vmsRowDataSource];
      this.isObjectElementBig = converArr.some(ele => (ele && ele.length > 2));
    }

    this.subscriptions.push(this.eventStream.on(Events.OPTION_DROPDOWN).subscribe((data) => {
      if (data) {
        this.showdropdown = false;
      }
    }));
  }

  isObject() {
    if(this.vmsRowDataSource === 'pending'){
      this.vmsRowDataSource = true;
    }
    return typeof this.vmsRowDataSource;
  }

  onclickexpand(id: any) { }

  clickToView() {
    this.viewClicked.emit(true);
  }

  clickToClone() {
    this.cloneClicked.emit(true);
  }

  clickToEdit() {
    this.editClicked.emit(true);
  }
  clickToCreateJob() {
    this.onCreateJobClick.emit(true);
  }
  detailViewClick() {
    this.viewDetailClicked.emit(true);
  }

  clickToRemoveDoNotRehire(){
    this.removeDoNotRehire.emit(true);
  }

  clickTodisable() {
    this.disableClicked.emit(true);
  }

  clickTodelete() {
    this.deleteClicked.emit(true);
  }

  clickToSubmitCandidate() {
    this.submitCandidateClicked.emit(true);
  }

  clickToOptOut() {
    this.optOutClicked.emit(true);
  }

  showOptionDropdown() {
    this.showdropdown = true;
  }

  onNumberBadgeClicked() {
    this.numberBadgeClicked.emit();
  }

  onClickedName() {
    this.onNameClicked.emit();
  }

  clickToViewProfile() {
    this.viewProfileClicked.emit(true);
  }

  clickWithdrawCandidate() {
    this.withdrawProfileClicked.emit(true);
  }
  onRescheduleClick(){
    this.rescheduleInterviewClicked.emit(true);
  }
  onCancelClick(){
    this.cancelInterviewClicked.emit(true);
  }
  clickToViewCandidate() {
    this.viewSubmittedCandidate.emit(true);
  }
  optionClicked(option) {
    this.onOptionClicked.emit(option);
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
