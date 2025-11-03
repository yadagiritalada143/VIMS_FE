import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IColoumnDefinition, ITableOptions, UserType, FilterType, IAdvanceFilterConfig } from './svms-table.model';
import * as _ from 'lodash';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { SvmsTableHeaderComponent } from './svms-table-header/svms-table-header.component';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-svms-table',
  templateUrl: './svms-table.component.html',
  styleUrls: ['./svms-table.component.scss'],
})
export class SvmsTableComponent implements OnInit {
  @Output() changePage = new EventEmitter<number>();
  @Input() informativeBubbleText:any;
  @Output() changeRecords = new EventEmitter<number>();
  @Output() changedOrderClicked = new EventEmitter<boolean>();
  @Output() goToPreviousPage = new EventEmitter();
  @Input() showPageSettingData: boolean = true;
  @Input() tableOptions: ITableOptions;
  @Input() coloumnDefintions: Array<IColoumnDefinition>;
  @ViewChild(SvmsTableHeaderComponent) svmsTableHeader: SvmsTableHeaderComponent;
  @Input() set dataSource(value: Array<any>) {
    this._dataSource = value ?? [];
  }
  @Input() set dataSourceWithoutLimit(value: Array<any>) {
    this._dataSourceWithoutLimit = value ?? [];
  }
  public sortedColumn: { field: string; order: string };
  public scrolledBottom: any;
  public currentPage = 1;
  public initialPage = 1;
  columnFilterForm: UntypedFormGroup;
  public recordsPerPageSetting: Array<any> = [10, 25, 50, 75, 100];
  private _dataSource: Array<any> = [];
  private _dataSourceWithoutLimit: Array<any> = [];
  scrollConfig: PerfectScrollbarConfigInterface = { suppressScrollX: false, suppressScrollY: true };
  hoverState;
  mobileFilterPanel: boolean = false;
  ascDes: any;
  fieldName: any
  constructor(private storage: StorageService, private userPermissionService: UserPermissionService) {}

  ngOnInit(): void {
    if (this.coloumnDefintions && this.coloumnDefintions.length > 0) {
      let primaryColumn = this.coloumnDefintions.find(col => col.primary);
      this.coloumnDefintions = this.coloumnDefintions.sort((a, b) => a.order - b.order);
      if(this.tableOptions?.enableColumnFilter && this.tableOptions?.headerConfig?.searchAllowed){
        this.tableOptions.headerConfig.searchAllowed = false;
      }
      if (primaryColumn) {
        _.remove(this.coloumnDefintions, primaryColumn);
        this.coloumnDefintions.unshift(primaryColumn);
      }
      this.coloumnDefintions.map(col => {
        if(!col.hidden){
          col.hidden = this.hasRolePermission(col.roles);
          if (!col.hidden) col.hidden = this.hasPermission(col.permissions);
        }
      });
      this.fillDummyRecords();
      this.initializeColumnFilterForm();
    }
  }

  initializeColumnFilterForm() {
    if (this.tableOptions?.headerConfig?.advanceFilterConfig?.length > 0) {
      this.columnFilterForm = new UntypedFormGroup({});
      this.tableOptions.headerConfig.advanceFilterConfig.forEach((entry: IAdvanceFilterConfig) => {
        //let key1 = entry.name;
        this.columnFilterForm.addControl(entry.name, new UntypedFormControl());
        //return {[entry.name] : new FormControl()}
      });
    }
  }

  onClearColumnFilter = () => {
    this.columnFilterForm.reset();
  };

  get dataSource() {
    return this._dataSource;
  }

  get dataSourceWithoutLimit() {
    return this._dataSourceWithoutLimit;
  }

  ngAfterViewChecked() {}

  // Used to show skeleton loaders on table UI
  fillDummyRecords = () => {
    this.dataSource = [{ dummy: 'dummy' }, { dummy: 'dummy' }, { dummy: 'dummy' }, { dummy: 'dummy' }, { dummy: 'dummy' }];
    this.dataSourceWithoutLimit = [
      {dummy:'dummy'},
      {dummy:'dummy'},
      {dummy:'dummy'},
      {dummy:'dummy'},
      {dummy:'dummy'}
    ];
  }

  onApplyColumnSetting = (colDefin: Array<IColoumnDefinition>) => {
      let copyDataSource = _.cloneDeep(this.dataSource);
      this.fillDummyRecords();
      this.coloumnDefintions = colDefin;
      setTimeout(() => {
        this.dataSource = copyDataSource;
      },100);
      if(this.tableOptions?.headerConfig?.columnSettingConfig?.onColumnSetting){
        this.tableOptions?.headerConfig.columnSettingConfig?.onColumnSetting(colDefin);
      }
  }

