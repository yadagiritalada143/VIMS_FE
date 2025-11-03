import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ColumnConfig, VMSConfig } from './table.model';
import { ProgramConfig } from 'src/app/shared/enums';
import { StorageService } from 'src/app/core/services/storage.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'vms-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  providers: [DatePipe],
})
export class VMSTableComponent implements OnInit, OnChanges {
  @Input() vmsClass: string;
  @Input() vmsTableConfig: VMSConfig;
  @Input() vmsDataSource: any[];
  @Input() loading = false;
  @Input() open = false;
  @Input() totalItem = 1;
  @Input() itemsPerPage = 10;
  @Input() showOrg = false;

  @Output() onDetailClick = new EventEmitter();
  @Output() onViewClick = new EventEmitter();
  @Output() cloneClicked = new EventEmitter();
  @Output() onEditClick = new EventEmitter();
  @Output() onCreateJobClick = new EventEmitter();
  @Output() onDeleteClick = new EventEmitter();
  @Output() onExpandClick = new EventEmitter();
  @Output() changePage = new EventEmitter<number>();
  @Output() onCreate = new EventEmitter<boolean>();
  @Output() onBack = new EventEmitter<boolean>();
  @Output() onSort = new EventEmitter();
  @Output() onCandidateFilter = new EventEmitter();
  @Output() search = new EventEmitter();
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
  @Output() removeDoNotRehireProgram = new EventEmitter();
  @Output() onRescheduleInterviewClick = new EventEmitter();
  @Output() onCancelInterviewClick = new EventEmitter();
  @Output() onViewSubmittedCandidateClick = new EventEmitter();

  @Output() onSubmittedCandidateClick = new EventEmitter();
  @Output() onOptOutClick = new EventEmitter();
  @Output() onOptionClicked = new EventEmitter();
  @Output() onReorderClicked = new EventEmitter<any>();
  @Output() changeRecords = new EventEmitter<number>();
  sortedColumn = '';
  isSortAsc = true;
  columnList = {};
  columnWidth = [];

  expandRow: number;
  fixedHeader = false;
  lastScrollTop = 0;
  direction = '';
  countColumnValue = 0;
  compactView = false;
  currentPage = 1;

