import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, ChangeDetectionStrategy, OnDestroy, HostListener, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ColumnConfig, VMSConfig } from './table.model';
import { ProgramConfig } from 'src/app/shared/enums';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { JobStatus, UsersType } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { DATE_FORMAT } from '../../date-format/date-format.model';
@Component({
  selector: 'vms-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VMSTableComponent implements OnInit, OnChanges, OnDestroy {
  scrolledBottom = false;
  showSortIndex = false;
  selectedVmsData: any;
  isDetails = false;
  isVieworClone = false;
  isVieworEdit = false;
  isEditEditRule = false;
  isVieworEditFlow = false;
  isDeleteFlow = false;
  isVieworEditCandidate = false;
  isDisableorDelete = false;
  isDelete = false;
  isOptOut = false;
  isOptIn = false;
  isSubmitCandidate = false;
  showComplianceOption = false;
  isViewProfile = false;
  isEditorReview = false;
  isWithdrawal = false;
  isGenericWithdraw = false;
  isGenericWithdrawText = '';
  isOfferCandidateWithdrawal = false;
  isRescheduleInterview = false;
  isEditInterview = false;
  isCancelInterview = false;
  isInterviewReview = false;
  isEditInterviewReview = false;
  isCancelInterviewReview = false;
  isSelectedTab: any;
  tableConfig: VMSConfig;
  checkboxDisabled = false;
  noActionMessages = false;
  private subscriptions = [];
  @Input() isFilterCleared = false;
  @Input() vmsClass: string;
  @Input() vmsDataSource: any[];
  @Input() loading = false;
  @Input() isMultipleSelectionDropdown = false;
  @Input() isCustomDropdown = false;
  @Input() recordType;

  @Input() open = false;
  @Input() totalItem = 1;
  @Input() itemsPerPage = 10;
  @Input() manuallySelectedCount = 0;
  recordsPerPageSetting?= [10, 25, 50, 75, 100];
  @Input() currentPage = 1;
  @Input() searchTerm = '';
  @Input() count: any[];
  @Input() customDownload;
  @Input() currentJobStatus;
  @Input() selectedRecordslist;
  @Input() availableCountForSelect;
  @Input() refName:string = 'ALL'
  @Input() offerNewWorkflow: boolean = false;
  radioType: any;
  selectedRecordsCount = 0;
  selectedAllRecordsCount = 0;
  customSelected: boolean = false;
  countInput: number= undefined;
  isDisabledCheckbox:boolean = false;
  disabledSelectAll: boolean = false;
  isTabChanged: boolean;
  isCheckboxClicked: boolean;
  selectPageData: boolean
  isAllRecordsSelected: boolean = false;
  selectedAllRecordsPage: number;
  onPaginationChange: boolean;
  isRecoredsChange: boolean;
  compareDisabledBtn: boolean;
  // @Input() currentTab  ;
  @Input() set currentTab(data) {
    if (data) {
      this.isSelectedTab = data;
    }
  }
  @Input() showRecords;
  @Input() rotuterLinkOnClick: boolean;
  @Input() rotuterLinkParams: any;
  @Input() rotuterLinkParseFn: any;
  @Input() currentOptStatus: any;
  @Output() onDetailClick = new EventEmitter();
  @Output() openMTPLinkingModal = new EventEmitter();
  @Output() onViewClick = new EventEmitter();
  @Output() onViewScheduleClick = new EventEmitter();
  @Output() cloneClicked = new EventEmitter();
  @Output() onEditClick = new EventEmitter();
  @Output() onCloneJobClick = new EventEmitter();
  @Output() onDeleteClick = new EventEmitter();
  @Output() onExpandClick = new EventEmitter();
  @Output() changePage = new EventEmitter<number>();
  @Output() changeRecords = new EventEmitter<number>();
  @Output() onCreate = new EventEmitter<boolean>();
  @Output() onSort = new EventEmitter();
  @Output() onCandidateFilter = new EventEmitter();
  @Output() search = new EventEmitter();
  @Output() onMonthChange = new EventEmitter();
  @Output() onYearChange = new EventEmitter();
  @Output() onDisableClicked = new EventEmitter();
  @Output() columnClicked = new EventEmitter();
  @Output() onListFilter = new EventEmitter();
  @Output() onClickFilter = new EventEmitter<boolean>();
  @Output() deactivateClicked = new EventEmitter();
  @Output() numberBadgeClicked = new EventEmitter();
  @Output() onNameClick = new EventEmitter();
  @Output() onTabClick = new EventEmitter<any>();
  @Output() onViewProfileClick = new EventEmitter();
  @Output() onWithdrawProfileClick = new EventEmitter();
  @Output() onSelectAllClick = new EventEmitter();
  @Output() onSelectClick = new EventEmitter();
  @Output() onRescheduleInterviewClick = new EventEmitter();
  @Output() onCancelInterviewClick = new EventEmitter();
  @Output() onViewSubmittedCandidateClick = new EventEmitter();
  @Output() onScheduleInterviewClick = new EventEmitter();
  @Output() onCreateOfferClick = new EventEmitter();
  @Output() onRejectCandidateClick = new EventEmitter();

  @Output() downloadDoc= new EventEmitter();
  @Output() onRehireCheckClick = new EventEmitter();

  @Output() onSubmittedCandidateClick = new EventEmitter();
  @Output() onDistributionOptionClicked = new EventEmitter();
  @Output() onOptOutClick = new EventEmitter();
  @Output() onOptInClick = new EventEmitter();
  @Output() updateClicked = new EventEmitter();
  @Output() onOptionClicked = new EventEmitter();
  @Output() onComplianceClicked = new EventEmitter();
  @Output() onOpenPanel = new EventEmitter();
  @Output() onHeaderButtonClick = new EventEmitter();
  @Output() onDownloadButtonClick = new EventEmitter();
  @Output() clickOnNext = new EventEmitter();
  @Output() onCompleteInterviewClick = new EventEmitter();
  @Output() createOffer?: EventEmitter<any> = new EventEmitter();
  @Output() counterOffer?: EventEmitter<any> = new EventEmitter();
  @Output() acceptOffer?: EventEmitter<any> = new EventEmitter();
  @Output() rejectOffer?: EventEmitter<any> = new EventEmitter();
  @Output() onboardingCandidate?: EventEmitter<any> = new EventEmitter();
  @Output() onJobOptionClicked = new EventEmitter();
  @Output() previewClicked: EventEmitter<any> = new EventEmitter<any>();
  @Output() onActionButtonClick: EventEmitter<any> = new EventEmitter<any>();
  @Output() onTitleClicked: EventEmitter<any> = new EventEmitter<any>();
  @Output() onBaseReportClicked: EventEmitter<any> = new EventEmitter<any>();
  @Output() onRowChecked = new EventEmitter<any>();
  @Output() onclickToisGenericWithdrawClick = new EventEmitter<any>();
  @Output() onPendingIconClick = new EventEmitter();
  @Output() editOffer?: EventEmitter<any> = new EventEmitter();
  @Output() onDraftOptionClicked = new EventEmitter();
  @Output() onOfferReviewClick = new EventEmitter();
  @Output() onshortListReviewClick = new EventEmitter();
  @Output() shortlistReviewClick = new EventEmitter();
  @Output() onEditOfferClick = new EventEmitter();
  @Output() onCancelOfferClick = new EventEmitter();
  @Output() onClickToReviewInterview = new EventEmitter();
  @Output() onClickToEditInterviewReview = new EventEmitter();
  @Output() onClickToCancelInterviewReview = new EventEmitter();
  @Output() selectedRecords = new EventEmitter();
  @Output() onAllRecordsSelected = new EventEmitter();
  @Output() onSelectedAllRecordsPage = new EventEmitter();
  @Output() onSelectPageData = new EventEmitter();
  @Output() viewCandidateScore = new EventEmitter();
  @Output() viewCompareScreen = new EventEmitter();
  @Output() emitCandidateScore = new EventEmitter();

  @Input() set vmsTableConfig(data: VMSConfig) {
    if (!data) {
      return;
    }
    this.tableConfig = data;
    if(this.tableConfig?.recordsPerPageSetting?.length > 0){
      this.recordsPerPageSetting= this.tableConfig?.recordsPerPageSetting;
    }
    this.tableConfig?.columnList?.forEach((col, index) => {
      this.setDropdownOptions(col);
      col.index = index;
      this.columnList[col.name] = true;
      this.columnList[col.name + '_width'] = col.width || 20;
      if (col.width) {
        this.columnWidth.push({ name: col.name, value: col.width });
      } else {
        if (this.tableConfig.isExpand) {
          this.columnWidth.push({
            name: col.name,
            value: (95 / this.tableConfig.columnList.length).toFixed(2),
          });
        } else {
          this.columnWidth.push({
            name: col.name,
            value: (100 / this.tableConfig.columnList.length).toFixed(2),
          });
        }
      }
    });
  }

  @Input() dateTransform: boolean = true;
  @Input() managerListTitle: string='Managers';
  @Input() set compareDisabled(data){
    this.compareDisabledBtn = data;
  };
  sortedColumn = '';
  isSortAsc = true;
  columnList = {};
  columnWidth = [];

  expandRow: number;
  fixedHeader = false;
  lastScrollTop = 0;
  direction = '';
  countColumnValue = 0;

  initialPage = 1;
  maxPages = 1;
  hideOptiondropdown = false;
  isDisabled = false;
  indexValues: any;
  selectedRowArr = [];
  allSelectedRows = false;
  hoverState;
  hasShadow = false;
  compactView = false;
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  selectAllValue = false;
  isScheduleInterview: boolean;
  userType: string = undefined;
  isRejectCandidate: boolean;
  isCreateOffer: boolean;
  isRateInterview: boolean;
  isAddAndSubmit: boolean;
  isCounterOffer: boolean;
  isRejectOffer: boolean;
  isOnboardingCandidate: boolean;

  isRejectedJob: boolean;
  isDraftJob: boolean;
  isCloneJob: boolean;
  isAcceptOffer: boolean;
  jobId: string;
  isDistribute: boolean;
  isReview: boolean;
  isClose: boolean;
  isRelease: boolean;
  isHaltSubmission: boolean;
  isHold: boolean;
  isApprove: boolean;
  isReject: boolean;
  isEditAndReview: boolean;
  isReDistribute: boolean;
  jobStatus: any = JobStatus;
  loggedUserType: any = UsersType;
  isEditOffer: boolean;
  currentProgram: any;
  userInfo:any;
  rowDropdownTrigger = false;
  isOfferReview: boolean;
  isEditJob: boolean;
  public scrollConfig: PerfectScrollbarConfigInterface = { suppressScrollX: false, suppressScrollY: true };
  scrollbarStatus: boolean = false;
  viewportWidth:number = 0;
  recordConfig:boolean = false;
  isOptInOptOut: boolean;
  showManagerList = false;
  managerList:any= []
  @ViewChild('recordOptionTrigger', { read: ElementRef, static: false }) recordOptionTrigger: ElementRef;
  @ViewChild('recordOptionConfig', { read: ElementRef, static: false }) recordOptionConfig: ElementRef;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private eventStream: EventStreamService,
    private router: Router,
    private svmsRouter: SvmsRouterService,
    private datePipe: LocalDateFormatPipe,
    private localStorage: StorageService,
    private route: ActivatedRoute,
    private render: Renderer2,
  ) {
    window.onscroll = () => {
      const st = window.scrollY;
      if (st > this.lastScrollTop) {
        if (st > 110) {
          this.fixedHeader = true;
        }
      } else if (110 < st && st < this.lastScrollTop) {
        this.fixedHeader = true;
      } else if (st <= 110) {
        this.fixedHeader = false;
      }

      this.lastScrollTop = st;

      this.changeDetectorRef.detectChanges();
    };

    this.render.listen('window', 'click', (e: Event) => {
      if ((this.recordOptionTrigger && this.recordOptionTrigger.nativeElement.contains(e.target)) ||
        (this.recordOptionConfig && this.recordOptionConfig.nativeElement.contains(e.target) && this.recordConfig)) {
        this.recordConfig = true;
        const recordPosition = this.recordOptionTrigger.nativeElement.getBoundingClientRect();
        const recordPopup = document.getElementById("recordpopup");
        recordPopup.style.top = (recordPosition.top + 22) + "px";
        recordPopup.style.left = (recordPosition.left - 88) + "px";
      } else {
        this.recordConfig = false;
      }
      this.changeDetectorRef.detectChanges();
    });
  }

  @HostListener('window:scroll', []) onWindowScroll() {
    const st = window.scrollY;
    const winHeight = window.innerHeight;
    const bodyHeight = document.getElementById('pagecontainer').clientHeight - 65;
    if (winHeight + st > bodyHeight) {
      this.scrolledBottom = true;
    } else {
      this.scrolledBottom = false;
    }
  }

  get doesColumnListExist() {
    return Object.keys(this.columnClick).length;
  }

  closeRecordConfig() {
    this.recordConfig = false;
    this.changeDetectorRef.detectChanges();
  }

  ngOnChanges() {
    if(this.vmsDataSource?.length && this.vmsDataSource?.filter(val => val?.disableCheckbox)?.length === this.vmsDataSource?.length) {
      this.disabledSelectAll = true
    }
    if (this.availableCountForSelect) {
      this.selectedAllRecordsCount = this.availableCountForSelect;
    } else {
      this.selectedAllRecordsCount = this.totalItem;
    }
    if(this.countInput == undefined && this.totalItem > 0){
      this.countInput = this.totalItem;
    }
    if (this.isTabChanged) {
      this.vmsDataSource?.forEach(val => {
        val.selected = false;
      });
      this.isTabChanged = false;
    }
    if (this.isMultipleSelectionDropdown) {
      if (this.manuallySelectedCount === 0) {
        if (this.selectedRecordsCount < this.itemsPerPage && this.countInput !== this.totalItem && !this.isCheckboxClicked) {
          this.allSelectedRows = false;
          if (this.customSelected) this.isDisabledCheckbox = true;
          this.vmsDataSource?.forEach((val, ind) => {
            if (this.selectedRecordsCount > ind) {
              if(!val?.disableCheckbox && !this.customSelected){
                val.isChecked = true;
              }
            }
          });
        } else if (this.selectedRecordsCount === this.itemsPerPage) {
          if (this.customSelected) this.isDisabledCheckbox = true;
          if(((this.currentPage-1) * this.itemsPerPage) !== this.selectedRecordsCount ){
            this.vmsDataSource?.forEach((val) => {
              if(!val?.disableCheckbox && !this.customSelected){
                val.isChecked = true;
              }
            });
            this.selectAllValue = true;
          }
          if (!this.customSelected) {
            this.selectPageData = true;
          }
        } else {
          let selectedRecordsPerPageRatio = this.selectedRecordsCount / this.itemsPerPage - this.currentPage;
          if (selectedRecordsPerPageRatio > -1 && !this.isCheckboxClicked) {
            if (this.customSelected) {
              this.isDisabledCheckbox = true;
              this.vmsDataSource?.forEach((val, ind) => {
                if (selectedRecordsPerPageRatio > 0 || Number(((selectedRecordsPerPageRatio + 1) * this.itemsPerPage).toFixed()) > ind) {
                  if(!val?.disableCheckbox){
                    val.isChecked = true;
                  }
                }
                if (selectedRecordsPerPageRatio < 0 && (this.totalItem != this.selectedRecordsCount)) this.selectAllValue = false;
                else {
                  this.selectAllValue = true;
                  if (!this.customSelected) {
                    if (this.totalItem != this.selectedRecordsCount) { this.selectPageData = true } else {
                      this.isAllRecordsSelected = true;
                    }
                  }
                }
              });
            }
          }
          else {
            this.allSelectedRows = false;
          }
        }
      }
      else if (this.manuallySelectedCount !== this.itemsPerPage || !this.isCheckboxClicked) {
        if (this.currentPage !== this.selectedAllRecordsPage && this.selectedAllRecordsPage !== -1 || this.customSelected) {
          if (this.selectedRecordsCount === this.itemsPerPage && this.currentPage !== this.selectedAllRecordsPage && !this.isAllRecordsSelected) {
            if (this.vmsDataSource.filter((val) => val.isChecked).length !== this.vmsDataSource.length) {
              if (this.selectPageData || this.selectAllValue) this.vmsDataSource.forEach((val) => val.isChecked = false)
              if(this.onPaginationChange){
                this.selectAllValue = false;
              }
              this.isAllRecordsSelected = false;
              this.selectPageData = false;
            }
          }
        }
        if (this.selectedAllRecordsPage === this.currentPage && this.manuallySelectedCount == this.vmsDataSource.length && this.onPaginationChange) {
          if(this.vmsDataSource.filter((val) =>  val.isChecked).length === this.vmsDataSource.length)  {
          this.selectAllValue = true;
          if (!this.customSelected) {
            this.selectPageData = true;
          }
        }
          if (this.vmsDataSource.filter((val) => val.isChecked).length === 0 && this.onPaginationChange) {
            this.selectAllValue = false;
            this.selectPageData = false;
          }
        }
        else {
          if (this.selectPageData && this.currentPage === this.selectedAllRecordsPage && this.onPaginationChange && (this.vmsDataSource.filter((val) => val.isChecked).length === this.itemsPerPage || this.vmsDataSource.length === this.selectedRecordsCount)) {
            this.selectAllValue = true;
          }
          else if ((((this.radioType !== "apply" || this.selectedRecordsCount < (this.itemsPerPage * this.currentPage)) && (this.itemsPerPage !== this.selectedRecordsCount)) && this.totalItem !== this.selectedRecordsCount)) {
            if(this.vmsDataSource.filter((val) => val.isChecked).length != this.vmsDataSource.length){
              if (this.onPaginationChange || this.isRecoredsChange) {
                this.selectAllValue = false;
              }
              this.selectPageData = false;
            }
          }
          if(this.onPaginationChange){
            if (this.vmsDataSource.filter((val) => val.isChecked).length === this.vmsDataSource.length) {
              this.selectAllValue = true;
            }
            else if (this.vmsDataSource.filter((val) => val.isChecked).length !== this.vmsDataSource.length) {
              this.selectAllValue = false;
            }
          }
          if (this.vmsDataSource.filter((val) => val.isChecked).length === this.itemsPerPage && this.onPaginationChange) {
            this.selectAllValue = true;
            this.selectPageData = true;
            if (this.customSelected || this.isAllRecordsSelected) this.selectPageData = false;
          }
        }
      }
      if (this.manuallySelectedCount && !this.customSelected && !this.isAllRecordsSelected) this.selectedRecordsCount = this.manuallySelectedCount;
    }
    this.pagination();
    setTimeout(() => {
      if ((this.vmsDataSource?.filter(d => d?.isChecked)?.length > 0) && ((this.vmsDataSource?.filter(d => d?.isChecked)?.length + this.vmsDataSource?.filter(d => d?.disableCheckbox)?.length) === this.vmsDataSource?.length)) {
        this.selectAllValue = true;
        this.disabledSelectAll = false;
      } else {
        this.selectAllValue = false;
      }
    }, 50);
  }
  showSort(i, type) {
    this.showSortIndex = i;
    if (type === 'hide' && this.sortedColumn === '') {
      this.showSortIndex = undefined;
    }
  }
  pagination() {
    if (this.itemsPerPage < 1) {
      this.itemsPerPage = 10;
    }
    this.maxPages = Math.ceil(this.totalItem / this.itemsPerPage);
  }
  ngOnInit() {
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.viewportChecker();
    this.currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.userInfo = this.localStorage.get('user');
    this.jobId = this.route?.parent?.snapshot?.params?.id;
    this.userType = this.localStorage.get('user_type');

    this.changeDetectorRef.detectChanges();

    this.subscriptions.push(
      this.eventStream.on(Events.VIEW_TYPE).subscribe(data => {
        if (data === 'COMPACT') {
          this.compactView = true;
        } else if (data === 'COMFORTABLE') {
          this.compactView = false;
        }
      }),
    );

    this.subscriptions.push(
      this.eventStream.on(Events.ITEM_POSITION).subscribe( item => {
        if((item?.refName && item?.refName===this.refName) || !item?.refName){this.noActionMessages = false;
        if (item.Item_Active == true) {
          const itemPosition = item.itemPosition;
          this.rowDropdownTrigger = true;
          if(this.rowDropdownTrigger == true) {
            setTimeout(() => {
              const ulItem = document.getElementById(`dropdownUnorderList-${this.refName}`).querySelectorAll('li');
              let count = 0;
              for (let i = 0; i <= ulItem.length - 1; i++) {
                if(ulItem[i].hasAttribute('hidden') === true || (ulItem[i]?.childNodes?.length === 1 && ulItem[i]?.childNodes[0]?.nodeName === '#comment')) {
                  count++
                }
              }

              if((ulItem.length)  === count) {
                this.noActionMessages = true;
              }

              const targetItem = document.getElementById(`rowDropdown-${this.refName}`);
              const windowHeight = window.innerHeight;
              const targetHeight = targetItem.clientHeight;
              targetItem.style.top = `${itemPosition.top + itemPosition.height + 12}px`;
              targetItem.style.left = `${itemPosition.left - 20}px`;
              targetItem.classList.add('active');
              if (itemPosition.top + targetHeight > windowHeight) {
                targetItem.classList.add('flip');
                targetItem.style.transform = `translateY(-${targetHeight + 60}px)`;
              } else {
                targetItem.classList.remove('flip');
              }
              this.render.addClass(document.body, 'dropdown-menu-overflow');
              this.changeDetectorRef.detectChanges();
            }, 200);
          }
        }
        else if(item.Item_Active == false) {
          this.rowDropdownTrigger = false;
          this.render.removeClass(document.body, 'dropdown-menu-overflow');
          this.noActionMessages = false;
        }}
        if((item?.refName && item?.refName!==this.refName)){
          this.rowDropdownTrigger = false;
          this.noActionMessages = false;

        }
      }),

      this.eventStream.on(Events.MANAGER_COUNT).subscribe( item => {
        if (item.Item_Active == true) {
          const itemPosition = item.itemPosition;
          this.showManagerList = true;
          this.managerList=item.managerList;
          if(this.showManagerList == true) {
            setTimeout(() => {
              const pageBody = document.getElementById('pagecontainer');
              const windowHeight = pageBody?.offsetHeight;
              const targetList = document.getElementById('managerlistDropdown');
              const targetHeight = targetList.offsetHeight;
              targetList.style.top = `${itemPosition.top}px`;
              targetList.style.left = `${itemPosition.left + 25}px`;
              targetList.classList.add('active');
              if (itemPosition.top + window.scrollY + targetHeight + 100 > windowHeight) {
                targetList.classList.add('flip');
              } else {
                targetList.classList.remove('flip');
              }
              this.render.addClass(document.body, 'dropdown-manager-overflow');
              this.changeDetectorRef.detectChanges();
            }, 200);
          }
        }
        else if(item.Item_Active == false) {
          this.showManagerList = false;
          this.render.removeClass(document.body, 'dropdown-manager-overflow');
        }
      })
    );
    if(this.totalItem > 0){
      this.countInput = this.totalItem;
    }
  }

  ngAfterViewChecked() {
    const st = window.scrollY;
    const winHeight = window.innerHeight;
    const bodyHeight = document.getElementById('pagecontainer')?.clientHeight;
    if (winHeight == bodyHeight) {
      this.scrolledBottom = true;
    } else if (winHeight + st > bodyHeight - 65) {
      this.scrolledBottom = true;
    } else {
      this.scrolledBottom = false;
    }
  }

  viewportChecker() {
    const checkWindowWidth = () => {
      this.viewportWidth = window.innerWidth;
      if(this.viewportWidth > 767) {
        this.scrollbarStatus = false;
      }
      else if(this.viewportWidth <= 767) {
        this.scrollbarStatus = true;
      }
    }

    setTimeout(() => {
      checkWindowWidth()
    }, 1000);

    window.addEventListener('resize', checkWindowWidth);
  }

  setDropdownOptions(name) {
    if (name?.isDetails) {
      this.isDetails = true;
    }
    if (name?.isVieworClone) {
      this.isVieworClone = true;
    }
    if (name?.isVieworEdit) {
      this.isVieworEdit = true;
    }
    if(name?.isEditEditRule){
      this.isEditEditRule = true;
    }
    if(name?.isVieworEditFlow) {
      this.isVieworEditFlow = true;
    }
    if(name?.isDeleteFlow) {
      this.isDeleteFlow = true;
    }
    if (name?.isVieworEditCandidate) {
      this.isVieworEditCandidate = true;
    }

    if (name?.isGenericWithdraw) {
      this.isGenericWithdrawText = name.isGenericWithdrawText;
      this.isGenericWithdraw = true;
    }

    if (name?.isDisableorDelete) {
      this.isDisableorDelete = true;
    }
    if (name?.isDelete) {
      this.isDelete = true;
    }
    if (name?.isOptOut) {
      this.isOptOut = true;
    }
    if (name?.isOptIn) {
      this.isOptIn = true;
    }
    if (name?.isSubmitCandidate) {
      this.isSubmitCandidate = true;
    }
    if (name?.showComplianceOption) {
      this.showComplianceOption = true;
    }
    if (name?.isViewProfile) {
      this.isViewProfile = true;
    }
    if (name?.isEditorReview) {
      this.isEditorReview = true;
    }
    if (name?.isWithdrawal) {
      this.isWithdrawal = true;
    }
    if (name?.isOfferCandidateWithdrawal) {
      this.isOfferCandidateWithdrawal = true;
    }
    if (name?.isRescheduleInterview) {
      this.isRescheduleInterview = true;
    }
    if (name?.isEditInterview) {
      this.isEditInterview = true;
    }
    if (name?.isInterviewReview) {
      this.isInterviewReview = true;
    }
    if (name?.isEditInterviewReview) {
      this.isEditInterviewReview = true;
    }
    if (name?.isCancelInterviewReview) {
      this.isCancelInterviewReview = true;
    }
    if (name?.isCancelInterview) {
      this.isCancelInterview = true;
    }
    if (name?.isScheduleInterview) {
      this.isScheduleInterview = true;
    }
    if (name?.isRejectCandidate) {
      this.isRejectCandidate = true;
    }
    if (name?.isCreateOffer) {
      this.isCreateOffer = true;
    }
    if (name?.isRateInterview) {
      this.isRateInterview = true;
    }
    if (name?.isAddAndSubmit) {
      this.isAddAndSubmit = true;
    }
    if (name?.isCounterOffer) {
      this.isCounterOffer = true;
    }
    if (name?.isRejectOffer) {
      this.isRejectOffer = true;
    }
    if (name?.isOnboardingCandidate) {
      this.isOnboardingCandidate = true;
    }
    if (name?.isAcceptOffer) {
      this.isAcceptOffer = true;
    }
    if (name?.isRejectedJob) {
      this.isRejectedJob = true;
    }
    if (name?.isDraftJob) {
      this.isDraftJob = true;
    }
    if (name?.isCloneJob) {
      this.isCloneJob = true;
    }
    if (name?.isDistribute) {
      this.isDistribute = true;
    }
    if (name?.isApprove) {
      this.isApprove = true;
    }
    if (name?.isReject) {
      this.isReject = true;
    }
    if (name?.isHold) {
      this.isHold = true;
    }
    if (name?.isReDistribute) {
      this.isReDistribute = true;
    }
    if (name?.isHaltSubmission) {
      this.isHaltSubmission = true;
    }
    if (name?.isRelease) {
      this.isRelease = true;
    }
    if (name?.isClose) {
      this.isClose = true;
    }
    if (name?.isReview) {
      this.isReview = true;
    }
    if (name?.isEditAndReview) {
      this.isEditAndReview = true;
    }
    if (name?.isEditOffer) {
      this.isEditOffer = true;
    }
    if(name?.isOfferReview){
      this.isOfferReview=true;
    }
    if(name?.isEditJob){
      this.isEditJob = true;
    }
    if(name?.isOptInOptOut) {
      this.isOptInOptOut = true;
    }
  }
  jobOptionListClicked(key) {
    this.onJobOptionClicked.emit({
      key,
      vmsData: this.selectedVmsData,
    });
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  distributionOptionClicked(key) {
    this.onDistributionOptionClicked.emit({
      key,
      vmsData: this.selectedVmsData,
    });
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  complianceOptionClick(vmsData) {
    this.onComplianceClicked.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  hideDropdownBox(e: Event) {
    if(e) {
      this.rowDropdownTrigger = false;
      this.render.removeClass(document.body, 'dropdown-menu-overflow');
      this.noActionMessages = false;
      this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
    }
    else {}
  }

  hideManagerDropdown(e: Event) {
    if(e) {
      this.showManagerList = false;
      this.render.removeClass(document.body, 'dropdown-manager-overflow');
      this.eventStream.emit(new EmitEvent(Events.MANAGER_COUNT, {"Item_Active": false}));
    }
    else {}
  }

  hideTouchDropdownBox($event) {
    setTimeout(() => {
      if ($event.path[3].classList[1] === 'active') {
        this.rowDropdownTrigger = false;
        this.render.removeClass(document.body, 'dropdown-menu-overflow');
        this.noActionMessages = false;
        const targetItem = document.getElementById(`rowDropdown-${this.refName}`);
        if(targetItem) {
          targetItem.classList.remove('active');
          targetItem.classList.remove('flip');
          targetItem.style.top = '';
          targetItem.style.left = '';
        }
      }
    }, 100);
  }

  scrollLeft($event) {
    if ($event) {
      const shadowTarget = document.querySelector('.listing-wrap');
      shadowTarget.classList.remove('reach-end');
    }
  }

  scrollRight($event) {
    if ($event) {
      const shadowTarget = document.querySelector('.listing-wrap');
      shadowTarget.classList.add('reach-end');
    }
  }

  onclickexpand(index: number, id: string) {
    if (this.expandRow === index) {
      this.expandRow = undefined;
      this.onExpandClick.emit(undefined);
    } else {
      this.expandRow = index;
      this.onExpandClick.emit(id);
    }
  }

  getColumnValue(data: any) {
    if (this.countColumnValue <= this.tableConfig.columnList.length) {
      this.countColumnValue += 1;
      return {
        data: data[this.tableConfig.columnList[0].name],
        type: typeof data[this.tableConfig.columnList[0].name],
      };
    } else {
      this.countColumnValue = 0;
      this.getColumnValue(data);
    }
  }

  getColumnData(name: any, column: any, data: any) {
    if (typeof name === 'object') {
      if (data[name[0]] !== 'None' && data[name[1]] !== 'None') {
        return (this.getFormattedDate(data[name[0]]) ?? '') + ' - ' + (this.getFormattedDate(data[name[1]]) ?? '');
        // return this.datePipe.transform(date1, 'dd-MM-yyyy') + ' - ' + this.datePipe.transform(date2, 'dd-MM-yyyy')
      } else {
        return null;
      }
    }
    if(data?.consolidated_invoice_number && data?.consolidated_invoice_number != "--") {
      this.checkboxDisabled = true;
    }
    else {
      this.checkboxDisabled = false;
    }

    const nameList = name?.split('.');
    if (column?.isArray) {
      let returnData = [];
      let tempData;
      if (!data[nameList[0]]) {
        return null;
      }
      for (const nl of nameList) {
        if (tempData) {
          if (!tempData[nl]) {
            break;
          }
          tempData = tempData[nl];
        } else {
          tempData = data[nl];
        }
      }
      if (tempData && tempData?.length) {
        if (typeof tempData?.[0] === 'string')
          returnData = tempData;
        else
          tempData?.forEach(td => {
            if (td[nameList[nameList?.length - 1]]) {
              returnData.push(td[nameList[nameList?.length - 1]]);
            }
          });
      }
      return returnData;
    } else if (column?.isDate) {
      return this.getFormattedDate(data[name]);
    } else if (this.isRateType(column)) {
      if (data && data[name] && typeof data[name] === 'object') {
        return data[name]
      }
      else {
        return { amount: data[name], currency: data['currency'] };
      }
    }
    else if(column?.isManagerList){
      return data['manager']?.[0]?.name;
    }
    else {
      if (nameList?.length > 1) {
        let returnData;
        if (!data[nameList[0]]) {
          return null;
        }
        nameList?.forEach(n => {
          if (returnData) {
            returnData = returnData[n];
          } else {
            returnData = data[n];
          }
        });
        return returnData;
      }
    }
    return data[name];
  }

  getFormattedDate(date) {
    if (date) {
      if (date?.indexOf('T') !== -1) {
        date = date?.split('T');
        let onlyDate = date[0] || '';
        return this.dateTransform
          ? this.datePipe.transform(onlyDate, null, null, null, true)
          : this.datePipe.transform(onlyDate, this.currentProgram?.defaultDateFormat, null, null, false, DATE_FORMAT.FORMATYMD);
      } else {
        return this.dateTransform
          ? this.datePipe.transform(date, null, null, null, true)
          : this.datePipe.transform(date, this.currentProgram?.defaultDateFormat, null, null, false, DATE_FORMAT.FORMATYMD);
      }
    }
  }

  onViewClickd(event, vmsData, column) {
    this.onViewClick.emit({ ...vmsData, column: column?.name });
    if (vmsData.unique_id && !vmsData?.offer_id) {
      this.svmsRouter.navigate(['program-setup', 'program-detail'], {
        queryParams: {
          programId: vmsData?.unique_id,
          clientId: vmsData?.client?.id,
          program_req_id: vmsData?.id,
          clientName: vmsData.client?.name,
        },
      });
      this.localStorage.set(ProgramConfig[5], vmsData, true);
    }
  }

  navigateToMtpDetails = (mtp_id:string) => {
    if(mtp_id){
      this.openMTPLinkingModal.emit(mtp_id);
    }
  }

  isRateType(column) {
    let rate_columns = [
      'rate', 'total_invoice_value', 'gst_amount', 'gst_rate', 'basic_invoice_value',
      'net_allocated_budget', 'total_timesheet_amount', 'total_budget', 'used_amount', 'total_tax_amount',
      'total_amount', 'amount_without_tax', 'total_msp_amount', 'item_total_tax_amount', 'item_total_amount',
      'item_amount_without_tax', 'item_total_msp_amount', 'bill_rate', 'pay_rate', 'total_expense_amount',
      'total_misc_expense_amount', 'total_billrate', 'basic_invoice_value', 'total_invoice_value',
      'final_regular_bill_rate', 'final_overtime_bill_rate', 'final_doubletime_bill_rate', 'total_final_amount',
      'estimate_budget', 'budget_amount', 'bill_amount', 'ratecard_amount', 'saving_amount', 'overpayment_amount',
      'regular_billrate_total_amount', 'regular_payrate_total_amount', 'current_budget', 'total_assignment_budget_approved',
      'total_assignment_balance_remaining', 'assignment_budget_per_day_approved', 'assignment_budget_for_the_month',
      'total_budget_spent', 'spend_of_the_month', 'rt_amount', 'ot_amount', 'dt_amount', 'st_amount',
      'total_expense_amount', 'total_timesheet_amount', 'total_assignment_budget_approved', 'total_budget_spent',
      'total_assignment_balance_remaining', 'last_spend_amount', 'remaining_amount', 'ot_bill_rate', 'dt_bill_rate',
      'sow_budget', 'utilized_sow_budget', 'remaining_sow_budget', 'st_bill_rate', 'msp_fee_rate', 'rt_bill_rate',
      'budget_utilisation_exceeded_by_sow', 'project_budget', 'project_budget_second', 'total_approved_progress_update_spend',
      'total_approved_progress_update_spend_second', 'total_approved_resource_budget', 'total_utilised_project_budget',
      'Remaining_Project_Budget', 'Project_Budget_utilization_exceeded_By', 'progress_update_amount',
      'penalty', 'progress_update_invoice_amount_after_deducting_penalty', 'total_pending_progress_update_spend', 'assignment_budget',
      'total_assignments_pending_approval', 'assignment_spend_approved', 'assignment_remaining_budget', 'assignment_spend_pending',
      'total_assignment_spend_pending', 'total_approved_resource_spend', 'total_approved_resource_spend_second',
      'total_utilized_project_budget_across_spend_approved', 'remaining_project_budget_across_spend_approved',
      'project_budget_utilization_exceeded_across_spend_approved', 'client_billrate_st', 'client_billrate_ot', 'client_billrate_dt',
      'vendor_bill_rate_st', 'vendor_bill_rate_ot', 'vendor_bill_rate_dt', 'total_client_bill_amount', 'total_vendor_bill_amount',
      'gross_amount', 'msp_amount', 'vendor_total_amount', 'net_client_amount_due', 'vendor_bill_rate', 'final_regular_bill_rate',
      'final_ot_bill_rate', 'final_dt_bill_rate', 'regular_pay_rate', 'ot_pay_rate', 'voucher_amount', 'vendor_amount',
      'st_pay_rate', 'dt_pay_rate', 'supplier_bill_rate', 'supplier_dt_bill_rate', 'supplier_ot_bill_rate', 'check_amount',
      'final_bill_rate', 'st_rate', 'ot_rate', 'dt_rate', 'net_client_amount', 'total_spent', 'vendor_bill_total', 'msp_fee',
      'client_bill_total', 'project_spend', 'available_funds', 'dt_weekend_rate', 'ot_weekend_rate', 'st_weekend_rate', 'estimated_budget',
      'tax_client_amount', 'tax_vendor_amount', 'st_spend_amount', 'ot_spend_amount', 'dt_spend_amount', 'break_spend_amount',
      'total_spend_amount',
    ];

    let modifiedRateColumn = [];
    if(typeof this.tableConfig?.formatColumns?.amountTypeColumns != "undefined"){
      modifiedRateColumn = [rate_columns, ...this.tableConfig?.formatColumns?.amountTypeColumns];
    }else{
      modifiedRateColumn = rate_columns;
    }

    var rateSet = new Set(modifiedRateColumn);
    // var rateSet = new Set(rate_columns);
    if (rateSet?.has(column?.name)) {
      return true;
    } else {
      return false;
    }
  }

  isNumberType(column) {
    let number_columns = [
      'project_id', 'total_expense_items', 'no_of_openings', 'job_count', 'job_level', 'submission_count',
      'interview_count', 'offer_count', 'aging_duration', 'number_of_openings', 'contract_id', 'days_per_week',
      'st_hours_per_day', 'total_working_days', 'tax_job_category', 'milestone_end_year',
      'tenure_duration_days', 'tenure_duration_month', 'number_of_days_worked', 'estimated_hours_per_week',
      'numerical_allocation', 'total_job_count', 'response_count', 'response_pct', 'response_rate_score',
      'shortlist_count', 'shortlist_pct', 'shortlist_rate_score', 'interview_pct', 'interview_rate_score',
      'hit_count', 'hit_pct', 'hit_rate_score', 'offer_pct', 'offer_rate_score', 'offer_accepted_count',
      'offer_accepted_pct', 'offer_accepted_rate_score', 'false_start_count', 'false_start_pct',
      'false_start_rate_score', 'rate_competitiveness_count', 'rate_competitiveness_pct', 'rate_competitiveness_score',
      'evaluation_performance_count', 'evaluation_performance_pct', 'evaluation_performance_score',
      'assignment_completion_count', 'assignment_completion_pct', 'assignment_completion_score', 'working_hours',
      'break_hours', 'regular_hours', 'overtime_hours', 'doubletime_hours', 'total_hours', 'total_regular_hours',
      'total_overtime_hours', 'total_doubletime_hours', 'submission_interview_ratio', 'interview_offer_ratio',
      'submission_offer_ratio', 'hours', 'st_hours', 'ot_hours', 'dt_hours', 'st_weekend_hours', 'ot_weekend_hours',
      'dt_weekend_hours', 'timesheet_count', 'spend_to_sow_budget_calculation_percentage', 'per_spend_project_budget',
      'per_spend_project_budget_across_spend_approved'
    ];

    let modifiedNumberColumn = [];
    if(typeof this.tableConfig?.formatColumns?.numericTypeColumns != "undefined"){
      modifiedNumberColumn = [number_columns, ...this.tableConfig?.formatColumns?.numericTypeColumns];
    }else{
      modifiedNumberColumn = number_columns;
    }

    var numberSet = new Set(modifiedNumberColumn);
    if (numberSet?.has(column?.name)) {
      return true;
    } else {
      return false;
    }
  }


  optionClicked(option, data) {
    const payload = { data, option };
    this.onOptionClicked.emit(payload);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  clickToDetails(event, vmsData) {
    this.onDetailClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  clickToViewDetails(event){
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  onCloneClickd(vmsData) {
    this.cloneClicked.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  EditClicked(event, vmsData) {
    this.onEditClick.emit({ ...vmsData, viewOnly: !event });
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  ViewClicked(event,vmsData) {
    this.onViewClick.emit({ ...vmsData, viewOnly: !event });
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  CloneJobClicked(event, vmsData) {
    this.onCloneJobClick.emit({ ...vmsData, viewOnly: !event });
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  onTabClicked(vmsData) {
    this.currentPage = 1;
    this.isTabChanged = true;
    this.clearSelection();
    this.onTabClick.emit(vmsData);
  }
  onSelectAllRecordsClicked(event){
    // this.isDisabledCheckbox = true;
    this.isAllRecordsSelected = true;
    this.selectAllValue = true;
    // this.selectedRecordsCount = event;
    this.vmsDataSource?.forEach(val => {
      if(!val?.disableCheckbox){
        val.isChecked = true;
      }
    });
    if (this.availableCountForSelect) {
      this.selectedRecordsCount = this.availableCountForSelect;
    } else {
      this.selectedRecordsCount = this.totalItem;
    }

    this.selectedRecords.emit(event);
  }
  listFilter(event) {
    this.currentPage = 1;
    this.clearSelection();
    this.onListFilter.emit(event);
    // ToDo: add reports filtering
  }

  onDisableClick(index, vmsData) {
    this.indexValues = index;
    this.isDisabled = true;
    this.onDisableClicked.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  deleteClick(index, vmsData) {
    this.onDeleteClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  clickToViewProfile(index, vmsData) {
    this.onViewProfileClick.emit(vmsData);
  }

  clickToWithdrawProfile(index, vmsData) {
    this.onWithdrawProfileClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  clickToScheduleInterview(index, vmsData) {
    this.onScheduleInterviewClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  clickTorRehireCheck(index, vmsData) {
    this.onRehireCheckClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  clickToCreateOffer(index, vmsData) {
    this.onCreateOfferClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  clickToReviewInterview (index, vmsData) {
    this.onClickToReviewInterview.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, { "Item_Active": false }));
  }
  clickToEditInterviewReview (index, vmsData) {
    this.onClickToEditInterviewReview.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, { "Item_Active": false }));
  }
  clickToCancelInterviewReview (index, vmsData) {
    this.onClickToCancelInterviewReview.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, { "Item_Active": false }));
  }
  clickToOfferReview(index, vmsData) {
    this.onOfferReviewClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, { "Item_Active": false }));
  }
  clickToShortListReview(index, vmsData) {
    this.onshortListReviewClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, { "Item_Active": false }));
  }
  shortlistReviewReject(index, vmsData) {
    this.shortlistReviewClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, { "Item_Active": false }));
  }
  clickToEditOfferReview(index,vmsData){
    this.onEditOfferClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, { "Item_Active": false }));
  }
  clickToCancelOfferReview(index,vmsData){
    this.onCancelOfferClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, { "Item_Active": false }));
  }
  clickToRejectCandidate(index, vmsData) {
    this.onRejectCandidateClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  clickToCompleteInterview(index, vmsData) {
    this.onCompleteInterviewClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  clickToisGenericWithdraw(index, vmsData) {
    this.onclickToisGenericWithdrawClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  onPlusButtonClick(id: string) {}

  onPaginationClick(event) {
    this.onPaginationChange = true;
    this.isCheckboxClicked = false;
    this.currentPage = event;
    if(this.isAllRecordsSelected) {
      this.onSelectedAllRecordsPage.emit(event);
    }
    this.changePage.emit(event);
  }
  onClickRecords(event) {
    this.isRecoredsChange = true;
    if (!this.customSelected && (this.selectedRecordsCount === (this.itemsPerPage * this.currentPage))) {
      this.clearSelection();
    }
    this.changeRecords.emit(event);
  }
  onCreateClick(event) {
    this.onCreate.emit(event);
  }

  onClickNext(event) {
    this.clickOnNext.emit(event);
  }
  onSettingClick(event) {
    event.forEach(colName => {
      this.columnList[colName.name] = colName.value;
    });
    this.widthCalculator(event);
    this.changeDetectorRef.detectChanges();
  }

  onNumberBadgeClicked(column: ColumnConfig, vmsData: any) {
    this.numberBadgeClicked.emit({
      name: column.name,
      vmsData,
    });
  }

  widthCalculator(event) {
    let totalAdjustValue = 0;
    let noOfShow = 1;
    event.forEach(colName => {
      if (!this.columnList[colName.name]) {
        totalAdjustValue += this.columnWidth.find(a => a.name === colName.name).value;
      } else {
        noOfShow += 1;
      }
    });

    const adjustWidth = totalAdjustValue / noOfShow;

    this.columnWidth.forEach(colName => {
      if (this.columnList[colName.name]) {
        this.columnList[colName.name + '_width'] = colName.value + adjustWidth;
      }
    });
  }

  onSearchClick(event) {
    this.clearSelection();
    this.search.emit(event);
  }

  monthChange(event) {
    this.onMonthChange.emit(event);
  }
  yearChange(event) {
    this.onYearChange.emit(event);
  }

  onClickHeaderFilter(event) {
    this.onClickFilter.emit(event);
  }

  columnClick(column: ColumnConfig, vmsData: any) {
    this.selectedVmsData = vmsData;
    if (column.enableClick) {
      this.columnClicked.emit({
        name: column.name,
        vmsData,
      });
    }
  }

  onSortClick(name) {
    if (this.sortedColumn === '') {
      this.isSortAsc = true;
    } else if (this.sortedColumn !== name) {
      this.isSortAsc = true;
    } else {
      this.isSortAsc = !this.isSortAsc;
    }
    if (this.sortedColumn === name && this.isSortAsc) {
      this.sortedColumn = '';
    } else {
      this.sortedColumn = name;
    }
    if (this.sortedColumn === name && this.isSortAsc) {
      this.onSort.emit({ name, order: 'ASC' });
    } else if (this.sortedColumn === name && !this.isSortAsc) {
      this.onSort.emit({ name, order: 'DESC' });
    } else if (this.sortedColumn === '') {
      this.onSort.emit(undefined);
    }
    this.currentPage = 1;
  }

  onFliterCandidate(name){
    this.onCandidateFilter.emit(name);
  }

  hideOptionDropdown() {
    // this.eventStream.emit(new EmitEvent(Events.OPTION_DROPDOWN, true));
    // this.hoverState = null;
  }

  onRowNameClick(column: ColumnConfig, vmsData: any) {
    this.onNameClick.emit({ column, vmsData });
  }

  selectAllClick(vmsData: any) {
    if ( this.customSelected) return;
    this.customSelected = false;
    this.onPaginationChange = false;
    if ((this.vmsDataSource?.filter((val) => val?.isChecked)?.length === this.vmsDataSource?.length) || this.selectAllValue ) {
      this.allSelectedRows = false;
      this.selectPageData = false;
      if (this.vmsDataSource?.filter((val) => val?.isChecked === true)?.length === this.selectedRecordsCount) {
        this.selectedRecordsCount = 0;
        this.selectedRecords.emit(0);
        this.vmsDataSource?.forEach(val => {
          val.isChecked = false;
        });
        this.onSelectAllClick.emit({ selected: this.vmsDataSource });
      }
      else {
        let recordIds = [];
        if (this.recordType === 'invoice') {
          let allRecordsIds = this.vmsDataSource.map(x => x?.all_invoice_uuid);
          allRecordsIds.forEach((allRecordsId) => {
            recordIds = [...recordIds, ...allRecordsId];
          })
        }
        else {
          recordIds = this.vmsDataSource.map(x => x?.timesheet_uuid);
        }
        this.selectedRecordslist = this.selectedRecordslist?.filter(x => !recordIds.includes(x));
        this.selectedRecordsCount = this.selectedRecordsCount - this.vmsDataSource?.filter((val) => val?.isChecked)?.length;
        this.vmsDataSource?.forEach(val => {
          val.isChecked = false;
        });
        this.onSelectAllClick.emit({ selected: this.isAllRecordsSelected ? this.vmsDataSource :this.selectedRecordslist });
        if(this.isAllRecordsSelected){
          this.selectedRecords.emit(this.selectedRecordsCount);
        }
      }
      this.isDisabledCheckbox = false;
    }
    else {
      this.allSelectedRows = true;
      this.selectPageData = true;
      if (this.isAllRecordsSelected) {
        this.selectedRecordsCount = this.selectedRecordsCount + this.vmsDataSource?.filter((val) => !val?.disableCheckbox && val?.isChecked === false)?.length;
      }
      else {
        this.selectedRecordsCount = this.vmsDataSource?.filter((val) => !val?.disableCheckbox)?.length;
      }
      this.vmsDataSource?.forEach(val => {
        if(!val?.disableCheckbox){
          val.isChecked = true;
        }
      });
      this.isDisabledCheckbox = false;
      if(this.isAllRecordsSelected){
        this.selectedRecords.emit(this.selectedRecordsCount);
      }
      this.onSelectAllClick.emit({ selected: this.vmsDataSource });
      this.selectedAllRecordsPage = this.currentPage;
      this.onSelectPageData.emit(this.selectPageData);
      this.onSelectedAllRecordsPage.emit(this.selectedAllRecordsPage);
    }
  }

  getTooltipText(text) {
    if (text && this.isDisabledCheckbox) return text;
    else '';
  }

  clearSelection() {
    this.countInput = this.totalItem;
    this.selectedAllRecordsPage = -1;
    this.allSelectedRows = false;
    this.selectAllValue = false;
    this.selectPageData = false;
    this.customSelected = false;
    this.isAllRecordsSelected = false;
    this.isDisabledCheckbox = false;
    this.selectedRecordsCount = 0;
    this.selectedAllRecordsCount = 0;
    this.vmsDataSource?.forEach(val => {
      val.isChecked = false;
      val.selected = false;
    });
    this.onSelectAllClick.emit({ selected: [] });
    this.onAllRecordsSelected.emit(this.isAllRecordsSelected);
    this.selectedRecords.emit(0);
  }

  selectRadioButton(vmsData: any, type) {
    this.isCheckboxClicked = false;
    if (type === "custom") {
      this.customSelected = true;
      this.countInput = this.totalItem;
    }
    else if (type === "apply") {
      this.selectedAllRecordsPage = this.currentPage;
      if(this.customSelected) this.selectedAllRecordsPage = 1;
      this.onSelectedAllRecordsPage.emit(this.selectedAllRecordsPage);
      if (!this.customSelected) {
        this.onSelectPageData.emit(this.selectPageData);
        this.selectAllValue = true;
        this.allSelectedRows = true;
        if(this.isAllRecordsSelected) {
        this.selectedRecordsCount = this.totalItem;
        }
        this.vmsDataSource?.forEach(val => {
          if(!val?.disableCheckbox){
            val.isChecked = true;
          }
        });
        this.onSelectAllClick.emit({ selected: this.isAllRecordsSelected ? [] : this.vmsDataSource });
        this.onAllRecordsSelected.emit(this.isAllRecordsSelected);
        this.isDisabledCheckbox = false;
        if(this.isAllRecordsSelected)
        {
          this.selectedRecords.emit(this.selectedRecordsCount);
        }
        else {
          this.selectedRecords.emit(0);
        }
      }
      else {
        let customData = [];
        this.isDisabledCheckbox = true;
        if (this.countInput > this.itemsPerPage * (this.currentPage - 1)) {
          this.vmsDataSource?.forEach((val, ind) => {
            if (this.countInput - this.itemsPerPage * (this.currentPage - 1) > ind) {
              if(!val?.disableCheckbox){
                val.isChecked = true;
              }
              customData.push(val);
            }
            else {
              val.isChecked = false;
            }
          })
        }
        else {
          this.vmsDataSource?.forEach((val, ind) => {
            val.isChecked = false;
          })
        }
        this.onSelectPageData.emit(false);
        this.onSelectAllClick.emit({ selected: [] });
        if (this.countInput >= this.vmsDataSource?.length && this.countInput >= this.itemsPerPage * (this.currentPage)) {
          this.selectAllValue = true;
          if (!this.customSelected) {
            this.selectPageData = true;
          }
          this.allSelectedRows = true;
        }
        else {
          this.allSelectedRows = false;
          this.selectAllValue = false;
        }
        this.selectedRecordsCount = this.countInput;
        this.selectedRecords.emit(this.countInput);
      }
      this.closeRecordConfig()
    }
    else {
      this.customSelected = false;
      if (type === "selectAllData") { this.isAllRecordsSelected = true; this.selectPageData = false; }
            if (type === "selectPageData") { this.selectPageData = true; this.isAllRecordsSelected = false; }
    }
    this.radioType = type;
  }

  onCheckClick(vmsData: any, index) {
    this.vmsDataSource[index].isChecked = !!vmsData.isChecked;
    this.onSelectClick.emit({ selected: vmsData });
    if (!vmsData.isChecked) {
      this.resetTimesheetCheckboxes();
    }
    // let checkTicked;
    /* this.vmsDataSource.forEach(elem => {
      if (
        (elem.isChecked && elem !== vmsData) ||
        (!elem.isChecked && elem === vmsData)
      ) {
        checkTicked = true;
      } else {
        checkTicked = false;
        return;
      }
    }); */
    let checkTicked = this.vmsDataSource.every(function (elem) {
      return elem.isChecked;
    });
    if (checkTicked) {
      this.enableSelectAll();
    }
    if (this.isAllRecordsSelected) {
      this.selectedRecordsCount = vmsData.isChecked ? this.selectedRecordsCount + 1 : this.selectedRecordsCount - 1;
    }
    else {
      this.selectedRecordsCount = this.vmsDataSource?.filter((val) => val.isChecked === true)?.length;
    }
    this.isCheckboxClicked = true;
  }
  clickToRescheduleInterview(index, vmsData) {
    this.onRescheduleInterviewClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  clickToCancelInterview(index, vmsData) {
    this.onCancelInterviewClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  clickToViewSubmittedCandidate(event, vmsData) {
    this.onViewSubmittedCandidateClick.emit(vmsData);
  }

  onOptOutClicked(event, vmsData) {
    this.onOptOutClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  viewScheduleClicked(vmsData) {
    this.onViewScheduleClick.emit(vmsData);
  }

  onOptInClicked(event, vmsData) {
    this.onOptInClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }
  onUpdateClicked(event, vmsData) {
    this.updateClicked.emit(vmsData);
  }

  onSubmittedCandidateClicked(event, vmsData) {
    this.onSubmittedCandidateClick.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  hoverClass(i, vmsData) {
    // this.selectedVmsData = vmsData;
    this.hoverState = i;
  }

  clickToViewPanel(event, vmsData) {
    this.onOpenPanel.emit(vmsData);
  }
  onSelectButtonClick(eve) {
    this.onHeaderButtonClick.emit(eve);
  }
  onDownloadClick(eve) {
    this.onDownloadButtonClick.emit(eve);
  }
  resetTimesheetCheckboxes() {
    this.allSelectedRows = false;
    this.selectAllValue = false;
    this.customSelected = false;
  }
  enableSelectAll() {
    this.allSelectedRows = true;
    this.selectAllValue = true;
    this.customSelected = false;
  }

  clickToCounterOffer(index, vmsData) {
    this.counterOffer.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  clickToEditOffer(index, vmsData) {
    this.editOffer.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  clickToAcceptOffer(index, vmsData) {
    this.acceptOffer.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  clickToRejectOffer(index, vmsData) {
    this.rejectOffer.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  clickToOnboardingCandidate(index, vmsData) {
    this.onboardingCandidate.emit(vmsData);
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  createoffer(event) {
    this.eventStream.emit(new EmitEvent(Events.JOB_TAB_CHANGE, 'submitted-candidate'));
    this.router.navigate([`jobs/details/job-details/${this.jobId}/submitted-candidate`]);
  }

  previewOptionClicked(vmsData) {
    this.previewClicked.emit(vmsData);
  }

  actionButtonClicked(btn) {
    this.onActionButtonClick.emit(btn);
  }

  titleClicked(event) {
    this.tableConfig.subTitle = '';
    this.onTitleClicked.emit(event);
  }

  baseReportClicked(event) {
    this.onBaseReportClicked.emit(event);
  }

  onRowSelect(value) {
    this.selectedRecordsCount = this.vmsDataSource?.filter((val) => val.selected === true)?.length;
    this.onRowChecked.emit(value);
  }

  public onPendingIconClicked(_, vmsData) {
    this.onPendingIconClick.emit(vmsData);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  draftOptionClicked(key): void {
    this.onDraftOptionClicked.emit({ key, vmsData: this.selectedVmsData });
    this.rowDropdownTrigger = false;
    this.render.removeClass(document.body, 'dropdown-menu-overflow');
    this.eventStream.emit(new EmitEvent(Events.ITEM_POSITION, {"Item_Active": false}));
  }

  downloadDocument(rowData) {
    this.downloadDoc.emit(rowData)
  }

  showCandidateScore(event) {
    this.viewCandidateScore.emit(event)
  }

  showCompareScreen(event) {
    this.viewCompareScreen.emit(event);
  }

  emitScoreFactors(event) {
    this.emitCandidateScore.emit(event);
  }
}
