import { Component, OnDestroy, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { TreeComponent } from 'src/app/library/tree/tree.component';
import { ProgramService } from 'src/app/programs/program.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { HierarchyConfig } from 'src/app/shared/enums';
import { ProgramConfig } from 'src/app/shared/enums';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { ColumnType, IColoumnDefinition, ITableHeaderConfig, ITableOptions, IActionLinks, FilterType, IAdvanceFilterConfig } from 'src/app/library/svms-table/svms-table.model';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { Router } from '@angular/router';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-hierarchy-configuration-listing',
  templateUrl: './hierarchy-configuration-listing.component.html',
  styleUrls: ['./hierarchy-configuration-listing.component.scss']
})
export class HierarchyConfigurationListingComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  public eventParentNode: any;
  searchTerm: any;
  isAdvanceSearch = false;
  flattednedHierarchy: any = [];
  filterpayLoad: any = {};
  @ViewChild(TreeComponent) appTree: TreeComponent;
  private searchHierarchySub: Subject<any> = new Subject<any>();
  public vmsData: Array <any> = [];
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('statusTemplate',{static:true}) statusTemplate: TemplateRef<void>;
  @ViewChild('showData',{static:true}) showData: TemplateRef<void>;
  @ViewChild('hierarchyTemplate', { static: true }) hierarchyTemplate: TemplateRef<void>;
  @ViewChild('codeTemplate',{static:true}) codeTemplate: TemplateRef<void>;

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        type: FilterType.MULTISELECT,
        title: 'hierarchy_name',
        name: 'name',
        placeholder: 'select_hierarchy',
        options: [],
        loading: false
      },
      {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: 'select_status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
      {
        type: FilterType.TEXT,
        title: 'code',
        name: 'code',
        placeholder: 'filter_by_code',
      },
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'hierarchies',
      searchAllowed: true,
      onSearch: this.onSearch,
      showAddBtn: this.authService.authorize('hierarchy_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter,
    };

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'view', method: this.onViewClick, disable: !this.authService.authorize('hierarchy_view'), hide: !this.authService.authorize('hierarchy_view')  },
      { linkName: 'edit', method: this.onEditClick, disable: !this.authService.authorize('hierarchy_manage'), hide: !this.authService.authorize('hierarchy_manage') },
      { linkName: 'enable_disable', method: this.onDisableClicked, disable: !this.accessControlService.accessControl() || !this.authService.authorize('hierarchy_manage'), hide: !this.authService.authorize('hierarchy_manage') },
      { linkName: 'delete', method: this.onDeleteClicked, disable: !this.accessControlService.accessControl() || !this.authService.authorize('hierarchy_manage'), hide: !this.authService.authorize('hierarchy_manage') }
    ];

    this.svmstableColomnDefn = [
      { field: 'name', header: 'name', width: 35, templateRef: this.hierarchyTemplate, order:1, sortable: true, showActionLinkForTemplate: true },
      { field: 'modified_on', header: 'Last Updated', width: 15,order:4, type: ColumnType.DATETIME, sortable: true },
      { field: 'is_enabled', header: 'status', width: 15,order:2,templateRef: this.statusTemplate, sortable: true },
      { field: 'code', header: 'code', width: 10, order: 3, sortable: true, type: ColumnType.TEMPLATE, templateRef: this.codeTemplate }
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: false,
      noDataMessage: "no_records_found",
      actionLinks,
      linksValidatorFn: this.clickThreeDot,
      enableColumnFilter: true
    };
  };

  constructor(
    private _programService: ProgramService,
    private _storageService: StorageService,
    private eventStream: EventStreamService,
    private _alertService: AlertService,
    private _confirmService: ConfirmationDialogService,
    private router: Router,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.initalizeTableConfigs();
    this.hierarchyList();
    this.subscriptions.push(this.eventStream.on(Events.CREATE_HIERARCHY).subscribe((data:any) => {
      if (!data) {
        this.hierarchyList();
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.EDIT_HIERARCHY).subscribe((data:any) => {
      if (!data) {
        this.hierarchyList();
      }
    }));

    this.searchHierarchySub
      .pipe(debounceTime(600))
      .subscribe((term: any) => {
        this.searchTerm = term;
        this.hierarchyList();
      })
  }

  clickThreeDot = (actionLinks: Array<IActionLinks>, rowData: any) => {
    let control: boolean = this.accessControlService.accessControl();
    if (rowData?.hierarchy_level == 1) {
      actionLinks[3].disable = true;
    } else {
      actionLinks[3].disable = !control;
    }
    if(rowData?.is_enabled){
      actionLinks[2].linkName = 'disable';
    }else {
      actionLinks[2].linkName = 'enable';
    }
  }

  hierarchyList = () => {
    let programDetails = JSON.parse(this._storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    let url = `/configurator/programs/${programId}/hierarchy`;
    if (!!this.filterpayLoad && Object.keys(this.filterpayLoad)?.length > 0) {
      url+=`?advance_filter=true`;
      if(this.filterpayLoad?.name){
        url+=`&name=${(this.filterpayLoad?.name || []).join(',')}`;
      }
      if(this.filterpayLoad?.is_enabled==true || this.filterpayLoad?.is_enabled==false){
        url+=`&active=${this.filterpayLoad?.is_enabled}`;
      }
      if(this.filterpayLoad?.code) {
        url += `&code=${this.filterpayLoad?.code}`;
      }
      if(this.filterpayLoad?.modified_on) {
        url += `&date_range=${(this.filterpayLoad?.modified_on || []).join(',')}`;
      }
    }
    else if(this.searchTerm){
      url+=`?k=${this.searchTerm}`;
    }
    this.subscriptions.push(this._programService.get(url).subscribe(
      (data:any) => {
        if (data) {
          this.vmsData = [];
          this.flattenHierarchy(data.result[0].hierarchies);
          this.vmsTable.dataSource = this.vmsData;
          this.flattednedHierarchy = this.vmsData;
          this.tableOptions.headerConfig.advanceFilterConfig[0].options = this.vmsData?.map((hierarchy: any) => {return {name: hierarchy?.name, value:hierarchy?.name}}).splice(1);
          if((!!this.filterpayLoad && Object.keys(this.filterpayLoad)?.length > 0) || this.searchTerm) {
            this.vmsData = data.result[0]?.filtered_hierarchy_names?.map((hierarchy: any) => {return {...hierarchy, modified_on: hierarchy?.modified_on*1000}});
            this.vmsTable.dataSource = this.vmsData;
          }
          // if(this.vmsData.length > 0){
          //   this.tableOptions.headerConfig.showAddBtn = false;
          // }
          this.tableOptions.totalRecords = this.vmsData?.length;
          //This is temperory comment may be later can be used.
          this._storageService.set(HierarchyConfig[0], data.result[0].hierarchies, true);
        }
      }));
  }

  flattenHierarchy = (hierarchies: any) => {
    if(hierarchies?.length < 1){
      return ;
    }
    hierarchies?.forEach((hierarchy: any) => {
      this.vmsData.push(hierarchy);
      this.flattenHierarchy(hierarchy?.hierarchies);
    })
  }

  onSearch = (term: any) => {
    this.searchHierarchySub.next(term);
  }

  onListFilter = (event: any) => {
    this.isAdvanceSearch = true;
    this.filterpayLoad = event;
    this.hierarchyList();
  }

  onCreateClick = (event: any) => {
    // this.eventStream.emit(new EmitEvent(Events.CREATE_HIERARCHY, true));
    if(Array.isArray(this.vmsData) && this.vmsData.length) {
      let evt: any = {
        parent_name: this.vmsData[0]?.name,
        parent_id: this.vmsData[0]?.id
      }

      this._storageService.set("hierarchyDataEdit", evt, true);
    }
    this.router.navigate(['self-configuration', 'program', 'hierarchy','create']);
  }

  onViewClick = (event: any) => {

    let evt = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == event.id);
    if(evt.hierarchy_level == 1){
      evt['parent_name'] = this._storageService.get(StorageKeys.CURRENT_PROGRAM).name;
    }
    else{
      this.vmsData.forEach((hierarchy: any) => {
        if(hierarchy.hierarchy_level == (evt.hierarchy_level-1)){
          evt['parent_name'] = hierarchy.name;
          evt['parent_id'] = hierarchy.id;
        }
      })
    }
    this._storageService.set("hierarchyData",evt,true);
    this.router.navigate(['self-configuration', 'program', 'hierarchy', 'view'])
    .then(()=>{
      setTimeout(()=> {
        this.eventStream.emit(new EmitEvent(Events.VIEW_HIERARCHY, evt));
      }, 800);
    });
  }

  onEditClick = (event: any) => {
    let evt = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == event.id);
    if(evt.hierarchy_level == 1){
      evt['parent_name'] = this._storageService.get(StorageKeys.CURRENT_PROGRAM).name;
    }
    else{
      this.vmsData.forEach((hierarchy: any) => {
        if(hierarchy.hierarchy_level == (evt.hierarchy_level-1)){
          evt['parent_name'] = hierarchy.name;
          evt['parent_id'] = hierarchy.id;
        }
      })
    }
    this._storageService.set("hierarchyDataEdit",evt,true);
    this.router.navigate(['self-configuration', 'program', 'hierarchy', 'edit'])
    .then(()=>{
      setTimeout(()=> {
        this.eventStream.emit(new EmitEvent(Events.EDIT_HIERARCHY, evt));
      }, 800);
    });
  }


  onClickSubLevel = (evt: any) => {
    this.eventStream.emit(new EmitEvent(Events.CREATE_HIERARCHY, evt));
  }
  getParentViewNode = (childNodeData: any) => {
    //assuming for now it will have only one parent node and under this index all node will occure.
    const nodeData = this._storageService.get(HierarchyConfig[0]);
    var viewNodeReturn;
    const checkNested = (nodedata) => {
      return nodedata?.forEach(element => {
        if (element.hierarchy_level === (childNodeData.hierarchy_level - 1)) {
          if (element?.hierarchies) {
            return element?.hierarchies.forEach((ele, key) => {
              if (ele.id === childNodeData.id) {
                viewNodeReturn = element;
                return element;
              }
            });
          }
        } else {
          checkNested(element?.hierarchies);
        }
      });
    }
    checkNested(nodeData)
    return viewNodeReturn;


  }
  onDisableClicked = (evt: any) => {
    let event = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == evt.id);
    let action = '';
    if(event.is_enabled){
      action = 'disable';
    }else{
      action = 'enable';
    }
    this._confirmService.confirm('', `Are you sure to ${action} the ${event.name}?`,
    'Yes','No')
      .then((confirmed) =>{
        if(confirmed){
          const programDetails = JSON.parse(this._storageService.get(ProgramConfig[0]));
          const programId = programDetails['program_req_id'];
          const viewParentNodeData = this.getParentViewNode(event);
          this.eventParentNode = { ...viewParentNodeData };
          let selected_member = event.managers;
          let arr = selected_member.map(({ user_id }) => user_id);
          let foundational_data = event.foundational_data;
          let foundational_data_arr = foundational_data.map(({ id }) => id);

          const levelData = event;
          const payload = {
            "parent": this.eventParentNode.id,
            "name": levelData.name,
            "preferred_currency": null,
            "preferred_language": null,
            "is_enabled": levelData.is_enabled ? false : true,
            "foundational_data": foundational_data_arr,
            "managers": arr,
            "addresses": null,
            "contacts": null
          }
          this.subscriptions.push( this._programService.put(`/configurator/programs/${programId}/hierarchy/${event.id}`, payload)
          .subscribe({
            next: (resp:any) => {
              if (resp) {
                this._alertService.success(`hierarchy_level_${action}d_successfully`);
                this.hierarchyList();
              }
            },
            error: (error) => {
              this._alertService.error(errorHandler(error));
            }
        }));
        }
      }
    )
   .catch(() =>
     console.error('User dismissed the dialog')
   );
  }
  //delete hierarchy level
  onDeleteClicked = (event: any) => {
    const programDetails = JSON.parse(this._storageService.get(ProgramConfig[0]));
    const programId = programDetails['program_req_id'];
    this._confirmService.confirm('', `Are you sure to delete the ${event.name}?`,
    'Yes','No')
      .then((confirmed) =>{
        if(confirmed){
          this.subscriptions.push(this._programService.delete(`/configurator/programs/${programId}/hierarchy/${event.id}`)
        .subscribe(
          (resp:any) => {
            if (resp) {
              this._alertService.success(`hierarchy_level_deleted_successfully`);
              this.hierarchyList();
            }
          },
          (error) => {
            this._alertService.error(errorHandler(error));
          }
        ));
      }
     }
    )
   .catch(() =>
     console.error('User dismissed the dialog')
   );
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
