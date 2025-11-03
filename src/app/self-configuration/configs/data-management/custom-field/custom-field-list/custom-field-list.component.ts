import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Subject, Subscription } from 'rxjs';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig} from 'src/app/library/svms-table/svms-table.model';
import { Router } from '@angular/router';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { CustomFieldsService } from 'src/app/program-setup/custom-fields/custom-fields.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { UserService } from 'src/app/core/services/user.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-custom-field-list',
  templateUrl: './custom-field-list.component.html',
  styleUrls: ['./custom-field-list.component.scss']
})
export class CustomFieldListComponent implements OnInit {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('customFieldStatus',{static:true}) customFieldStatus:TemplateRef<void>;
  @ViewChild('requiredStatus',{static:true}) requiredStatus:TemplateRef<void>;

  private subscriptions: Array<Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};

  public vmsData: any;
  public itemPerPage = 10;
  public totalRecords = 0;
  public expand: boolean = true;
  public description: string = '';
  public svmsData: Array<any>;
  public currentPath: string = ''
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  tableFilterConfig: Array <IAdvanceFilterConfig>;
  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;

  public programId: any;
  public searchmoduleId: string = null;

  dataLoader: boolean = false;
  searchTerm: string = null;
  tablePaginationConfig: ITablePaginationConfig;
  showOrderChangeFlyout: boolean = false;
  allCustomFieldData: any = [];
  moduleList: any = [];

  initalizeTableConfigs = () => {
    this.tableFilterConfig = [
      {
        name: 'statusMessage',
        title: 'Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ],
        advanceFilter: false
      },
      {
        name: 'name', title: 'Search Name', type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'entity.name',
        title: 'Modules',
        type: FilterType.SELECT,
        options: [],
        advanceFilter: false
      },
      {
        name: 'label',
        title: 'Search label',
        type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'type',
        title: 'Search field type',
        type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'is_required',
        title: 'Search',
        type: FilterType.SELECT,
        advanceFilter: false,
        options: [
          { name: 'True', value: true },
          { name: 'False', value: false }
        ]
      },
      {
        name: 'modified_on',
        title: 'Last updated ',
        type: FilterType.DATEPICKER
      },
    ];

    this.tableHeaderConfig = {
      title: 'Custom Fields',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('custom_field_manage'),
      onAdd: this.onCreateClick,
      onSearch: this.onSearch,
      advanceFilter: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter,
      reorder: true,
      onReorder: this.onReorder,
    };

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onClickView , linkIcon: 'visibility', hide: !this.authService.authorize('custom_field_view')},
      { linkName: 'Edit', method: this.editCustomFields, hide: !this.authService.authorize('custom_field_manage') },
      { linkName: 'Enable/Disable', method: this.changeCustomFieldStatus, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('custom_field_manage') },
      { linkName: 'Delete', method: this.onDeleteClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('custom_field_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };

    this.svmstableColomnDefn = [
      { field: 'name', header: 'Name', width: 5, order:3, primary:false , sortable:true, onClick:this.onClickView },
      { field: 'statusMessage', header: 'Status', width: 15, sortable:true, templateRef:this.customFieldStatus, order:2 },
      { field: 'entity.name', header: 'Module', width: 15, sortable:true, order:1, primary: true, onClick:this.onClickView },
      { field: 'label', header: 'Label', width: 15, sortable:true, order:4 },
      { field: 'type', header: 'Field Type', width: 15, sortable:true, order:5 },
      { field: 'is_required', header: 'Required', templateRef:this.requiredStatus, width: 15, sortable:true, order:6 },
      { field: 'modified_on', header: 'Last Updated', width: 15, sortable:true, order:7, type: ColumnType.DATETIME  },
    ];


    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Custom Field found for the selected program.",
      actionLinks:actionLinks,
      enableColumnFilter: true,
    };
  };
  reOrderModules: any;
  reOrderSelectedModule: any;

  constructor (
    private route: SvmsRouterService,
    private loader: LoaderService,
    private accessControlService: AccessControlService,
    private router: Router,
    private alert: AlertService,
    private storeServ: StorageService,
    private programService: ProgramService,
    private customFieldsService: CustomFieldsService,
    private authService: AuthorizationService,
    public userService: UserService,
    private keysort: SortHelperPipe
  ) { }

  private generateCustomFieldPayload = (formValue: any) => {
    const { type, name, label, placeholder, description, meta_data, is_required, is_enabled, entity_refs } = formValue;
    const entityRefs = entity_refs.map(ref => ({
      entity_ref: ref.entity_ref,
      can_edit: ref.can_edit.map(item => ({
        ...item,
        organizations: item.organizations.length > 0 ? item.organizations?.map(org => org.id) : null,
      })),
      can_view: ref.can_edit.map(item => ({
        ...item,
        organizations: item.organizations.length > 0 ? item.organizations?.map(org => org.id) : null,
      })),
    }));
    const payload = {
      type,
      name,
      label,
      placeholder,
      description,
      meta_data,
      is_required,
      is_enabled,
      entity_refs: entityRefs,
    };
    return payload;
  }

  public changeCustomFieldStatus = (event: any) => {
    this.customFieldsService.getCustomFieldDetails(this.programId, event.id, event.entity.code).subscribe(
      (data:any) => {
        const customField = {
          ...data.custom_field,
          is_enabled: !event.is_enabled,
        };
        let payload = this.generateCustomFieldPayload(customField);
        payload.entity_refs.forEach(x => { x.add = true })
        if(event.entity.code == 'PROGRAM_USERS') {
          payload['org_category'] = data.custom_field.org_category.map(x => x.organization_category)
        }
        if(event.entity.code == 'MASTER_DATA_TYPE') {
          payload['master_data_type'] = data.custom_field.master_data_type.map(x => x.id)
        }
        this.customFieldsService.updateCustomField(this.programId, event.id, payload).subscribe(
          () => {
            this.alert.success(payload.is_enabled ? `Custom Field Enabled Succesfully` : `Custom Field Disabled Succesfully`)
            this.masterSub.next(this.prevMasterConfig);
          },
          res => {
            if (res?.error?.error?.message) {
              this.alert.error(res.error.error.message);
            }
          },
        );
      },
      res => {
        if (res?.error?.error?.message) {
          this.alert.error(res.error.error.message);
        }
      },
    );
  }

  onDeleteClick = (event: any) => {
    this.customFieldsService.getCustomFieldDetails(this.programId, event.id, event?.entity?.code).subscribe(
      (data:any) => {
        const customField = {
          ...data.custom_field
        };
        const payload = this.generateCustomFieldPayload(customField);
        payload.entity_refs.forEach(x => {
          return (x?.entity_ref || '')?.toUpperCase() === (event?.entity?.code || '')?.toUpperCase() ? x.add = false : x.add = true;
        });
        if(event.entity.code == 'PROGRAM_USERS') {
          payload['org_category'] = data.custom_field.org_category.map(x => x.organization_category)
        }
        if(payload.meta_data?.linked?.modules?.length > 0){ this.alert.error("Selected Custom field has been linked with other modules. Deletion can be possible only if linked module is removed.") }
        else {
        this.customFieldsService.updateCustomField(this.programId, event.id, payload).subscribe(
          () => {
            this.alert.success(`Custom Field Deleted Succesfully`);
            this.masterSub.next({});
          },
          res => {
            if (res?.error?.error?.message) {
              this.alert.error(res.error.error.message);
            }
          },
        );
        }
      },
      res => {
        if (res?.error?.error?.message) {
          this.alert.error(res.error.error.message);
        }
      },
    );
  }

  ngOnInit(): void {
    this.programId = this.storeServ.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.currentPath = this.router.url
    this.initalizeTableConfigs();
    //this.getAllCustomField();
    this.loadModules();
    this.subscriptions.push(
      this.masterSub
        .pipe(
          debounceTime(600),
          switchMap((config: any) => {
            this.loader.show();
            let { page = 1, term = '' } = config;
            config = { page, term };
            if(this.vmsTable) {
              this.vmsTable.currentPage = page;
            }

            this.prevMasterConfig = config;
            if (this.isAdvanceSearch) {
              // Search for table: false
              return this.fetchAdvanceSearchObservable(config);
            }
            // Search for table: true
            return this.fetchSearchObservable(config);
          }),
        )
        .subscribe(
          (data: any) => {
            if (data) {
              this.vmsData = data;
              const customFieldConfig: Array<any> = this.vmsData?.custom_fields;
              customFieldConfig.forEach((el: any) => {
                el.status = el.is_enabled
                el.statusMessage = el.is_enabled ? 'Active' : 'Inactive'
              });

              this.svmsData = customFieldConfig;
              this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
              this.itemPerPage = data?.items_per_page;
              this.totalRecords = data?.total_records;
              this.tableOptions.totalRecords = this.totalRecords;
              this.loader.hide();
            }
          },
          err => {
            this.loader.hide();
            this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
            console.error(err);
          },
        ),
    );
    this.masterSub.next({ page: 1, term: '' });
  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;

    this.itemPerPage = this.itemPerPage ? this.itemPerPage : 10

    let url = `/configurator/programs/${this.programId}/custom-fields?limit=${this.itemPerPage}&order_by=asc&key=ref_order&info_level=basic`;

    if (page) {
      url += `&page=${page}`;
    }

    if (term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  fetchAdvanceSearchObservable({ page = 1 }): Observable <any> {

    let payload: any = {
      pagination: {
        limit: this.itemPerPage,
        page: page
      },
      filters: {}
    };

    const filters: any = payload['filters'];
    if (this.filterpayLoad) {

      if('name' in this.filterpayLoad) {
        filters.name = this.filterpayLoad?.['name'];
      }

      if('entity.name' in this.filterpayLoad) {
        filters.module = this.filterpayLoad?.['entity.name'];
      }

      if('label' in this.filterpayLoad) {
        filters.label = this.filterpayLoad?.['label'];
      }

      if('type' in this.filterpayLoad) {
        filters.field_type = this.filterpayLoad?.['type'];
      }

      if(typeof(this.filterpayLoad?.['statusMessage']) === 'boolean') {
        filters.is_enabled = this.filterpayLoad?.['statusMessage'] || false;
      }

      if(typeof(this.filterpayLoad?.['is_required']) === 'boolean') {
        filters.is_required = this.filterpayLoad?.['is_required'] || false;
      }

      const modified_on: Array <any> = this.filterpayLoad?.['modified_on'];
      if(Array.isArray(modified_on) && (modified_on.length === 2)) {
        filters.date_range  = [modified_on[0], modified_on[1]];
      }
    }

    const url: string = `/configurator/programs/${this.programId}/custom-fields/advanced-filters`;
    return this.programService.post(url, payload);
  }

  onReOrderModuleChange(moduleCode){
    this.reOrderSelectedModule = moduleCode
    this.getAllCustomField(moduleCode)
  }
  getAllCustomField(moduleCode) {
    let url = `/configurator/programs/${this.programId}/custom-fields?order_by=asc&key=ref_order&entity_ref=${moduleCode}`;
    this.programService.get(url).subscribe(
      (data: any) => {
        if (data) {
          this.allCustomFieldData = data?.custom_fields;
        }
      },
      err => {
        this.loader.hide();
        this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        console.error(err);
      },
    );
  }

  loadModules() {
    this.programService.get(`/configurator/resources/module-groups?module_customfield=true`).subscribe((data:any) => {
      if (data) {
        data.module_groups.forEach(x => {
          x.modules.forEach(innerModules => {
            this.moduleList.push(innerModules)
          })
        })

        let parsedData: Array <string> = this.moduleList.map((x: any) => {
          return {
            name: (x?.name || '')?.trim(),
            value: x?.code
          }
        });

        this.reOrderModules = this.keysort.transform([...parsedData], 'name');
        this.tableFilterConfig.filter(tab => tab.name == 'entity.name')[0].options = this.reOrderModules;
      }
    })
  }

  onReorder= () => {
    this.showOrderChangeFlyout = true
  }

  changedCustomColoumnOrder(event) {
    if(event) {
      let custom_fields = [];
      for(let i in this.allCustomFieldData){
        custom_fields.push({
          id:this.allCustomFieldData[i].id,
          entity_ref:this.reOrderSelectedModule,
          ref_order: Number(i)+1
        })
      }
      this.subscriptions.push(
        this.userService.reOrderCustomFieldsList(this.programId,{custom_fields}).subscribe(
          (data:any) => {
            this.loader.hide();
            this.showOrderChangeFlyout = false;
            this.alert.success('Custom Field Reordered Successfully')
            this.masterSub.next({});
          },
          error => {
            this.alert.error(errorHandler(error), {});
            //this.getAllCustomField();
            this.loader.hide();
          },
        ),
      );
    }
  }

  onCloseOrderChangedModel(event) {
    if(event) {
      this.showOrderChangeFlyout = false;
    }
  }

  onCreateClick =(create: any) => {
    if (create) {
      this.route.navigate(['data-management', 'custom-field', 'create']);
    }
  }

  onClickView =(evt: any) => {
    if (evt) {
      const { id } = evt;
      this.route.navigate(['data-management', 'custom-field', 'view', id], { queryParams: { entity_ref: evt?.entity.code }});
    }
  }

  editCustomFields = (evt: any) => {
    if (evt) {
      const { id } = evt;
      this.route.navigate(['data-management', 'custom-field', 'edit', id], { queryParams: { entity_ref: evt?.entity.code }});
    }
  }

  onItemCountChanged = (count: number) => {
    this.itemPerPage = count;
    this.tablePaginationConfig.itemsPerPage = count;
    this.masterSub.next({ ...this.prevMasterConfig, page: 1 });
  }

  onPaginationClick = (page: number) => {
    this.masterSub.next({ ...this.prevMasterConfig, page: page });
  }

  isEmptyObject(value) {
    return value && Object.keys(value).length === 0 && value.constructor === Object;
  }

  onListFilter = (event: any) => {
    if(this.isEmptyObject(event) || this.isEmptyObject(event) == null) {
      this.isAdvanceSearch = false;
      this.masterSub.next({});
    } else {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.masterSub.next({});
    }
  }

  onSearch = (term: string) => {
    this.masterSub.next({ term, page: 1 });
  }

}