  onPaginationClick(event) {
    this.currentPage = event;
    if (this.tableOptions.paginationConfig && this.tableOptions.paginationConfig.onPagination) {
      this.fillDummyRecords();
      this.tableOptions.paginationConfig.onPagination(event);
    }
  }

  onClickRecords(event) {
    if (this.tableOptions.paginationConfig && this.tableOptions.paginationConfig.onChangeItemRecords) {
      this.fillDummyRecords();
      this.currentPage = 1;
      this.tableOptions.paginationConfig.onChangeItemRecords(event);
    }
  }

  openColumnOrderScaner() {
    this.changedOrderClicked.emit(true)
  };

  backtoPreviousPage(evt) {
    if(evt) {
      this.goToPreviousPage.emit(true)
    }
  }

  get pageCount() {
    const itemsPerPage: number = this.tableOptions?.paginationConfig?.itemsPerPage || 10;
    let count: number = 1;
    if (this.tableOptions?.totalRecords) {
      count = Math.ceil(this.tableOptions.totalRecords / itemsPerPage);
    } else if (Array.isArray(this.dataSource)) {
      count = Math.ceil(this.dataSource.length / itemsPerPage);
    }
    return count;
  }

  hasPermission = (permissions: Array<string>): boolean => {
    let hasPermission = false;
    if (!this.userPermissionService.isUserSuperAdmin() && permissions && permissions.length > 0) {
      const user_permission: [] = this.storage.get('user_permission');
      if (user_permission && user_permission.length > 0) {
        hasPermission = !user_permission.some(perm => permissions.indexOf(perm) > -1);
      }
    }
    return hasPermission;
  };

  hasRolePermission = (roles: Array<UserType>): boolean => {
    let hasRolePermission = false;
    if (roles && roles.length > 0) {
      let currentRole = this.userPermissionService.currentUserRole();
      if (currentRole !== UserType.Super_org) {
        hasRolePermission = !roles.some(role => role == currentRole);
      }
    }
    return hasRolePermission;
  };

  setSortColumn = (field: string, order: string) => {
    this.sortedColumn = { field: field, order: order };
  };

  sortByAsc = (field: any) => {
    if(field){
      if((!this.ascDes || this.ascDes == 'desc') || (!this.fieldName || this.fieldName !==field)){
      this.ascDes = 'asc'
      this.fieldName = field;
      this.setSortColumn(field, 'asc');
      if(this.svmsTableHeader?.headerConfig?.columnSettingConfig?.onSortColumns){
        this.fillDummyRecords();
        this.currentPage= 1;
        this.svmsTableHeader?.headerConfig?.columnSettingConfig.onSortColumns(field,'ASC');
      } else if(this.dataSource && this.dataSource.length > 0 ) {
        // V2M-14739
        this.dataSource = _.orderBy(this.dataSource, [(item) => isNaN(_.get(item, field)) ? _.get(item, field).toLowerCase() :  _.get(item, field)],['asc']);
      }
    }
  }
  }

  sortByDsc = (field: any) => {
    if((!this.ascDes || this.ascDes == 'asc')  || (!this.fieldName || this.fieldName !==field)){
      this.ascDes = 'desc'
      this.fieldName = field;

    this.setSortColumn(field, 'desc');
    if(this.svmsTableHeader?.headerConfig?.columnSettingConfig?.onSortColumns){
      this.fillDummyRecords();
      this.currentPage= 1;
      this.svmsTableHeader?.headerConfig?.columnSettingConfig.onSortColumns(field,'DESC');
    } else if (this.dataSource && this.dataSource.length > 0 && field) {
      this.dataSource = _.orderBy(this.dataSource, [(item) => isNaN(_.get(item, field)) ? _.get(item, field).toLowerCase() :  _.get(item, field)],['desc']);
    }
  }
  }

  hoverClass(i) {
    this.hoverState = i;
  }

  getColumnFilterField = (coloumnName: string) => {
    if (coloumnName && this.svmsTableHeader?.headerConfig?.advanceFilterConfig) {
      let filterConfig = this.svmsTableHeader?.headerConfig?.advanceFilterConfig.find(x => x.name === coloumnName);
      if (!filterConfig) return { type: FilterType.NONE };
      else return filterConfig;
    }
    return {type: FilterType.NONE};
  };
  onShowFilters(event) {
    if(event) {
      this.mobileFilterPanel = true;
    }
    else {
      this.mobileFilterPanel = false;
    }
  }
}
