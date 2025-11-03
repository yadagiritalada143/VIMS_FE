import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { debounceTime, Subscription, switchMap } from 'rxjs';
import { GlobalConstants } from 'src/app/shared/globalconstants';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { CustomFieldsComponent } from 'src/app/library/custom-fields/custom-fields/custom-fields.component';
import { CommonService } from 'src/app/library/custom-fields/common.service';

@Component({
  selector: 'app-create-hierarchy-config',
  templateUrl: './create-hierarchy.component.html',
  styleUrls: ['./create-hierarchy.component.scss']
})
export class CreateHierarchyComponent implements OnInit, OnDestroy {

  public subscriptions: Subscription[] = [];
  selectedParentHierarchy: any;
  sameAsParent: boolean;
  hierarchyName: string;
  hierarchyCode: string = '';
  statusToggle: boolean = true;
  preferred_language: any;
  preferred_currency: any;
  preferred_date_format: any;
  workflow: any = 'STANDARD';
  enforceRateCard: boolean = false;
  ratemodel: any;
  selectedTimesheet: any = [];
  primaryCountry: any;
  secondaryCountry: any;
  primaryAddress: any;
  secondaryAddress: any;
  pageTitle: any = "Create New Hierarchy";
  primaryContactDetails: any = {
    name: null,
    title: null,
    email: null,
    phone: null,
    isd_code: null,
    iso_code2: 'GL'
  }
  secondaryContactDetails: any = {
    name: null,
    title: null,
    email: null,
    phone: null,
    isd_code: null,
    iso_code2: 'GL'
  }
  is_hidden: boolean = false;
  public currencyList = ['USD','GBP', 'AUD', 'INR'];
  public timesheetType = [];
  public defaultSelectedOrNot: boolean = false;
  public listOfFundationalDataType: any = [];
  public foundDataTypeFG: UntypedFormGroup;
  public selectedFoundationalDataTypeIds = [];
  public searchingFoundationalTypeId;
  public parentManagers = [];
  public localizationSameAsparent: boolean = false;
  public preferencesSameAsparent: boolean = false;
  public masterDataSameAsparent: boolean = false;
  public hierarchies: any;
  public languages = [
    {key: 'en-US', value: 'English (United States)'},
    {key: 'en-UK', value: 'English (United Kingdom)'},
    {key: 'en-CA', value: 'English (Canada)'},
    {key: 'SPA', value: 'Spanish'},
    {key: 'Fr', value: 'French'}
  ];

  public codePattern: RegExp = /^[a-zA-Z0-9\-_]{0,}$/gm;
  public dateFormats = GlobalConstants?.defaultDateFormat?.filter((dates: string) => dates == DATE_FORMAT.FORMATMDY || dates == DATE_FORMAT.FORMATDDMMYY || dates == DATE_FORMAT.FORMATYYMMDD);
  public allCountryList: any = [];
  public isEdit: boolean = false;
  public parent: any;
  hierarchyListData: any = [];
  foundationalInput = new EventEmitter<string>();
  loader = [];
  foundationalType = [];

  @ViewChild(CustomFieldsComponent) cfCmp: CustomFieldsComponent;
  public updatedCFs: Array <any>;
  public recievedCFs: Array <any>;
  public isCFValid: boolean = true;

  constructor(
    private storageService: StorageService,
    private programService: ProgramService,
    private alert: AlertService,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private loaderS: LoaderService,
    private router: SvmsRouterService,
    private changeDetector: ChangeDetectorRef,
    private cfService: CommonService
  ) { }

  ngOnInit(): void {
    this.getAllCountry();
    this.parent = this.storageService.get("hierarchyDataEdit");
    if(this.route.snapshot?.routeConfig?.path?.includes('edit')){
      this.clearFields();
      this.isEdit = true;
      this.pageTitle = `Edit ${this.parent?.name}`;
      this.hierarchyName = this.parent?.name || '';
      this.hierarchyCode = this.parent?.code || '';
      this.statusToggle = this.parent?.is_enabled;
      this.is_hidden = this.parent?.is_hidden;
      if(!this.isParent){
        this.selectedParentHierarchy = this.parent?.parent_id;
      }
      this.gethierarchyData(this.parent?.id);
    }
    this.getTimeSheetType();
    this.foundationalTypeList();
    this.getAutoSearch();
    this.hierarchyList();
  }

  ngAfterViewChecked(){ this.changeDetector.detectChanges(); }

