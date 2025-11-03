import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject, Subscription, concatMap, debounceTime, distinctUntilChanged, forkJoin, fromEvent, interval, of, switchMap, takeUntil } from 'rxjs';
import { ProgramSetupService } from 'src/app/program-setup/program-setup.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { DropdownTreeviewSelectI18n } from './dropdown-treeview-select-i18n';
import { TreeviewI18n, TreeviewItem, TreeviewConfig, TreeviewEventParser, DownlineTreeviewEventParser } from 'ngx-treeview';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { CustomFieldsService } from 'src/app/program-setup/custom-fields/custom-fields.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { AllowedCFUserTypes } from 'src/app/user-management/profile-view/program-user-cf.config';
import { TitleCasePipe } from '@angular/common';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

type Query = { term: string, page: number };

@Component({
  selector: 'app-new-custom-field',
  templateUrl: './new-custom-field.component.html',
  styleUrls: ['./new-custom-field.component.scss'],
  providers: [{
    provide: TreeviewI18n,
    useClass: DropdownTreeviewSelectI18n
  },
  {
    provide: TreeviewEventParser,
    useClass: DownlineTreeviewEventParser
  }],
})
export class NewCustomFieldComponent implements OnInit {

  selectedDate : any;
  public roles:any=[];
  public isEditMode = false;
  public customFieldId : any;
  public customField_Obj : any = {metaData : {depends_on : {conditions : []}}, meta_data : {}};
  public linkedModuleList = [];
  public moduleList = [];
  public vendors = [];
  public fieldTypeList = [];
  public customFieldListByModule = [];
  public canEditList = [];
  public hierarchy = [];
  public hierarchyListTags = [];
  public checkboxAction: boolean = null;
  public hierarchyMap: Map <string, string> = new Map <string, string> ();
  public treeViewGeneric: Array <any> = [];
  public treeViewItems: Array <TreeviewItem> = [];
  public vendorVisibility : boolean = false;
  public vendorVisibilityType : any;
  public moduleVendorVisibility : any;
  public viewVendorCount : number = 0;
  public editVendorCount : number = 0;
  public showReadOnly : boolean = true;
  public showLinkedReadOnly : boolean = true;
  public numberPattern: RegExp = /[0-9.]+/;
  public emailPattern: RegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  public alphaNumericPattern: RegExp = /^[a-zA-Z0-9]+$/;
  public timePattern: RegExp = /^([01]\d|2[0-3]):([0-5]\d)$/;
  public timeTypePattern: RegExp = /^[0-9]{0,2}[:]{0,1}[0-9]{0,2}$/;
  public timeErrorText: string = `Invalid time format! Required: 00:00-23:59`
  public amountAccuracy: number = 6;
  public sourceLOV = [{id : 'USER',name : 'Users'}];
  public userType = [{id : 'ALL',name : 'ALL'}, {id : 'BY ORGANIZATION',name : 'By Org'}, {id : 'BY USER ROLE',name : 'By User Role'}];
  public userCategory = [{id : 'SIMPLIFYVMS',name : 'SimplifyVMS'}, {id : 'CLIENT',name : 'CLIENT'}, {id : 'MSP',name : 'MSP'}];
  public userRoles : any = [];
  public candidateValidations: boolean = true;

  entityCode : any = '';
  initiallySelectedLinkedData
  selectedResultingFields

  public loadingLinkedData: boolean = false;
  public currencyData$: Observable<any>;
  public allDefaultRoles : any = [];
  public hideHierarchyInModules = ["WORK_LOCATIONS", "PROGRAM_USERS", "CANDIDATES", "MASTER_DATA_TYPE", "VENDORS", "PROGRAM_DETAILS", "HIERARCHY"]
  public hideLinkedPartInModules = ["WORK_LOCATIONS", "HIERARCHY", "MASTER_DATA_TYPE", "VENDORS"]
  public hidePlaceholder = ["DROPDOWN", "RADIO", "CHECKBOX"]

  public jobTypesLoaded: boolean = false;
  public hierarchyConfig: any = TreeviewConfig.create({
    hasAllCheckBox: false,
    hasFilter: false,
    hasCollapseExpand: true,
    decoupleChildFromParent: false,
    maxHeight: 240,
  });

  programDetails: any = {};
  public titleToggle = {
    title: 'active',
    value: true
  };

  public required = {
    value: false
  };

  public readonly = {
    value: false
  };

  public data_subject_right = {
    value: false
  };

  public linked = {
    value: false
  };

  public linkModule = {
    value: true
  }

  public range = {
    value: true
  };

  private subscriptions: Array <Subscription> = [];
  private picklistSub: Subject <any> = new Subject <any> ();
  public picklistLoading: boolean = false;
  public prevPicklistConfig: any = null;
  public picklistCount: number = 0;
  public predefinedPicklists: Array <any> = [];

  public mdtList: Array <any> = [];
  public mdtSelected: string = null;
  public mdtLoading: boolean = true;
  public mdtPrevQuery: Query = null;
  public mdtTotalRecords: number = Number.POSITIVE_INFINITY;
  public mdtSubject: Subject <Query> = new Subject <Query> ();

  constructor (
    private Router : SvmsRouterService,
    private _alert: AlertService,
    private route: ActivatedRoute,
    private progServ: ProgramSetupService,
    private storeServ: StorageService,
    private customFieldsService: CustomFieldsService,
    private sortHelper: SortHelperPipe,
    private uniquePipe: UniqueKeyPipe,
    private localDateFormat: LocalDateFormatPipe,
    private titleCase: TitleCasePipe,
    private loader: LoaderService
  ) {
    this.programDetails = this.storeServ.get(StorageKeys.CURRENT_PROGRAM);
  }

  // Job Types
  public jobTypesLoading: boolean = true;
  public selectedJobTypes: Array <string> = [];
  public jobTypesList: Array <{ name: string, id: string }> = [];

  public dateFormat;
  public org_category: Array <string> = [];
  public orgCategories: Array<any> = AllowedCFUserTypes.map((key: any) => {
    return {
      name: (key === 'MSP') ? key : this.titleCase.transform(key),
      value: key
    };
  });

  ngOnInit(): void {

    this.loadModules();
    this.getRoles();
    this.getAllVendorsData();

    // Job Types
    this.getJobTypesPicklist();

    this.getCurrencyData();

    let currentProgram = this.storeServ.get(StorageKeys.CURRENT_PROGRAM);
    if(currentProgram) {
      let custom_field: any = currentProgram?.config?.custom_field;
      if(custom_field) {
        this.candidateValidations = !(custom_field.candidate_hierarchy || false);
      }
    }

    this.customFieldId = this.route.snapshot.params['id'];
    if (this.customFieldId) {
      this.entityCode = this.route.snapshot.queryParamMap.get('entity_ref')
      this.isEditMode = true
      this.setValuesFromDetails();
    }

    this.loadHierarchies();
    this.loadFieldTypes();
    this.amountAccuracy = this.storeServ.get(StorageKeys.ACCURACY_CONFIG)?.amount?.scale ?? 6;
    this.dateFormat = this.programDetails?.defaultDateFormat;
    this.initializeMDTListingSub();
  }

  backButtonClicked() {
    this.Router.navigate(['data-management', 'custom-field', 'list']);
  }

  fetchMorePicklists() {
    if(this.picklistCount > this.predefinedPicklists.length) {
      this.picklistSub.next({
        ...this.prevPicklistConfig,
        page: ((this.prevPicklistConfig.page + 1) || 1)
      });
    }
  }

  onClickToggle() {
    if (this.titleToggle.value) {
      this.titleToggle.value = false;
      this.titleToggle.title = 'inactive';
    } else {
      this.titleToggle.value = true;
      this.titleToggle.title = 'active';
    }
  }

