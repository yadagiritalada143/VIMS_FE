import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { map, debounceTime } from 'rxjs/operators';
import {  DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { TimesheetConfigurationService } from 'src/app/program-setup/timesheet-configuration/timesheet-configuration.service';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { Observable } from 'rxjs';
import { ProgramService } from 'src/app/programs/program.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-timesheet-configuration-lists',
  templateUrl: './timesheet-configuration-lists.component.html',
  styleUrls: ['./timesheet-configuration-lists.component.scss']
})
export class TimesheetConfigurationListsComponent implements OnInit {

  public tableConfig: VMSConfig;
  public tableLoaded = false;
  public limitRecords = 10;
  public vmsData: any;
  public filter: any = {};
  public totalRecords: number = 10;
  public itemPerPage: number = 10;
  public Page = 1;

  tableOptions: ITableOptions;
  tableFilterConfig: Array<IAdvanceFilterConfig>;
  tableHeaderConfig: ITableHeaderConfig;
  tablePaginationConfig: ITablePaginationConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('Status', { static: true }) Status: TemplateRef<void>;
  public loading = false;
  public search: any;
  public user_type: any;
  public user: any;
  public searchTerm: string = '';

  public dbHierarchies = [];
  public selectedTimesheet = []
  public locations = [];
  public isAdvanceFilter: boolean = false;
  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'title',
        title: 'title',
        placeholder: 'Filter by Name',
        type: FilterType.TEXT
      },
      {
        name: 'is_active',
        title: 'is_active',
        placeholder: 'Select Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
      {
        name: 'hierarchy.name',
        title: 'hierarchy.name',
        placeholder: 'Select Hierarchy',
        type: FilterType.MULTISELECT,
        options: this.dbHierarchies
      },
      {
        name: 'updated_at',
        title: 'updated_at',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }
      // {
      //   name: 'timesheettype',
      //   title: 'Timesheet Type',
      //   type: FilterType.MULTISELECT,
      //   options:this.selectedTimesheet
      // },
      // {
      //   name: 'locations',
      //   title: 'Locations',
      //   type: FilterType.MULTISELECT,
      //   options:this.locations
      // },
    ];

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onViewClick, hide: !this.authService.authorize('timesheet_configuration_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('timesheet_configuration_manage') },
      // { linkName: 'Delete', method: this.onDeleteClick, hide: !this.authService.authorize('timesheet_configuration_manage') },
      { linkName: 'Clone', method: this.onCloneClicked, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('timesheet_configuration_manage') }
    ];

    this.tableHeaderConfig = {
      title: 'Timesheet Configurations',
      createButtonTitle: 'Create New',
      searchAllowed: false,
      showAddBtn: this.authService.authorize('timesheet_configuration_manage'),
      onAdd: this.onCreate,
      onSearch: this.onSearch,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100]
    }
    // columnList: [
    //   { name: 'name', title: 'Timesheet Configuration Name', width: 30, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
    //   { name: 'version', title: 'Version', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
    //   { name: 'hierarchy.name', title: 'Hierarchy', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
    //   { name: 'created_by.updated_at', title: 'Updated By', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
    //   { name: 'is_active', title: 'Status', width: 16, isIcon: false, isImage: false, isContact: false, isNoOption: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isNumberBadge: false, isVieworClone: true }
    // ],
    this.svmstableColomnDefn = [
      { field: 'title', header: 'Name', width: 30, primary: true, order: 1,sortable:false,onClick:this.onViewClick },
      { field: 'version', header: 'Version', width: 10, order: 3,sortable:false,onClick:this.onViewClick },
      { field: 'hierarchy.name', header: 'Hierarchy', width: 15, order: 4,sortable:false,onClick:this.onViewClick },
      { field: 'created_by.updated_by', header: 'Updated By', width: 15, order: 5,sortable:false,onClick:this.onViewClick },
      { field: 'updated_at', header: 'Last Updated', width: 15, order: 6, sortable: false, onClick: this.onViewClick, type: ColumnType.DATETIME },
      { field: 'is_active', header: 'Status', width: 16,   order: 2,sortable:false,onClick:this.onViewClick ,templateRef: this.Status},
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination: true,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Records Found",
      actionLinks: actionLinks,
      enableColumnFilter: true
    };
  };

  constructor(
    public timesheetConfigurationService: TimesheetConfigurationService,
    private alertService: AlertService,
    private router: SvmsRouterService,
    private storageService: StorageService,
    private localDatePipe: LocalDateTimeFormatPipe,
    private dialog: ConfirmationDialogService,
    private spinner: LoaderService,
    private accessControlService: AccessControlService,
    private programService: ProgramService,
    private localDateFormat: LocalDateFormatPipe,
    private authService: AuthorizationService
    ) { }

  ngOnInit(): void {
    this.initalizeTableConfigs();
    this.tableConfig = {
      title: 'Timesheet Configuration List',
      isCreateButtonName: 'Add New Timesheet',
      columnList: [
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: true,
      density: 'COMFORTABLE',
      advanceFilter: [

      ]
    };
    this.user_type = this.storageService.get('user_type');
    this.user = this.storageService.get('user');
    this.getTimesheetType();
    this.getWorkLocations();
     // Fetch hierarchy details
     this.fetchHierarchyObservable().subscribe({
      next: (data: any) => {
        this.spinner.hide();
        if(Array.isArray(data?.result) && data?.result?.length)
          this.hierarchyMapper(data?.result?.[0]);
          this.fetchHierarchyList(data.result?.[0], false);
          this.initalizeTableConfigs();
        // this.masterSub.next({ term: '', page: 1 });
      }, error: (err: any) => {
        console.error(err);
        this.alertService.error('Error encountered while fetching hierarchy details');
      }, complete: () => {
        this.spinner.hide();
      }
    });
    this.getTimesheetConfigurationList();
  }
  fetchHierarchyObservable(): Observable <any> {
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.spinner.show();
    let url: string = `/configurator/programs/${programId}/hierarchy`;
    return this.programService.get(url);
  }

  fetchHierarchyList(hierarchy, flag) {
    if(flag) {
      this.dbHierarchies?.push({
        value: hierarchy.id,
        name: hierarchy.name
      });
    } else {
       flag = true;
     }

    if(Array(hierarchy?.hierarchies)?.length === 0)
      return;

    hierarchy?.hierarchies?.forEach(item => {
      this.fetchHierarchyList(item, true);
    });
  }

  hierarchyMapper(hierarchy: any) {
    if(!hierarchy) {
      return;
    }

    // const { name, id, hierarchies } = hierarchy;
    // if(name && id) {
    //   this.hierarchyMap.set(id, name);
    // }

    // if(Array.isArray(hierarchies)) {
    //   hierarchies.forEach((entry: any) => {
    //     this.hierarchyMapper(entry);
    //   });
    // }
  }

  getTimesheetType() {
    let currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // &hierarchy_id=${hierarchy_id}
    let url = `/configurator/programs/${currentprogram?.id}/picklists/*/items?picklist_slug=timesheet_type&is_enabled=true`;
    this.timesheetConfigurationService.get(url).subscribe((data: any) => {
      if (data && data?.picklist_items) {
        data?.picklist_items.forEach(pickList => {
          this.selectedTimesheet?.push({
              value: pickList.value,
              name: pickList.label
            });
        })
      }
    })
  }

  // get location
  getWorkLocations() {
    let currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/configurator/programs/${currentprogram?.id}/work-locations`;
    this.timesheetConfigurationService.get(url)
      .subscribe({
        next: (data: any) => {
          if (data && data?.work_locations && data?.work_locations?.length > 0) {
            const uniqueLocations: any = [...new Map(data?.work_locations?.map(item => [item?.name, item]))?.values()];
            const locations = uniqueLocations?.filter(l => l?.name);
            locations.forEach(location => {
              this.locations?.push({
                  value: location.id,
                  name: location.name
                });
            })
          }
        }, error: (error: Error | any) => {
          this.alertService.error(errorHandler(error), {});
        }
      }
    );
  }
  onCreate = (event : any) => {
    this.router.navigate(['configuration', 'timesheet', 'create']);
  }

  getTimesheetConfigurationList= (pageNo = 1, name?: string) => {

    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic?`;
    url = url + 'limit=' + this.itemPerPage + `&page=${pageNo}`;
    if (name) {
      url += `&search=${name}`;
    }
    if (this.search) {
      url = url + '&k=' + this.search;
    }
    // if (this.filter.searchTerm) {
    //   url = url + '&search=' + this.filter.searchTerm;
    // }
    // if (this.filter.hasOwnProperty('is_enabled')) {
    //   url = url + '&k=' + this.filter.is_enabled;
    // }

    this.loading = true;
    this.spinner.show();
    this.timesheetConfigurationService.get(url)
      .pipe(
        debounceTime(400),
        map((res: any) => {

          let res_list = res?.data?.config;
          // if (res_list) {
          //   res_list = res_list.filter((obj: any) => {
          //     let search_param: number = String(obj?.title)?.toLowerCase()?.search(this.searchTerm?.toLowerCase());
          //     return (search_param !== -1);
          //   });
          // }

          res.data.config = res_list;
          return res;
        })
      ).subscribe({
        next: (data: any) => {
          this.loading = false;
          this.spinner.hide();
          if (data?.data?.config) {
            this.vmsData = data?.data?.config;
            this.vmsData?.forEach(element => {
              element.is_active = element?.status === 'active' ? true : false;
              if(element?.hierarchies) {
                let name = element?.hierarchies.map(n => n.name).toString();
                if(!element.hierarchy) {
                  element.hierarchy = {};
                  element.hierarchy['id'] = element?.hierarchies.map(n => n.id).toString();
                  element.hierarchy['name'] = name

                }else {
                element.hierarchy.name =name;
                }
              }
              if (element?.created_by?.name) {
                element.created_by.updated_at = this.localDateFormat.transform(element?.created_at, '', '', '', true);
                element.created_by.updated_by = element?.created_by?.name;
              }
            });
          }
          this.itemPerPage = data?.data?.pagination?.per_page;
          this.totalRecords = data?.data?.pagination?.total_records;
          this.tableOptions.paginationConfig.itemsPerPage = data?.data?.pagination?.per_page;;
          this.tableOptions.totalRecords = data?.data?.pagination?.total_records;
        },
        error: (err: Error) => {
          this.loading = false;
          // this.alertService.error(errorHandler(err));
          this.vmsData = new Array();
          this.totalRecords = 0;
        }
      }
    );
  }

  getTimesheetConfigAdvanceFilter(pageNo = 1, name?: string){
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic/advanced-filters`


    const filters = {
    filters : {
      title:  this.filter?.searchTerm[0] ?? '',
      // timesheet_type:this.filter?.timesheet_type ?? [],
      hierarchy_ids: this.filter?.hierarchy_ids ?? [],
      titles : this.filter?.searchTerm ?? [],
      // location: this.filter?.location ?? [],
      status: this.filter?.status ?? [],
      date_range: this.filter?.updated_at || []
     }
    }
     this.loading = true;
     this.spinner.show();
     this.timesheetConfigurationService.post(url,filters)
       .pipe(
         debounceTime(400),
         map((res: any) => {

           let res_list = res?.data?.config;
           if (res_list) {
             res_list = res_list.filter((obj: any) => {
               let search_param: number = String(obj?.title)?.toLowerCase()?.search(this.searchTerm?.toLowerCase());
               return (search_param !== -1);
             });
           }

           res.data.config = res_list;
           return res;
         })
       ).subscribe({
         next: (data: any) => {
           this.loading = false;
           this.spinner.hide();
           if (data?.data?.config) {
             this.vmsData = data?.data?.config;
             this.vmsData?.forEach(element => {
              element.is_active = element?.status === 'active' ? true : false;
               if(element?.hierarchies) {
                 let name = element?.hierarchies.map(n => n.name).toString();
                 if(!element.hierarchy) {
                   element.hierarchy = {};
                   element.hierarchy['id'] = element?.hierarchies.map(n => n.id).toString();
                   element.hierarchy['name'] = name

                 }else {
                 element.hierarchy.name =name;
                 }
               }
               if (element?.created_by?.name) {
                 const createdAtDate = this.localDatePipe.transform((element?.created_at), DATE_FORMAT.FORMATDMMY, null, null, false);
                 let p = 'By '.concat(element?.created_by?.name, ' On ', createdAtDate);
                 return element.created_by.updated_at = p;
               }
             });
           }
           this.itemPerPage = data?.data?.pagination?.per_page;
           this.totalRecords = data?.data?.pagination?.total_records;
           this.tableOptions.paginationConfig.itemsPerPage = data?.data?.pagination?.per_page;;
           this.tableOptions.totalRecords = data?.data?.pagination?.total_records;
         },
         error: (err: Error) => {
           this.loading = false;
           // this.alertService.error(errorHandler(err));
           this.vmsData = new Array();
           this.totalRecords = 0;
         }
       }
     );
  }

  onEditClick = (event: any) => {
    this.router.navigate(['configuration', 'timesheet', 'create'], { queryParams: { id: event?.id, mode: 'edit' }});
  }
  onViewClick = (event: any) =>  {
    this.router.navigate(['configuration', 'timesheet', 'create'], { queryParams: { id: event?.id, mode: 'view' }});
  }
  onCloneClicked = (event: any) => {
    this.router.navigate(['configuration', 'timesheet', 'create'], { queryParams: { id: event?.id, mode: 'clone' }});
  }

  onDeleteClick = (event: any) => {
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic/${event?.id}`;
    let payload = {};

    this.dialog.confirm(
      "Delete Timesheet",
      "Are you sure, You want to delete this timesheet?",
      "Yes", "No")
      .then(res => {
        if (res === false)
          return;

        this.timesheetConfigurationService.delete(url, payload)
          .subscribe({
            next: (data: any) => {
              this.alertService.success('Timesheet successfully deleted');
              this.getTimesheetConfigurationList();
            }, error: (err: Error | any) => {
              this.alertService.error(errorHandler(err));
            }
          }
        );
      }
    );
  }

  onDisableOrEnableClick =(event : any) =>  {

    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let payload: any = { status: event.is_active ? 'inactive' : 'active' };
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic/${event?.id}/status`;

    this.dialog.confirm(
      "Update Timesheet Status",
      "Are you sure, you want to update the status?",
      "Yes",
      "No"
    ).then(res => {

      if (res === false)
        return;

      this.timesheetConfigurationService.put(url, payload)
        .subscribe({
          next: (data: any) => {
            this.alertService.success("Record updated successfully");
            this.getTimesheetConfigurationList();
          }, error: (err: Error | any) => {
            this.alertService.error(errorHandler(err));
          }
        }
      );
    });
  }

  onPaginationClick= (event: any) => {
    this.Page = event;
    if(!this.isAdvanceFilter) {
    this.getTimesheetConfigurationList(this.Page,this.searchTerm ?? '');
    }else {
    this.getTimesheetConfigAdvanceFilter(this.Page,'');

    }
  }

  onSearch = (term: string) => {
    if(!term){
      this.vmsTable.currentPage =  1;
    }
    this.isAdvanceFilter = false;
    this.searchTerm = term;
    this.getTimesheetConfigurationList(1,term);
  }

  onListFilter = (event: any) =>  {
    if(!event) {
      this.filter = {};
      this.vmsTable.currentPage =  1;
      this.getTimesheetConfigurationList(1, this.searchTerm);
      return;
    }

    this.isAdvanceFilter = true;
    this.Page = 1;

    if('is_active' in (event ?? {})) {
      this.filter.status = event?.is_active?['active']:['inactive'];
    }

    if (event?.title) {
      this.filter.searchTerm = [event?.title];
    } else {
      this.filter.searchTerm = '';
    }

    const hierarchies: any = event?.['hierarchy.name'];
    if(Array.isArray(hierarchies) && hierarchies?.length) {
      this.filter.hierarchy_ids = event?.['hierarchy.name'];
    }

    if(event && event.timesheettype) {
      this.filter.timesheet_type = event.timesheettype
    }
    if(event && event.locations) {
      this.filter.location = event.locations
    }

    if (event && event.name && !event?.hasOwnProperty('is_enabled')) {
      this.filter.searchTerm = [event?.name];
    }

    if (event && event.updated_at) {
      this.filter.updated_at = event.updated_at;
    }

    this.getTimesheetConfigAdvanceFilter(this.Page,'');
  }

  onChangeRecords = (records: any) => {
    this.itemPerPage = records;
    if(!(JSON.stringify(this.filter) === JSON.stringify({}))){
      // this.onFilter();
    }
    else if(this.searchTerm)
      this.getTimesheetConfigurationList(1,this.searchTerm);
    else
      this.getTimesheetConfigurationList();
  }
}