  getAllCountry(){
    this.subscriptions.push(this.programService.get(`/configurator/resources/countries?limit=300`).subscribe(
      (data:any) => {
        this.allCountryList = data.countries;
        if(this.isEdit) {
          let hierarchy = this.storageService.get("hierarchyDataEdit");
          let addresses = hierarchy?.addresses;
          if(addresses?.length>0){
            this.primaryAddress = addresses[0]?.address_line1;
            for(let i=0;i<this.allCountryList?.length;i++){
              if(addresses[0]?.country == this.allCountryList[i]?.name){
                this.primaryCountry = this.allCountryList[i]?.id;
                break;
              }
            }
          }
          if (addresses?.length > 1) {
            addresses?.sort(function (a: any, b: any) {
              if (a.address_type < b.address_type)
                return -1;
              if (a.address_type > b.address_type)
                return 1;
              return 0;
            });
            this.primaryAddress = addresses[0]?.address_line1;
            this.secondaryAddress = addresses[1]?.address_line1;
            for(let i=0;i<this.allCountryList?.length;i++){
              if(addresses[0]?.country == this.allCountryList[i]?.name){
                this.primaryCountry = this.allCountryList[i]?.id;
              }
              if(addresses[1]?.country == this.allCountryList[i]?.id){
                this.secondaryCountry = this.allCountryList[i]?.id;
              }
            }
          }
        }
      }
    ));
  }

  sameAsParentToggleLevel = (toggleValue: any) => {
    switch(toggleValue) {
      case 'localization':
        this.localizationSameAsparent = !this.localizationSameAsparent;
        if(this.localizationSameAsparent) {
            this.localizationSet(this.hierarchies);
        }
        break;
      case 'preferences':
        this.preferencesSameAsparent = !this.preferencesSameAsparent;
        if(this.preferencesSameAsparent) {
          this.preferencesSet(this.hierarchies);
        }
        break;
      case 'master_data':
        this.masterDataSameAsparent = !this.masterDataSameAsparent;
        if(this.masterDataSameAsparent) {
          this.masterDataSet(this.hierarchies);
        }
        break;
    }
  }

  hierarchyList = () => {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    this.subscriptions.push(this.programService.get(`/configurator/programs/${programId}/hierarchy`).subscribe(
      (data: any) => {
        if (data) {
          this.hierarchyListData = [];
          this.flattenHierarchy(data.result[0].hierarchies);
          if(!this.isEdit){
            this.selectedParentHierarchy = this.hierarchyListData[0]?.id;
            this.gethierarchyData(this.selectedParentHierarchy);
            this.parentManagers = [];
            this.hierarchyListData[0]?.managers.forEach((item: any) => {
              this.parentManagers.push(item?.user_id);
            });
          }
          else {
            this.hierarchyListData = this.hierarchyListData?.filter((hierarchy: any) => (hierarchy?.hierarchy_level <= this.parent?.hierarchy_level)&&(hierarchy?.id != this.parent?.id));
          }
        }
      }));
  }