  getPredefinedPicklistObservable(term: string = '', page: number = 1) {

    let programId: string = this.storeServ.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/pick-lists?limit=100&page=${page}&active=true`;

    if(term) {
      url += `&picklist_name=${term}`;
    }

    return this.progServ.get(url);
  }

  onUserType(event) {
    if(event.id == "BY ORGANIZATION") {
      this.customField_Obj.user_role = null;
    } else if(event.id == "BY USER ROLE") {
      this.getUserRoles()
      this.customField_Obj.user_category = null;
    } else {
      this.customField_Obj.user_category = null;
      this.customField_Obj.user_role = null;
    }
  }

  getPickLists() {
    this.subscriptions.push(
      this.picklistSub.pipe(
        debounceTime(600),
        distinctUntilChanged((prev: any, next: any) => {
          return (prev?.term === next?.term) && (prev?.page === next?.page);
        }), concatMap((query: any) => {

          if(!query)
            return of(null);

          this.picklistLoading = true;
          this.prevPicklistConfig = query;

          const {term, page} = query;
          return forkJoin([this.getPredefinedPicklistObservable(term, page), of(page)]);
        })
      ).subscribe({
        next: (res: any) => {
          if (Array.isArray(res) && res.length) {

            this.picklistLoading = false;
            this.picklistCount = (res[0]?.total_records || 0);

            let result: Array <any> = res[0]?.pick_lists?.map((entry: any) => {
              return {
                id: entry?.id ?? '',
                name: entry?.name ?? ''
              }
            });

            const page: number = res[1];
            if(page === 1) {
              this.predefinedPicklists = result;
            } else {
              this.predefinedPicklists = this.uniquePipe.transform([...result, ...this.predefinedPicklists], 'id');
            }

            this.predefinedPicklists = this.sortHelper.transform(this.predefinedPicklists, 'name');
          }
        },
        error: (err: any) => {
          this.picklistLoading = false;
          this._alert.error(errorHandler(err));
        }
      })
    );

    if(this.customField_Obj.selectedFieldType == 'PICKLIST') {
      this.picklistSub.next({term: '', page: 1});
    }
  }

  private setValuesFromDetails() {
    let currentProgram = this.storeServ.get(StorageKeys.CURRENT_PROGRAM);
    this.subscriptions.push(
      this.customFieldsService.getCustomFieldDetails(currentProgram?.id, this.customFieldId, this.entityCode ? this.entityCode : null).subscribe((data:any) => {
        const customField = { ...data.custom_field };
        this.updateJobType(customField?.job_type);
        this.customField_Obj.hierarchy = customField.hierarchies ?? []
        this.customField_Obj.customFieldName = customField.name || null;
        this.titleToggle.value = customField.is_enabled ? customField.is_enabled : false;
        this.customField_Obj.customFieldPlaceholder = customField.placeholder || null;
        this.customField_Obj.customFieldDescription = customField.description || null;
        this.customField_Obj.selectedFieldType = customField.type || null;
        this.customField_Obj.customFieldLabel = customField.label || null;
        this.customField_Obj.customFieldSupportingText = customField.supporting_text || null;
        this.required.value = customField.is_required ? customField.is_required : false;
        this.readonly.value = customField.is_readonly ? customField.is_readonly : false;
        this.org_category = customField?.org_category?.map(x => x?.organization_category)
        this.data_subject_right.value = customField.data_subject_right ? customField.data_subject_right : false;
        this.linked.value = customField?.meta_data?.linked?.modules?.filter(x => x).length > 0 ? true : false;
        this.customField_Obj.metaData = []
        this.customField_Obj.metaData = customField?.meta_data
        customField?.meta_data?.depends_on?.conditions.forEach(x => {
          this.customField_Obj.metaData.datasource.options.filter(y => y.value == x.condition.value)[0].dependent = true
        })
        this.customField_Obj.default_value = customField.meta_data?.default_value
        if(this.customField_Obj.selectedFieldType == 'CURRENCY') {
          this.customField_Obj.currency = customField.meta_data?.currency ? customField.meta_data?.currency : null
        } else if(this.customField_Obj.selectedFieldType == 'HYPERLINK') {
          this.customField_Obj.hyperlink = customField.meta_data?.url ? customField.meta_data?.url : null
        } else if(this.customField_Obj.selectedFieldType == 'NUMBERS') {
          this.customField_Obj.decimal = customField.meta_data?.decimal;
          this.customField_Obj.show_in_thousands = customField.meta_data?.show_in_thousands ? customField.meta_data?.show_in_thousands : false;
          this.customField_Obj.range_applicable = customField.meta_data?.range_applicable ? customField.meta_data?.range_applicable : false;
          this.customField_Obj.range_min = customField.meta_data?.range?.range_min;
          this.customField_Obj.range_max = customField.meta_data?.range?.range_max;
        } else if(this.customField_Obj.selectedFieldType == 'PICKLIST') {
          this.getPickLists();
          this.customField_Obj.picklist = customField.pick_list ? customField?.pick_list?.id : null
        } else if(this.customField_Obj.selectedFieldType == 'SOURCE') {
          if(customField.user_type == 'BY USER ROLE') {
            this.getUserRoles()
          }
          this.customField_Obj.hyperlink = customField.meta_data?.url ? customField.meta_data?.url : null
          this.customField_Obj.source_lov = customField.source_lov ? customField.source_lov : null
          this.customField_Obj.user_type = customField.user_type ? customField.user_type : null
          this.customField_Obj.user_category = customField.user_category ? customField.user_category : null
          this.customField_Obj.user_role = customField?.user_role ? customField?.user_role?.id : null
        }
        let linkedModuleData = []
        linkedModuleData = customField.meta_data?.linked ? customField.meta_data?.linked?.modules : []
        let modules = customField.entity_refs.filter(val => !linkedModuleData.includes(val.entity_ref));
        let linkedData = []
        if(modules.length == 1) {
          this.customField_Obj.moduleType = modules[0]?.entity_ref
          linkedData = customField.entity_refs.filter(val => linkedModuleData.includes(val.entity_ref));
          this.initiallySelectedLinkedData = linkedData
          setTimeout(() => {
            this.getAllVendorsData()
            this.getCustomFieldListByModules(this.customField_Obj.moduleType,linkedData);
          },500);
          this.linked.value = linkedData?.length > 0 ? true : false;
        }
        this.customField_Obj.customFieldCanView = modules[0].can_view.map(x => x.organization_category)
        this.customField_Obj.customFieldCanEdit = modules[0].can_edit.map(x => x.organization_category)

        if(modules[0].can_view.map(x => x.organization_category).includes('VENDOR')) {
          this.customField_Obj.can_view_vendors_ids = modules[0]?.can_view?.filter(x => x.organization_category == 'VENDOR')?.map(y => y?.organizations)[0]?.map(z => z?.id)
        }

        if(modules[0].can_edit.map(x => x.organization_category).includes('VENDOR')) {
          this.customField_Obj.can_edit_vendors_ids = modules[0]?.can_edit?.filter(x => x.organization_category == 'VENDOR')?.map(y => y?.organizations)[0]?.map(z => z?.id)
        }

        if(customField.type == "DATE") {
          this.customField_Obj.default_value = customField?.meta_data?.default_value ? this.localDateFormat.transform(customField?.meta_data?.default_value.trim(), this.dateFormat ,null ,null , true, DATE_FORMAT.FORMATMDY) : null
        }
        if(customField.type == "DATETIME") {
          this.customField_Obj.default_value_2 =customField?.meta_data?.default_value.length > 12 ? customField?.meta_data?.default_value?.substring(11,18) : null
          this.customField_Obj.default_value = customField?.meta_data?.default_value.length > 9 ? this.localDateFormat.transform(customField?.meta_data?.default_value?.trim(), this.dateFormat ,null ,null , true, DATE_FORMAT.FORMATMDY) : null
        }

        if(this.isMasterDataTypeSelected) {
            this.initializeMDTLock(customField?.master_data_type || []);
        }
      }),
    );
  }

  getUserRoles(term: string = '') {

    let programId: string = this.storeServ.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/roles?status=true&users_count_more_one=true`;

    if(term) {
      url += `&k=${term}`;
    }

    this.progServ.get(url).subscribe((data: any) => {
      this.userRoles = data?.roles
    }, err => {

    })
  }

  timeFieldAction = (event: KeyboardEvent | Event | any): void => {

    // Helpers
    const key: any = event?.key;
    const target: EventTarget | any = event?.target;
    const caretPosition: number = target?.selectionStart;

    // Validations
    const isCorrectPosition: boolean = (caretPosition === 2);
    const isKeyStroke: boolean = (key?.length === 1);
    const includesColon: boolean = ((target?.value ?? "")?.includes(':'))

    if(isCorrectPosition && isKeyStroke && !includesColon) {
      target.value += ':';
    }

    return event;
  }

