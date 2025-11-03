import { Component, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Subject, debounceTime, switchMap, Observable, map } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from '../svms-table/svms-table.component';
import {
  ITableHeaderConfig,
  IColoumnDefinition,
  ITableOptions,
  ITablePaginationConfig,
  IAdvanceFilterConfig,
  FilterType,
  ColumnType,
  IColoumnSettingConfig,
} from '../svms-table/svms-table.model';
import { ListViewService } from './services/list-view.service';
import { NavigationService } from 'src/app/core/services/navigation.service';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: [
    '../../../assets/sass/self-config/config-main.scss',
    '../../../assets/sass/self-config/config-main-2.scss',
    'list-view.component.scss',
  ],
})
export class ListViewComponent implements OnInit {
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  private currentProgram: any;
  private module: string = 'JobModule'; // NameSpace
  private entity: string = 'Job'; // Entity Name
  private subscriptions: Array<Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};
  private orderBy:string = 'createdOn';
  private order:string='DESC';
  public itemPerPage = 10;
  public totalRecords = 0;
  public expand: boolean = true;
  public svmsData: Array<any> = [];
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  @ViewChild('dynamicTemplate', { static: true }) dynamicTemp: TemplateRef<any>;
  @ViewChild('containerView', { read: ViewContainerRef, static: true }) 

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array<IAdvanceFilterConfig>;

  tempHeader: any;
  showTable: boolean = false;
  availableColumns: Array<IColoumnDefinition>;
  previousURL:string;
  constructor(
    private route: ActivatedRoute,
    private storageService: StorageService,
    private listViewService: ListViewService,
    private loaderService: LoaderService,
    private navigationService: NavigationService,
  ) {
    // this.previousURL = this.router.getCurrentNavigation()?.extras?.state?.prevURL;
    this.previousURL = this.navigationService.getPreviousUrl();
  }

  ngOnInit(): void {
    // this.previousURL = this.router.getCurrentNavigation()?.extras?.state?.prevURL;
    this.previousURL = this.navigationService.getPreviousUrl();
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.loadDynamicComponent();
    this.getSelectedColoumConfig();
    this.subscriptions.push(
      this.masterSub
        .pipe(
          debounceTime(600),
          switchMap((config: any) => {
            this.prevMasterConfig = config;
            return this.fetchAdvanceSearchObservable(config);
          }),
        )
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.svmsData = data.response;
              this.tableOptions.paginationConfig.itemsPerPage = data?.limit;
              this.itemPerPage = data?.limit;
              this.totalRecords = data?.total_records;
              this.tableOptions.totalRecords = this.totalRecords;
            }
          },

          error: err => {
            console.log(err);
            this.svmsData = [];
          }

        }),
    );
  }

  updateEntityTitle(){
     if(this.entity == 'Job') {
      return 'Jobs'
     } else if(this.entity == 'Submission') {
      return 'Submitted Candidates'
     } else if(this.entity == 'Candidate') {
      return 'Candidates'
     } else if(this.entity == 'Interview') {
      return 'Interviews'
     } else if(this.entity == 'Offer') {
      return 'Offers'
     } else {
      return this.entity
     }
  }
  fetchAdvanceSearchObservable({ page }): Observable<any> {
    if (this.filterpayLoad) {
      var filter = this.filterpayLoad;
    }
    return this.listViewService.getModuleList(
      this.module,
      this.entity,
      this.currentProgram?.id,
      filter ? filter : {},
      page,
      this.itemPerPage,
      this.orderBy,
      this.order
    );
  }

  initalizeTableConfigs = (tableFilterConfig?, svmstableColomnDefn?) => {
    this.tableFilterConfig = tableFilterConfig;

    // TODO: Check for pagination change
    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onEntryCountChanged,
    };

    this.svmstableColomnDefn = svmstableColomnDefn;

    let columnsSettingConfig: IColoumnSettingConfig = {
      availableColumns: this.getAvailableColoumns,
      onColumnSetting: this.modifyColumnSetting,
      onSortColumns: this.onSortColumn,
    };

    

    

    this.tableHeaderConfig = {
      title: this.updateEntityTitle(),
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: true,
      reorder: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter,
      columnSettingConfig: columnsSettingConfig,
      switchBackURL: this.previousURL ?? '/jobs/list',
    };

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: 'No Data found for the selected program.',
      enableColumnFilter: true,
    };
  };

  onSortColumn = (fielsOrderBy:string,order:string) => {
    this.orderBy = fielsOrderBy;
    this.order = order;
    this.getModuleList(1,this.itemPerPage,this.orderBy,this.order,this.filterpayLoad ?? {});
  }

  tableFilterConfigMapper = data => {
    let tableData = [];
    data.response.forEach(element => {
      let temp: IAdvanceFilterConfig = {
        title: element.displayName,
        name: element.name,
        type: this.getFilterType(element.type),
        options: [],
        onSearch: this.onColumnFocus,
        onOpen: this.onColumnFocus,
        loading: false,
      };
      tableData.push(temp);
    });
    return tableData;
  };

  getFilterType = type => {
    switch (type) {
      case 'TEXT':
        return FilterType.TEXT;
      case 'SELECT':
        return FilterType.SELECT;
      case 'DATEPICKER':
        return FilterType.DATEPICKER;
      case 'DATE':
        return FilterType.DATEPICKER;
      case 'MULTISELECT':
        return FilterType.MULTISELECT;
      case 'NUMBER':
        return FilterType.NUMBER;

     case 'TIME':
        return FilterType.TIME;

      default:
        return FilterType.NONE;
    }
  };

  columnDefinationMapper = data => {
    let tableData = [];
    data.response.forEach((element, index) => {
      let temp: IColoumnDefinition = {
        field: element.name,
        header: element.displayName,
        type: this.getColumnType(element.type, element.isLink, element.isStyle),
        id: element.id,
        primary: index == 0 ? true : false,
        order: index,
        isStyle: element.isStyle,
        isLink: element.isLink,
        width: 20,
        sortable: element?.isSortable ?? false,
        hidden: false,
      };
      tableData.push(temp);
    });
    return tableData;
  };

  getColumnType = (type, isLink?, isStyle?) => {
    if (isStyle || isLink) {
      return ColumnType.TEMPLATE;
    } else if (type == 'DATEPICKER' || type == 'DATETIME') {
      return ColumnType.DATETIME;
    } else if (type == 'DATE') {
      return ColumnType.DATE;
    } else {
      return null;
    }
  };

  changeModuleAndEntity = (module, entity) => {
    this.module = module;
    this.entity = entity;
    this.getSelectedColoumConfig();
  };

  loadDynamicComponent() {
    // Extract Module and Entity from the URL
    this.module = this.route.snapshot.paramMap.get('module');
    this.entity = this.route.snapshot.paramMap.get('entity');
    this.route.paramMap.subscribe(param => {
      if (param) {
        this.module = param.get('module');
        this.entity = param.get('entity');
      }
    });
  }

  onPaginationClick = (page: number) => {
    this.masterSub.next({
      ...this.prevMasterConfig,
      page: page,
    });
  };

  onEntryCountChanged = (count: number) => {
    this.itemPerPage = count;
    this.masterSub.next({
      ...this.prevMasterConfig,
      page: 1,
    });
  };

  onSearch = (term: string) => {
    this.masterSub.next({ term, page: 1 });
  };

  onListFilter = (event: any) => {
    if (event) {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.masterSub.next({ page: 1 });
    } else {
      this.isAdvanceSearch = false;
      this.filterpayLoad = {};
      this.masterSub.next({ page: 1 });
    }
  };

  onColumnFocus = (event: any, field: IAdvanceFilterConfig) => {
    if (field?.type == FilterType.SELECT || field?.type == FilterType.MULTISELECT) {
      if (event?.term) {
        this.getFilterOptions(field?.name, event?.term);
      } else {
        this.getFilterOptions(field?.name, '');
      }
    }
  };

  // Get All Configured Colums for the module and entity
  getAvailableColoumns = () => {
    return this.listViewService.getAvailableColoumConfig(this.module, this.entity, this.currentProgram?.id).pipe(
      map((res: any) => {
        return this.columnDefinationMapper(res);
      }),
    );
  };

  // Get Selected Coloumns for the module and Entity
  getSelectedColoumConfig = () => {
    this.loaderService.show();
    this.listViewService.getSelectedColumns(this.module, this.entity, this.currentProgram?.id).subscribe(
      (response: any) => {
        this.mapColumnConfig(response);
        this.loaderService.hide();
        this.showTable = true;
        this.filterpayLoad = this.storageService.get(StorageKeys.FILTER_PRESERVE);
        this.getModuleList(1,this.itemPerPage,this.orderBy,this.order,this.filterpayLoad ?? {});
        if(this.filterpayLoad){
          Object.keys(this.filterpayLoad).forEach(ele => {
            if(Array.isArray(this.filterpayLoad[ele])){
            this.getFilterOptions(ele, '')
            }
          })
        }
      },
      (err: any) => {
        this.loaderService.hide();
      },
    );
  };

  getModuleList = (page=1,limit=10,orderBy='createdOn',order='DESC',filterpayLoad:any) => {
    this.listViewService.getModuleList(this.module, this.entity, this.currentProgram?.id,filterpayLoad,page,limit,orderBy,order).subscribe((response: any) => {
      this.svmsData = response.response;
      if (this.tableOptions) {
        this.tableOptions.paginationConfig.itemsPerPage = response?.limit;
        this.itemPerPage = response?.limit;
        this.totalRecords = response?.total_records;
        this.tableOptions.totalRecords = this.totalRecords;
      }
    },err => {
      this.svmsData = [];
    });
  };

  getFilterOptions = (fieldName, value) => {
    var newOptions = [];
    this.listViewService
      .getFilterOptions(this.module, this.entity, this.currentProgram?.id, fieldName, value)
      .pipe(debounceTime(300))
      .subscribe((response: any) => {
        response.response.forEach((element:any) => {
            newOptions.push({ name: element?.name, value: element?.value });
        });

        this.tableOptions.headerConfig.advanceFilterConfig.forEach(element => {
          if (element.name == fieldName) {
            element.options = newOptions;
            element.loading = false;
          }
        });
      });
  };

  mapColumnConfig = (tableConfiguration: any) => {
    var tableFilterConfig = this.tableFilterConfigMapper(tableConfiguration);
    var svmstableColomnDefn = this.columnDefinationMapper(tableConfiguration);
    this.initalizeTableConfigs(tableFilterConfig, svmstableColomnDefn);
  };

  modifyColumnSetting = (coloumSetting: Array<IColoumnDefinition>) => {
    if (coloumSetting && coloumSetting.length > 0) {
      let selectedColoums = coloumSetting.sort((x, y) => x.order - x.order).map(col => col.id);
      let coloumnSetting = {
        selected: selectedColoums,
      };
      this.listViewService.saveColumnSettings(this.module, this.entity, this.currentProgram?.id, coloumnSetting).subscribe(response => {
        this.ngOnInit();
      });
    }
  };
}