  initialPage = 1;
  maxPages = 1;
  hideOptiondropdown = false;
  isDisabled = false;
  indexValues: any;
  selectedRowArr = [];
  allSelectedRows = false;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private eventStream: EventStreamService,
    private router: Router,
    private datepipe: DatePipe,
    private localStorage: StorageService,
  ) {
    window.onscroll = () => {
      const st = window.pageYOffset;
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
  }

  ngOnChanges() {
    this.pagination();
  }
  pagination() {
    if (this.itemsPerPage < 1) {
      this.itemsPerPage = 10;
    }
    this.maxPages = Math.ceil(this.totalItem / this.itemsPerPage);
  }
  ngOnInit() {
    if (this.vmsTableConfig && this.vmsTableConfig.columnList) {
      this.vmsTableConfig.columnList.forEach((col, index) => {
        col.index = index;
        this.columnList[col.name] = true;
        this.columnList[col.name + '_width'] = col.width;
        if (col.width !== undefined) {
          this.columnWidth.push({ name: col.name, value: col.width });
        } else {
          if (this.vmsTableConfig.isExpand) {
            this.columnWidth.push({ name: col.name, value: (95 / this.vmsTableConfig.columnList.length).toFixed(2) });
          } else {
            this.columnWidth.push({ name: col.name, value: (100 / this.vmsTableConfig.columnList.length).toFixed(2) });
          }
        }
      });
    }

    this.changeDetectorRef.detectChanges();

    this.eventStream.on(Events.VIEW_TYPE).subscribe(data => {
      if (data === 'COMPACT') {
        this.compactView = true;
      } else if (data === 'COMFORTABLE') {
        this.compactView = false;
      }
    });
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
    if (this.countColumnValue <= this.vmsTableConfig.columnList.length) {
      this.countColumnValue += 1;
      return { data: data[this.vmsTableConfig.columnList[0].name], type: typeof data[this.vmsTableConfig.columnList[0].name] };
    } else {
      this.countColumnValue = 0;
      this.getColumnValue(data);
    }
  }

  getColumnData(name: any, data: any) {
    if (typeof name === 'object') {
      if (data[name[0]] !== 'None' && data[name[1]] !== 'None') {
        return this.datepipe.transform(data[name[0]], 'd MMM y') + ' - ' + this.datepipe.transform(data[name[1]], 'd MMM y');
      } else {
        return null;
      }
    }

    const nameList = name.split('.');
    if (nameList.length > 1) {
      let returnData;
      if (!data[nameList[0]]) {
        return null;
      }
      nameList.forEach(n => {
        if (returnData) {
          returnData = returnData[n];
        } else {
          returnData = data[n];
        }
      });
      return returnData;
    }
    return data[name];
  }

  onViewClickd(event, vmsData) {
    this.onViewClick.emit(vmsData);
    if (vmsData.unique_id) {
      this.router.navigate(['/program-setup'], {
        queryParams: {
          programId: vmsData.unique_id,
          clientId: vmsData.client.id,
          program_req_id: vmsData.id,
          clientName: vmsData.client.name,
        },
      });
      this.localStorage.set(ProgramConfig[5], vmsData, true);
    }
  }

  clickToDetails(event, vmsData) {
    this.onDetailClick.emit(vmsData);
  }

  onCloneClickd(vmsData) {
    this.cloneClicked.emit(vmsData);
  }

  editClicked(event, vmsData) {
    this.onEditClick.emit(vmsData);
  }
  onCreateJobClicked(event, vmsData) {
    this.onCreateJobClick.emit(vmsData);
  }
  onTabClicked(vmsData) {
    this.onTabClick.emit(vmsData);
  }
  listFilter(event) {
    this.currentPage = 1;
    this.onListFilter.emit(event);
  }

  onDisableClick(index, vmsData) {
    // this.indexValues = index;
    // this.isDisabled = true;
    this.onDisableClicked.emit(vmsData);
  }

  removeDoNotRehire(event, vmsData){
    this.removeDoNotRehireProgram.emit(vmsData);
  }

  deleteClick(index, vmsData) {
    this.onDeleteClick.emit(vmsData);
    // this.vmsDataSource.splice(index, 1);
  }

  clickToViewProfile(index, vmsData) {
    this.onViewProfileClick.emit(vmsData);
  }

  clickToWithdrawProfile(index, vmsData) {
    this.onWithdrawProfileClick.emit(vmsData);
  }

  onPlusButtonClick(id: string) {}
  onPaginationClick(event) {
    this.currentPage = event;
    this.changePage.emit(event);
  }
  onCreateClick(event) {
    this.onCreate.emit(event);
  }

  onBackClicked(event) {
    this.onBack.emit(event);
  }

  optionClicked(option, vmsData) {
    this.onOptionClicked.emit({ option, data: vmsData });
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
    this.search.emit(event);
  }

  onReorderClick() {
    this.onReorderClicked.emit(true);
  }

  onClickHeaderFilter(event) {
    this.onClickFilter.emit(event);
  }

  columnClick(column: ColumnConfig, vmsData: any) {
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
    this.eventStream.emit(new EmitEvent(Events.OPTION_DROPDOWN, true));
  }

  onRowNameClick(column: ColumnConfig, vmsData: any) {
    this.onNameClick.emit({ column, vmsData });
  }

  selectAllClick(vmsData: any) {
    if (this.allSelectedRows) {
      this.allSelectedRows = false;
      this.vmsDataSource.forEach(val => {
        val.isChecked = false;
      });
      this.onSelectAllClick.emit({ selected: [] });
    } else {
      this.allSelectedRows = true;
      this.vmsDataSource.forEach(val => {
        val.isChecked = true;
      });
      this.onSelectAllClick.emit({ selected: this.vmsDataSource });
    }
  }
  onCheckClick(vmsData: any, index) {
    this.vmsDataSource[index]['isChecked'] = vmsData.isChecked ? true : false;
    this.onSelectClick.emit({ selected: vmsData });
  }
  clickToRescheduleInterview(index, vmsData) {
    this.onRescheduleInterviewClick.emit(vmsData);
  }
  clickToCancelInterview(index, vmsData) {
    this.onCancelInterviewClick.emit(vmsData);
  }

  clickToViewSubmittedCandidate(event, vmsData) {
    this.onViewSubmittedCandidateClick.emit(vmsData);
  }

  onOptOutClicked(event, vmsData) {
    this.onOptOutClick.emit(vmsData);
  }

  onSubmittedCandidateClicked(event, vmsData) {
    this.onSubmittedCandidateClick.emit(vmsData);
  }

  onClickRecords(event) {
    this.changeRecords.emit(event);
  }


}