  getCheckedLength(obj) {
    return obj?.filter(ob => ob?.checked)?.length
  }

  isValidFile(evt: any) { }

  uploadFile(evt: any) {
    this.customField_Obj.default_value = evt;
  }

  private getRoles() {
    this.customFieldsService.getConfiguratorUserRoles(this.programDetails?.id).subscribe((res: any) => {
      this.allDefaultRoles = res.user_roles;
      if(this.isEditMode && this.customField_Obj?.moduleType && this.customField_Obj.customFieldCanView?.length > 0) {
        this.canEditList = this.allDefaultRoles.filter(mod => mod.module_code == this.customField_Obj?.moduleType && mod.can_edit && this.customField_Obj.customFieldCanView.includes(mod.user_category)).map(x => x.user_category)
      }
    });
  }

  onFieldTypeChange(fieldType) {
    this.customField_Obj.default_value = null
    if(fieldType) {
      // Custom configurations for different custom fields
      this.showReadOnly = true;
      this.showLinkedReadOnly = true;
      switch(fieldType) {
        case 'HYPERLINK':
          this.showReadOnly = false;
          this.showLinkedReadOnly = false;
          this.customField_Obj.hyperlink = this.customField_Obj?.hyperlink || "";
        break;

        case 'PICKLIST':
          this.getPickLists()
        break;

        case 'TOGGLE':
          this.changeDefaultToggle(false);
        break;
      }
    }
  }

  dateChanged(event) {
    if(event) {
      this.customField_Obj.default_value = this.localDateFormat.transform(event, this.dateFormat ,null ,null , true,)
      this.customField_Obj.meta_data.default_value = this.localDateFormat.transform(event, this.dateFormat ,null ,null , true,)
    }
  }

  changeDefaultToggle(event) {
    this.customField_Obj.default_value = event
  }

  viewRolesChange(event) {
    this.canEditList = this.allDefaultRoles.filter(mod => mod.module_code == this.customField_Obj?.moduleType && mod.can_edit && this.customField_Obj.customFieldCanView.includes(mod.user_category)).map(x => x.user_category)
    this.customField_Obj.customFieldCanEdit = this.customField_Obj?.customFieldCanEdit?.filter((x) => {
      return this.customField_Obj?.customFieldCanView?.includes(x);
    });
  }

  viewModuleRolesChange(index) {
    this.linkedModuleList[index].canEditList = this.allDefaultRoles.filter(mod => mod.module_code == this.linkedModuleList[index].code && mod.can_edit && this.linkedModuleList[index].customFieldCanView.includes(mod.user_category)).map(x => x.user_category)
    this.linkedModuleList[index].customFieldCanEdit = this.linkedModuleList[index]?.customFieldCanEdit?.filter((x) => {
      return this.linkedModuleList[index]?.customFieldCanView?.includes(x);
    });
  }

  editRolesChange(event) {
    if(event.includes('VENDOR')) {
      this.customField_Obj.can_edit_vendors = this.customField_Obj.can_view_vendors.filter(x => x.checked)
     // this.customField_Obj.can_edit_vendors_ids = this.customField_Obj.can_view_vendors.filter(x => x.checked).map(cv => cv.vendor.id)
    }
  }

  editModuleRolesChange(event,index) {
    if(event.includes('VENDOR')) {
      this.linkedModuleList[index].can_edit_vendors = this.linkedModuleList[index].can_view_vendors.filter(x => x.checked)
      // this.linkedModuleList[index].can_edit_vendors_ids = this.linkedModuleList[index].can_view_vendors.filter(x => x.checked).map(cv => cv.vendor.id)
    }
  }

  openVendorVisibility(type) {
    this.vendorVisibilityType = type
    if(this.vendorVisibilityType == 'can_view') {
      this.customField_Obj.can_view_vendors = this.customField_Obj?.can_view_vendors.map(x => ({
        ...x,
        checked: !this.customField_Obj?.can_view_vendors_ids?.length ? false : this.customField_Obj?.can_view_vendors_ids?.includes(x.vendor.id)
      }));
    } else if (this.vendorVisibilityType == 'can_edit') {
      this.customField_Obj.can_edit_vendors = this.customField_Obj?.can_edit_vendors.map(x => ({
        ...x,
        checked: !this.customField_Obj?.can_edit_vendors_ids?.length ? false : this.customField_Obj?.can_edit_vendors_ids?.includes(x.vendor.id)
      }));
    }
    this.vendorVisibility = true
  }

  openModuleVendorVisibility(type, index) {
    this.linkedModuleList[index].vendorVisibilityType = type
    if(this.linkedModuleList[index].vendorVisibilityType == 'can_view') {
      this.linkedModuleList[index].can_view_vendors = this.linkedModuleList[index]?.can_view_vendors.map(x => ({
        ...x,
        checked: !this.linkedModuleList[index]?.can_view_vendors_ids?.length ? false : this.linkedModuleList[index]?.can_view_vendors_ids?.includes(x.vendor.id)
      }));
    } else if (this.linkedModuleList[index].vendorVisibilityType == 'can_edit') {
      this.linkedModuleList[index].can_edit_vendors = this.linkedModuleList[index]?.can_edit_vendors.map(x => ({
        ...x,
        checked: !this.linkedModuleList[index]?.can_edit_vendors_ids?.length ? false : this.linkedModuleList[index]?.can_edit_vendors_ids?.includes(x.vendor.id)
      }));
    }
    this.linkedModuleList[index].moduleVendorVisibility = true
  }

  hideVendorModel(event) {
    if(event) {
      this.vendorVisibility = false
    }
  }

  moduleHideVendorModel(event, index) {
    if(event) {
      this.linkedModuleList[index].moduleVendorVisibility = false
    }
  }

  canViewChanged(event) {
    this.customField_Obj.can_view_vendors_ids = !event.selectedVendor.filter(x => x.checked).map(v => v.vendor.id).length ? [] : event.selectedVendor.filter(x => x.checked).map(v => v.vendor.id)
    if(!this.customField_Obj.can_view_vendors_ids.length){
      this.customField_Obj.can_edit_vendors_ids = []
    }
    if(this.customField_Obj.can_edit_vendors_ids?.length) {
      this.customField_Obj.can_edit_vendors_ids = this.customField_Obj.can_view_vendors_ids.filter(f =>this.customField_Obj.can_edit_vendors_ids.includes(f))
    }
    this.customField_Obj.can_edit_vendors = this.customField_Obj.can_view_vendors.filter(x => this.customField_Obj.can_view_vendors_ids.includes(x.vendor.id))
    this.customField_Obj.can_edit_vendors = this.customField_Obj?.can_edit_vendors.map(x => ({
      ...x,
      checked: false
    }));
    // this.customField_Obj.can_edit_vendors_ids = this.customField_Obj.can_edit_vendors.map(ef => ef.vendor.id)
  }

  canEditChanged(event) {
    this.customField_Obj.can_edit_vendors_ids = !event.selectedVendor.filter(x => x.checked).map(v => v.vendor.id).length ? [] : event.selectedVendor.filter(x => x.checked).map(v => v.vendor.id)
  }

  moduleCanViewChanged(event, index) {
    this.linkedModuleList[index].can_view_vendors_ids = !event.selectedVendor.filter(x => x.checked).map(v => v.vendor.id).length ? [] : event.selectedVendor.filter(x => x.checked).map(v => v.vendor.id)
    if(!this.linkedModuleList[index].can_view_vendors_ids.length){
      this.linkedModuleList[index].can_edit_vendors_ids = []
    }
    if(this.linkedModuleList[index].can_edit_vendors_ids?.length) {
      this.linkedModuleList[index].can_edit_vendors_ids = this.linkedModuleList[index].can_view_vendors_ids.filter(f =>this.linkedModuleList[index].can_edit_vendors_ids.includes(f))
    }
    this.linkedModuleList[index].can_edit_vendors = this.linkedModuleList[index].can_view_vendors.filter(x => this.linkedModuleList[index].can_view_vendors_ids.includes(x.vendor.id))
    // this.linkedModuleList[index].can_edit_vendors_ids = this.linkedModuleList[index].can_edit_vendors.map(ef => ef.vendor.id)
  }

