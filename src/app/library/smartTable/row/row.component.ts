import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, AfterViewInit, HostBinding } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigTypes }  from 'src/app/expense/enums/accuracy-config.enum';
import { IProgram } from 'src/app/expense/interfaces/expense.interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'vms-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss']
})
export class VMSRowComponent implements OnInit, OnDestroy, AfterViewInit {
  expandRow: number;
  private subscriptions: Subscription[] = [];
  @Input() notes = '';
  @Input() isIcon = false;
  @Input() all: any;
  @Input() isImage = false;
  @Input() isNumberBadge = false;
  @Input() set isClickable(val: boolean) {
    if (val !== undefined) {
      this.isLinkClickable = val;
      return;
    }
    this.isLinkClickable = true;
  }
  @Input() isLastColumn = false;
  @Input() isVmsTableExpand = false;
  @Input() isContact = false;
  @Input() isReport = false;
  @Input() index: any;
  @Input() vmsRowDataSource: any;
  @Input() rowData: any;
  @Input() isAction = false;
  @Input() isNoOption = false;
  @Input() hideOptions = false;
  @Input() infoIcon = false;
  @Input() isDetails = false;
  @Input() isVieworEdit = false;
  @Input() isEditEditRule = false;
  @Input() isVieworEditFlow = false;
  @Input() isDeleteFlow = false;
  @Input() isEditorReview = false;
  @Input() isWithdrawal = false;
  @Input() isViewProfile = false;
  @Input() isVieworClone = false;
  @Input() isDisableorDelete = false;
  @Input() isDelete = false;
  @Input() isStatusColor = false;
  @Input() isIconList = false;
  @Input() isShowCheckBox = false;
  @Input() isMultiUser = false;
  @Input() isOpenView = false;
  @Input() toolTipVisibility = false;
  @Input() isArray: boolean;
  @Input() hideBadege = false;
  @Input() showTitleCase = false;
  @Input() showPreviewIcon = false;
  @Input() isPending = false;
  @Input() isDoNotRehire = false;
  @Input() isRedirect = false;
  // @Input() showUpdate = false;
  @Input() isObjectStatusShow: boolean;
  @Input() showDoNotRehireFlag = false;
  @Input() width: string;
  @Input() isProfileMatch: boolean;
  @Input() isCandidateStatus: boolean;
  @Input() isInterview: boolean;
  @Input() isViewEnabled: boolean;
  @Input() isOptOut: boolean;
  @Input() isOptIn: boolean;
  @Input() isSubmitCandidate: boolean;
  @Input() options: any[] = [];
  @Input() isCheckBoxReadonly: boolean;
  @Input() permission: string;
  @Input() vmsTableConfig: any;
  @Input() isNavigation: boolean;
  @Input() isCurrency: boolean;
  @Input() enableClick: boolean;
  @Input() rotuterLinkOnClick: boolean;
  @Input() rotuterLinkParams: any;
  @Input() rotuterLinkParseFn: any;
  @Input() allowMultiselect = false;
  @Input() isExpenseType = false;
  @Input() isDownloadBtn = false;
  @Input() isRateType= false;
  @Input() isNumberType= false;
  @Input() showPreCandidateFlag = false;
  @Input() checkboxDisabled = false;
  @Input() isTooltip = {isShow : false , message : '' , match : '' , secoundMatch : ''};
  @Input() orgStatus: string;
  @Input() linearProgressBar: boolean;
  @Input() circularProgressBar: boolean;
  @Input() refName: string;
  @Input() canViewMtp = false;
  /* 'orgStatus' is added as part of a corner case of SOW, where the amfam_contract_id can have a text
      value as 'draft', but it shouldn't highlight like the statuses in other places in the table. */

  @Input() isMasked = false;
  @Input() isManagerList:boolean = false;
  @Output() viewClicked = new EventEmitter();
  @Output() cloneClicked = new EventEmitter();
  @Output() disableClicked = new EventEmitter();
  @Output() editClicked = new EventEmitter();
  @Output() deleteClicked = new EventEmitter();
  @Output() optOutClicked = new EventEmitter();
  @Output() optInClicked = new EventEmitter();
  @Output() updateClicked = new EventEmitter();
  @Output() onSubmittedCandidateClick = new EventEmitter();
  @Output() numberBadgeClicked = new EventEmitter();
  @Output() onNameClicked = new EventEmitter();
  @Output() viewProfileClicked = new EventEmitter();
  @Output() withdrawProfileClicked = new EventEmitter();
  @Output() viewDetailClicked = new EventEmitter();
  @Output() rescheduleInterviewClicked = new EventEmitter();
  @Output() cancelInterviewClicked = new EventEmitter();
  @Output() onOptionClicked = new EventEmitter();
  @Output() viewSubmittedCandidate = new EventEmitter();
  @Output() onOpenPanel = new EventEmitter();
  @Output() previewClicked = new EventEmitter();
  @Output() onRowChecked = new EventEmitter<any>();
  @Output() onPendingIconClick = new EventEmitter();
  @Output() baseReportClick = new EventEmitter();
  @Output() downloadDoc = new EventEmitter();
  @Output() candidateScore  = new EventEmitter();
  @Output() onMtpViewClick = new EventEmitter();
  @Output() onNavigateClickView = new EventEmitter();