  private gethierarchyData(current_level_id: any) {
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    if(!this.isEdit){
      this.clearFields();
      let hierarchy = this.hierarchyListData?.find((hierarchy: any) => hierarchy?.id == current_level_id);
      let addresses = hierarchy?.addresses;
      if(addresses?.length>0){
        this.primaryAddress = addresses[0]?.address_line1;
        for(let i=0;i<this.allCountryList?.length;i++){
          if(addresses[0]?.country == this.allCountryList[i]?.name){
            this.primaryCountry = this.allCountryList[i]?.id;
            break;
          }
        }
      }
      if (addresses?.length > 1) {
        addresses?.sort(function (a: any, b: any) {
          if (a.address_type < b.address_type)
            return -1;
          if (a.address_type > b.address_type)
            return 1;
          return 0;
        });
        this.primaryAddress = addresses[0]?.address_line1;
        this.secondaryAddress = addresses[1]?.address_line1;
        for(let i=0;i<this.allCountryList?.length;i++){
          if(addresses[0]?.country == this.allCountryList[i]?.name){
            this.primaryCountry = this.allCountryList[i]?.id;
          }
        if(addresses[1]?.country == this.allCountryList[i]?.id){
          this.secondaryCountry = this.allCountryList[i]?.id;
        }
        }
      }
    }
    this.loaderS.show();
    let url: string = `/configurator/programs/${programId}/hierarchy/${current_level_id}?return_custom_fields=true`;
    this.subscriptions.push(this.programService.get(url)
      .subscribe({
        next: (resp:any) => {
          if (resp) {

            const hierarchies = resp?.hierarchy;
            this.hierarchies = resp?.hierarchy;
            if(hierarchies.managers) {
              this.parentManagers = [];
              hierarchies.managers.forEach((item: any) => {
                this.parentManagers.push(item?.user_id);
              });
            }

            if(hierarchies) {
              if(this.isEdit){
                this.localizationSet(hierarchies);
                this.preferencesSet(hierarchies);
                this.masterDataSet(hierarchies);
                this.cfService.queueCFpopulation(hierarchies?.['custom_fields'] || {}, this.cfCmp).then((cfs: any) => {
                  this.recievedCFs = cfs;
                });
              }

              let contact_info = hierarchies?.contact_info?.filter((contact: any) => (contact?.member_type == 'PRIMARY' || contact?.member_type == 'SECONDARY'));
              if(contact_info?.length > 0){
                this.primaryContactDetails = {
                  name: contact_info[0]?.contact_name,
                  email: contact_info[0]?.contact_email,
                  isd_code: contact_info[0]?.isd_code,
                  iso_code2: contact_info[0]?.iso2_code,
                  title: contact_info[0]?.title,
                  phone: contact_info[0]?.contact_phone
                }
              }
              if (contact_info?.length > 1) {
                contact_info?.sort(function (a: any, b: any) {
                  if (a.member_type < b.member_type)
                    return -1;
                  if (a.member_type > b.member_type)
                    return 1;
                  return 0;
                });
                this.primaryContactDetails = {
                  name: contact_info[0]?.contact_name,
                  email: contact_info[0]?.contact_email,
                  isd_code: contact_info[0]?.isd_code,
                  iso_code2: contact_info[0]?.iso2_code,
                  title: contact_info[0]?.title,
                  phone: contact_info[0]?.contact_phone
                }
                this.secondaryContactDetails = {
                  name: contact_info[1]?.contact_name,
                  email: contact_info[1]?.contact_email,
                  isd_code: contact_info[1]?.isd_code,
                  iso_code2: contact_info[1]?.iso2_code,
                  title: contact_info[1]?.title,
                  phone: contact_info[1]?.contact_phone
                }
              }
            }
          }
          this.loaderS.hide();
        },
        error: (error) => {
          this.sameAsParent = false;
          this.localizationSameAsparent = false;
          this.preferencesSameAsparent = false;
          this.masterDataSameAsparent = false;
          this.loaderS.hide();
          this.alert.error(errorHandler(error));
        }
    }));
  }

  masterDataSet(hierarchies: any) {
    let foundational_data_types = hierarchies?.foundational_data_types;
    foundational_data_types?.forEach((element: any, key: any) => {
      this.foundationalType[element?.id] = element?.foundational_data;
      var ids = [];
      for (let items of element?.foundational_data) {
        ids.push(items.id);
      }
      this.selectedFoundationalDataTypeIds[element?.id] = ids;
    });
  }

  preferencesSet(hierarchies: any) {
    this.enforceRateCard = hierarchies?.is_rate_card_enforced;
    this.selectedTimesheet = hierarchies?.pick_list_items?.map((timesh: any) => {return timesh?.id});
    if(!hierarchies?.pick_list_items || hierarchies?.pick_list_items?.length == 0){
      this.selectedTimesheet = [];
    }
    this.ratemodel = hierarchies?.rate_model;
  }

  localizationSet(hierarchies: any) {
    this.preferred_date_format = hierarchies?.preferred_date_format;
    this.preferred_currency = hierarchies?.preferred_currency;
    this.preferred_language = hierarchies?.preferred_language;
  }

  sameAsParentToggle(same: boolean) {
    this.sameAsParent = same;
    if(same){
      this.gethierarchyData(this.selectedParentHierarchy);
    }
  }

  enforceRateCardToggle(rate: boolean) {
    this.enforceRateCard = rate;
  }

  changeStatus(status: any){
    switch(status){
      case 'statusToggle': this.statusToggle = !this.statusToggle; break;
      case 'is_hidden': this.is_hidden = !this.is_hidden; break;
    }

  }

  flattenHierarchy = (hierarchies: any) => {
    if (hierarchies?.length < 1) {
      return;
    }
    hierarchies?.forEach((hierarchy: any) => {
      this.hierarchyListData.push(hierarchy);
      this.flattenHierarchy(hierarchy?.hierarchies);
    })
  }