  moduleCanEditChanged(event, index) {
    this.linkedModuleList[index].can_edit_vendors_ids = !event.selectedVendor.filter(x => x.checked).map(v => v.vendor.id).length ? [] : event.selectedVendor.filter(x => x.checked).map(v => v.vendor.id)
  }

  getAllVendorsData(): Promise<any[]> {
    return this.getDataFromAPI(`/configurator/programs/${this.programDetails?.id}/vendors?active=true`,1, 50).then((response: any) => {
      const totalCount = response.total_records;
      const numAdditionalCalls = Math.ceil(totalCount / 50) - 1;
      this.vendors = []
      this.vendors = [...response.program_vendors];
      // Make additional API calls to get remaining data
      const promises = [];
      for (let page = 2; page <= numAdditionalCalls + 1; page++) {
        promises.push(this.getDataFromAPI(`/configurator/programs/${this.programDetails?.id}/vendors?active=true`,page, 50).then((res: any) => res.program_vendors));
      }
      return Promise.all(promises).then((programUsersArrays: any[]) => {
        programUsersArrays.forEach((usersArray: any[]) => {
          this.vendors.push(...usersArray);
        });

        this.customField_Obj.can_view_vendors = this.vendors;
        if(!this.isEditMode) {
          // this.vendors.forEach(x => { x.checked = true })
          // this.customField_Obj.can_view_vendors?.forEach(x => { x.checked = true })
          //this.customField_Obj.can_view_vendors_ids = this.customField_Obj?.can_view_vendors?.map(x => x.vendor.id)
        } else {
          this.loadingLinkedData = true
         // this.customField_Obj.can_view_vendors_ids = this.customField_Obj?.can_view_vendors_ids?.length > 0 ? this.customField_Obj?.can_view_vendors_ids : this.customField_Obj?.can_view_vendors?.map(x => x.vendor.id)
          this.customField_Obj.can_edit_vendors = this.customField_Obj?.can_view_vendors?.filter(x => this.customField_Obj?.can_view_vendors_ids?.includes(x?.vendor?.id))
         // this.customField_Obj.can_edit_vendors_ids = this.customField_Obj?.can_edit_vendors_ids?.length > 0 ? this.customField_Obj?.can_edit_vendors_ids : this.customField_Obj?.can_view_vendors_ids
          this.linkedModuleList?.forEach(lm => {
            let currentLoopData = this.initiallySelectedLinkedData?.filter(x => x.entity_ref == lm?.code)[0]
            if(currentLoopData) {
              lm.linkModule = currentLoopData ? currentLoopData : false;
              lm.readOnly = currentLoopData ? currentLoopData?.is_readonly : false;
              // lm.roles = this.roles
              lm.customFieldCanView = currentLoopData.can_view.map(x => x.organization_category)
              lm.canEditList = this.allDefaultRoles.filter(mod => mod.module_code == lm.code && mod.can_edit && currentLoopData.can_view.map(x => x.organization_category).includes(mod.user_category)).map(cat => cat.user_category)
              lm.customFieldCanEdit = currentLoopData.can_edit.map(x => x.organization_category)
              if(currentLoopData.can_view.map(x => x.organization_category).includes('VENDOR')) {
                lm.can_view_vendors = this.vendors
                lm.can_view_vendors_ids = currentLoopData?.can_view?.filter(x => x.organization_category == 'VENDOR')?.map(y => y?.organizations)[0]?.map(z => z?.id)
                lm.can_edit_vendors = lm.can_view_vendors.filter(x => lm.can_view_vendors_ids.includes(x.vendor.id))
                lm.can_edit_vendors_ids = currentLoopData?.can_edit?.filter(x => x.organization_category == 'VENDOR')?.map(y => y?.organizations)[0]?.map(z => z?.id)
              } else {
                lm.can_view_vendors = this.vendors;
                // lm.can_view_vendors.forEach(x => {x.checked = true})
                // lm.can_view_vendors_ids = this.vendors.map(x => x.vendor.id);
              }
            }
          })
          this.loadingLinkedData = false
        }


        const jsArray = JSON.parse(JSON.stringify(this.vendors));

        this.vendors = jsArray.reduce((acc, obj) => {
          const found = acc.some(item => item.id === obj.id);
          if (!found) {
            acc.push(obj);
          }
          return acc;
        }, []);
        return this.vendors;
      });
    });
  }

  private getDataFromAPI(url:any,page: number, limit: number): Promise<any> {
    let apiUrl = url+`&page=${page}&limit=${limit}`
    return this.progServ.get(apiUrl).toPromise();
  }

  // Render hierarchy dropdown as tree view.
  treeViewParser(node, list: Array <any>) {
    if(node) {
      const value = node.id;
      const text = node.name;
      let checked = false;
      list.push(value);
      let children = node.hierarchies?.map(element => {
        return this.treeViewParser(element, list);
      });
      this.hierarchyMap.set(value, text);
      return { value, text, children, checked };
    }
  }

  // Function for directory to tell weather check / uncheck hierarchy base on querySelector tag
  initCheckListeners(preOrderList) {
    const treeRef = document.querySelector('ngx-treeview');
    const boxRefs = treeRef.querySelectorAll('input[type="checkbox"]');
    boxRefs.forEach((checkbox, it)=> {
      checkbox.id = preOrderList[it];
      this.subscriptions.push(
        fromEvent(checkbox, 'click').subscribe((res: any) => {
          const action = res.target.checked;
          this.checkboxAction = action;
        })
      )
    });
  }

  // Get auto populated hierarchy while edit or view mode
  selectEditItems() {
    // entry selection
    this.hierarchyListTags = [];
    if(this.customField_Obj.hierarchy) {
      let list: Array <string> = this.customField_Obj.hierarchy.map(x => x.id);;
      list?.forEach(element => {
        const ref: any = document?.getElementById(`${element}`);
        ref?.click();
      });
    }
  }

  // To remove selected hierarchy from tails tag
  removeSelectedHierarchy(id: string) {
    // Checkbox removal
    let ref: any = document.getElementById(id);
    if(ref)
      ref.click();
    // Tag removal
    this.hierarchyListTags = this.hierarchyListTags.filter(node => node.id !== id);
    this.treeViewItems.forEach((node: TreeviewItem) => {
      node.correctChecked();
    });
    this.customField_Obj.hierarchy = this.hierarchyListTags;
    return;
  }

  // As per API responce get depth of child hierarchy data
  public getparent(p) {
    if (p.parent) {
      this.getparent(p.parent)
    }
    if (p.item.internalChecked && !p.item.internalChildren.filter(f => f.internalChecked == false).length) {
      this.hierarchy.push(p.item.value)
    }
  }

  // created common array formate to ittrate a loop on all(Perent/child) hierarchy.
  public buildarray(hie) {
    for (var i = 0; i < hie.length; i++) {
      if (hie[i].parent) {
        this.getparent(hie[i].parent)
      }
      if (hie[i].item.internalChecked) {
        this.hierarchy.push(hie[i].item.value)
      }
    }
  }

  // Map hierarchy Ids and push selected ids in hierarchyListTags.
  observeSelectedChange(selectionNodes: Array <string>) {
    this.hierarchy = []
    this.buildarray(selectionNodes)
    this.hierarchy =  [... new Set(this.hierarchy)];
    selectionNodes = this.hierarchy;
    this.hierarchyListTags = [];
    selectionNodes.forEach((node: string) => {
      this.hierarchyListTags.push({
        id: node,
        name: this.hierarchyMap.get(node)
      });
    });
    return;
  }

  // Get program hierarchy list
  loadHierarchies() {
    this.progServ.get(`/configurator/programs/${this.programDetails?.id}/hierarchy?active=true`).subscribe((data:any) => {
      if (data) {
        data.result.forEach(element => {
          let preOrderList = [];
          this.treeViewItems = [];
          this.treeViewGeneric = [];
          if(data.result && data.result.length && data.result[0].hierarchies) {
            data.result[0].hierarchies.forEach(node => {
              this.treeViewGeneric.push(this.treeViewParser(node, preOrderList));
            });
            this.treeViewItems = [];
            this.treeViewItems = this.treeViewGeneric.map(node => new TreeviewItem(node));
          }
          setTimeout(()=> {
            // Initialize listeners
            this.initCheckListeners(preOrderList);
            if(this.isEditMode) {
              this.selectEditItems();
            }
          }, 800);
        });
      }
    })
  }

