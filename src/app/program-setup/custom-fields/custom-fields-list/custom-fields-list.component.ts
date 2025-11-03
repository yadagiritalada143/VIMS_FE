import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { StorageService } from '../../../core/services/storage.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { ProgramConfig } from '../../../shared/enums';
import { UserService } from './../../../core/services/user.service';
import { DataTransferService } from '../../../core/services/data-transfer.service';
import { Events, EventStreamService } from '../../../core/services/event-stream.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { Subscription } from 'rxjs';
import { CustomFieldsService } from '../custom-fields.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-custom-fields-list',
  templateUrl: './custom-fields-list.component.html',
  styleUrls: ['./custom-fields-list.component.scss'],
})
export class CustomFieldsListComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public vmsData: any;
  public tableConfig: VMSConfig;
  filter: any = {};
  public isExpand = false;
  public totalPages = 12;
  public totalRecords = 10;
  public itemsPerPage: 25;
  public moduleName: string;
  public programId: string;
  public clientId: string;
  isReorderCustomFields = 'hidden';
  dataLoading = false;
  private limit = 9;
  pathname = '';
  isCreateCustomFields = 'hidden';
  public editClicked = false;
  public selectedFieldsId: string;
  public tableLoaded = false;
  eventSubscription: any;
  terms: string;
  actualFilters: any = {};
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  constructor(
    private route: ActivatedRoute,
    public userService: UserService,
    private localStorage: StorageService,
    private _loader: LoaderService,
    private _alert: AlertService,
    public dataTransferService: DataTransferService,
    private accessControlService: AccessControlService,
    private eventStream: EventStreamService,
    private customFieldsService: CustomFieldsService,
  ) {
    this.subscriptions.push(
      this.route.paramMap.subscribe((param:any) => {
        this.pathname = param['create'];
        if (param.get('add')) {
          this.isCreateCustomFields = 'visible';
        }
      }),
    );
  }

  ngAfterViewInit(): void {
    this.subscriptions.push(
      this.eventStream.on(Events.CUSTOM_FIELDS).subscribe((m:any) => {
        this.tableConfig.title = m;
      }),
    );
  }

  ngOnInit(): void {
    let programid = this.localStorage.get(ProgramConfig[0]);
    programid = JSON.parse(programid);
    if (programid) {
      this.clientId = programid['clientId'];
      this.programId = programid['program_req_id'];
    }
    this.tableConfig = {
      title: '',
      columnList: [
        {
          name: 'name',
          title: 'Custom fields name',
          width: 20,
          isIcon: true,
          isImage: true,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'label',
          title: 'Label',
          width: 20,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'type',
          title: 'Field Type',
          width: 15,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'is_required',
          title: 'Required',
          width: 15,
          isIcon: true,
          isShowCheckBox: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          enableClick: false,
        },
        {
          name: 'modified_on',
          title: 'Updated Date',
          width: 17,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'is_enabled',
          title: 'Status',
          width: 13,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNoOption: false,
          isVieworEdit: true,
          isVieworClone: false,
          isDisableorDelete: this.accessControlService.accessControl(),
          isDelete: this.accessControlService.accessControl(),
          isNumberBadge: false,
          isCustomField: true,
        },
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isReorder: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: true,
      density: 'COMFORTABLE',
      advanceFilter: [
        { name: 'name', title: 'Data Type', filterType: 'TEXT' },
        {
          name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
            { name: 'ACTIVE', value: true },
            { name: 'INACTIVE', value: false }
          ]
        },
      ],
      showRecordSelect: true
    };
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((queryParamMap:any) => {
        const tab = queryParamMap.get('currentTab');
        if (tab) {
          this.moduleName = tab;
        }
        if(this.moduleName)
          this.getCustomFieldsList();
      }),
    );
  }
  getCustomFieldsList(pageNo = 1) {
    this.dataLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }
    let qry = '&';
    if (this.filter.hasOwnProperty('sort_key') && this.filter.hasOwnProperty('sort_by')) {
      qry = qry + 'key=' + this.filter.sort_key;
      qry = qry + '&order_by=' + this.filter.sort_by;
    } else {
      qry = qry + 'order_by=asc&key=ref_order';
    }
    if (this.terms) {
      qry = qry + '&name=' + this.terms;
    }
    if (this.isAdvanceSearch) {
      let keys = Object?.keys(this.actualFilters)
      if (keys?.length !== 0) {
        for (let i = 0; i < keys?.length; i++) {
          qry += `&${keys[i]}=${this.actualFilters[keys[i]]}`
        }
      }
    }
    this.subscriptions.push(
      this.userService.getAllCustomFieldsList(this.programId, pageNo, this.limit, this.moduleName,qry=="&"?"":qry).subscribe({next:
        (data:any) => {

          if(Array.isArray(data?.custom_fields)) {
            this.vmsData = data.custom_fields.map((entry: any) => {
              return {
                ...entry, 
                modified_on: ((entry?.modified_on || 0) * 1000)
              }
            });
          }

          this.totalRecords = data.total_records;
          this.itemsPerPage = data.items_per_page;
          this.tableLoaded = true;
          this._loader.hide();
        },error:
        error => {
          this._alert.error(errorHandler(error), {});
          this._loader.hide();
        },complete:
        () => {
          this.dataLoading = false;
          this._loader.hide();
        },
       } ),
    );
  }

  onClickCreateCustomFields(e) {
    this.isCreateCustomFields = 'visible';
  }

  onCloseCreateCustomFields(event) {
    this.isCreateCustomFields = 'hidden';
    this.editClicked = false;
    this.selectedFieldsId = '';
    this.getCustomFieldsList();
  }

  public editCustomFields(event) {
    this.editClicked = true;
    this.selectedFieldsId = event.id;
    this.isCreateCustomFields = 'visible';
  }

  public onReorderCustomFields(){
    //queryParamMap.get('currentTab')
    this.isReorderCustomFields = 'visible';
  }
  onCloseReorderCustomFields(event) {
    this.isReorderCustomFields = 'hidden';
  }

  onSaveReorderCustomFields(event) {
    this.filter.sort_key = "ref_order" ;
    this.filter.sort_by = "asc";
    this.getCustomFieldsList();
    this.isReorderCustomFields = 'hidden';
  }

  public viewCustomField(event) {
    this.editClicked = false;
    this.selectedFieldsId = event.id;
    this.isCreateCustomFields = 'visible';
  }

  private generateCustomFieldPayload(formValue) {
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
  onSearch(term: string) {
    this.terms = term;
    this.getCustomFieldsList();

  }

  onListFilter(event: any) {
    if (event) {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.advanceFilter(1);
    } else {
      this.isAdvanceSearch = false;
      this.advanceFilter(1);
    }
  }

  advanceFilter(page){
    let filter: any = {
      "pagination": {
        "limit": 10,
        "page": (page || 1),
      }
    }

    if (this.filterpayLoad) {
      filter['filters'] = {
        name: this.filterpayLoad['name'],
        is_enabled: this.filterpayLoad['is_enabled']
      }
    }
    this.checkFilters(this.filterpayLoad);
  }

  checkFilters(filtersApplied: any) {
    this.actualFilters = {};
    if(filtersApplied?.hasOwnProperty('is_enabled')){
      if(filtersApplied?.is_enabled){
        this.actualFilters['active'] = '1';
      } else{
        this.actualFilters['active'] = '0';
      }
    }
    if(filtersApplied?.name){
      this.actualFilters['name'] = filtersApplied.name.toString();
    }
    this.getCustomFieldsList();
  }
  

  onSortClick(event) {
    if (event) {
      if (!this.filter) {
        this.filter = {};
      }
      this.filter.sort_key = event?.name;
      this.filter.sort_by = event?.order?.toLowerCase();
      this.getCustomFieldsList();
    }
  }

  public changeCustomFieldStatus(event) {
    this.customFieldsService.getCustomFieldDetails(this.programId, event.id, this.moduleName).subscribe(
      (data:any) => {
        const customField = {
          ...data.custom_field,
          is_enabled: !event.is_enabled,
        };
        const payload = this.generateCustomFieldPayload(customField);
        payload.entity_refs.forEach(x => { x.add = true })
        this.customFieldsService.updateCustomField(this.programId, event.id, payload).subscribe(
          () => {
            this._alert.success(payload.is_enabled ? `Custom Field Enabled Succesfully` : `Custom Field Disabled Succesfully`)
            this.getCustomFieldsList();
          },
          res => {
            if (res?.error?.error?.message) {
              this._alert.error(res.error.error.message);
            }
          },
        );
      },
      res => {
        if (res?.error?.error?.message) {
          this._alert.error(res.error.error.message);
        }
      },
    );
  }

  public onClickRecords(event) {
    this.limit = event;
    this.getCustomFieldsList(1);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  onDeleteClicked(event) {
    this.customFieldsService.getCustomFieldDetails(this.programId, event.id, this.moduleName).subscribe(
      (data:any) => {
        const customField = {
          ...data.custom_field
        };
        const payload = this.generateCustomFieldPayload(customField);
        payload.entity_refs.forEach(x => { x.entity_ref === this.moduleName ? x.add = false : x.add = true; })
        if(payload.meta_data?.linked?.modules?.length > 0){ this._alert.error("Selected Custom field has been linked with other modules. Deletion can be possible only if linked module is removed.") }
        else {
        this.customFieldsService.updateCustomField(this.programId, event.id, payload).subscribe(
          () => {
            this._alert.success(`Custom Field Deleted Succesfully`);
            this.getCustomFieldsList();
          },
          res => {
            if (res?.error?.error?.message) {
              this._alert.error(res.error.error.message);
            }
          },
        );
        }
      },
      res => {
        if (res?.error?.error?.message) {
          this._alert.error(res.error.error.message);
        }
      },
    );
  }
}