  changeParent(parentChange: any) {
    this.selectedParentHierarchy = parentChange?.id;
    this.gethierarchyData(this.selectedParentHierarchy);
    this.parentManagers = [];
    parentChange?.managers.forEach((item: any) => {
      this.parentManagers.push(item?.user_id);
    });
    this.clearFields();
    if(this.sameAsParent){
      this.gethierarchyData(this.selectedParentHierarchy);
    }
  }

  clearFields() {
    this.preferred_date_format = null;
    this.preferred_currency = null;
    this.preferred_language = null;
    this.enforceRateCard = false;
    this.selectedTimesheet = [];
    this.ratemodel = null;
    this.selectedTimesheet = [];
    this.primaryCountry = null;
    this.primaryAddress = null;
    this.secondaryAddress = null;
    this.secondaryCountry = null;
    this.selectedFoundationalDataTypeIds = [];
    this.primaryContactDetails = {
      name: null,
      title: null,
      email: null,
      phone: null,
      isd_code: null,
      iso_code2: 'GL'
    }
    this.secondaryContactDetails = {
      name: null,
      title: null,
      email: null,
      phone: null,
      isd_code2: 'GL'
    }
  }

  selectCurrency(currency: any) {
    this.preferred_currency = currency;
  }

  getTimeSheetType() {
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.programService.get(`/configurator/programs/${programId}/pick-lists/*/items?picklist_slug=timesheet_type`)
      .subscribe((res: any) => {
        const { picklist_items } = res;
        picklist_items.forEach(element => {
          this.timesheetType.push(element)
        });
      })
  }

  selectAllTimesheet() {
    this.selectedTimesheet = [];
    this.selectedTimesheet = this.timesheetType?.map((timesheet: any) => {return timesheet?.id});
  }

  timesheetSelection(timesheet: any){
    if(this.selectedTimesheet?.includes(timesheet)){
      this.selectedTimesheet = this.selectedTimesheet?.filter((time_id: any) => time_id != timesheet);
    }
    else{
      this.selectedTimesheet.push(timesheet);
    }
  }

  foundationalTypeList(pageNo = 1) {
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.subscriptions.push(this.programService.get(`/configurator/programs/${programId}/foundational-data-types?active=true`).subscribe(
      { next: (data:any) => {
        if (data) {
          this.listOfFundationalDataType = data?.foundational_data_types;
          this.foundationalDataTypeFormBuider();
        }
      },
      error: (err) => {
        this.alert.error(errorHandler(err));
      }}));
  }