  private getCurrencyData() {
    this.currencyData$ = this.customFieldsService.getCurrencyData(this.programDetails.id);
  }

  loadModules() {
    this.progServ.get(`/configurator/programs/${this.programDetails.id}/module-groups?module_customfield=true`).subscribe((data:any) => {
      if (data) {
        this.linkedModuleList = []
        data.module_groups.forEach(x => {
          x.modules.forEach(innerModules => {
            this.moduleList.push(innerModules)
          })
        })
      }
    })
  }

  loadFieldTypes() {
    this.progServ.get('/configurator/resources/custom-fields').subscribe((data:any) => {
      if (data) {
        this.fieldTypeList = data.custom_fields
      }
    })
  }

  getCustomFieldListByModules(moduleCode, selectedLinkedData?): Promise<any[]> {

    this.selectedJobTypes = [];

    setTimeout(() => {
      if(this.isMasterDataTypeSelected) {
        this.mdtSubject.next({ page: 1, term: '' });
      }
    }, 0);

    return this.getDataFromAPI(`/configurator/programs/${this.programDetails?.id}/custom-fields?order_by=asc&key=ref_order&active=1&entity_ref=${moduleCode}`,1, 20).then((response: any) => {
      const totalCount = response.total_records;
      const numAdditionalCalls = Math.ceil(totalCount / 20) - 1;
      this.customFieldListByModule = []
      this.customFieldListByModule = [...response.custom_fields].filter((entry: any) => entry?.id !== this.customFieldId);
      // Make additional API calls to get remaining data
      const promises = [];
      for (let page = 2; page <= numAdditionalCalls + 1; page++) {
        promises.push(this.getDataFromAPI(`/configurator/programs/${this.programDetails?.id}/custom-fields?order_by=asc&key=ref_order&active=1&entity_ref=${moduleCode}`,page, 20).then((res: any) => res.custom_fields));
      }
      return Promise.all(promises).then((customField: any[]) => {
        customField.forEach((cf: any[]) => {
          this.customFieldListByModule.push(...cf);
        });

        if(this.isEditMode && this.customField_Obj.metaData?.depends_on) {
          this.customField_Obj.metaData.datasource.options.forEach(x => {x.selectedResultingFields = []})
          this.customField_Obj.metaData?.depends_on.conditions.forEach(df => {
            let custom_field = this.customFieldListByModule.filter(x => x.slug == df.slug)[0] || df
            this.customField_Obj.metaData.datasource.options.filter(cf => cf.value == df?.condition?.value)[0].selectedResultingFields.push(custom_field)
          })
        }

        this.linkedModuleList = []
        if(moduleCode != 'HIERARCHY' && moduleCode != 'WORK_LOCATIONS') {
          this.linkedModuleList = this.moduleList?.filter(x => x.code == moduleCode)[0]?.linked_modules
        }
        if(!this.isEditMode) {
          this.customFieldListByModule.forEach(cf => {
            cf.checked = false;
          })
          this.customField_Obj.customFieldCanView = null
          this.canEditList = []
          this.customField_Obj.customFieldCanEdit = null

         this.linked.value = false;

          // Default values for Linked Modules
          this.linkedModuleList?.forEach(lm => {
            lm.linkModule = false
            lm.readOnly = false
            lm.customFieldCanView = null
            lm.customFieldCanEdit = null
            lm.canEditList = []
            lm.can_view_vendors = this.vendors;
            lm.can_view_vendors.forEach(x => { x.checked = true })
            // lm.can_view_vendors_ids = lm.can_view_vendors.map(x => x.vendor.id)
          })

        } else if(this.isEditMode && selectedLinkedData?.length > 0) {
          this.linkedModuleList = this.moduleList?.filter(x => x.code == moduleCode)[0]?.linked_modules;
          this.linkedModuleList?.forEach(x => {
            if(selectedLinkedData?.map(linked => linked?.entity_ref)?.includes(x.code)) {
              x.readOnly = selectedLinkedData?.filter(linked => linked?.entity_ref == x.code)[0]?.is_readonly
            }
          })
          this.linkedModuleList?.forEach(lm => {
            let currentLoopData = this.initiallySelectedLinkedData?.filter(x => x.entity_ref == lm?.code)[0]
            if(currentLoopData) {
              lm.linkModule = currentLoopData ? currentLoopData : false;
              lm.readOnly = currentLoopData ? currentLoopData?.is_readonly : false;
              // lm.roles = this.roles
              lm.customFieldCanView = currentLoopData.can_view.map(x => x.organization_category)
              lm.canEditList = this.allDefaultRoles.filter(mod => mod.module_code == lm.code && mod.can_edit && currentLoopData.can_view.map(x => x.organization_category).includes(mod.user_category)).map(cat => cat.user_category)
              lm.customFieldCanEdit = currentLoopData.can_edit.map(x => x.organization_category)
              if(currentLoopData.can_view.map(x => x.organization_category).includes('VENDOR')) {
                lm.can_view_vendors = this.vendors
                lm.can_view_vendors_ids = currentLoopData?.can_view?.filter(x => x.organization_category == 'VENDOR')?.map(y => y?.organizations)[0]?.map(z => z?.id)
                lm.can_edit_vendors = lm.can_view_vendors.filter(x => lm.can_view_vendors_ids.includes(x.vendor.id))
                lm.can_edit_vendors_ids = currentLoopData?.can_edit?.filter(x => x.organization_category == 'VENDOR')?.map(y => y?.organizations)[0]?.map(z => z?.id)
              } else {
                lm.can_view_vendors = this.vendors;
              }
            }
          })
        }

        this.roles = this.allDefaultRoles.filter(mod => mod.module_code == moduleCode && mod.can_view).map(role => role.user_category)
        this.linkedModuleList?.forEach(x => {

          let result: Array <any> = this.allDefaultRoles.filter(mod => mod.module_code == x.code && mod.can_view).map(role => role.user_category);
          if(Array.isArray(result)) {
            result = result.map((y: any) => (y || '').toUpperCase());
            result = this.uniquePipe.transform([...result]);
          }

          x.roles = result;
        })

        return this.customFieldListByModule;
      });
    });
  }

  changeMultiselect(event) {

  }

  public allSelectedResultingFields: Array <string> = [];
  changeOptions(event: any) {
    if(Array.isArray(event)) {
      this.allSelectedResultingFields = event.reduce((acc: Array <string>, option: any) => {
        let result: Array <string> = (option?.selectedResultingFields || []).map((entry: any) => {
          return entry?.id;
        });

        return [...acc, ...result];
      }, []);
    }

    this.customField_Obj.meta_data = event
    if(this.isEditMode) {
       this.customField_Obj.metaData.datasource.options = event
      this.customField_Obj.metaData.depends_on.conditions = []
      let cond = []
      event.forEach(element => {
        element.selectedResultingFields?.forEach(element1 => {
          cond.push({condition:{value:element.value},id:element1.id,name:element1.name,label:element1.label,slug:element1.slug})
        });
      });
      this.customField_Obj.metaData.depends_on.conditions = cond;
      if(!event || !event?.length) {
        this.customField_Obj.metaData = {}
      }
    }
  }

  public getSvgName(fileName: string) {
    return fileName?.split('.svg')?.length && fileName?.split('.svg')[0].length ? fileName?.split('.svg')[0] : '1';
  }

  toggleNew(fieldName: string, val: boolean) {
    this.customField_Obj[fieldName] = !val;
  }

  clearDefaultValue() {
    this.customField_Obj.default_value = ''
  }

  onClickRequired() {
    if (this.required.value) {
      this.required.value = false;
    } else {
      this.required.value = true;
    }
  }

  onClickReadonly() {
    if (this.readonly.value) {
      this.readonly.value = false;
    } else {
      this.readonly.value = true;
    }
  }

  onClickSensitiveToggle() {
    if (this.data_subject_right.value) {
      this.data_subject_right.value = false;
    } else {
      this.data_subject_right.value = true;
    }
  }