  isObjectElementBig = false;
  showDropDown = false;
  isFrequency = false;
  showdropdownFirstCol = false;
  showdropdownReport = false;
  svgValue = `10, 100`;
  isLinkClickable: boolean;
  currentProgram: IProgram;
  shortedDays = {
    sunday: 'Su',
    monday: 'M',
    tuesday: 'Tu',
    wednesday: 'W',
    thursday: 'Th',
    friday: 'F',
    saturday: 'Sa',
    first: 'First',
    second: 'Second',
    third: 'Third',
    fourth: 'Fourth',
    fifth: 'Fifth'
  };

  hasPermission = false;
  public viewCurrencyStrict: string = '0.4-4' ;
  public accuracyConfig = AccuracyConfigTypes;
  @ViewChild('optionButton', { read: ElementRef, static: false }) optionButton: ElementRef;
  @ViewChild('reportOptionButton', { read: ElementRef, static: false }) reportOptionButton: ElementRef;
  @ViewChild('putIcon') putIcon: ElementRef;
  @ViewChild('downLoadButton') downLoadButton: ElementRef;
  @ViewChild('managerCount', { read: ElementRef, static: false }) managerCount: ElementRef;
  constructor(
    private eventStream: EventStreamService,
    private authorizationService: AuthorizationService,
    private _storageService: StorageService,
    public currencyPipe: CustomcurrencyPipe,
    public accuracyPipe: AccuracyPipe,
    private router:Router
  ) {
    // const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    // let edit_accuracy = currentProgram?.config?.currency?.edit_accuracy;
    // this.viewCurrencyStrict = edit_accuracy ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewCurrencyStrict;
  }

  @HostBinding('style.--progress-val')
  public progressVal: number = 100;

  ngOnInit(): void {
    this.currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.isFrequency = this.all?.name === 'run_frequency';
    if (this.isFrequency && Array.isArray(this.vmsRowDataSource)) {
      this.vmsRowDataSource = this.vmsRowDataSource.map(el => this.shortedDays[el.toLowerCase()]);
    }
    if (this.all?.name === 'is_schedule') {
      this.vmsRowDataSource = Number(this.vmsRowDataSource) ? 'Active' : 'Inactive';
    }
    this.hasPermission = !!this.isOpenView;
    if (this.permission) {
      this.hasPermission = this.authorizationService.authorize(this.permission);
    }
    if (this.isShowCheckBox) {
      this.vmsRowDataSource = !!this.vmsRowDataSource;
    }
    if(this.circularProgressBar) {
      this.progressVal = this.vmsRowDataSource
    }
    if (this.isObject() === 'object' && this.vmsRowDataSource) {
      const convertArr = [this.vmsRowDataSource];
      this.isObjectElementBig = convertArr.some(ele => (ele && ele.length > 2));
    }
    this.subscriptions.push(this.eventStream.on(Events.OPTION_DROPDOWN).subscribe((data) => {
      if (data) {
        this.showDropDown = false;
      }
    }));

    this.subscriptions.push(
      this.eventStream.on(Events.ITEM_POSITION).subscribe( item => {
        if(item.Item_Active == false) {
          this.showdropdownFirstCol = false;
        }
      }));
  }

  navigateToMtpDetails = (mtp_id:string) => {
      this.onMtpViewClick.next(mtp_id)
  }

  navigateToRouteLink = (rowData:any,routerParam:any) => {
    if(this.rotuterLinkParseFn){
      const URL :string = this.rotuterLinkParseFn(rowData,routerParam);
      if(URL){
        this.router.navigateByUrl(URL);
      }
      this.onNavigateClickView.emit(true);
    }
  }

