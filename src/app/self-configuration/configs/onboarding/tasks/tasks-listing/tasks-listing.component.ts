import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { FilterType, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig, IActionLinks, IAdvanceFilterConfig } from 'src/app/library/svms-table/svms-table.model';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { debounceTime, Subject } from 'rxjs';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-tasks-listing',
  templateUrl: './tasks-listing.component.html',
  styleUrls: ['./tasks-listing.component.scss']
})
export class TasksListingComponent implements OnInit {

  public vmsData: any;
  public totalPages = 0;
  public tableLoaded = false;
  public dataLoading = true;
  public tasklistCreateForm = 'hidden';
  public searchTerm: any;
  public itemsPerPage = 10;
  public totalRecords = 10;
  public filter = {};
  public page = 1;

  private searchTaskListSub: Subject<any> = new Subject<any>();
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;

  constructor(
    private router: SvmsRouterService,
    private _programService: ProgramService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    private confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) {}

  @ViewChild('statusTemplate',{static:true}) statusTemplate: TemplateRef<void>;
  @ViewChild('showData',{static:true}) showData: TemplateRef<void>;
  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig:ITablePaginationConfig;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  public activityOptionsMap: Map<string, string> = new Map([
    ['UPLOAD_CREDENTIAL', 'Upload Credentials'],
    ['ATTACH_DOCUMENT', 'Attach Document'],
    ['SIGN_DOCUMENT', 'Sign Document'],
    ['ACKNOWLEDGEMENT', 'Acknowledge'],
    ['BACKGROUND_CHECK', 'Background Check']
  ]);

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        placeholder: 'Filter Name',
        type: FilterType.TEXT
      }, {
        name: 'task_type_label',
        title: 'task_type_label',
        placeholder: 'Filter by Activity Type',
        type: FilterType.SELECT,
        options: [
          { name: 'Acknowledge', value: 'ACKNOWLEDGEMENT' },
          { name: 'Attach Document', value: 'ATTACH_DOCUMENT' },
          { name: 'Background Check', value: 'BACKGROUND_CHECK' },
          { name: 'Sign Document', value: 'SIGN_DOCUMENT' },
          { name: 'Upload Credentials', value: 'UPLOAD_CREDENTIAL' },
        ]
      }, {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: 'Select Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
    ];

    this.tableHeaderConfig = {
      title: 'Tasks',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('task_manage'),
      onAdd: this.onCreateClick,
      onSearch: this.onSearch,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView, hide: !this.authService.authorize('task_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('task_manage') },
      { linkName: 'Enable/Disable', method: this.disableClicked, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('task_manage') },
      // { linkName: 'Delete', method: this.onDeleteClickc, disable: true, hide: !this.authService.authorize('task_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination:this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords,
      itemsPerPage:10,
      recordsPerPageSetting:[10,25,50,100]
    }

    this.svmstableColomnDefn = [
      { field: 'name', header: 'Name', width: 30, primary: true,order:1, sortable: true, onClick: this.onClickView },
      { field: 'task_type_label', header: 'Activity Type',templateRef: this.showData,  width: 30,order:3, sortable: true },
      { field: 'role.name', header: 'Role',templateRef: this.showData, width: 20,order:4, sortable: true },
      { field: 'is_enabled', header: 'Status', width: 15,order:2,templateRef: this.statusTemplate, sortable: false },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination:true,
      paginationConfig:this.tablePaginationConfig,
      noDataMessage:"No Records Found",
      actionLinks:actionLinks,
      enableColumnFilter:true
    };
  };

  ngOnInit(): void {

    this.initalizeTableConfigs();
    this.taskList();

    this.route.paramMap.subscribe(param => {
      if (param.get('add')) {
        this.tasklistCreateForm = 'visible';
      }
    });

    this.searchTaskListSub
      .pipe(debounceTime(600))
      .subscribe((term: any) => {
        this.searchTerm = term;
        this.taskList();
      })
  }

  taskList = () => {

    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    this._loader.show();

    this._programService.get(`/configurator/programs/${programId}/onboarding/tasks?limit=${this.itemsPerPage}&page=${this.page}${this.searchTerm ? ('&k=' + this.searchTerm) : ''}`)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.vmsData = data;
            this.vmsData.tasks.forEach(item => {
              item.task_type_label = this.activityOptionsMap.get(item?.task_type);
              if(item.roles && item.roles.length > 0){
                item.role = {name: item.roles.map(role=>role.name).join(', ')};
              }
            });
            this.itemsPerPage = data.items_per_page;
            this.totalRecords = data.total_records;
            this.tableOptions.totalRecords = data.total_records;
            this.tableOptions.paginationConfig.itemsPerPage = data.items_per_page;
            this.tableLoaded = true;
            this._loader.hide();
          }
        }, error: (err: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(err));
        }, complete: () => {
          this.initalizeTableConfigs();
        }
      }
    );
  }

  filterTaskListData = (payload = null, pageNo = 1) => {
    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/onboarding/tasks?limit=${this.itemsPerPage}&page=${pageNo}`;

    if(payload?.name) {
      url += `&name=${payload.name}`;
    }

    if(payload?.task_type_label) {
      url += `&task_type=${payload.task_type_label}`;
    }

    if(typeof(payload?.is_enabled) === 'boolean') {
      url += `&k=${payload?.is_enabled}`;
    }

    if (payload !== null) {
      this._loader.show();
      this._programService.get(url).subscribe({
          next: (data: any) => {
            if (data) {
              this.vmsData = data;
              this.vmsData.tasks.forEach(item => {
                item.task_type_label = this.activityOptionsMap.get(item?.task_type);
                if(item.roles && item.roles.length > 0){
                  item.role = {name: item.roles.map(role=>role.name).join(', ')};
                }
              });
              this.itemsPerPage = data?.items_per_page;
              this.totalRecords = data.total_records;
              this.tableOptions.totalRecords = data.total_records;
              this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
              this.tableLoaded = true;
              this._loader.hide();
            }
          }, error: (err: Error | any) => {
            this._loader.hide();
            this._alert.error(errorHandler(err));
          }
        }
      );
    } else {
      this.taskList();
    }
  }

  onClickView = (event: any) => {
    if(event?.id) {
      this.router.navigate(['onboarding', 'task', event.id, 'mode', 'view']);
    }
  }

  onEditClick = (event: any) => {
    if(event?.id) {
      this.router.navigate(['onboarding', 'task', event.id, 'mode', 'edit']);
    }
  }

  onPaginationClick = (event: any) => {
    this.page = event;
    if (!(JSON.stringify(this.filter) === JSON.stringify({}))) {
      this.filterTaskListData(this.filter,event);
    }
    else{
      this.taskList();
    }
  }

  disableClicked = (event: any) => {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    const payload = {
      name: event.name,
      task_type: event.task_type.toUpperCase().replace(' ', '_'),
      role_id: event?.role?.id,
      description: event.description,
      config: event.config,
      is_enabled: !event.is_enabled,
    };

    event.is_enabled = !event.is_enabled;
    this._loader.show();
    this._programService.put(`/configurator/programs/${programId}/onboarding/tasks/${event.id}`, payload)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this._alert.success(`You have successfully updated a task`);
            this._loader.hide();
          }
        }, error: (error: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(error));
        }
      }
    );
  }

  onCreateClick = (event: any) => {
    this.router.navigate(['onboarding', 'task', 'create']);
  }

  onSearch = (event: any) => {
    this.vmsTable.currentPage = 1;
    this.page = 1;
    this.searchTaskListSub.next(event);
  }

  onListFilter = (event: any) => {
    this.filter = event;
    this.page = 1;
    this.filterTaskListData(event);
  }

  onDeleteClickc = (event: any) => {
    this.confirmService.confirm('', `Are you sure to delete the ${event.name}?`, 'Yes', 'No')
    .then((confirmed) => {
        if (confirmed) {

          const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
          const programId = programDetails.program_req_id;
          this._programService.delete(`/configurator/programs/${programId}/onboarding/tasks/${event.id}`)
            .subscribe({
              next: (data: any) => {
                if (data) {
                  this._alert.success(`You have successfully deleted the task`);
                  this.vmsData.tasks.splice(this.vmsData.tasks.indexOf(event), 1);
                  this.totalRecords = this.totalRecords - 1;
                  this._loader.hide();
                }
              }, error: (error: Error | any) => {
                this._loader.hide();
                this._alert.error(errorHandler(error));
              }
            }
          );
        }
      }
    );
  }

  onChangeRecords = (records: any) => {
    this.itemsPerPage = records;
    this.page = 1;
    if(this.filter) {
      this.filterTaskListData(this.filter);
    } else {
      this.taskList();
    }
  }

}