  onClickLinked() {
    if (this.linked.value) {
      this.linked.value = false;
    } else {
      this.linked.value = true;
    }
  }

  onClickLinkModule(index) {
    if (this.linkedModuleList[index].linkModule) {
      this.linkedModuleList[index].linkModule = false;
      this.linkedModuleList[index].readOnly = false;
      this.linkedModuleList[index].customFieldCanView = null
      this.linkedModuleList[index].customFieldCanEdit= null
      this.linkedModuleList[index].canEditList = [];
      this.linkedModuleList[index].can_view_vendors = [];
      this.linkedModuleList[index].can_edit_vendors = [];
      this.linkedModuleList[index].can_view_vendors_ids = [];
      this.linkedModuleList[index].can_edit_vendors_ids = [];
    } else {
      this.linkedModuleList[index].linkModule = true;
      // this.linkedModuleList[index].roles = this.roles
      this.linkedModuleList[index].can_view_vendors = this.vendors;
      // this.linkedModuleList[index].can_view_vendors.forEach(x => {x.checked = true})
      // this.linkedModuleList[index].can_view_vendors_ids = this.vendors.map(x => x.vendor.id);
    }
  }

  readOnlyToggle(index) {
    if (this.linkedModuleList[index].readOnly) {
      this.linkedModuleList[index].readOnly = false;
    } else {
      this.linkedModuleList[index].readOnly = true;
    }
  }

  initializeMDTListingSub() {
    this.subscriptions.push(
      this.mdtSubject.pipe(
        debounceTime(500),
        distinctUntilChanged((prev: Query, next: Query) => {
          return (
            (prev.page === next.page) &&
            (prev.term === next.term)
          )
        }),
        switchMap((query: Query) => {
          let { term, page } = query;
          let url: string = `/configurator/programs/${this.programDetails?.id}/foundational-data-types?limit=10&page=${page}`;
          if(term) {
            url += `&name=${term}`;
          }

          this.mdtLoading = true;
          this.mdtPrevQuery = query;
          return forkJoin([this.progServ.get(url), of(page)]);
        })
      ).subscribe({
        next: (res: any) => {
          const data: any = res?.[0];
          const page: any = res?.[1];
          const foundational_data_types: Array <any> = data?.foundational_data_types || [];
          if(Array.isArray(foundational_data_types)) {
            this.mdtTotalRecords = data?.total_records;
            if(page === 1) {
              this.mdtList = foundational_data_types;
            } else {
              this.mdtList = [
                ...this.mdtList,
                ...foundational_data_types,
              ];
            }
          }

          this.mdtLoading = false;
        }, error: (err: any) => {
          console.error(err);
          this.mdtLoading = false;
          this._alert.error('Error encountered while loading MDT entries!');
        }
      })
    )
  }

  loadMoreMDTEntries() {
    const totalUniqueRecords: number = this.uniquePipe.transform(this.mdtList, 'id')?.length;
    if(!this.mdtLoading && (totalUniqueRecords < this.mdtTotalRecords)) {
      this.mdtSubject.next({
        ...this.mdtPrevQuery,
        page: (this.mdtPrevQuery?.page || 0) + 1
      })
    }
  }

  // when tuhin add code after that possible to add valition
  get hierarchyAllowed() {

    if(!this.candidateValidations)
      return true;

    // let length = this.selectedAllModules.length;
    // if(length === 0)
    //   return false;

    // if(length === 1 && this.selectedAllModules.includes('CANDIDATES'))
    //   return false;

    return true;
  }

  get hierarchyValidationText() {

    const candidateValidations: boolean = this.customField_Obj.moduleType == 'CANDIDATES' ? true : false;
    const programUserValidations: boolean = this.customField_Obj.moduleType == 'PROGRAM_USERS' ? true : false;

    if(candidateValidations && programUserValidations) {
      return 'Hierarchy will not be associated with Candidates and Program Users Module';
    }

    if(candidateValidations) {
      return 'Hierarchy will not be associated with Candidates Module';
    }

    if(programUserValidations) {
      return 'Hierarchy will not be associated with Program Users Module';
    }

    return null;
  }

  get selectedModuleCount() {
    return this.customField_Obj?.moduleType?.length + this.linkedModuleList?.filter(x => x?.linkModule)?.length;
  }

  get isCandidateSelected() {
    return this.customField_Obj.moduleType == 'CANDIDATES' || this.linkedModuleList.filter(x => x.linkModule).map(c => c.code).includes('CANDIDATES')
  }

  get isProgramUserSelected() {
    return this.customField_Obj.moduleType == 'PROGRAM_USERS';
  }

  get isMasterDataTypeSelected() {
    return this.customField_Obj.moduleType == 'MASTER_DATA_TYPE';
  }

  getValidation() {
    let isValid = true;
    if(this.customField_Obj?.customFieldSupportingText?.length > 1000){
      this._alert.error('Supporting text must be less than 1000 characters');
      isValid = false;
    }
    if(!this.customField_Obj.moduleType) {
      this._alert.error('No module selected for custom field');
      isValid = false;
    }
    if(this.hierarchyAllowed) {
      let hierarchy_ids = this.hierarchyListTags.map(h => h.id)
      if((!hierarchy_ids || !hierarchy_ids.length || hierarchy_ids.length == 0) && !this.hideHierarchyInModules?.includes(this.customField_Obj.moduleType)) {
        this._alert.error('No hierarchy selected for custom field');
        isValid = false;
      }
    }
    if(!this.customField_Obj.customFieldName) {
      this._alert.error('Please Enter custom field name');
      isValid = false;
    } else if(!this.hidePlaceholder.includes(this.customField_Obj.selectedFieldType) && !this.customField_Obj.customFieldPlaceholder) {
      this._alert.error('Please Enter placeholder');
      isValid = false;
    } else if(!this.customField_Obj.selectedFieldType) {
      this._alert.error('Please Select field type');
      isValid = false;
    } else if(!this.customField_Obj.customFieldLabel) {
      this._alert.error('Please Enter custom field label');
      isValid = false;
    } else if(this.customField_Obj.selectedFieldType == "SOURCE" && !this.customField_Obj.source_lov) {
      this._alert.error('Please Select Source Lov');
      isValid = false;
    } else if(this.customField_Obj.selectedFieldType == "SOURCE" &&  !this.customField_Obj.user_type) {
      this._alert.error('Please Select User type');
      isValid = false;
    } else if(this.customField_Obj.selectedFieldType == "SOURCE" &&  this.customField_Obj.user_type == 'BY ORGANIZATION' && !this.customField_Obj.user_category) {
      this._alert.error('Please Select Organization');
      isValid = false;
    } else if(this.customField_Obj.selectedFieldType == "SOURCE" &&  this.customField_Obj.user_type == 'BY USER ROLE' && !this.customField_Obj.user_role) {
      this._alert.error('Please Select User Role');
      isValid = false;
    }

    else if(!this.customField_Obj.customFieldCanView || this.customField_Obj.customFieldCanView?.length == 0) {
      this._alert.error('Please select the roles for view permission');
      isValid = false;
    } else if(this.canEditList?.length > 0 && (!this.customField_Obj?.customFieldCanEdit || this.customField_Obj?.customFieldCanEdit?.length == 0)) {
      this._alert.error('Please select the roles for edit permission');
      isValid = false;
    } else if(this.customField_Obj.selectedFieldType == "HYPERLINK" && !this.customField_Obj.hyperlink) {
      this._alert.error('Please enter URL');
      isValid = false;
    } else if(this.customField_Obj.selectedFieldType == "DATETIME") {

      let dateVal: any = this.customField_Obj.default_value;
      let timeVal: any = this.customField_Obj.default_value_2;

      if(!dateVal && timeVal) {
        this._alert.error('Default Date not provided for DATETIME custom field!');
        isValid = false;
      } else if (!timeVal && dateVal) {
        this._alert.error("Default Time not provided for DATETIME custom field!");
        isValid = false;
      }
    } else if (this.customField_Obj.selectedFieldType == "TIME" && !!this.customField_Obj.default_value && !this.timePattern.test(this.customField_Obj.default_value)) {
      this._alert.error(this.timeErrorText);
      isValid = false;
    }
     return isValid ? isValid : false;
  }

