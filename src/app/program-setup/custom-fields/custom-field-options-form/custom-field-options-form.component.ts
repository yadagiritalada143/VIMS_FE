import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, Subscription, fromEvent, Subject, of, forkJoin } from 'rxjs';
import { concatMap, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { CustomFieldsService } from '../custom-fields.service';
import { ICustomFieldType } from '../interfaces/custom-fields.interface';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { DropdownTreeviewSelectI18n } from './dropdown-treeview-select-i18n';
import { TreeviewI18n, TreeviewItem, TreeviewConfig, TreeviewEventParser, DownlineTreeviewEventParser } from 'ngx-treeview';
import { IPicklistOption } from '../components/picklist/picklist-options.interface';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { timeValidator } from 'src/app/shared/util/time-validator';
import { PicklistComponent } from '../components/picklist/picklist.component';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AllowedCFUserTypes } from 'src/app/user-management/profile-view/program-user-cf.config';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-custom-field-options-form',
  templateUrl: './custom-field-options-form.component.html',
  styleUrls: ['./custom-field-options-form.component.scss'],
  providers: [{
    provide: TreeviewI18n,
    useClass: DropdownTreeviewSelectI18n
  },
  {
    provide: TreeviewEventParser,
    useClass: DownlineTreeviewEventParser
  }],
})
export class CustomFieldOptionsFormComponent implements OnInit, OnDestroy {

  @Input() isEditMode = false;
  @Input() customFieldsId: string;
  @Input() programId: string;
  @Input() moduleName: string;
  @Input() visiblePanelIndex: number;
  @Input() selectedType;
  @Input() selectedModules: Array <string> = [];
  @Input() candidateValidations: boolean = false;
  @Input('isPicklistSelected') set checkPicklistSelected(flag: boolean) {
    this.isPicklistSelected = flag;
    if (flag) {
      this.picklistSub.next({ term: '', page: 1 });
    }
  }

  @Output() changeTitle = new EventEmitter<string>();
  @Output() toggleConfigurationPanel = new EventEmitter();
  @Output() formChanges = new EventEmitter();
  @Output() changePanelIndex = new EventEmitter<number>();
  @Output() getCustomFieldData = new EventEmitter();
  @Output() changeHierarhies = new EventEmitter();
  @Output() changeMultiselectToggle = new EventEmitter();
  @Output() changeDataSource = new EventEmitter();
  @Output() changeselectedModules = new EventEmitter();

  public predefinedPicklists: Array <any> = [];
  public isPicklistSelected: boolean = false;
  public picklistLoading: boolean = false;
  public prevPicklistConfig: any = null;
  public picklistCount: number = 0;

  public is_multi_select = false;
  public data_source = [];
  public customFieldForm: UntypedFormGroup;
  public selectedFieldType: ICustomFieldType;
  public hierarchyListTags = [];
  public items: any;
  public modules = [];
  public hierarchy = [];
  public selectedLocalModules = [];
  public sourceLOV = [{id : 'USER',name : 'Users'}];
  public userType = [{id : 'ALL',name : 'ALL'}, {id : 'BY ORGANIZATION',name : 'By Org'}, {id : 'BY USER ROLE',name : 'By User Role'}];
  public userCategory = [{id : 'SIMPLIFYVMS',name : 'SimplifyVMS'}, {id : 'CLIENT',name : 'CLIENT'}, {id : 'MSP',name : 'MSP'}];
  public userRoles : any = [];
  public currencyData$: Observable<any>;
  public customFieldData;
  public customFieldHierarchyData;
  public affectedId: string = null;
  public checkboxAction: boolean = null;
  public hierarchyMap: Map <string, string> = new Map <string, string> ();
  public treeViewGeneric: Array <any> = [];
  public treeViewItems: Array <TreeviewItem> = [];
  public hierarchyConfig: any = TreeviewConfig.create({
    hasAllCheckBox: false,
    hasFilter: false,
    hasCollapseExpand: true,
    decoupleChildFromParent: false,
    maxHeight: 240,
  });