  showTooltip(val,currency) {
      // return this.currencyPipe?.transform(val, undefined, undefined, this.viewCurrencyStrict, undefined, true);
      // return this.accuracyPipe?.transform(val, this.accuracyConfig.AMOUNT);
      if(this.currentProgram?.config['accuracy_config']){
        return this.accuracyPipe?.transform(val, this.accuracyConfig.AMOUNT,{currencyCode: currency});
      } else{
        return this.accuracyPipe?.transform(val, this.accuracyConfig.AMOUNT, {currencyCode: currency,digitInfo: this.viewCurrencyStrict});
      }
  }
  ngAfterViewInit(): void {
    const iconText = this.getSpan(this.vmsRowDataSource);
    if (this.putIcon && iconText) {
      const parent: HTMLElement = this.putIcon.nativeElement.parentElement;
      const iconNode = new DOMParser().parseFromString(iconText, 'text/html').body.childNodes[0];
      parent.appendChild(iconNode);
    }
  }

  isObject() {
    return typeof this.vmsRowDataSource;
  }

  onClickExpand(id: any) { }

  clickToView(event: boolean) {
    if (this.isLinkClickable) {
      this.viewClicked.emit(true);
      return;
    }
    if (this.isRedirect) {
      const link = this.vmsRowDataSource.toLocaleLowerCase().replaceAll(' ', '_');
      this.baseReportClick.emit(link);
      return;
    }
    this.editClicked.emit(event);
  }

  clickToClone() {
    this.cloneClicked.emit(true);
  }

  clickToEdit() {
    this.editClicked.emit(true);
  }

  detailViewClick() {
    this.viewDetailClicked.emit(true);
  }

  clickTodisable() {
    this.disableClicked.emit(true);
  }

  clickTodelete() {
    this.deleteClicked.emit(true);
  }

  clickToSubmitCandidate() {
    this.onSubmittedCandidateClick.emit(true);
  }

  clickToOptOut() {
    this.optOutClicked.emit(true);
  }

  previewOptionClicked() {
    this.previewClicked.emit(true);
  }
  clickToOptIn() {
    this.optInClicked.emit(true);
  }
  clickToUpdate() {
    this.updateClicked.emit(true);
  }
  showOptionDropdown() {
    this.showDropDown = true;
  }
  hideOptionDropdown() {
    this.showDropDown = false;
  }
  showDropdownFirstCol() {
    const itemPosition = this.optionButton.nativeElement.getBoundingClientRect();
    if(this.showdropdownFirstCol == false) {
      this.showdropdownFirstCol = true;
      this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"itemPosition": itemPosition, "Item_Active": true, "refName": this.refName}));
    }
    else if(this.showdropdownFirstCol == true){
      this.showdropdownFirstCol = false;
      this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"itemPosition": itemPosition, "Item_Active": false}));
    }
  }
  hideDropdownFirstCol() {
    this.showdropdownFirstCol = false;
  }
  onNumberBadgeClicked() {
    this.numberBadgeClicked.emit();
  }
  onClickedName() {
    if(this.isLinkClickable)
      this.onNameClicked.emit();
  }
  clickToViewProfile() {
    this.viewProfileClicked.emit(true);
  }
  clickWithdrawCandidate() {
    this.withdrawProfileClicked.emit(true);
  }
  onRescheduleClick() {
    this.rescheduleInterviewClicked.emit(true);
  }
  onCancelClick() {
    this.cancelInterviewClicked.emit(true);
  }
  clickToViewCandidate() {
    this.viewSubmittedCandidate.emit(true);
  }
  optionClicked(option) {
    this.onOptionClicked.emit(option);
  }
  openPanel() {
    if (this.isOpenView) {
      this.onOpenPanel.emit(true);
    }
  }

  rowSelected(values) {
    this.onRowChecked.emit({
      value: values.currentTarget.checked,
      row: this.rowData
    });
  }

  showDropdownReport() {
    this.showdropdownReport = true;
    const itemPosition = this.reportOptionButton.nativeElement.getBoundingClientRect();
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, itemPosition));
  }

  hideDropdownReport() {
    this.showdropdownReport = false;
  }

  clickOnPending() {
    this.onPendingIconClick.emit();
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  get isDataSourceArray() {
    return Array.isArray(this.vmsRowDataSource);
  }

  getSpan(data){
    const reg = new RegExp('<div(.*?)</div>');
    return reg.exec(data) ? reg.exec(data)[0] : null;
  }


  getDisplaytext(data) {
    if(data instanceof Array){
      return data;
    }
    const reg = new RegExp('<div(.*?)</div>');
    return data?.length > 0 ? (data?.split(reg)[0]) : data;
  }

  download() {
    this.downloadDoc.emit(this.rowData)
  }

  showCandidateScore($event) {
    this.candidateScore.emit(this.rowData);
  }
  showMoreName() {
    const itemPosition = this.managerCount.nativeElement.getBoundingClientRect();
    this.eventStream.emit(new EmitEvent(Events.MANAGER_COUNT, {"itemPosition": itemPosition, "Item_Active": true,"managerList": this.rowData?.manager}));
  }
}