  saveCustomField() {
    if(!this.getValidation()) {
      return null;
    }

    let entity_refs = []

    entity_refs.push({
      add : true,
      can_view : this.customField_Obj?.customFieldCanView?.map((x:any) => { return {
        organization_category : x,
        organizations : x == 'VENDOR' ? !this.customField_Obj?.can_view_vendors_ids?.length ? null : this.customField_Obj?.can_view_vendors_ids : null
      }}),
      can_edit : this.customField_Obj?.customFieldCanEdit?.map((x:any) => { return {
        organization_category : x,
        organizations : x == 'VENDOR' ? !this.customField_Obj?.can_edit_vendors_ids?.length ? null : this.customField_Obj?.can_edit_vendors_ids : null
      }}),
      entity_ref : this.customField_Obj?.moduleType,
      is_readonly : this.readonly?.value,
    })
    let selectedLinkedModules = this.linked?.value ? this.linkedModuleList?.filter(x => x.linkModule) : []
    if(this.linked?.value) {


      if(!selectedLinkedModules || !selectedLinkedModules?.length || selectedLinkedModules?.length === 0) {
        this._alert.error('Please select any linked Module');
        return null;
      }

      for(let i = 0; i<selectedLinkedModules?.length; i++) {
        if(!selectedLinkedModules[i]?.customFieldCanView || !selectedLinkedModules[i]?.customFieldCanView.length || selectedLinkedModules[i]?.customFieldCanView.length === 0) {
          this._alert.error('Please select the roles for view permission in linked Module');
          return null;
        }

        if(selectedLinkedModules[i]?.canEditList?.length > 0 && (!selectedLinkedModules[i]?.customFieldCanEdit || !selectedLinkedModules[i]?.customFieldCanEdit?.length || selectedLinkedModules[i]?.customFieldCanEdit?.length === 0)) {
          this._alert.error('Please select the roles for edit permission in linked Module');
          return null;
        }

        entity_refs.push({
          add : true,
          can_view : selectedLinkedModules[i]?.customFieldCanView?.map((x:any) => { return {
            organization_category : x,
            organizations : x == 'VENDOR' ? !selectedLinkedModules[i]?.can_view_vendors_ids?.length ? null : selectedLinkedModules[i]?.can_view_vendors_ids : null
          }}),
          can_edit : selectedLinkedModules[i]?.customFieldCanEdit?.map((x:any) => { return {
            organization_category : x,
            organizations : x == 'VENDOR' ? !selectedLinkedModules[i]?.can_edit_vendors_ids?.length ? null : selectedLinkedModules[i]?.can_edit_vendors_ids : null
          }}),
          entity_ref : selectedLinkedModules[i]?.code,
          is_readonly : selectedLinkedModules[i]?.readOnly,
        })

      }
    }

    let meta_data;
    if (this.customField_Obj?.meta_data?.length) {
      const fields = [];
      let options = []
      this.customField_Obj?.meta_data?.forEach(cond => {

        options.push({
          help_text : cond?.help_text,
          help_text_type : cond?.help_text_type,
          is_help_text_enabled : cond?.is_help_text_enabled,
          label : cond?.label,
          selected : cond?.selected,
          value : cond?.value
        })

        fields.push(
          ...(cond.selectedResultingFields ?? []).map(field => ({
            condition: cond
              ? { value: cond.value, operator: '=' }
              : { value: 0, operator: '>', measure_by: 'length' },
            slug: field.slug,
            label: field.label,
          })),
        );
      });
      meta_data = {
        datasource : {
          is_multi_select : this.customField_Obj.selectedFieldType === 'MULTI_SELECT_DROPDOWN' && this.customField_Obj?.metaData?.datasource?.is_multi_select ? this.customField_Obj?.metaData?.datasource?.is_multi_select : false,
          options: options
        },
        depends_on: {
          action: 'SHOW_FIELD',
          conditions: fields,
        },
      };
    }
    if(this.isEditMode && (this.customField_Obj?.metaData || JSON.stringify(this.customField_Obj?.metaData)!= '{}') && (!meta_data || JSON.stringify(meta_data) == "{}") && (this.customField_Obj.selectedFieldType=='DROPDOWN' || this.customField_Obj.selectedFieldType=='RADIO' || this.customField_Obj.selectedFieldType=='CHECKBOX')) {
      let datasource = this.customField_Obj?.metaData?.datasource?.options?.map(({ help_text, help_text_type, is_help_text_enabled, label, selected, value }, it: number) => ({ help_text, help_text_type, is_help_text_enabled, label, selected, value, ref_order: it }));
      meta_data = {
        datasource : {
          is_multi_select : this.customField_Obj.selectedFieldType === 'MULTI_SELECT_DROPDOWN' && this.customField_Obj?.metaData?.datasource?.is_multi_select ? this.customField_Obj?.metaData?.datasource?.is_multi_select : false,
          options: datasource
        },
        depends_on : this.customField_Obj?.metaData?.depends_on
      }
    }

    if(!meta_data?.datasource?.options?.length && (this.customField_Obj.selectedFieldType=='DROPDOWN' || this.customField_Obj.selectedFieldType=='RADIO' || this.customField_Obj.selectedFieldType=='CHECKBOX')) {
      this._alert.error(this.customField_Obj.selectedFieldType + ' values can not be blank');
      return null;
    }

    if (selectedLinkedModules?.length) {
      let linkeMod = this.linkedModuleList?.filter(x => x?.linkModule)
      meta_data = { ...meta_data, linked: { modules: linkeMod?.map(mod => mod?.code) } };
    }

    let payload = {
      type : this.customField_Obj.selectedFieldType,
      name : this.customField_Obj.customFieldName,
      label : this.customField_Obj.customFieldLabel,
      placeholder : this.customField_Obj.customFieldPlaceholder,
      description : this.customField_Obj.customFieldDescription,
      meta_data: meta_data ?? {},
      is_required : this.required?.value,
      source_lov : this.customField_Obj.source_lov ? this.customField_Obj.source_lov : false,
      user_type : this.customField_Obj.user_type ? this.customField_Obj.user_type : false,
      user_category : this.customField_Obj.user_category ? this.customField_Obj.user_category : false,
      user_role : this.customField_Obj.user_role ? this.customField_Obj.user_role : false,
      is_readonly : this.readonly?.value,
      is_enabled : this.titleToggle?.value,
      data_subject_right : this.data_subject_right.value,
      entity_refs: entity_refs,
      pick_list: (typeof(this.customField_Obj?.picklist) === 'string')? this.customField_Obj?.picklist : this.customField_Obj?.picklist?.id,
      supporting_text: this.customField_Obj.customFieldSupportingText ?? '',
      hierarchy_ids: this.hierarchyListTags.map(h => h.id)
    };

    if(this.jobTypeAllowed) {
      payload['job_type'] = this.selectedJobTypes;
    }

    if(this.isMasterDataTypeSelected) {
      if(this.mdtSelected) {
        payload['master_data_type'] = [ this.mdtSelected ];
      } else {
        this._alert.error('Master Data Type not specified for custom field');
        return null;
      }
    }

    if(!payload.source_lov) {
      delete payload['source_lov'];
    }

    if(!payload.user_type) {
      delete payload['user_type'];
    }

    if(!payload.user_category) {
      delete payload['user_category'];
    }

    if(!payload.user_role) {
      delete payload['user_role'];
    }

    if(this.customField_Obj.selectedFieldType != 'PICKLIST')
      delete payload['pick_list'];

    if(this.isProgramUserSelected) {
      let org_category: Array <string> = this.org_category;
      if(Array.isArray(org_category) && org_category.length) {
        payload['org_category'] = org_category;
      } else {
        this._alert.error('Please select the Organization Category.');
        return null;
      }
    }

    let default_val: any = this.customField_Obj.default_value;
    if(this.customField_Obj.selectedFieldType === 'NUMBERS') {
      default_val = Number.parseFloat(default_val) ?? 0;
    }

    // DATE
    if(this.customField_Obj.selectedFieldType === 'DATE') {
      if(this.customField_Obj?.default_value) {
        default_val = this.localDateFormat.transform(this.customField_Obj.default_value, DATE_FORMAT.FORMATMDY ,null ,null , true, this.dateFormat) ?? '';
      } else {
        default_val = null;
      }
    }

    // DATETIME
    if(this.customField_Obj.selectedFieldType === 'DATETIME') {
      if(this.customField_Obj?.default_value || this.customField_Obj?.default_value_2) {
        let dateElement: string = (this.localDateFormat.transform(this.customField_Obj.default_value, DATE_FORMAT.FORMATMDY ,null ,null , true, this.dateFormat) ?? '');
        let timeElement: string = (this.customField_Obj.default_value_2 ?? '');
        if(!dateElement) {
          default_val = " " + timeElement;
        } else if(!timeElement) {
          default_val = dateElement + " ";
        } else {
          default_val = dateElement + " " + timeElement;
        }
      } else {
        default_val = " ";
      }
    }

    if('default_value' in payload['meta_data']) {
      delete payload['meta_data'].default_value;
    }

    if (default_val || (typeof(default_val) === 'boolean')) {
      if (Array.isArray(payload['meta_data'])) {
        payload['meta_data'] = {
          default_value: default_val
        }
      } else {
        payload['meta_data'] = {
          ...(payload['meta_data'] ?? {}),
          default_value: default_val
        }
      }
    }

    if(this.hierarchyAllowed) {
      payload['hierarchy_ids'] = this.hierarchyListTags?.map(h => h.id);
    } else {
      payload['hierarchy_ids'] = [];
    }

    if(this.customField_Obj.selectedFieldType == "CURRENCY"){
      payload.meta_data = { ...payload.meta_data, currency: this.customField_Obj.currency};
    } else if(this.customField_Obj.selectedFieldType == "HYPERLINK"){
      payload.meta_data = { ...payload.meta_data, url: this.customField_Obj.hyperlink};
    } else if(this.customField_Obj.selectedFieldType == "NUMBERS") {
      payload.meta_data = { ...payload.meta_data,
        default_value : Number.parseFloat(this.customField_Obj?.default_value?.toString()) ?? 0,
        decimal: this.customField_Obj?.decimal ?? 0,
        show_in_thousands: this.customField_Obj?.show_in_thousands ?? false,
        range_applicable: this.customField_Obj?.range_applicable ?? false,
        range : {
          range_min: this.customField_Obj?.range_min ?? null,
          range_max: this.customField_Obj?.range_max ?? null
        }
      };
    }

    payload.meta_data = payload.meta_data.length == 0 ? {} : payload.meta_data

    let oldModules = this.customFieldId ? this.initiallySelectedLinkedData?.entity_refs?.map(m=>m.entity_ref) : []
    let newModules = payload?.entity_refs?.map(m=>m.entity_ref)
    let removedModules = oldModules?.filter(x => !newModules.includes(x));
    payload.entity_refs.forEach((x: any, it: number) => {
      if('entity_ref' in x) {
        x['entity_ref'] = ((x['entity_ref']) ?? '').toUpperCase();
      }
      x.add = true
    })
    let removedObj = this.initiallySelectedLinkedData?.entity_refs?.filter(f=> removedModules?.includes(f.entity_ref))
    for(let i in removedObj){
      removedObj[i].add = false
      for(let j in removedObj[i].can_edit){
        removedObj[i].can_edit[j].organizations = (!removedObj[i].can_edit[j].organizations ||  removedObj[i].can_edit[j].organizations.length == 0) ? null : removedObj[i].can_edit[j].organizations.map(o=>o.id)
      }
      for(let j in removedObj[i].can_view){
        removedObj[i].can_view[j].organizations = (!removedObj[i].can_view[j].organizations || removedObj[i].can_view[j].organizations.length == 0) ? null : removedObj[i].can_view[j].organizations.map(o=>o.id)
      }
      payload.entity_refs= [...payload.entity_refs , removedObj[i]]
    }

    if(Array.isArray(payload?.meta_data?.datasource?.options)) {
      payload.meta_data.datasource.options = payload.meta_data.datasource.options.map((entry: any, it: number) => {
        return {
          ...entry,
          ref_order: it
        };
      })
    }

    this.loader.show();
    if(this.customFieldId) {
      this.customFieldsService.updateCustomField(this.programDetails.id, this.customFieldId, payload).subscribe({
        next: (data: any) => {
          this.Router.navigate(['data-management', 'custom-field', 'view', data?.id], {
            queryParams: {
              'entity_ref': this.customField_Obj?.moduleType
            }
          });
          this._alert.success(`Custom Field Updated Succesfully`);
        }, error: (err: Error | any) => {
          console.error(err);
          this.loader.hide();
          this._alert.error(err?.error?.error?.message ?? 'Error encountered while updating custom field');
        },
      });
    } else {
      this.progServ.post(`/configurator/programs/${this.programDetails?.id}/custom-fields`,payload).subscribe((data:any) => {
          if(data?.id) {
            this.Router.navigate(['data-management', 'custom-field', 'view', data?.id], {
              queryParams: {
                'entity_ref': this.customField_Obj?.moduleType
              }
            });
          this._alert.success("Custom Field Created Succesfully");
          }
      }, (err: Error | any) => {
        console.error(err);
        this.loader.hide();
        this._alert.error(err?.error?.error?.message ?? 'Error encountered while creating custom field');
      })
    }
  }

