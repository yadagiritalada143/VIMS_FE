import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramService } from 'src/app/programs/program.service';
import { Router, ActivatedRoute } from '@angular/router';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { Subject, Subscription } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions } from 'src/app/library/svms-table/svms-table.model';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { debounceTime, switchMap } from 'rxjs/operators';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { Observable } from 'rxjs';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { createConditionHtmlString, createRecipientChain } from 'src/app/self-configuration/flows-management/flows-view/flows-view.model';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { UtilityService } from 'src/app/shared/service/utility/utility.service';
@Component({
  selector: 'app-flow-detailed-listing',
  templateUrl: './flow-detailed-listing.component.html',
  styleUrls: ['./flow-detailed-listing.component.scss']
})
export class FlowDetailedListingComponent implements OnInit {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;
  @ViewChild('flowStatus',{static:true}) flowStatus:TemplateRef<void>;
  @ViewChild('quickView', {static: true}) quickViewTemplate: TemplateRef <any>;

  flowData: any;
  private subscriptions: Array<Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};
  public vmsData: any;
  public allFlowConfigList: any;
  public totalRecords = 0;
  public expand: boolean = true;
  public description: string = '';
  public svmsData: Array<any>;
  public currentPath: string = ''
  public informativeBubbleText: string;
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  public reorderFlyoutVisibility: string = 'hidden';
  public masterFlyoutVisibility: 'visible' | 'hidden' = 'hidden';
  public showOrderChangedFlyout: boolean = false;
  public showQuickViewFlow: boolean = false;
  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  public programId: any;
  public moduleFilterInput = new Subject<string | null>();
  public eventNameFilterInput = new Subject<string | null>();
  public searchmoduleId: string = null;
  public eventId: string = null;
  public flow_type: string = null;
  public moduleId: string = null;
  moduleList : any = [];
  allHierarchy : any = [];
  public treeViewGeneric: Array <any> = [];
  eventList : any = [];
   dataLoader: boolean = false;
   searchTerm: string = null;
   tableFilterConfig: Array <IAdvanceFilterConfig>;
  initalizeTableConfigs = () => {
    this.tableFilterConfig = [
      {
        name: 'is_enabled',
        title: 'Status',
        type: FilterType.SELECT,
        options: [
          { name: 'ACTIVE', value: true },
          { name: 'INACTIVE', value: false }
        ],
        advanceFilter: false
      },
      {
        name: 'name', title: 'Search Title', type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'hierarchies',
        title: 'Search Hierarchies',
        type: FilterType.MULTISELECT,
        options: [],
        advanceFilter: false
      },
      {
        name: 'modified_on',
        title: 'Last updated ',
        type: FilterType.DATEPICKER
      },
    ];
    this.tableHeaderConfig = {
      title: '',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('workflow_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: true,
      importData: false,
      exportData: false,
      onSearch: this.onSearch,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter,
      showInformativeBubble: true,
      showBackArrow: true
    };
    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView, hide: !this.authService.authorize('workflow_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('workflow_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClicked, linkIcon: 'label_off', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('workflow_manage') },
      { linkName: 'Delete', method: this.onDeleteClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('workflow_manage') }
    ];
    this.svmstableColomnDefn = [
      { field: 'placement_order', header: 'Execution Sequence', width: 15, customOrder: true, primary: true, supportingText: 'Only active workflows will be considered for execution',order:1,sortable:true,onClick:this.onClickView },
      { field: 'is_enabled', header: 'Status', width: 20,templateRef:this.flowStatus,order:2 },
      { field: 'name', header: 'Title', width: 20, order:3, sortable:true, type: ColumnType.TEMPLATE, templateRef: this.quickViewTemplate },
      { field: 'hierarchies', header: 'Hierarchy', width: 15,order:4,sortable:true }
    ];
    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: false,
      totalRecords: this.totalRecords,
      noDataMessage: "No Flows found for the selected program.",
      actionLinks:actionLinks,
      enableColumnFilter: true,
    };
  };
  constructor (
    private route: SvmsRouterService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private loader: LoaderService,
    private alert: AlertService,
    private localStorage: StorageService,
    private storageService: StorageService,
    private programService: ProgramService,
    private _confirmService: ConfirmationDialogService,
    private localDateFormat: LocalDateFormatPipe,
    private accessControlService: AccessControlService,
    private sortPipe: SortHelperPipe,
    private authService: AuthorizationService,
    private utilityService:UtilityService
  ) { }
  onClickView =(evt: any) => {
    if (evt) {
      const id = evt.id;
      this.route.navigate(['program', 'workflow', 'view', id]);
    }
  }
  onEditClick = (event) => {
    if (event) {
      const { id } = event;
      this.route.navigate(['program', 'workflow', 'edit', id]);
    }
  }
  changedOrderClicked(event) {
    if(event) {
      this.showOrderChangedFlyout = event;
    }
  }
  changedCustomColoumnOrder(event) {
    if(event) {
      event = this.sortPipe.transform(event, 'selectedSeq');
      let uniqueSeq = event.map(x => x?.selectedSeq)
      uniqueSeq = [...new Set(uniqueSeq)]
      if(event?.length != uniqueSeq?.length) {
        this.alert.error('Please enter unique Sequence to re-ordering flow.');
      } else {
        let orderedFlowIds = event.map(x => x?.id)
        this.reOrderFlowListing(orderedFlowIds)
        this.showOrderChangedFlyout = false;
      }
    }
  }
  onCloseOrderChangedModel(event) {
    if(event) {
      this.showOrderChangedFlyout = false;
    }
  }

  onCloseQuickViewFlow(event) {
    if(event) {
      this.showQuickViewFlow = false;
    }
  }

  quickViewFlowCard(evt) {
    if(evt.id) {
      this.showQuickViewFlow = true
      this.getFlowDetails(evt.id)
    }
  }

  goToPreviousPage(evt) {
    if(evt) {
      this.route.navigate(['program', 'workflow', 'list']);
    }
  }
  reOrderFlowListing(orderedFlowIds) {
    if(orderedFlowIds && orderedFlowIds?.length > 0) {
      let payload =  {
        flow_order : orderedFlowIds
      }
      let url = `/configurator/programs/${this.programId}/flow-configs/grouped/${this.eventId}/${this.flow_type}/re-order`
      this.programService.put(url, payload).subscribe({
        next: (data: any) => {
          if(data) {
            this.alert.success('Re-ordering flow been successful.');
            this.loader.hide();
            this.masterSub.next({});
          }
        }, error: (err: any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      });
    }
  }
  onDisableClicked = (event: any) => {
    if (event) {
      let state: string = event?.is_enabled ? 'disable' : 'enable';
      let message: string = `Are you sure to ${state} the ${event.name}?`;
      this._confirmService
        .confirm('', message, 'Yes', 'No')
        .then((flag: boolean) => {
          if (flag) {
            const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
            const url: string = `/configurator/programs/${programId}/flow-configs/${event?.id}`;
            let payload: any = {
              is_enabled: !event?.is_enabled,
            };
            this.loader.show();
            this.programService.put(url, payload).subscribe(
              (res: any) => {
                if (res) {
                  this.loader.hide();
                  this.alert.success(`Flows Type ${state}d successfully`);
                  event.is_enabled = !event.is_enabled;
                }
              },
              err => {
                this.loader.hide();
                this.alert.error(errorHandler(err));
              },
            );
          }
        })
        .catch(err => {
          console.error(err);
        });
    }
  }
  onDeleteClick = (event) =>{
    if (event) {
         const { id } = event;
         if (id) {
      this.loader.show();
      this.programService.delete(`/configurator/programs/${this.programId}/flow-configs/${id}`)
        .subscribe(
          {
            next: (message: any) => {
              this.alert.success("Flow Deleted Successfully");
              this.loader.hide();
              this.masterSub.next(this.prevMasterConfig);
            }, error: (err: any) => {
              this.loader.hide();
              this.alert.error(errorHandler(err));
            }
          });
    }
    }
  }

  ngOnInit(): void {
    this.programId = this.localStorage.get("PROGRAM_ID");
    this.currentPath = this.router.url
    this.activatedRoute.params.subscribe(params => {
      this.eventId = params['eventId'];
      this.flow_type = params['flow_type']
      this.moduleId = params['module']
    });
    this.loadModules();
    this.hierarchyList();
    this.initalizeTableConfigs();
    this.subscriptions.push(
      this.masterSub
        .pipe(
          debounceTime(600),
          switchMap((config: any) => {
            this.loader.show();
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
              const flowConfig: Array<any> = this.vmsData?.flow_configs;
              flowConfig.forEach((el: any) => {
                el.modified_on = this.localDateFormat.transform(el?.modified_on, '', '', '', true);
                el.status = el.is_enabled ? 'Active' : 'Inactive'
                el.placement_order = el.placement_order + 1
                el.hierarchies = el?.hierarchies?.map(h => h.name)?.join(", ")
              });
              this.svmsData = flowConfig;
              this.tableHeaderConfig.title = this.tableHeaderConfig.title ? this.tableHeaderConfig.title : flowConfig[0]?.event?.name
              this.informativeBubbleText = this.informativeBubbleText ? this.informativeBubbleText : this.utilityService.capitalizeWords(this.svmsData[0]?.module?.name?.toString()) +' - '+ this.utilityService.capitalizeWords(this.flow_type?.toString())
              this.svmsData = this.sortPipe.transform(this.svmsData, 'placement_order');
              this.totalRecords = data?.total_records;
              this.tableOptions.totalRecords = this.totalRecords;
              this.loader.hide();
            }
          },
          err => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error occured while loading Master data types');
          },
        ),
    );
    this.masterSub.next({ term: '' });
    this.getFlowConfigListWithoutLimit();
  }
  onListFilter = (event: any) => {
    if(event?.hierarchies?.length == 0) {
      delete event['hierarchies']
    }
    if(this.isEmptyObject(event) || this.isEmptyObject(event) == null) {
      this.isAdvanceSearch = false;
      this.masterSub.next({});
    } else {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.masterSub.next({});
    }
  }
  searchModuleFilter = (term = '') => {
    let url = `/configurator/programs/${this.programId}/modules`;
    if (term) {
      url += `&k=${term}`;
    }
    this.programService.get(url)
      .subscribe(
        {
          next: (data: any) => {
            const moduleData = data?.modules;
            const fmoduleData = [];
            moduleData?.forEach((item: any) => {
              fmoduleData.push({ value: item?.id, name: item?.name });
            });
          }
        });
  }
  getFlowConfigListWithoutLimit = () => {
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/flow-configs/grouped/${this.eventId}/${this.flow_type}`;
    this.programService.get(url)
      .subscribe(
        {
          next: (data: any) => {
            this.allFlowConfigList = data?.flow_configs;
            this.allFlowConfigList = this.sortPipe.transform(this.allFlowConfigList, 'placement_order');
          }
        });
  }
  fetchSearchObservable(config: any): Observable<any> {
    const { term } = config;
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/flow-configs/grouped/${this.eventId}/${this.flow_type}`;
    if (term) {
      url += `&k=${term}`;
    }
    return this.programService.get(url);
  }
  fetchAdvanceSearchObservable({ page }): Observable<any> {
    let filter: any = {};
    if (this.filterpayLoad) {
      filter = {
        flow_type: this.flow_type,
        is_enabled: this.filterpayLoad['is_enabled'],
        name : this.filterpayLoad['name'],
        hierarchies:this.filterpayLoad['hierarchies'],
        order_by : "placement_order"
      };
      if(this.eventId) {
        filter['events'] = [this.eventId]
      }
      if(this.svmsData[0]?.module?.id) {
        filter['modules'] = [this.svmsData[0]?.module?.id]
      }
      if(this.filterpayLoad['modified_on']){
        filter["modified_on"]  = {start : this.filterpayLoad['modified_on'][0], end: this.filterpayLoad['modified_on'][1]}
      }
    }
    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url: string = `/configurator/programs/${programId}/flow-configs/advance-search`;

    return this.programService.post(url, filter);
  }
  onCreateClick =(event)=> {
    if(event) {
      this.route.navigate(['program', 'workflow','create', this.eventId, this.moduleId, this.flow_type]);
    }
  }
  onSearch = (term: string) => {
    this.masterSub.next({ term });
  }
  onChange = (selectedModule: string) => {
    this.loadEvents(selectedModule);
  }

  isEmptyObject(value) {
    return value && Object.keys(value).length === 0 && value.constructor === Object;
  }

  hierarchyList() {
    this.loader.show();
    this.programService.get(`/configurator/programs/${this.programId}/hierarchy`).subscribe({
      next: (data: any) => {
        this.treeViewGeneric = [];
        if(data.result && data.result.length && data.result[0].hierarchies) {
          data.result[0].hierarchies.forEach(node => {
            this.treeViewGeneric.push(this.treeViewParser(node));
          });
          this.allHierarchy = [...new Set(this.allHierarchy)];
          this.tableFilterConfig.filter(x => x.name == 'hierarchies')[0].options = this.allHierarchy;
        }
        this.loader.hide();
      },
      error: (err: any) => {
        this.alert.error(errorHandler(err));
      }
    })
  }

  treeViewParser(node) {
    const value = node.id;
    const text = node.name;
    node.hierarchies.map(element => {
      return this.treeViewParser(element);
    });
    this.allHierarchy.push({value : value, name: text});
  }

  getFlowsList = (payload?) => {
    this.dataLoader = true;
    const status = payload['is_enabled'] ? '&is_enabled=' + payload.is_enabled : payload.is_enabled == false ? '&is_enabled=' + payload.is_enabled : null;
    let url = `/configurator/programs/${this.programId}/flow-configs/grouped/${this.eventId}/${this.flow_type}?${status ? status : ''}${payload['name'] ? '&name=' + payload['name'] : ''}${payload['hierarchies'] ? '&hierarchies=' + payload['hierarchies'] : ''}${payload['modified_on'] ? '&modified_on=' + payload['modified_on'] : ''}`;
    // if (this.searchTerm) {
    //   url += `&k=${this.searchTerm}`;
    // }
    this.programService.get(url).subscribe(
      {
        next: (data: any) => {
          this.vmsData = data;
          this.svmsData = data?.flow_configs;
          this.svmsData.forEach(x => {
            x.modified_on = this.localDateFormat.transform(x?.modified_on, '', '', '', true);
            x.status = x.is_enabled ? 'Active' : 'Inactive'
            x.placement_order = x.placement_order + 1
            x.hierarchies = x.hierarchies.map(h => h.name).join(", ")
          })
          this.svmsData = this.sortPipe.transform(this.svmsData, 'placement_order');
          this.totalRecords = data?.total_records;
          this.tableOptions.totalRecords = this.totalRecords;
        },
        error: (err: any) => {
          this.alert.error(errorHandler(err));
        }
      })
  }
  getFlowDetails(flowId) {
    this.loader.show();
    this.programService.get(`/configurator/programs/${this.programId}/flow-configs/${flowId}`)
      .subscribe(
        {
          next: (flow: any) => {
            this.flowData = flow?.flow_config;
            this.flowData['default_conditions'] = flow?.flow_config?.levels?.length > 0 ? createConditionHtmlString(flow?.flow_config?.levels[0]?.conditions) : 'No Available Condition';
            this.flowData['each_level'] = flow?.flow_config?.levels?.length > 0 ? flow?.flow_config?.levels.slice(1).map((level: any) => { return { conditions: createConditionHtmlString(level?.conditions), recipients: createRecipientChain(level?.recipient_types[0],this.flowData.module.code) } }) : [];
            this.loader.hide();
          },
          error: (err: any) => {
            this.alert.error(errorHandler(err));
            this.loader.hide();
          }
        })
  }
  loadModules = () => {
    let url = `/configurator/programs/${this.programId}/modules?exclude_if_no_event=true`
    this.programService.get(url).subscribe({
      next: (data: any) => {
        this.moduleList = data?.modules.map(x => { return {
          value: x.id,
          name: x.name
        }})
        if(this.filterpayLoad) {
          this.filterpayLoad['events'] = null
        }
        this.tableFilterConfig.forEach(x => {
          if(x.name == 'modules') {
            x.options = this.moduleList
          }
        })
      },
      error: err => {
        console.error(err);
      }
    });
  }
  loadEvents(selectedModule): void {
    this.programService.get(`/configurator/flow-system/modules/${selectedModule}/events`).subscribe({
      next: (data: any) => {
        this.eventList = data?.events.map(x => { return {
          value: x.id,
          name: x.name
        }})
        this.tableFilterConfig.forEach(x => {
          if(x.name == 'events') {
            x.options = this.eventList
          }
        })
      },
      error: err => {
        console.error(err);
      }
    });
  }
  get showTable() {
    return this.totalRecords;
  }
}
