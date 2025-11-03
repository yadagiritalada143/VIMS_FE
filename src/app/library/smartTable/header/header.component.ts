import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { Subject, debounceTime } from 'rxjs';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { VMSConfig } from '../table/table.model';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import * as _ from 'lodash';

@Component({
  selector: 'vms-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class VMSHeaderComponent implements OnInit, OnChanges {
  isSelectedTab: string = undefined;
  @Input() mainmenuName = 'Clients';
  @Input() submenuName: string;
  @Input() createBtnName = 'Create New';
  @Input() isCreateButtonName: string;
  @Input() tableConfig: VMSConfig;
  @Input() initialPage = 1;
  @Input() currentPage = 1;
  @Input() maxPages = 1;
  @Input() count: any;
  @Input() filterCandidateBy: any;
  showAllRecordsToggle: boolean = true;
  // @Input() currentTab: string= undefined;
  @Input() set currentTab(data) {
    if (data) {
      this.isSelectedTab = data;
    }
  }

  @Input() isSelectSubmitButtonName: string;
  @Input() routeLinkOption: string;
  @Input() routeLinkText: string;
  @Input() searchPlaceHolder: string;
  @Input() searchValue = '';
  @Input() customDownload;
  @Input() selectedRecordsCount: number;
  @Input() totalItem;
  @Input() selectedAllRecordsCount: number;
  @Input() selectAllRecordsFromBar;
  @Output() changePages = new EventEmitter<number>(true);
  @Output() onCreate = new EventEmitter<boolean>();
  @Output() onFilter = new EventEmitter<any>();
  @Output() onSearch = new EventEmitter<any>();
  @Output() onMonthChangeEvent = new EventEmitter<any>();
  @Output() onYearChangeEvent = new EventEmitter<any>();
  @Output() onSetting = new EventEmitter<any>();
  @Output() onListFilter = new EventEmitter();
  @Output() onTabClick = new EventEmitter();
  @Output() onSelectAllRecordsClick = new EventEmitter();
  @Output() onSortFilter = new EventEmitter();
  @Output() onHeaderButtonClick = new EventEmitter();
  @Output() onDownloadButtonClick = new EventEmitter();
  @Output() onActionButtonClick = new EventEmitter<any>();
  @Output() titleClick = new EventEmitter<any>();
  @Output() baseReportClick = new EventEmitter<any>();
  @Output() onCandidateFilter = new EventEmitter();
  @Output() clearSelection = new EventEmitter();
  @Output() showCompareScreen = new EventEmitter();
  @Output() emitScoreFactors = new EventEmitter();

  isSearchOpen = false;
  density = 'COMFORTABLE';
  selectedTab = '';
  showSettings = false;
  showFilter = false;
  totalFilterApplied = 0;
  @Input() isFilterCleared = false;
  @Input() compareDisabledBtn: boolean;
  tooltipName: any;
  @ViewChild('action', { read: ElementRef, static: false })
  action: ElementRef;
  @ViewChild('actionList', { read: ElementRef, static: false })
  actionList: ElementRef;
  actionVisibility:boolean = false;
  openDrop = false;
  monthList = [ {name : 'January', value: 'jan'},
                {name : 'February', value: 'feb'},
                {name : 'March', value: 'mar'},
                {name : 'April', value: 'apr'},
                {name : 'May', value: 'may'},
                {name : 'June', value: 'jun'},
                {name : 'July', value: 'jul'},
                {name : 'August', value: 'aug'},
                {name : 'September', value: 'sep'},
                {name : 'October', value: 'oct'},
                {name : 'November', value: 'nov'},
                {name : 'December', value: 'dec'} ];
  yearList = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  selectedMonth = this.monthList[(new Date).getMonth()].value;
  selectedYear = (new Date()).getFullYear();
  customDropdown = false;
  firstPage: any;
  selected : any = null;
  private dragStartIndex: number;
  moreBtnText = "More";
  defaultSortOptions = [{ title: 'Date Created', key: 'created' }, { title: 'Date Updated', key: 'updated' }];
  @ViewChild('setting', { read: ElementRef, static: false }) setting: ElementRef;
  @ViewChild('settingMenu', { read: ElementRef, static: false }) settingMenu: ElementRef;
  @ViewChild('search', { read: ElementRef, static: false }) search: ElementRef;
  @ViewChild('searchInput', { read: ElementRef, static: false }) searchInput: ElementRef;
  @ViewChild('filter', { read: ElementRef, static: false }) filter: ElementRef;
  @ViewChild('filterMenu', { read: ElementRef, static: false }) filterMenu: ElementRef;
  @ViewChild('filterCount', { read: ElementRef, static: false }) filterCount: ElementRef;

  classList = ['ng-option-label', 'ng-option-marked', 'ng-option', 'ng-value-icon', 'datepicker--cell', 'datepicker-apply-btn'];

  public allowReordering: boolean = true;
  public compliance:any;
  @Input('allowReordering') set allowReorder(flag: boolean) {
    if(typeof(flag) === 'boolean') {
      this.allowReordering = flag;
    }
  }

  scoreCalculator: boolean = false;
  total_sum = 0;
  scoreCalCopy = [];
  scoreFactorChange = new Subject<any>();
  

  constructor(
    private render: Renderer2,
    private changeDetectorRef: ChangeDetectorRef,
    private eventStream: EventStreamService,
    private storageService: StorageService
  ) {
    this.render.listen('window', 'click', (e: Event) => {
      if ((this.setting && this.setting.nativeElement.contains(e.target) && !this.showSettings) ||
        (this.settingMenu && this.settingMenu.nativeElement.contains(e.target))) {
        this.showSettings = true;
      } else {
        this.showSettings = false;
      }
      if ((this.search && this.search.nativeElement.contains(e.target)) ||
        (this.searchInput && this.searchInput.nativeElement.contains(e.target))) {
        this.isSearchOpen = true;
      } else {

        if (this.searchValue) {
          this.isSearchOpen = true;
        } else {
          this.isSearchOpen = false;
        }
      }

      // if ((this.filter && this.filter.nativeElement.contains(e.target)) ||
      //   (this.filterMenu && this.filterMenu.nativeElement.contains(e.target)) ||
      //   (this.filterCount && this.filterCount.nativeElement.contains(e.target)) ||
      //   (this.classList.some(className => e.target['classList'].contains(className)))) {
      //   if (!this.classList.some(className => e.target['classList'].contains(className))) {
      //     this.showFilter = true;
      //   }
      // } else {
      //   this.showFilter = false;
      // }
      this.changeDetectorRef.detectChanges();
    });
    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.action && this.action.nativeElement.contains(e.target) && !this.actionVisibility) ||
        (this.actionList && this.actionList.nativeElement.contains(e.target))
      ) {
        this.actionVisibility = true;
      } else {
        this.actionVisibility = false;
      }
      this.changeDetectorRef.detectChanges();
    });
  }

  filterList = {};
  columnCust = [];

  ngOnInit(): void {
    this.compliance = this.storageService.get(StorageKeys?.CURRENT_PROGRAM)?.config?.compliance;
    this.isSelectedTab = this.isSelectedTab ?? this.tableConfig?.tabsList?.[0];
    this.scoreCalCopy = _.cloneDeep(this.tableConfig?.scoreFactors);
    if(!this.selected)
      this.selected =  this.tableConfig?.filterCandidateBy?.[0]?.value ??  null;

    this.tooltipName = this.mainmenuName?.replace(/ List/ig, ' ');
    if (this.tableConfig && this.tableConfig.density) {
      this.density = this.tableConfig.density;
    }
    if (this.tableConfig && this.tableConfig.columnList) {
      this.columnCust = [];
      this.tableConfig.columnList.forEach(col => {
        this.filterList[col.name] = true;
        this.columnCust.push({ name: col.name, value: true });
      });
    }
    this.onSetting.emit(this.columnCust);
    if (this.tableConfig?.tabsList && this.tableConfig?.tabsList.length > 0) {
      // const defaultSelected = this.isSelectedTab || this.tableConfig?.tabsList[0];
      // this.tabClick(defaultSelected); // to restrict initial pageNo change
      this.firstPage = this.maxPages - (this.maxPages - 1);

    }

    if(this.tableConfig?.scoreFactors) {
      this.totalScore();
    }

    this.scoreFactorChange.pipe(debounceTime(400)).subscribe((value: any) => {
      if (value) {
        this.changeRangeFromInput(value[0],value[1],value[2]);
      }
    });

  }
  ngOnChanges() {
    if(this.isFilterCleared) {
      this.totalFilterApplied = 0;
    }

    this.changeDetectorRef.detectChanges();
    this.tooltipName = this.mainmenuName?.replace(/ List/ig, ' ');
    this.updateColumns();
  }

  openGenericListPage = ($event) => {
    if($event && this.tableConfig?.genericListConfig) {
      this.eventStream.emit(new EmitEvent(Events.TRY_NEW_TABLE_UI, this.tableConfig.genericListConfig));
    }
  }

  onMonthChange(event){
    if(event){
      this.selectedMonth = event;
      this.onMonthChangeEvent.emit(this.selectedMonth);
    }
  }
  onYearChange(event){
    if(event){
      this.selectedYear = event;
      this.onYearChangeEvent.emit(this.selectedYear);
    }
  }

  updateColumns() {
    if (this.tableConfig && this.tableConfig?.columnList) {
      this.columnCust = [];
      this.tableConfig?.columnList?.forEach(col => {
        this.filterList[col?.name] = true;
        this.columnCust?.push({ name: col?.name, value: true });
      });
    }
    this.onSetting.emit(this.columnCust);
  }

  get sortOptions() {
    return (this.tableConfig?.sortOptions && Array.isArray(this.tableConfig?.sortOptions))
      ? this.tableConfig.sortOptions
      : this.defaultSortOptions;
  }

  getActiveTab(tab) {
    return this?.isSelectedTab?.toLowerCase() === tab?.toLowerCase();
  }
  onCreateClick() {
    this.onCreate.emit(true);
  }

  activateFilter() {
    this.showFilter = true;
    document.body.classList.add("filter-overflow");
    //alert("clicked")
  }

  onFilterDone(event) {
    this.isFilterCleared = false;
    if (event) {
      this.isSearchOpen = false;
      this.totalFilterApplied = event.noOfFilter;
      this.onListFilter.emit(event.filterData);
    } else {
      this.totalFilterApplied = 0;
      this.onListFilter.emit();
    }
    this.changeDetectorRef.detectChanges();

    this.showFilter = false;
    document.body.classList.remove("filter-overflow");
  }

  onCloseFilter($event) {
    if($event) {
      this.showFilter = false;
      document.body.classList.remove("filter-overflow");
    }
  }

  onClick(event, page: string) {
    if (page === '-1') {
      if (this.currentPage > 1) {
        this.currentPage = this.currentPage - 1;
      } else {
        event.preventDefault();
        return;
      }
    } else if (page === '+1') {
      if (this.currentPage < this.maxPages) {
        this.currentPage = this.currentPage + 1;
      } else {
        event.preventDefault();
        return;
      }
    }
    this.changePages.emit(this.currentPage);
    event.preventDefault();
  }

  tabClick(tab) {
    this.isSelectedTab = tab;
    this.onTabClick.emit(this.isSelectedTab);
    this.isFilterCleared=true;
    this.moreBtnText = "More";
    this.totalFilterApplied = 0;
    this.showAllRecordsToggle = true;
  }
  onSelectAllRecords(){
    this.showAllRecordsToggle = !this.showAllRecordsToggle;
    this.selectedRecordsCount = this.selectedAllRecordsCount;
    this.onSelectAllRecordsClick.emit(this.selectedAllRecordsCount);
  }
  subTabClick(tab) {
    this.isSelectedTab = tab;
    this.onTabClick.emit(this.isSelectedTab);
    this.moreBtnText = tab;
  }

  onSearchClick(event = null) {
    if (event === null) {
      this.onSearch.emit(encodeURIComponent(this.searchValue));
    } else if (event.keyCode === 13) {
      this.onSearch.emit(encodeURIComponent(this.searchValue));
    }else if (event.keyCode === 9) {
    }else if (this.searchValue.length === 0) {
      this.onSearch.emit(encodeURIComponent(this.searchValue));
    }
  }

  onClickColumn(name) {
    let filteredColumn = this.columnCust?.filter(n => n?.name === name)
    filteredColumn?.forEach((val) => {
      if (this.columnCust?.indexOf(val) === 0) {
        val.value = true;
      } else {
        val.value = !val?.value;
      }
      this.filterList[name] = val?.value;
    })
    this.onSetting.emit(this.columnCust);
  }

  onDensityClick(id) {
    this.density = id;
    this.eventStream.emit(new EmitEvent(Events.VIEW_TYPE, id));
  }

  onColumnCustomClick(name) {
    this.filterList[name] = !this.filterList[name];
  }

  onDragStart(index: number) {
    this.dragStartIndex = index;
  }

  onDrop(event: DndDropEvent) {
    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {
        let dropIndex = event.index;
        if (dropIndex > this.dragStartIndex) {
          dropIndex--;
        }
        if (dropIndex !== this.dragStartIndex && dropIndex !== 0) {
          this.tableConfig.columnList.splice(this.dragStartIndex, 1);
          this.tableConfig.columnList.splice(dropIndex, 0, event.data);
        }
      }
    }
    this.dragStartIndex = null;
  }

  onAdFilterClear() {
    this.isFilterCleared = true;
    this.totalFilterApplied = 0;
    this.onListFilter.emit();
  }

  showGridViewLayout(event) {
    this.eventStream.emit(new EmitEvent(Events.SHOW_GRID_LAYOUT, event));
  }

  onFilterCandidate(eve){
    this.onCandidateFilter.emit(eve);
  }

  onClickSort(eve) {
    this.onSortFilter.emit(eve);
  }

  onSelectButtonClick(eve) {
    this.onHeaderButtonClick.emit(eve);
  }
  onDownloadClick(eve) {
    this.onDownloadButtonClick.emit(eve);
  }
  openDropdown() {
    this.openDrop = !this.openDrop;
  }
  onClickedOutside(e) {
    this.openDrop = false;
  }

  actionButtonClicked(btn) {
    this.onActionButtonClick.emit(btn);
  }
  titleClicked(eve) {
    this.titleClick.emit(eve);
  }
  baseReportClicked(eve) {
    this.baseReportClick.emit(true);
  }

  goToURL(url): void {
    window.open(url, '_blank');
  }

  onClearSelection(){
    this.showAllRecordsToggle = true;
    this.clearSelection.emit(true);
  }


  changeRangeFromInput(id, calfactor, index) {
    this.totalScore();
    this.adjustFactors(index);
  }

  showScoreCalculator() {
    this.scoreCalculator = true;
    this.totalScore();
  }

  hideCalculator() {
    this.tableConfig.scoreFactors = _.cloneDeep(this.scoreCalCopy);
    this.scoreCalculator = false;
  }

  getClassNameForScoreCal(calculateFactor,isSlider?) {
    if(isSlider) {
      return `slider_${calculateFactor}`
    }
    return `form-control display range-display-${calculateFactor} rounded-sm`;
  }

  resetScoreCal = () => {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const key_parameters = currentProgram?.config?.candidate_matching_score?.key_parameters;
    this.tableConfig?.scoreFactors?.forEach(factor=>{
      factor.value = key_parameters[factor?.name];
    });
    this.scoreCalCopy = _.cloneDeep(this.tableConfig?.scoreFactors);
    this.totalScore();
  }

  calculateScoreCal() {
    this.totalScore();
    if(this.total_sum == 100) {
      this.emitScoreFactors.emit(this.tableConfig?.scoreFactors);
    }
    this.scoreCalCopy = _.cloneDeep(this.tableConfig?.scoreFactors);
  }

  totalScore() {
    const sumFnc = (acc, curr) => {
      acc = acc + (+curr?.value);
      return acc;
    }
    this.total_sum = this.tableConfig?.scoreFactors?.reduce(sumFnc, 0);
    this.changeDetectorRef.detectChanges();
  }

  compareCandidates() {
    this.showCompareScreen.emit(true);
  }

  // check the scores after inc/dec if score is more than 100 then we have to decrease the scrolles or factor excluding the 
  // one which was increased and if total sum is less than 100 then we have to increase the factors or
  // scrollers excluding the one which was decreased
  adjustFactors(index) {
    this.totalScore();
    this.tableConfig?.scoreFactors?.forEach((res) => {
      res.value = res?.value ? Number(res?.value) : 0;
    });
    if (this.total_sum > 100) {
      // if only one gets 100 then make other factors 0
      if (this.tableConfig?.scoreFactors?.[index]?.value >= 100) {
        this.tableConfig?.scoreFactors?.forEach((res, i) => {
          if (i != index) {
            res.value = 0;
          }
        });
        this.totalScore();
      } else {
        this.handleDecrease(index);
      }
    } else if (this.total_sum < 100) {
      this.handleIncrease(index);
    }
  }

  handleDecrease(index) {
    // check how much is to be decreased i.e. how much the total is more than 100
    let exceed = this.total_sum - 100;

    // the factors which r more than 0 can only be decreased
    const findNonZeroFact = (acc, currV) => {
      if (currV.value > 0) {
        acc += 1;
      }
      return acc;
    }
    let nonZeroFactors = this.tableConfig?.scoreFactors?.reduce(findNonZeroFact, 0) - 1;

    // calculate the value which has to be reduced on each scroller
    let reduceValue = Math.floor(exceed / nonZeroFactors);

    // if reduce value is less then total no of scrollers means we have to decrease evenly by 1 after checking 
    // whether the value is greater than 0
    if (reduceValue == 0) {
      let i = 0;
      while (this.total_sum > 100) {
        const factor = this.tableConfig?.scoreFactors?.[i];
        if (i != index && this.total_sum > 100 && Number(factor?.value) > 0) {
          factor.value = Number(factor.value) - 1;
          this.total_sum -= 1;
        }
        i = (i + 1) % this.tableConfig?.scoreFactors?.length;
      }
    } else {

      // if large reduce values r there then we can decrease in large number after checking factor values
      // i.e if exceeding val is 60 then 15 can be subtracted directly from the remaining four scrollers
      this.tableConfig?.scoreFactors?.forEach((factor, i) => {
        if (i != index && this.total_sum > 100) {
          if (factor.value >= reduceValue) {
            factor.value = Number(factor.value) - reduceValue;
            this.total_sum -= reduceValue;
          } else {
            this.total_sum = this.total_sum - factor.value;
            factor.value = factor.value - factor.value;
          }
        }
      });

      // if some value is left due to factor value less than reduce value or just some modulus is remaining for them 
      exceed = this.total_sum - 100;
      nonZeroFactors = this.tableConfig?.scoreFactors?.reduce(findNonZeroFact, 0) - 1;
      reduceValue = Math.floor(exceed % nonZeroFactors);
      let i = 0;
      while (this.total_sum > 100) {
        const factor = this.tableConfig?.scoreFactors?.[i];
        if (i != index && this.total_sum > 100 && Number(factor?.value) > 0) {
          factor.value = Number(factor.value) - 1;
          this.total_sum -= 1;
        }
        // to take the first index after all the array is looped
        i = (i + 1) % this.tableConfig?.scoreFactors?.length;
      }
    }
    this.totalScore();
  }


  handleIncrease(index) {
    let diff = 100 - this.total_sum;

    // to find how much per scroll can be increased
    const incPerScroll = Math.floor(diff / (this.tableConfig?.scoreFactors?.length - 1));
    this.tableConfig?.scoreFactors?.forEach((fact, i) => {
      if (i != index) {
        fact.value = Number(fact?.value) + incPerScroll;
      }
    });
    this.totalScore();
    diff = 100 - this.total_sum;
    let i = 0;
    // some value can be left as we r adding whole number so at last add the remaining values
    while (diff > 0 && i <= this.tableConfig?.scoreFactors?.length) {
      if (i != index) {
        const factor = this.tableConfig?.scoreFactors?.[i];
        factor.value = Number(factor.value) + 1;
        diff -= 1;
      }
      i++;
    }
    this.totalScore();
  }

} 