  getJobTypesPicklist() {

    let url: string = `/configurator/programs/${this.programId}/pick-lists?limit=50&slug=job_type&active_picklist_items=True&apply_job_type_filter=False`;
    this.progServ.get(url).subscribe({
      next: (res: any) => {
        const pick_lists: Array <any> = res?.pick_lists;
        if(Array.isArray(pick_lists) && pick_lists.length) {
          const picklist_items: Array <any> = pick_lists[0]?.picklist_item;
          if(Array.isArray(picklist_items)) {
            this.jobTypesList = picklist_items.map(({ id, label }) => { return {name: label, id}});
            this.jobTypesLoaded = true;
          }
        }

        this.jobTypesLoading = false;
      }, error: (err: any) => {
        console.error(err);
        this._alert.error(errorHandler(err));
        this.jobTypesLoading = false;
      }
    })
  }

  get jobTypeAllowed() {
    return ![ 'VENDORS', 'HIERARCHY', 'MASTER_DATA_TYPE', 'PROGRAM_DETAILS', 'WORK_LOCATIONS', 'PROGRAM_USERS', 'CONFIGURATOR']
      .includes(this.customField_Obj?.moduleType) && 
      this.storeServ.get(StorageKeys.CURRENT_PROGRAM)?.config?.job_type;
  }

  get programId(): string {
    return this.storeServ.get(StorageKeys.PROGRAM_ID);
  }

  initializeMDTLock(data: Array <any>) {
    let destroySub$: Subject <void> = new Subject <void> ();
    this.subscriptions.push(
      interval(500).pipe(takeUntil(destroySub$))
      .subscribe(() => {
        if (!this.mdtLoading) {
          if (data?.length) {
            let mdtId: string = data.map((entry: any) => (entry?.id || entry))?.[0] || null;
            let mdtIdList: Array <string> = this.mdtList.map((entry: any) => entry?.id);
            this.mdtSelected = data?.[0]?.id;
            if (!mdtIdList.includes(mdtId)) {
              this.mdtList = [ ...this.mdtList, ...data ];
            }
          }

          destroySub$.next();
        }
      })
    )
  }

  private updateJobType(data: any) {
    if (this.jobTypeAllowed) {

      let destroyer$: Subject <void> = new Subject <void> ();
      this.subscriptions.push(
        interval(500).pipe(
          takeUntil(destroyer$)
        ).subscribe(() => {
          if(this.jobTypesLoaded) {

            let result: Array<string> = (data || [])?.map((type: any) => (type?.id || type));
            if (Array.isArray(this.jobTypesList)) {
              result = result.filter((id: string) => this.jobTypesList.find((entry: any) => (entry?.id === id)));
            }

            setTimeout(() => {
              this.selectedJobTypes = result;
            }, 800);

            destroyer$.next();
          }
        })
      )
    }
  }

  get showSensitiveData(): boolean {
    return !!(this.programDetails?.config?.data_subject_rights?.enabled);
  }
}
