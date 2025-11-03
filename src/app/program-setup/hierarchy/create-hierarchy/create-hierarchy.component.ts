import { Component, EventEmitter, OnDestroy, Input, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { HierarchyConfig, ProgramConfig, StorageConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';
import { debounceTime, switchMap } from 'rxjs/operators';
import { AddressContactDetailsComponent } from 'src/app/shared/components/svms-tab-components/address-contact-details/address-contact-details.component';
import { GlobalConstants } from 'src/app/shared/globalconstants';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';

@Component({
  selector: 'app-create-hierarchy',
  templateUrl: './create-hierarchy.component.html',
  styleUrls: ['./create-hierarchy.component.scss'],
})
export class CreateHierarchyComponent implements OnInit, OnDestroy {

  items =['Bill Rate (No Markup)' , 'Pay Rate (Markup)' , 'Bill Rate (Markup)'];
  createHierarchy = 'hidden';
  headerTitle = 'Add Hierarchy Level';

  public sameAsParent = false;
  public selectedParent: string = "";
  public selectedRateModel: string = "";
  public currency: string[] = ['USD', 'GBP', 'AUD', 'INR'];
  public languages = [
      {key: 'en-US', value: 'English (United States)'},
      {key: 'en-UK', value: 'English (United Kingdom)'},
      {key: 'en-CA', value: 'English (Canada)'},
      {key: 'SPA', value: 'Spanish'},
      {key: 'Fr', value: 'French'}
    ];

  public status;
  public hide_show_root: boolean = false;
  public toggles = {
    is_enabled: {
      title: 'active',
      value: true
    },
    rate_card_enforce: {
      title: 'Enforce Rate Card',
      value: false
    },
    hide_show_root:{
      title: 'Hide Root Hierarchy',
      value: false
    }
  };

  public isViewMode = false;
  public hierarchy_level: number = -1;
  public managers = [];
  public parentManagers = [];
  public createHirarcheyLevelFG: UntypedFormGroup;
  public foundDataTypeFG: UntypedFormGroup;
  public eventParentNode;
  public isDataAvilable = false;
  public tabIndex = 0;
  public isCustomeFieldButton = true;
  public listOfFundationalDataType = [];
  public searchingFoundationalTypeId;
  public selectedFoundationalDataTypeIds = [];
  public isContactDetilsArr: any;
  public allCountryList = [];

  clickOutside: boolean;
  enforceToggle:any={};
  toUpdateId = '';
  currencyList = [];
  dateFormats = GlobalConstants?.defaultDateFormat?.filter((dates: string) => dates == DATE_FORMAT.FORMATMDY || dates == DATE_FORMAT.FORMATDDMMYY || dates == DATE_FORMAT.FORMATYYMMDD);
  selectedTimesheet = [];
  timesheetType = [];
  foundationalType = [];
  foundationalInput = new EventEmitter<string>();
  minLengthTerm = 2;
  loader = [];
  editHierarchyisParent = [];
  isEdit = false;
  ParentsArray = [];
  editItem: any;
  initialSelectedCountries = [];
  codePattern: RegExp = /^[a-zA-Z0-9\-_]{0,}$/gm;

  @Input() countryList;
  @ViewChild(AddressContactDetailsComponent) AddressContactDetailsComponent: AddressContactDetailsComponent;

  private programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
  private currentProgramDetails = this.storageService.get(StorageConfig[2]);
  private subscriptions: Subscription[] = [];

  constructor(
    private eventStream: EventStreamService,
    private storageService: StorageService,
    private programService: ProgramService,
    private alertService: AlertService,
    private fb: UntypedFormBuilder,
    private _programService: ProgramService,
  ) { }

  ngOnInit(): void {

    // Fetching first the members or Managers
    this.foundationalTypeList();
    this.getAutoSearch();
    this.getTimeSheetType();
    this.getAllCountry();

    // Event Handler to check if any event available to create the Hirarchey Level.
    this.subscriptions.push(this.eventStream.on(Events.CREATE_HIERARCHY).subscribe((data:any) => {

      // Initially set the first tab
      this.isEdit = false;
      this.tabIndex = 0;
      this.toUpdateId = '';
      if (data) {
        this.eventParentNode = data;
        this.selectedParent = data?.id;
        this.createHierarchy = 'visible';
        this.isDataAvilable = true;
        this.hierarchy_level = parseInt(data?.hierarchy_level) + 1;
        if(isNaN(this.hierarchy_level))
          this.hierarchy_level = -1;

        this.hirarchyFormbuilder();
        this.foundationalDataTypeFormBuider();

        if (this.eventParentNode?.id) {

          this.getHierarchyParentByLevel(this.eventParentNode?.hierarchy_level);
          this.sameAsParent = true;
          this.setDataSameAsParent();
        } else {
          this.sameAsParent = false;
        }
        if(this.isParent){
          this.createHirarcheyLevelFG.controls['hierrchy_level_name'].setValue(this.currentProgramDetails["name"]);
          this.createHirarcheyLevelFG.controls['preferred_date_format'].setValue(this.currentProgramDetails["config"]["preferred_date_format"].toUpperCase());
        }
      } else {
        this.createHierarchy = 'hidden';
      }
      this.clickOutside = false;
    }));

    // Event Handler to check if any event available to view the hierarchy Level.
    this.subscriptions.push(this.eventStream.on(Events.VIEW_HIERARCHY).subscribe((data:any) => {
      this.clickOutside = true;
      this.isEdit = false;
      // Initially set the first tab
      this.tabIndex = 0;
      if (data) {
        // Calling the foundational data api
        const current_level_id = data?.id;
        if (current_level_id) {
          this.getViewEditFoundationalData(current_level_id);
        }

        this.hierarchy_level = parseInt(data?.hierarchy_level);
        if(isNaN(this.hierarchy_level)){
          this.hierarchy_level = -1;
        }
        else if(this.hierarchy_level === 1){
          this.toggles.hide_show_root.value = data?.is_hidden;
          this.hide_show_root = data?.is_hidden;
        }

        const viewParentNodeData = this.getParentViewNode(data);

        this.headerTitle = `${data.name} detail view`;
        this.isViewMode = true;
        this.eventParentNode = {...viewParentNodeData};
        this.getHierarchyParentByLevel(this.eventParentNode?.hierarchy_level)
        this.selectedParent = viewParentNodeData?.id;
        this.createHierarchy = 'visible';
        this.isDataAvilable = true;
        this.toggles.is_enabled.value = data?.is_enabled;
        this.toggles.rate_card_enforce.value = data?.is_rate_card_enforced;
        this.toggles.is_enabled.title = data?.is_enabled ? 'Active' : 'Inactive';
        if (this.checkParentNode()) {
          this.sameAsParent = false;
        }
        this.hirarchyFormbuilder();
        this.foundationalDataTypeFormBuider();
        let managers: Array <any> = data?.managers || [];
        if(Array.isArray(managers)) {
          managers = managers.map((entry: any) => entry?.user_id);
        }
        this.createHirarcheyLevelFG.patchValue({
          hierrchy_level_name: data.name,
          code: data?.code || '',
          managers,
          workflow: 'STANDARD',
          preferred_language: data?.preferred_language ? data?.preferred_language : this.languages[0],
          preferred_date_format: data?.preferred_date_format,
          preferred_currency: data.preferred_currency ? data.preferred_currency : this.currencyList[0],
          is_enabled: data?.is_enabled,
          is_rate_card_enforced: data?.is_rate_card_enforced,
          rate_model: data?.rate_model,
          timesheet_type: data?.pick_list_items ? data?.pick_list_items : [],
        });
        this.selectedRateModel = data?.rate_model,
        this.selectedTimesheet = data?.pick_list_items ? data?.pick_list_items : []
      } else {
        this.createHierarchy = 'hidden';
      }
    }));

    // Event Handler to check if any event available to edit the hierarchy Level.hierarchies
    this.subscriptions.push(this.eventStream.on(Events.EDIT_HIERARCHY).subscribe((data:any) => {
      // Initially set the first tab
      this.tabIndex = 0;
      if (data) {

        this.editItem = data;
        const current_level_id = data?.id;
        this.isEdit = true;
        this.editHierarchyisParent = data?.hierarchies; // check either item is parent or not
        if (current_level_id) {
          this.getViewEditFoundationalData(current_level_id);
        }

        this.hierarchy_level = parseInt(data?.hierarchy_level);
        if(isNaN(this.hierarchy_level)){
          this.hierarchy_level = -1;
        }
        else if(this.hierarchy_level === 1){
          this.toggles.hide_show_root.value = data?.is_hidden;
          this.hide_show_root = data?.is_hidden;
        }

        this.toUpdateId = data.id;
        const viewParentNodeData = this.getParentViewNode(data);
        this.headerTitle = `Edit ${data.name}`;
        this.eventParentNode = {...data};
        this.getHierarchyParentByLevel(this.eventParentNode?.hierarchy_level); // get parent for item to be edit if available
        this.selectedParent = viewParentNodeData?.id;
        this.createHierarchy = 'visible';
        this.eventParentNode = {...viewParentNodeData};
        this.isDataAvilable = true;
        this.toggles.is_enabled.value = data?.is_enabled;
        this.toggles.rate_card_enforce.value = data?.is_rate_card_enforced;
        this.toggles.is_enabled.title = data?.is_enabled ? 'Active' : 'Inactive';
        if (this.checkParentNode()) {
          this.sameAsParent = false;
        }
        // this.sameAsParent = true;
        this.hirarchyFormbuilder();
        this.foundationalDataTypeFormBuider();
        let managers: Array <any> = data?.managers || [];
        if(Array.isArray(managers)) {
          managers = managers.map((entry: any) => entry?.user_id);
        }
        this.createHirarcheyLevelFG.patchValue({
          parent: this.eventParentNode.id,
          hierrchy_level_name: data.name,
          code: data?.code || '',
          managers,
          workflow: 'STANDARD',
          preferred_language: data.preferred_language,
          preferred_date_format: data.preferred_date_format,
          preferred_currency: data.preferred_currency ? data.preferred_currency : this.currencyList[0],
          is_enabled: data?.is_enabled,
          is_rate_card_enforced: data?.is_rate_card_enforced,
          rate_model: data?.rate_model,
          timesheet_type: data?.pick_list_items ? data?.pick_list_items : [],
        });
        this.selectedRateModel = data?.rate_model,
        this.selectedTimesheet = data?.pick_list_items ? data?.pick_list_items : []
      } else {
        this.createHierarchy = 'hidden';
      }
      this.clickOutside = false;
    }));

  }

  getAllCountry(){
    this.subscriptions.push(this._programService.get(`/configurator/resources/countries?limit=300`).subscribe(
      (data:any) => {
        this.allCountryList = data.countries;
      }
    ));
  }

  getTimeSheetType() {
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this._programService.get(`/configurator/programs/${programId}/pick-lists/*/items?picklist_slug=timesheet_type`)
      .subscribe((res: any) => {
        const { picklist_items } = res;
        picklist_items.forEach(element => {
          this.timesheetType.push(element)
        });
      })
  }

  onChangeTimeSheet(event){
    const isAlreadyExist = this.selectedTimesheet?.findIndex((entity:any) => entity.id == event.id);
    if(isAlreadyExist === -1){
      this.selectedTimesheet.push(event);
    }
    this.createHirarcheyLevelFG.controls.timesheet_type.setValue(null);
  }

  getParentViewNode(childNodeData) {
    // assuming for now it will have only one parent node and under this index all node will occure.
    const nodeData = this.storageService.get(HierarchyConfig[0]);
    let viewNodeReturn;
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
    };
    checkNested(nodeData);
    return viewNodeReturn;
  }

  onClickEnforceToggle(){}

  get isParent() {
    return this.eventParentNode?.hierarchy_level === undefined;
  }

  hirarchyFormbuilder() {
    // Form builder started.
    this.createHirarcheyLevelFG = this.fb.group({
      parent: [''],
      hierrchy_level_name: ['', Validators.required],
      code: ['', Validators.required],
      managers: [''],
      workflow: [null],
      preferred_language: [this.languages['en-US']],
      preferred_date_format: [DATE_FORMAT.FORMATDDMMYY, Validators.required],
      preferred_currency: [''],
      is_enabled: [true, Validators.required],
      is_rate_card_enforced: [true],
      rate_model: [null, ''],
      timesheet_type: [null, '']
    });
  }

  foundationalDataTypeFormBuider() {
    const getFormControl = this.creteFormControl();
    this.foundDataTypeFG = this.fb.group(getFormControl);
  }

  private creteFormControl() {
    const formControlObj = {};
    for (const prop of this.listOfFundationalDataType) {
      if (prop?.configuration?.hierarchy_included !== 'OFF') {
        if (prop?.configuration?.hierarchy_included === 'REQUIRED') {
          formControlObj[prop?.name] = new UntypedFormControl('', Validators.required);
        } else {
          formControlObj[prop?.name] = new UntypedFormControl('');
        }
      }
    }
    return formControlObj;
  }

  sidebarClose() {
    this.resetForm();
    this.hierarchy_level = -1;
    this.createHirarcheyLevelFG.reset();
    this.selectedTimesheet = [];
    this.hide_show_root = false;
    this.toggles.hide_show_root.value = false;
    this.createHirarcheyLevelFG.get('timesheet_type').setValue([]);
    this.eventStream.emit(new EmitEvent(Events.CREATE_HIERARCHY, false));
    this.eventStream.emit(new EmitEvent(Events.VIEW_HIERARCHY, false));
    this.eventStream.emit(new EmitEvent(Events.EDIT_HIERARCHY, false));
    this.isViewMode = false;
    this.headerTitle = 'Add Hierarchy Level';
  }

  toggleParent() {
    if (this.sameAsParent) {
      this.sameAsParent = false;
    } else {
      this.sameAsParent = true;
      this.setDataSameAsParent();
    }
  }

  setDataSameAsParent() {
    if (this.sameAsParent) {
      this.foundationalDataTypeFormBuider();
      this.hirarchyFormbuilder();
      const current_level_id = this.eventParentNode?.id;
      if (current_level_id) {
        this.getViewEditFoundationalData(current_level_id);
      }
      this.createHirarcheyLevelFG.patchValue({
        parent: this.eventParentNode?.id,
        hierrchy_level_name: this.toUpdateId ? this.editItem?.name : '',
        code: this.toUpdateId?this.editItem?.code : '',
        workflow: 'STANDARD',
        preferred_language: this.eventParentNode?.preferred_language,
        preferred_date_format: this.eventParentNode?.preferred_date_format,
        preferred_currency: this.eventParentNode?.preferred_currency,
        is_enabled: this.eventParentNode?.is_enabled,
        is_rate_card_enforced: this.eventParentNode?.is_rate_card_enforced,
        rate_model: this.eventParentNode?.rate_model,
        timesheet_type: this.eventParentNode?.pick_list_items ? this.eventParentNode?.pick_list_items : [],
      });
      this.selectedRateModel = this.eventParentNode?.rate_model,
      this.selectedTimesheet = this.eventParentNode?.pick_list_items ? this.eventParentNode?.pick_list_items : [],
      setTimeout(() => {
        this.createHirarcheyLevelFG.patchValue({
          managers: this.parentManagers.length > 0 ? this.parentManagers : []
        });
      }, 400);
      this.selectedParent = this.eventParentNode?.id;
    } else {
      this.resetForm();
      this.selectedFoundationalDataTypeIds = [];
    }
  }

  onClickToggle(toggle) {
    if (toggle === 'is_enabled') {
      if (this.toggles.is_enabled.value) {
        this.toggles.is_enabled.value = false;
        this.toggles.is_enabled.title = 'inactive';
      } else {
        this.toggles.is_enabled.value = true;
        this.toggles.is_enabled.title = 'active';
      }
      this.status = this.toggles.is_enabled.value;
      this.createHirarcheyLevelFG.patchValue({
        is_enabled: this.toggles.is_enabled.value
      });
    }
    else if (toggle === 'hide_show_root'){
      if(this.toggles.hide_show_root.value){
        this.toggles.hide_show_root.value = false;
      }
      else {
        this.toggles.hide_show_root.value = true;
      }
      this.hide_show_root = this.toggles.hide_show_root.value;
    }
    else {
      this.toggles.rate_card_enforce.value = !this.toggles.rate_card_enforce.value;
      this.createHirarcheyLevelFG.patchValue({
        is_rate_card_enforced: this.toggles.rate_card_enforce.value
      });
    }
  }

  foundationalTypeList(pageNo = 1) {
    let programId = this.programDetails['program_req_id'];
    this.subscriptions.push(this.programService.get(`/configurator/programs/${programId}/foundational-data-types`).subscribe(
      (data:any) => {
        if (data) {
          this.listOfFundationalDataType = data?.foundational_data_types;
        }
      },
      (err) => {
        this.alertService.error(errorHandler(err));
      }));
  }

  resetForm() {
    this.createHirarcheyLevelFG.reset();
    this.createHirarcheyLevelFG.patchValue({
      parent: this.eventParentNode?.id,
      is_enabled: this.toggles.is_enabled.value
    });
    this.selectedFoundationalDataTypeIds = [];
    this.isContactDetilsArr = [];
  }

  onContinue(event?) {
    this.isCustomeFieldButton = false;
    this.tabIndex++;
    if (this.tabIndex === 0) {
      this.tabIndex = 1 + this.tabIndex;
    }

    // during update.
    if (this.toUpdateId && this.tabIndex === 2) {
      if (this.createHirarcheyLevelFG.valid && this.foundDataTypeFG.valid) {
        const basicInfo = this.createHirarcheyLevelFG.value;
        const foundationalData = this.foundDataTypeFG.value;
        // const addressFormData = this.AddressContactDetailsComponent?.addressForm?.value;
        this.createHirarcheyLevel(basicInfo, foundationalData);
      } else {
        this.alertService.error('Please fill the required details.');
        this.tabIndex--;
      }
    }

    if (!this.toUpdateId) {
      if (this.createHirarcheyLevelFG.valid && this.foundDataTypeFG.valid) {
        const basicInfo = this.createHirarcheyLevelFG.value;
        const foundationalData = this.foundDataTypeFG.value;
        // const addressFormData = this.AddressContactDetailsComponent?.addressForm?.value;
        if (this.tabIndex === 2) {
          this.createHirarcheyLevel(basicInfo, foundationalData);
        }
      }
    }

  }

  onIndexChange(event?) {
    this.tabIndex = event;
    if (this.tabIndex === 0) {
      this.isCustomeFieldButton = true;
    } else {
      this.isCustomeFieldButton = false;
    }
  }

  checkParentNode() {
    let hirerchyList = this.storageService.get(HierarchyConfig[0]);
    return hirerchyList[0]?.id === this.eventParentNode?.id;
  }

  private foundationalDataList(input) {

    let programId = this.programDetails['program_req_id'];

    return this.programService.get(`/configurator/programs/${programId}/foundational-data-types/${this.searchingFoundationalTypeId}/foundational-data?k=${input}`);
  }

  getAutoSearch(foundationaldataId?) {
    this.subscriptions.push(this.foundationalInput.pipe(
      debounceTime(800),
      switchMap((term) => {
        this.loader[this.searchingFoundationalTypeId] = true;
        return this.foundationalDataList(term);
      })
    ).subscribe((data: any) => {

      this.loader[this.searchingFoundationalTypeId] = false;
      this.foundationalType[this.searchingFoundationalTypeId] = data?.foundational_data;

    }));
  }

  changeInput(event, foundationaldataId) {
    this.searchingFoundationalTypeId = foundationaldataId;
    this.loader[foundationaldataId] = true;
  }

  getfoundationalTypeItems(id?) {
    return this.foundationalType[id];
  }

  selectCurrency(event) {
    this.createHirarcheyLevelFG.controls['preferred_currency'].setValue(event);
  }

  private createHirarcheyLevel(basicInfo?, foundationalData?, contacts?) {

    let foundational_data_arr = [];
    for (let key in foundationalData) {
      foundational_data_arr = [...foundational_data_arr];
      if (foundationalData[key]) {
        foundational_data_arr.push(...foundationalData[key]);
      }
    }
    let payload = {
      'parent': this.eventParentNode.id,
      'name': basicInfo.hierrchy_level_name,
      'code': basicInfo?.code || '',
      'preferred_currency': null,
      'preferred_language': null,
      'preferred_date_format': basicInfo.preferred_date_format,
      'is_enabled': basicInfo.is_enabled,
      'foundational_data': foundational_data_arr,
      'managers': basicInfo.managers,
      'addresses': null,
      'contacts': null,
      "rate_model": this.selectedRateModel == "" ? false : this.selectedRateModel,
      "picklist_items" : null
    };

    if(this.isParent){
      payload['preferred_date_format'] =  basicInfo.preferred_date_format
      payload['is_hidden'] = this.hide_show_root;
    }
    if(!this.isParent){
      payload['is_rate_card_enforced'] =  null;
    }
      payload['industries'] = null;
      payload['countries'] = null;
      payload['time_zones'] = [];
      payload['currencies'] = null
      payload['defaults'] = [];

      if(!payload['time_zones']?.length && this.isParent) {
        delete payload['time_zones'];
      }

    let programId = this.programDetails['program_req_id'];
    if (this.toUpdateId) {
      this.subscriptions.push(this.programService.put(`/configurator/programs/${programId}/hierarchy/${this.toUpdateId}`, payload)
        .subscribe(
          (resp:any) => {
            if (resp) {
              this.sidebarClose();
              this.alertService.success('Hierarchy level updated successfully..');
            }
          },
          (error) => {
            this.alertService.error(errorHandler(error));
          }
        ));
    } else {
      this.subscriptions.push(this.programService.post(`/configurator/programs/${programId}/hierarchy`, payload)
        .subscribe(
          (resp:any) => {
            if (resp) {
              this.sidebarClose();
              this.alertService.success('Hierarchy level created successfully..');
            }
          },
          (error) => {
            this.alertService.error(errorHandler(error));
          }
        ));
    }

  }

  private getViewEditFoundationalData(current_level_id) {
    let programId = this.programDetails['program_req_id'];
    this.subscriptions.push(this.programService.get(`/configurator/programs/${programId}/hierarchy/${current_level_id}`)
      .subscribe(
        (resp:any) => {
          if (resp) {

            const hierarchies = resp?.hierarchy;
            if(hierarchies.managers) {
              hierarchies.managers.forEach(item => {
                this.parentManagers.push(item?.user_id);
              });
            }

            let foundational_data_types = hierarchies?.foundational_data_types;
            foundational_data_types?.forEach((element, key) => {
              this.foundationalType[element?.id] = element?.foundational_data;
              var ids = [];
              for (let items of element?.foundational_data) {
                ids.push(items.id);
              }
              this.selectedFoundationalDataTypeIds[element?.id] = ids;
            });
              const editAddressInfo = hierarchies.addresses.length > 0 ? hierarchies.addresses : [];
              const primaryAdress = editAddressInfo[0] !== undefined && editAddressInfo[0]?.address_type === 'PRIMARY' ? editAddressInfo[0] : (editAddressInfo[1]?.address_type == 'PRIMARY' ? editAddressInfo[1] : '');
              const secondaryAdress = editAddressInfo[0] !== undefined && editAddressInfo[0]?.address_type === 'SECONDARY' ? editAddressInfo[0] : (editAddressInfo[1]?.address_type == 'SECONDARY' ? editAddressInfo[1] : '');
              const editContactInfo = hierarchies.contact_info?.length > 0 ? hierarchies?.contact_info : '';

              let get_index = function(cehck) {
                return editContactInfo?.filter(e => {
                  if (e.member_type == cehck) {
                    return editContactInfo.indexOf(e.member_type);
                  }
                });
              };
              const primaryContact = get_index('PRIMARY')[0] !== undefined ? get_index('PRIMARY')[0] : '';
              const secondaryContact = get_index('SECONDARY')[0] !== undefined ? get_index('SECONDARY')[0] : '';

              this.isContactDetilsArr = [];
              this.isContactDetilsArr.push({
                  primary: {
                    label: 'edit',
                    address_line1: primaryAdress.address_line1,
                    address_line2: primaryAdress.address_line2,
                    address_type: primaryAdress.address_type,
                    city: primaryAdress.city,
                    country: primaryAdress.country,
                    state: primaryAdress.state,
                    zipcode: primaryAdress.zipcode
                  }
                },
                {
                  secondary: {
                    label: 'edit',
                    address_line1: secondaryAdress.address_line1,
                    address_line2: secondaryAdress.address_line2,
                    address_type: secondaryAdress.address_type,
                    city: secondaryAdress.city,
                    country: secondaryAdress.country,
                    state: secondaryAdress.state,
                    zipcode: secondaryAdress.zipcode
                  }
                },
                {
                  primarycontacts: {
                    email: primaryContact?.contact_email,
                    first_name: primaryContact?.contact_name,
                    phone: primaryContact?.contact_phone,
                    isd_code : primaryContact?.isd_code,
                    phoneFomat : primaryContact?.iso2_code,
                    designation: primaryContact?.title
                  }
                },
                {
                  secondarycontacts: {
                    email: secondaryContact?.contact_email,
                    first_name: secondaryContact?.contact_name,
                    phone: secondaryContact?.contact_phone,
                    isd_code : secondaryContact?.isd_code,
                    secondary_phoneFomat : secondaryContact?.iso2_code,
                    designation: secondaryContact?.title
                  }
                }); //data pushed..
          }
        },
        (error) => {
          this.sidebarClose();
          this.alertService.error(errorHandler(error));
        }
      ));
  }

  getHierarchyParentByLevel(parentLevel) {
    this.ParentsArray = []
    let programId = this.programDetails['program_req_id'];
    for(let i=1;i<=parentLevel;i++){
      this.subscriptions.push(
        this.programService.get(`/configurator/programs/${programId}/hierarchy?hierarchy_level=${i}`)
        .subscribe((data:any) => {
          if (data) {
            this.ParentsArray = [... this.ParentsArray , ...data?.result[0]?.hierarchies];
          }
        }
      ));
    }
  }

  getAllFoundationalData(searchingFoundationalTypeId) {
    let programId = this.programDetails['program_req_id'];
    this.searchingFoundationalTypeId = searchingFoundationalTypeId
    this.loader[this.searchingFoundationalTypeId] = true;
    this.subscriptions.push(this.programService.get(`/configurator/programs/${programId}/foundational-data-types/${this.searchingFoundationalTypeId}/foundational-data?k=`).subscribe((data: any) => {
      if (data) {
        this.foundationalType[this.searchingFoundationalTypeId] = data?.foundational_data;
      }
    }));
    this.loader[this.searchingFoundationalTypeId] = false;
  }

  changeParent(event) {
    this.eventParentNode = this.ParentsArray.find(h => h?.id === event.id);
    this.selectedParent = event.id;
  }

  changeRatemodel(model) {
    if (this.selectedRateModel == model) {
      this.selectedRateModel = ""
    }
    else {
      this.selectedRateModel = model
    }
    this.createHirarcheyLevelFG.patchValue({
      rate_model: this.selectedRateModel,
      timesheet_type: this.selectedTimesheet
    });
  }

  hide() {
    return true;
  }

  get hierarchyCodeValidationError(): string {
    if(this.createHirarcheyLevelFG) {

      const codeForm: AbstractControl = this.createHirarcheyLevelFG?.get('code');
      let length: number = codeForm?.value?.length;
      if(!length) {
        return 'This field is required';
      }
  
      if(length < 4) {
        return 'Minimum 4 characters required';
      }
  
      if(length > 20) {
        return 'Maximum 20 characters allowed';
      }
    }

    return null;
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