  private subscriptions: Array <Subscription> = [];
  private picklistSub: Subject <any> = new Subject <any> ();

  // Data members for individual Custom fields
  public metaFieldsForm: UntypedFormGroup;
  public alphaNumericPattern: RegExp = /^[a-zA-Z0-9]+$/;
  public hyperlinkPattern: RegExp = /^(?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
  public emailPattern: RegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  public numberPattern: RegExp = /[0-9.]+/;
  public showReadOnly: boolean = true;
  public showLinkedReadOnly: boolean = true;
  public amountAccuracy: number = 6;
  public dateFormat : any = ""

  public timePattern: RegExp = /^[0-9]{1,2}:[0-9]{1,2}$/;
  public timeTypePattern: RegExp = /^[0-9]{0,2}[:]{0,1}[0-9]{0,2}$/;
  public timeErrorText: string = `Invalid time format! Required: 00:00-23:59`
  public programDetails : any;

  public org_category: Array <string> = [];
  public orgCategories: Array<any> = AllowedCFUserTypes.map((key: any) => {
    return {
      name: (key === 'MSP') ? key : this.titleCase.transform(key),
      value: key
    };
  });

  constructor(
    private fb: UntypedFormBuilder,
    private customFieldsService: CustomFieldsService,
    private programService: ProgramService,
    private loader: LoaderService,
    private storageService: StorageService,
    private sortHelper: SortHelperPipe,
    private alert: AlertService,
    private uniquePipe: UniqueKeyPipe,
    private datePipe: LocalDateFormatPipe,
    private titleCase: TitleCasePipe
  ) {
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  }

  ngOnInit(): void {
    this.dateFormat = this.programDetails.defaultDateFormat.toUpperCase()
    this.initializeForm();
    this.hierarchyList();
    this.getModules();

    this.amountAccuracy = this.storageService.get(StorageKeys.ACCURACY_CONFIG)?.amount?.scale ?? 6;
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
          this.alert.error(errorHandler(err));
        }
      })
    );

    if(this.isPicklistSelected) {
      this.picklistSub.next({term: '', page: 1});
    }
  }

  getItems(parentChildObj) {
    const itemsArray = [];
    parentChildObj.forEach(set => {
      itemsArray.push(new TreeviewItem(set));
    });
    return itemsArray;
  }

  createTreeViewItem(h) {
    return h.hierarchies.length
      ? {
          text: h.name,
          value: h.id,
          checked: this.customFieldForm?.get('hierarchy_ids')?.value?.includes(h.id),
          children: h.hierarchies.map(ch => this.createTreeViewItem(ch)),
        }
      : {
          text: h.name,
          value: h.id,
          checked: this.customFieldForm?.get('hierarchy_ids')?.value?.includes(h.id),
        };
  }

  hierarchyList() {
    this.loader.show();
    this.customFieldsService.getHierarchyList(this.programId).subscribe((data:any) => {
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
          this.loader.hide();
          setTimeout(()=> {
            // Initialize listeners
            this.initCheckListeners(preOrderList);
            if(this.customFieldsId) {
              this.selectEditItems();
            }
          }, 800);
        });
      }
    })
  }

  treeViewParser(node, list: Array <any>) {
    const value = node.id;
    const text = node.name;
    let checked = false;
    list.push(value);
    let disabled = !node?.is_enabled;
    let children = node.hierarchies.map(element => {
      return this.treeViewParser(element, list);
    });
    this.hierarchyMap.set(value, text);
    return { value, text, children, checked, disabled };
  }

  get formControl() {
    return this.customFieldForm.controls;
  }

  get metaControl() {
    return this.metaFieldsForm?.controls;
  }

  public metaData(): UntypedFormGroup {
    return this.customFieldForm.get('meta_data') as UntypedFormGroup;
  }

  initCheckListeners(preOrderList) {
    const treeRef = document?.querySelector('ngx-treeview');
    const boxRefs = treeRef?.querySelectorAll('input[type="checkbox"]');
    (boxRefs ?? [])?.forEach((checkbox, it)=> {
      checkbox.id = preOrderList[it];
      this.subscriptions.push(
        fromEvent(checkbox, 'click').subscribe((res: any) => {
          const action = res.target.checked;
          const id = res.target.id;
          this.checkboxAction = action;
          this.affectedId = id;
        })
      )
    });
  }

  selectEditItems() {
    // entry selection
    this.hierarchyListTags = [];
    if(this.customFieldHierarchyData) {
      let list: Array <string> = this.customFieldHierarchyData.map(x => x.id);
      list?.forEach(element => {
        const ref: any = document.getElementById(`${element}`);
        ref?.click();
      });
    }
  }
  public getparent(p) {
    if (p.parent) {
      this.getparent(p.parent)
    }
    if (p.item.internalChecked && !p.item.internalChildren.filter(f => f.internalChecked == false).length) {
      this.hierarchy.push(p.item.value)
    }
  }

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
    this.customFieldForm.patchValue({
      hierarchy_ids: selectionNodes,
    });
    this.changeHierarhies.emit(selectionNodes);
  }

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
    this.customFieldForm.patchValue({
      hierarchy_ids: this.hierarchyListTags,
    });
    this.changeHierarhies.emit(this.hierarchyListTags);
    return;
  }

  private initializeForm() {
    if (this.customFieldsId) {
      this.setValuesFromDetails();
    } else {
      this.fillFormWithDefaultData();
      this.customFieldForm?.valueChanges.subscribe((value:any) => {
        this.formChanges.emit({ value, isValid: this.isCustomFormValid });
      });
    }
  }
  private fillFormWithDefaultData(customField?) {
    if(!customField) {
      if(this.moduleName){
        this.selectedModules.push(this.moduleName)
        this.selectedLocalModules.push(this.moduleName)
      }
      this.changeselectedModules.emit(this.selectedLocalModules)
    }
    let linkedModuleData = []
    linkedModuleData = customField?.meta_data?.linked ? customField?.meta_data?.linked?.modules : []
    let hasdependant = (customField?.meta_data?.depends_on?.conditions?.filter(x => x).length > 0 || customField?.meta_data?.linked?.modules?.filter(x => x).length > 0 ) ? true : false;
    this.customFieldForm = this.fb.group({
      type: [customField?.type || '', Validators.required],
      name: [customField?.name || '', Validators.required],
      label: [customField?.label || '', Validators.required],
      placeholder: [customField?.placeholder || '', Validators.required],
      description: [customField?.description || ''],
      currency: [customField?.meta_data?.currency || ''],
      meta_data: this.groupFormatCorrection(customField?.meta_data),
      is_required: [customField ? customField?.is_required : true, Validators.required],
      is_enabled: [customField ? customField?.is_enabled : true, Validators.required],
      is_readOnly: [customField?.entity_refs.filter(val => !linkedModuleData.includes(val.entity_ref))[0]?.is_readonly || false],
      hierarchy_ids: [customField?.hierarchies?.length ? customField?.hierarchies.map(h => h.id) : []],
      has_dependent_linked: [hasdependant || false, Validators.required],
      data_subject_right: [customField && customField?.data_subject_right ? customField?.data_subject_right : false, Validators.required],
      module: [[null]],
      source_lov: [customField?.source_lov || null, customField?.type == 'SOURCE' ? Validators.required : ''],
      user_type: [customField?.user_type || null, customField?.type == 'SOURCE' ? Validators.required : ''],
      user_category: [customField?.user_category || null],
      user_role: [customField?.user_role?.id || null],
      can_view: [null],
      view_vendors: [null],
      can_edit: [null],
      edit_vendors: [null],
      picklist: [customField?.pick_list],
      default_value: [ customField?.meta_data?.default_value ?? ''],
      support_text: [customField?.supporting_text ?? ''],
      default_value_2: [null, timeValidator()]
    });

    if(Array.isArray(customField?.org_category)) {
      this.org_category = customField?.org_category.map((data: any) => data?.organization_category);
    }

    this.toggleConfigurationPanel.emit(this.formControl?.has_dependent_linked?.value);
    if (customField?.hierarchies?.length) {
      this.changeHierarhies.emit(customField?.hierarchies.map(h => h.id));
    }

    if (this.selectedType) {
      this.customFieldForm?.patchValue({
        type: this.selectedType.type,
        name: this.selectedType.name,
        label: this.selectedType.label,
      });
      this.selectedFieldType = this.selectedType;
    }

    if (customField?.type === 'CURRENCY' || this.selectedFieldType?.type === 'CURRENCY') {
      this.getCurrencyData();
      if (!this.metaData().get('currency')) {
        this.metaData().addControl('currency', this.fb.control(''));
      }
    }

    const defaultValueForm: AbstractControl = this.customFieldForm?.get('default_value');
    defaultValueForm?.clearValidators();
    if (customField?.type === 'TIME' || this.selectedFieldType?.type === 'TIME') {
      defaultValueForm?.setValidators(timeValidator());
    }

    if ((this.isEditMode || this.isViewMode) && (customField?.type === 'DATETIME' || this.selectedFieldType?.type === 'DATETIME')) {
      let defaults: Array <string> = (customField?.meta_data?.default_value ?? '')?.split(' ');
      let dateCustomField: string = this.datePipe.transform(defaults?.[0], this.dateFormat ,null ,null , true, DATE_FORMAT.FORMATMDY) ?? null;
      let timeCustomField: string = defaults?.[1] ?? null;
      this.customFieldForm.patchValue({
        default_value_2: timeCustomField,
        default_value: dateCustomField
      });
    }


    if (customField?.meta_data?.depends_on?.conditions?.length) {
      this.toggleConfigurationPanel.emit(this.formControl?.has_dependent_linked?.value);
    }

    if(customField?.entity_refs?.length > 0){
      let modules = []
      let linkedModuleData = []
      linkedModuleData = customField.meta_data?.linked ? customField.meta_data?.linked?.modules : []

      modules = customField.entity_refs.filter(val => !linkedModuleData.includes(val.entity_ref));
      modules = modules.map(val => val.entity_ref)
      this.selectedLocalModules = modules
    }

    this.resetMetaFields();
    let fieldType: string = customField?.type ?? this.selectedFieldType?.type;
    if(fieldType) {
      // Custom configurations for different custom fields
      switch(fieldType) {
        case 'HYPERLINK':
          this.showReadOnly = false;
          this.showLinkedReadOnly = false;
          this.metaFieldsForm = new UntypedFormGroup({
            [fieldType]: new UntypedFormControl(customField?.meta_data?.url ?? '', [
              Validators.required,
              this.isValidURL
            ]),
          });
          break;

        case 'NUMBERS':
          this.metaFieldsForm = new UntypedFormGroup({
            "decimal": new UntypedFormControl(customField?.meta_data?.decimal ?? 0, []),
            "show_in_thousands": new UntypedFormControl(customField?.meta_data?.show_in_thousands ?? false, [Validators.required]),
            "range_applicable": new UntypedFormControl(customField?.meta_data?.range_applicable ?? false, [Validators.required]),
            "range_min": new UntypedFormControl(customField?.meta_data?.range?.range_min ?? null, [Validators.min(1), Validators.max(1000000000)]),
            "range_max": new UntypedFormControl(customField?.meta_data?.range?.range_max ?? null, [Validators.min(1), Validators.max(1000000000)])
          });
          break;

        case 'TOGGLE':
          this.setValuesForToggle();
          break;
      }
    }
  }

  private setValuesFromDetails() {
    this.subscriptions.push(
      this.customFieldsService.getCustomFieldDetails(this.programId, this.customFieldsId, this.moduleName ? this.moduleName : null).subscribe((data:any) => {
        const customField = { ...data.custom_field };
        // this.customFieldData = customField;
        let linkedModuleData = []
        linkedModuleData = customField.meta_data?.linked ? customField.meta_data?.linked?.modules : []
        let modules = customField.entity_refs.filter(val => !linkedModuleData.includes(val.entity_ref));
        this.selectedLocalModules = modules.map(m=>m.entity_ref)
        this.changeselectedModules.emit(this.selectedLocalModules)
        this.customFieldData = {"entity_refs" : modules}
        this.customFieldHierarchyData = customField?.hierarchies
        if(customField.user_type == 'BY USER ROLE') {
          this.getUserRoles()
        }
        if (this.isEditMode) {
          this.changeTitle.emit(`Edit ${customField.name} properties`);
        } else {
          this.changeTitle.emit(`View ${customField.name} properties`);
        }
        if((customField.type == "RADIO" || customField.type == "DROPDOWN" || customField.type == "CHECKBOX" || customField.type == "MULTI_SELECT_DROPDOWN") && this.isEditMode){
          this.is_multi_select = customField.type == "MULTI_SELECT_DROPDOWN" && customField.meta_data?.datasource?.is_multi_select ? customField.meta_data?.datasource?.is_multi_select : false;
          this.data_source = customField.meta_data?.datasource?.options;
          this.changeMultiselectToggle.emit(this.is_multi_select);
          this.changeDataSource.emit(this.data_source);
        }
        if((customField.type == "RADIO" || customField.type == "DROPDOWN" || customField.type == "CHECKBOX" || customField.type == "MULTI_SELECT_DROPDOWN") && this.isViewMode){
          this.is_multi_select = customField.type == "MULTI_SELECT_DROPDOWN" && customField.meta_data?.datasource?.is_multi_select ? customField.meta_data?.datasource?.is_multi_select : false;
        }

        if(customField.type == "CURRENCY" && this.isEditMode){
          this.customFieldForm?.get('currency')?.setValue(customField.meta_data?.currency)
        }

        if(customField.type == "DATE" && customField.meta_data.default_value) {
          customField.meta_data.default_value = this.datePipe.transform(customField?.meta_data?.default_value, this.dateFormat ,null ,null , true, DATE_FORMAT.FORMATMDY)
        }

        this.getCustomFieldData.emit(customField);
        this.fillFormWithDefaultData(customField);
        this.customFieldsService
          .getSupportedFields()
          .pipe(map((res:any) => res.custom_fields))
          .subscribe(fields => {
            const fieldByType = fields.find(({ type }) => type === customField.type);
            if (fieldByType) {
              this.selectedFieldType = fieldByType;
            }
          });
        this.customFieldForm?.valueChanges.subscribe((value:any) => {
          this.formChanges.emit({ value, isValid: this.isCustomFormValid });
        });
      }),
    );
  }

  public removeSelected(event,i){
    const isAlreadyExist = this.selectedModules?.findIndex((entity:any) => entity == event);
    this.selectedModules.splice(isAlreadyExist,1);
    this.selectedLocalModules.splice(i,1);
    this.changeselectedModules.emit(this.selectedLocalModules)
  }
  onUserType(event) {
    if(event.id == "BY ORGANIZATION") {
      this.customFieldForm.get('user_role').clearValidators();
      this.customFieldForm?.get('user_role').setValue(null);
      this.customFieldForm.get('user_category').addValidators(Validators.required);
    } else if(event.id == "BY USER ROLE") {
      this.getUserRoles()
      this.customFieldForm.get('user_category').clearValidators();
      this.customFieldForm?.get('user_category').setValue(null);
      this.customFieldForm.get('user_role').addValidators(Validators.required);
    } else {
      this.customFieldForm.get('user_category').clearValidators();
      this.customFieldForm?.get('user_category').setValue(null);
      this.customFieldForm.get('user_role').clearValidators();
      this.customFieldForm?.get('user_role').setValue(null);
    }
  }
  getModuleName(module){
    return this.modules.filter((f)=>f.code == module)[0]?.name || module
  }
  public changeModule(event) {
    const isAlreadyExist = this.selectedModules?.findIndex((entity:any) => entity == event);
    if(isAlreadyExist === -1){
      this.selectedModules.push(event);
      this.selectedLocalModules.push(event);
    }
    this.customFieldForm?.patchValue({
      module: ''
    });
    this.changeselectedModules.emit(this.selectedLocalModules);
  }
  private getModules() {
    this.customFieldsService.getProgramModules(this.programId, true)
    .subscribe((data: any) => {
      data.module_groups.forEach(group => this.modules.push(...group.modules));
    }, err => {

    })
  }

  private getCurrencyData() {
    this.currencyData$ = this.customFieldsService.getCurrencyData(this.programId);
  }

  getPredefinedPicklistObservable(term: string = '', page: number = 1) {

    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/pick-lists?limit=100&page=${page}&active=true`;

    if(term) {
      url += `&picklist_name=${term}`;
    }

    return this.programService.get(url);
  }

  getUserRoles(term: string = '') {

    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/roles?status=true`;

    if(term) {
      url += `&k=${term}`;
    }

    this.programService.get(url).subscribe((data: any) => {
      this.userRoles = data?.roles
    }, err => {

    })
  }

  fetchMorePicklists() {
    if(this.picklistCount > this.predefinedPicklists.length) {
      this.picklistSub.next({
        ...this.prevPicklistConfig,
        page: ((this.prevPicklistConfig.page + 1) || 1)
      });
    }
  }

  updatePicklistSelection() {
    this.formChanges.emit({ value: this.customFieldForm.value, isValid: this.isCustomFormValid });
  }

  dateChanged(event) {
    if(event) {
      this.customFieldForm.value.default_value = this.datePipe.transform(event, this.dateFormat ,null ,null , true,)
      this.customFieldForm.value.meta_data.default_value = this.datePipe.transform(event, this.dateFormat ,null ,null , true,)
      this.formChanges.emit({ value: this.customFieldForm.value, isValid: this.isCustomFormValid });
    }
  }

  public changeFieldType(field: ICustomFieldType) {
    this.customFieldForm.patchValue({
      type: field.type,
      name: field.name,
      label: field.label,
    });
    this.selectedFieldType = field;
  }

  toggle(fieldName, value) {
    this.customFieldForm.patchValue({
      [fieldName]: !value,
    });
  }

  toggleNew(fieldName: string, val: boolean) {
    this.metaFieldsForm.patchValue({
      [fieldName]: !val
    });
  }

  public toggleDependentLinked(flag?: boolean) {

    const value: any = this.formControl?.has_dependent_linked?.value;
    if(typeof(flag) === 'boolean') {
      if(value === flag) {
        return;
      }
    }

    this.toggle('has_dependent_linked', value);
    this.toggleConfigurationPanel.emit(this.formControl?.has_dependent_linked?.value);
  }

  public changePanel(index: number) {
    this.changePanelIndex.emit(index);
  }

  public selectPickListId(picklistId: string) {
    this.metaData().addControl('datasource', this.fb.group({ picklist: [picklistId, Validators.required] }));
  }

  public changeVendorFields(event) {
    this.customFieldForm.patchValue(event);
  }

  public changeMultiselect(isMultiselect: boolean) {
    this.is_multi_select = isMultiselect;
    if (this.metaData().get('datasource')) {
      this.metaData()
        .get('datasource')
        .patchValue({
          ...this.metaData().get('datasource').value,
          is_multi_select: isMultiselect,
        });
    } else {
      this.metaData().addControl('datasource', this.fb.group({ is_multi_select: isMultiselect }));
    }
    this.changeMultiselectToggle.emit(this.is_multi_select);
  }

  public changeOptions(options: IPicklistOption[]) {
    this.data_source = options;
    if (this.metaData().get('datasource')) {
      this.metaData()
        .get('datasource')
        .patchValue({
          ...this.metaData().get('datasource').value,
          options:options,
        });
    } else {
      this.metaData().addControl('datasource', this.fb.group({ options }));
    }
    this.changeDataSource.emit(this.data_source);
  }

  public getSvgName(fileName: string) {
    return fileName?.split('.svg')?.length && fileName?.split('.svg')[0].length ? fileName?.split('.svg')[0] : '1';
  }

  resetMetaFields() {
    this.showReadOnly = true;
    this.showLinkedReadOnly = true;
    this.metaFieldsForm = null;
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

  get isCustomFormValid() {
    if(!this.isPicklistSelected)
      return this.customFieldForm.valid;
    return !!this.customFieldForm.value['picklist'] && this.customFieldForm.valid;
  }

  get isCandidateSelected() {
    return this.selectedModules.includes('CANDIDATES');
  }

  get isProgramUserSelected() {
    return this.selectedModules.includes('PROGRAM_USERS');
  }

  get selectedModuleCount() {
    return this.selectedModules.length;
  }

  get showHierarchy() {

    if(!this.candidateValidations)
      return true;

    let length = this.selectedModules.length;
    if(length === 0)
      return false;

    if(length === 1) {
      return !(
        this.selectedModules.includes('CANDIDATES') ||
        this.selectedModules.includes('PROGRAM_USERS')
      );
    }

    if(length === 2) {
      return !(
        this.selectedModules.includes('CANDIDATES') &&
        this.selectedModules.includes('PROGRAM_USERS')
      );
    }

    return true;
  }

  get sortedModules() {
    return this.sortHelper.transform(this.modules, 'name');
  }

  get isViewMode() {
    return (this.customFieldsId && !this.isEditMode);
  }

  get isCreateMode() {
    return (!this.customFieldsId && !this.isEditMode);
  }

  isValidURL(field: AbstractControl): ValidationErrors | null {
    let url: string = field?.value ?? '';
    try {
      let link: URL = new URL(url);
      return null;
    } catch(err) { }

    return { 'invalid': 'Invalid URL pattern' };
  }

  @ViewChild(PicklistComponent) picklist: PicklistComponent;
  setValuesForToggle() {
    if(this.isCreateMode) {
      setTimeout(() => {
        if(this.picklist) {
          this.picklist?.picklistOptions?.reset();
          this.picklist?.updateOptionsInForm();
          this.picklist?.addNewValue('Yes', true);
          this.picklist?.addNewValue('No', false);
        }
      }, 800);
    }
  }

  isValidFile(evt: any) { }

  uploadFile(evt: any) {
    this.customFieldForm?.get('default_value')?.setValue(evt);
  }

  changeDefaultToggle(flag: any) {
    this.customFieldForm.get('default_value').setValue(flag);
  }

  clearDefaultValue() {
    this.customFieldForm?.get('default_value')?.setValue('');
  }

  get showDependedToggle() {
    return !!(
      (this.customFieldForm?.get('hierarchy_ids')?.value ?? []).length &&
      (this.selectedLocalModules ?? []).length
    );
  }

  get onlyProgramUserModuleSelected() {

    if(this.selectedLocalModules.length === 1) {
      return (this.selectedLocalModules.includes('PROGRAM_USERS'));
    }

    return false;
  }

  get hierarchyValidationText() {

    const candidateValidations: boolean = this.candidateValidations && (this.selectedModuleCount >= 2) && this.isCandidateSelected;
    const programUserValidations: boolean = (this.selectedModuleCount >= 2) && this.isProgramUserSelected;

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

  groupFormatCorrection(data: any): UntypedFormGroup {

    let result: UntypedFormGroup = this.fb.group({});
    if(!data) {
      return result;
    }

    let keys: Array <any> = [...Object.keys(data)];
    for(let key of keys) {
      result.addControl(key, new UntypedFormControl(data?.[key]));
    }

    return result;
  }

  ngOnDestroy(): void {
    this.formChanges.emit({ value: this.customFieldForm.value, isValid: this.isCustomFormValid });
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  get showSensitiveData(): boolean {
    return !!(this.programDetails?.config?.data_subject_rights?.enabled);
  }
}