  private createFormControl() {
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

  foundationalDataTypeFormBuider() {
    const getFormControl = this.createFormControl();
    this.foundDataTypeFG = this.fb.group(getFormControl);
  }

  private foundationalDataList(input: any) {
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.programService.get(`/configurator/programs/${programId}/foundational-data-types/${this.searchingFoundationalTypeId}/foundational-data?active=true&k=${input}`);
  }

  getAutoSearch(foundationaldataId?: any) {
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

  getAllFoundationalData(searchingFoundationalTypeId: any) {
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.searchingFoundationalTypeId = searchingFoundationalTypeId
    this.loader[this.searchingFoundationalTypeId] = true;
    this.subscriptions.push(this.programService.get(`/configurator/programs/${programId}/foundational-data-types/${this.searchingFoundationalTypeId}/foundational-data?active=true&k=`).subscribe((data: any) => {
      if (data) {
        this.foundationalType[this.searchingFoundationalTypeId] = data?.foundational_data;
      }
    }));
    this.loader[this.searchingFoundationalTypeId] = false;
  }

  changeInput(event: any, foundationaldataId: any) {
    this.searchingFoundationalTypeId = foundationaldataId;
    this.loader[foundationaldataId] = true;
  }

  getfoundationalTypeItems(id?: any) {
    return this.foundationalType[id];
  }

  primaryCountryChange(country: any) {
    this.primaryCountry = country;
  }

  secondaryCountryChange(country: any) {
    this.secondaryCountry = country;
  }

  primaryAddressChange(address: any) {
    this.primaryAddress = address;
  }

  secondaryAddressChange(address: any) {
    this.secondaryAddress = address;
  }

  primaryContactDetailsChange(details: any) {
    details['isd_code']=this.allCountryList?.find((country: any) => country?.iso_code_2 == details?.iso_code2)?.isd_code;
    this.primaryContactDetails = details;
  }

  secondaryContactDetailsChange(details: any) {
    details['isd_code']=this.allCountryList?.find((country: any) => country?.iso_code_2 == details?.iso_code2)?.isd_code;
    this.secondaryContactDetails = details;
  }

  isValid(): boolean {
    // if(this.foundDataTypeFG?.invalid) {
    //   return false
    // }
    if(!this.hierarchyName || this.hierarchyName == ""){
      return false;
    }

    if(this.hierarchyValidationError(this.hierarchyCode)) {
      return false;
    }

    if(!this.preferred_date_format || this.preferred_date_format == ""){
      return false;
    }
    // if(!this.preferred_currency || this.preferred_currency == ""){
    //   return false;
    // }
    // if(!this.preferred_language || this.preferred_language == ""){
    //   return false;
    // }
    // if(!this.selectedTimesheet || this.selectedTimesheet?.length == 0){
    //   return false;
    // }
    // if(!this.workflow || this.workflow == ""){
    //   return false;
    // }

    if(!this.isCFValid)
      return false;

    return true;
  }

  get isParent() {
    return this.parent?.hierarchy_level == 1;
  }

  goBack() {
    this.router.navigate(['program', 'hierarchy', 'list']);
  }

  createHierarchy() {

    let foundational_data_arr = [];
    let foundationalData = this.selectedFoundationalDataTypeIds;
    for (let key in foundationalData) {
      foundational_data_arr = [...foundational_data_arr];
      if (foundationalData[key]) {
        foundational_data_arr.push(...foundationalData[key]);
      }
    }
    let payload = {
      'parent': this.selectedParentHierarchy,
      'name': this.hierarchyName,
      'code': this.hierarchyCode,
      'preferred_currency': null,
      'preferred_language': null,
      'preferred_date_format': this.preferred_date_format,
      'is_enabled': this.statusToggle,
      'foundational_data': foundational_data_arr,
      'managers': this.parentManagers,
      'addresses': null,
      'contacts': null,
      "rate_model": this.ratemodel == "" ? false : this.ratemodel,
      "picklist_items" : null
    };

    this.cfCmp?.onEmit();
    if(!this.isCFValid) {
      this.alert.error('Please specify all the required Custom Fields!');
      return;
    } else {
      payload['custom_fields'] = this.cfService.amendCFData(this.updatedCFs);
    }

    if(this.isParent){
      payload['is_hidden'] = this.is_hidden;
      delete payload['parent'];
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

    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.loaderS.show();
    if (this.isEdit) {
      this.subscriptions.push(this.programService.put(`/configurator/programs/${programId}/hierarchy/${this.parent.id}`, payload)
        .subscribe({
          next: (resp:any) => {
            if (resp) {
              this.storageService.set('hierarchyData', {
                id: resp?.id, 
                parent_name: this.parent?.parent_name,
                parent_id: this.parent?.parent_id
              });

              this.alert.success('hierarchy_level_updated_successfully');
              this.router.navigate(['program', 'hierarchy','view']);
            }
            this.loaderS.hide();
          },
          error: (error) => {
            this.loaderS.hide();
            this.alert.error(errorHandler(error));
          }
      }));
    } else {
      this.subscriptions.push(this.programService.post(`/configurator/programs/${programId}/hierarchy`, payload)
        .subscribe({
          next: (resp:any) => {
            if (resp) {
              this.storageService.set('hierarchyData', {
                id: resp?.id, 
                parent_name: this.parent?.parent_name,
                parent_id: this.parent?.parent_id
              });

              this.alert.success('hierarchy_level_created_successfully');
              this.router.navigate(['program', 'hierarchy','view']);
            }
            this.loaderS.hide();
          },
          error: (error) => {
            this.loaderS.hide();
            this.alert.error(errorHandler(error));
          }
      }));
    }

  }

  hide() {
    return true;
  }

  hierarchyValidationError(control?: AbstractControl | string | any) {

    if(typeof(control) === 'string') {
      return this.hierarchyValidationErrorHelper(control?.length);
    }

    const isControlValid: boolean = (control instanceof AbstractControl);
    const touched: boolean = control?.touched;
    const length: number = control?.value?.length;

    if(isControlValid && touched) {
      return this.hierarchyValidationErrorHelper(length);
    }

    return null;
  }


  private hierarchyValidationErrorHelper(length: number) {
    if(!length) {
      return 'This field is required';
    }

    if(length < 4) {
      return 'Minimum 4 characters required';
    }

    if(length > 10) {
      return 'Maximum 10 characters allowed';
    }
  }

  ngOnDestroy(): void {
    this.storageService.remove('hierarchyDataEdit');
    this.parent = null;
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
