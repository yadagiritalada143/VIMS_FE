import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramSetupService } from 'src/app/program-setup/program-setup.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ProgramService } from '../../programs/program.service';
import { CustomFieldsComponent } from 'src/app/library/custom-fields/custom-fields/custom-fields.component';
import { CommonService } from 'src/app/library/custom-fields/common.service';

@Component({
  selector: 'app-onbaord-setup',
  templateUrl: './onbaord-setup.component.html',
  styleUrls: ['./onbaord-setup.component.scss']
})
export class OnbaordSetupComponent implements OnInit {

  @ViewChild(CustomFieldsComponent) cfCmp: CustomFieldsComponent;
  public updatedCFs: Array <any>;
  public recievedCFs: Array <any>;
  public isCFValid: boolean = true;

  private subscriptions = [];
  basicInfo = true;
  financialDetail = false;
  jobDetails = false;
  references = false;
  isView = false;
  isEditReference=false;
  isEditDiversity=false;
  isEditContact=false;
  isEditAddress=false;
  showContactAction = -1;
  showAddressAction = -1;
  showDiversityAction = -1;
  showReferencesAction = -1;
  isUrlvalid = true
  billingAddressLength;
  isPrimaryContactLength;
  index;
  vendorId;
  programId;
  public toggle = {
    title: 'active',
    value: true
  }
  visiblePanel: any = 'basicInfo';
  public allCountryList = [];
  dataToEditReference:any = {};
  dataToEditDiversityList:any = {};
  finalDiversityList:any = []
  finalContactList:any = []
  finalAddressList:any = []
  dataToEditContactList:any = []
  dataToEditAddressList:any = []
  basicInforForm: UntypedFormGroup = this.fb.group({
    is_enable: [true],
    name: ['', [Validators.required]],
    description: [],
    year_of_establishment: [],
    business_ownership: [],
    website: [],
    size_of_business: [],
    social_profiles: this.fb.array([]),
    labor_categories: [],
    work_locations: [],
    supplier_reference: ['', [Validators.pattern('^[A-Za-z0-9]{10}$')]],
    supplier_connection_id: ['', [Validators.pattern('^[A-Za-z0-9]{10}$')]],
    addresses: this.fb.array([]),
    contacts: this.fb.array([]),
    diversities: this.fb.array([])
  });
  financialForm: UntypedFormGroup = this.fb.group({
    tax_type: [],
    tax_number: ['', [Validators.pattern('^[A-Za-z0-9]*$')]],
    bank_name: [],
    bank_routing_number: ['',[Validators.pattern('^[A-Za-z0-9]*$')]],
    bank_account_number: ['',[Validators.pattern('^[A-Za-z0-9]*$')]]
  });
  diversityForm: UntypedFormGroup;
  referenceForm: UntypedFormGroup;
  termsAndConditionAccepted = false;
  businessOwnershipList = [
    'Public Limited Company',
    'Private Limited Company'
  ];
  taxIdType = [
    // 'GSTIN',
    // 'Fedderal Tax Id'
  ]
  businessSize = [
    '0 – 100',
    '101 - 500',
    '501 – 1000',
    '1001+'
  ];
  requiredDocList: any[] = [];
  addAddressVisibility = 'hidden';
  addDiversityVisibility = 'hidden';
  addReferenceVisibility = 'hidden';
  addContactVisibility = 'hidden';
  showDragDropWindow = false;
  selectedDocIndex;
  labor_categories: any[] = [];
  workLocations: any[] = [];
  confirmAccountNumber: any = '';
  programDetail: any;
  constructor(
    private route: ActivatedRoute,
    private programService: ProgramSetupService,
    private fb: UntypedFormBuilder,
    private loader: LoaderService,
    private router: Router,
    private loaderService: LoaderService,
    private storageService : StorageService,
    private _programService: ProgramService,
    private alertService: AlertService,
    private cfService: CommonService
  ) { }

  ngOnInit(): void {


    this.getAllCountry();
    this.route.queryParamMap.subscribe(param => {
      this.vendorId = param.get('org_id') || this.storageService.get('ORG_ID');
      this.programId = param.get('program_id') || this.storageService.get('PROGRAM_ID');
      this.loadLocations();
      this.loadLaborCategories();
      this.loadVendorDetails();
      this.checkOnboardingStatus();
      let userType = this.storageService.get('user_type');
       if(userType === 'VENDOR') {
        //  this.isView = true;
        //  this.basicInforForm.disable();
       }
    })




    this.loadDocumentList();
    this.loadTaxIdList();
    this.getProgram();
  }


  get basicControl() {
    return this.basicInforForm.controls;
  }

  get financeControl() {
    return this.financialForm.controls;
  }
  get socialList() {
    return this.basicInforForm.get('social_profiles') as UntypedFormArray;
  }

  get addressList() {
    return this.basicInforForm.get('addresses') as UntypedFormArray;
  }

  get contactList() {
    return this.basicInforForm.get('contacts') as UntypedFormArray;
  }

  get diversitiesList() {
    return this.basicInforForm.get('diversities') as UntypedFormArray;
  }




  // socialForm(data) {
  //   return this.fb.group({
  //     type: [],
  //     link: []
  //   })
  // }
  checkOnboardingStatus() {
    this.loaderService.show('Loading...');
    this.programService.get(`/configurator/programs/${this.programId}/vendors/${this.vendorId}`)
      .subscribe({
        next: (res: any) => {
          const { program_vendor } = res;
          if (program_vendor.is_msa_signed) {
            this.loaderService.hide();
            if(this.basicInforForm && program_vendor?.supplier_reference) {
              this.basicInforForm.get('supplier_reference').setValue(program_vendor?.supplier_reference);
            }
            this.termsAndConditionAccepted = true;
            if (program_vendor.is_onboarded) {
              this.isView = true;
              this.basicInforForm.disable();
            }
          } else {
            this.termsAndConditionAccepted = false;
            this.loaderService.hide();
          }
        }, error: (err: Error) => {
          this.loaderService.hide()
        }
      })
  }

  loadLaborCategories() {
    this.programService.get('/configurator/resources/industries')
      .subscribe((res: any) => {
        const { industries } = res;
        this.labor_categories = industries;
      })
  }
  loadLocations() {
    this.programService.get(`/configurator/programs/${this.programId}/work-locations?status=true`)
      .subscribe((res: any) => {
        const { work_locations } = res;
        this.workLocations = work_locations;
      })
  }

  hideAddress(address) {
    return !address?.address_line1
      && !address?.address_line2
      && !address?.city
      && !address?.country
      && !address?.state
      && !address?.zipcode;
  }

  loadVendorDetails() {
    this.programService.get(`/configurator/organizations/${this.vendorId}`)
      .subscribe({
        next: (data: any) => {

          data.social_profiles = data.social_profiles ? data.social_profiles : [];
          if (data) {
            data.industries = data.industries.map(laborCategory => laborCategory.id)
            data['labor_categories'] = data?.industries;
            this.basicInforForm.patchValue(data);
            (data.addresses ? data.addresses : []).map(add => {
              add.sampleindex = -1
              add.is_billing = add?.billing ? add?.billing : false
              this.addItemAddress(add)
            });

            let myContacts = data.contacts?.filter(c => JSON.stringify(c.contact_numbers) != JSON.stringify({}));
            data.contacts = myContacts.length > 0 ? myContacts : [];

            (data.contacts ? data.contacts : []).map(contact => {
              contact.sampleindex = -1
              this.addItemContacts(contact)
            });
            (data.diversities ? data.diversities : []).map(diversity => {
              diversity.sampleindex = -1
              this.addItemDiversities({...diversity, category: {...diversity?.category, value: diversity?.category?.name}})
            });



            ((data.social_profiles && data.social_profiles.length) ? data.social_profiles : [{ type: '', link: '' }]).map(profile => {
              this.addItemSocial(profile)
            });
          }

        }, error: (error: Error) => {
          console.error(error);
        }
      }
    );

    this.programService.get(`/configurator/programs/${this.programId}/vendors/${this.vendorId}`)
      .subscribe({
        next: (data: any) => {
          if (data) {

            const program_vendor: any = data?.program_vendor || {};
            if('custom_fields' in program_vendor) {
              setTimeout(() => {
                this.cfService.queueCFpopulation(program_vendor['custom_fields'] || {}, this.cfCmp).then((cfs: any) => {
                  this.recievedCFs = cfs;
                });
              }, 1000);
            }

            this.financialForm.patchValue({
              tax_type: data.program_vendor.financials[0]?.tax_type,
              tax_number: data.program_vendor.financials[0]?.federal_tax_number,
              bank_name: data.program_vendor.financials[0]?.bank_name,
              bank_routing_number: data.program_vendor.financials[0]?.bank_routing_number,
              bank_account_number: data.program_vendor.financials[0]?.bank_account_number
            })
            this.confirmAccountNumber = data.program_vendor.financials[0]?.bank_account_number
            this.basicInforForm.patchValue({
              is_enable: data.program_vendor.is_enabled,
              supplier_reference: data.program_vendor.supplier_reference,
              supplier_connection_id: data.program_vendor.supplier_connection_id,
            })
          }

        }, error: (error: Error) => {
          console.error(error);
        }
      }
    );
  }

  loadDocumentList() {

    const http1 = this.programService.get(`/configurator/programs/${this.programId}/vendor-compliance/required-documents?vendor_id=${this.vendorId}`)
    // const http2 = this.programService.get(`/configurator/programs/${this.programId}/vendors/${this.vendorId}/compliance-documents`)
    forkJoin([http1])
      .subscribe((res: any) => {
        const { required_documents } = res[0];
        this.requiredDocList = required_documents;

        // res[1]?.compliance_documents?.forEach(uDoc => {
        //   let index = this.requiredDocList.findIndex(doc => {
        //     return uDoc?.required_document.id === doc.id;
        //   });
        //   if (index > -1) {
        //     this.requiredDocList[index].file_name = uDoc.file_name;
        //     this.requiredDocList[index].document_id = uDoc.id;
        //     this.requiredDocList[index].document_url = uDoc.url;
        //   }
        // });
      })
  }

  getProgram() {
    this.programService.get(`/configurator/programs/${this.programId}`)
    .subscribe((data: any) => {
      if(data) {
      this.programDetail = data.program;
      }
    });
  }

  loadTaxIdList() {
    this.programService.get(`/configurator/resources/tax_id_types`)
      .subscribe((data: any) => {
        const { tax_id_types } = data;
        this.taxIdType = tax_id_types;
      });
  }

  showContactDropdown(index){
    if(this.showContactAction == index){
      this.showContactAction = -1
    }else{
      this.showContactAction = index
    }
  }

  showAddressDropdown(index){
    if(this.showAddressAction == index){
      this.showAddressAction = -1
    }else{
      this.showAddressAction = index
    }
  }

  clickTodeleteAddress(index){
    this.finalAddressList.splice(index, 1)
    this.showAddressAction = -1
    this.billingAddressLength = this.finalAddressList.filter(e => e.billing == true).length
  }

  clickToEditAddress(address, index){
    this.addAddressVisibility = 'visible';
    this.showAddressAction = -1
    this.dataToEditAddressList = address
    this.dataToEditAddressList.editedIndex = index
    this.isEditAddress = true
  }

  showDiversityDropdown(index){
    if(this.showDiversityAction == index){
      this.showDiversityAction = -1
    }else{
      this.showDiversityAction = index;
    }
  }

  showReferencesDropdown(index){
    if(this.showReferencesAction == index){
      this.showReferencesAction = -1
    }else{
      this.showReferencesAction = index
    }
  }


  clickTodeleteDiversity(index){
    this.finalDiversityList.splice(index, 1)
    this.showDiversityAction = -1
  }

  clickToEditDiversity(reference, index){
    this.showDiversityAction = -1
    this.addDiversityVisibility = 'visible';
    this.dataToEditDiversityList = reference
    this.dataToEditDiversityList.editedIndex = index
    this.isEditDiversity = true
  }

  clickTodeleteContact(index){
    this.finalContactList.splice(index, 1)
    this.showContactAction = -1
    this.isPrimaryContactLength = this.finalContactList.filter(e => e.phone_numbers[0].label == "PRIMARY").length
  }

  clickToEditContact(reference, index){
    this.addContactVisibility = 'visible';
    this.showContactAction = -1
    this.dataToEditContactList = reference
    this.dataToEditContactList.editedIndex = index
    this.isEditContact = true
  }

  addNewSocial() {
    this.addItemSocial({})
  }

  getAllCountry() {
    this.subscriptions.push(
      this._programService.get(`/configurator/resources/countries?limit=300`)
        .subscribe((data: any) => {
          if (data) {
            this.allCountryList = data.countries;
          }
        }
      )
    );
  }

  addItemAddress(add) {
    if(add?.sampleindex == -1){
      this.finalAddressList.push({
        street_1: add?.address_line1 ? add?.address_line1 : "",
        street_2: add?.address_line2 ? add?.address_line2 : "",
        type: add?.address_type,
        city: add?.city,
        country: add?.country,
        state: add?.state,
        zipcode: add?.zipcode,
        billing: add?.is_billing ? true : false
      })
    }else{
      this.finalAddressList[add?.sampleindex] = {
        street_1: add?.address_line1 ? add?.address_line1 : "",
        street_2: add?.address_line2 ? add?.address_line2 : "",
        type: add?.address_type,
        city: add?.city,
        country: add?.country,
        state: add?.state,
        zipcode: add?.zipcode,
        billing: add?.is_billing ? true : false
      }
    }
    this.isEditAddress = false;
    this.billingAddressLength = this.finalAddressList.filter(e => e.billing == true).length
  }

  addItemDiversities(diver) {
    if(diver?.sampleindex == -1){
      this.finalDiversityList.push({
        country: diver?.country,
        contact_phone : "9070205462",
        category: diver?.category,
        certification: diver?.certification,
      })
    }else{
      this.finalDiversityList[diver?.sampleindex] = {
        country: diver?.country,
        contact_phone : "9070205462",
        category: diver?.category,
        certification: diver?.certification,
      }
    }
    this.isEditDiversity = false
  }

  clearDiversityArray = () => {
    this.finalDiversityList = []
  }




  addItemContacts(contact) {
    if(contact?.sampleindex == -1){
        this.finalContactList.push({
          email: contact?.email ? contact?.email : contact?.contact_email,
          first_name: contact?.first_name ? contact?.first_name : contact?.contact_name,
          last_name: contact?.last_name ? contact?.last_name : "",
          contact_name: contact?.contact_name ? contact?.contact_name : "",
          phone_numbers: [{
          "label" : contact?.label ? contact?.label : contact?.contact_numbers[0]?.label,
          "number" : contact?.contact_phone ? contact?.contact_phone : contact?.contact_numbers[0]?.number,
          "iso2_code" : contact?.phoneFormat ? contact?.phoneFormat  : contact?.contact_numbers[0]?.iso2_code,
          "iso_code" : contact?.phoneFormat ? this.allCountryList?.filter(t => t.iso_code_2 == contact?.phoneFormat)[0]?.isd_code : contact?.contact_numbers[0]?.isd_code,
          "ext": contact?.ext == undefined ? "" : contact?.ext
          }],
          type: contact?.member_type,
          title: contact?.title
        });
    }else{
        this.finalContactList[contact?.sampleindex] = {
          email: contact?.email ? contact?.email : contact?.contact_email,
          first_name: contact?.first_name ? contact?.first_name : contact?.contact_name,
          last_name: contact?.last_name ? contact?.last_name : "",
          contact_name: contact?.contact_name ? contact?.contact_name : "",
          phone_numbers: [{
          "label" : contact?.label ? contact?.label : contact?.contact_numbers[0]?.label,
          "number" : contact?.contact_phone ? contact?.contact_phone : contact?.contact_numbers[0]?.number,
          "iso2_code" : contact?.phoneFormat ? contact?.phoneFormat  : contact?.contact_numbers[0]?.iso2_code,
          "iso_code" : contact?.phoneFormat ? this.allCountryList?.filter(t => t.iso_code_2 == contact?.phoneFormat)[0]?.isd_code : contact?.contact_numbers[0]?.isd_code,
          "ext": contact?.ext == undefined ? "" : contact?.ext
          }],
          type: contact?.member_type,
          title: contact?.title
        };
    }
    this.isEditContact = false;
    this.isPrimaryContactLength = this.finalContactList.filter(e => e.phone_numbers[0].label == "PRIMARY").length
  }

  isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
  }

  addItemSocial(profile) {
    this.socialList.push(this.fb.group({
      type: [profile?.type],
      link: [profile?.link],
    }));
  }

  removeItemSocial(index) {
    this.socialList.removeAt(index);
  }


  onClickToggle() {
    this.basicInforForm.patchValue({
      is_enable: !this.basicControl.is_enable.value
    });
  }

  _onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
      this.clearDiversityArray();
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
  }
  goToBasic() {
    this.basicInfo = true;
    this.financialDetail = false;
    this.jobDetails = false;

  }

  removeSocial(index) {
    this.removeItemSocial(index)
  }

  goToFinancialDetail() {
    this.basicInfo = false;
    this.financialDetail = true;
    this.jobDetails = false;
  }

  goToJobDetails() {
    this.basicInfo = false;
    this.financialDetail = false;
    this.jobDetails = true;
  }


  next() {

    this.cfCmp?.onEmit();
    if(!this.isCFValid) {
      this.alertService.error('Please specify all required Custom Fields correctly');
      return;
    }

    if (this.disableSubmit) {
      return;
    }
    switch (this.visiblePanel) {
      case 'basicInfo':
        (!this.basicInforForm.get("labor_categories").value || this.basicInforForm.get("labor_categories").value.length <= 0) ? this.alertService.error("Please slect labor category") :  (this.basicInforForm.get('website').touched && this.basicInforForm.get('website').value && (this.basicInforForm.get('website').errors?.pattern || this.basicInforForm.get('website').invalid)) ?  this.alertService.error("Please enter valid URL for company website") : this.finalContactList.filter(e => e.phone_numbers[0].label == "PRIMARY").length == 0 && this.isView == false ? this.alertService.error("Please select one contact as primary")  : this.finalAddressList.length == 0 && this.isView == false ? this.alertService.error("Please add at least one address") : this.finalAddressList.length && this.isView == false? this.finalAddressList.filter(e => e.billing == true).length == 0  ? this.alertService.error("Please select at least one billing address") : this.finalAddressList.filter(e => e.billing == true).length > 1 ? this.alertService.error("Multiple billing addresses are not allowed") : this.visiblePanel = 'financialDetail' : this.visiblePanel = 'financialDetail'
        break;
      case 'financialDetail':
        this.visiblePanel = 'jobDetails'
        break;
      case 'jobDetails':
        this.finalContactList.filter(e => e.phone_numbers[0].label == "PRIMARY").length == 0 && this.isView == false ? this.alertService.error("Please select one contact as primary")  : this.finalAddressList.length == 0 && this.isView == false ? this.alertService.error("Please add at least one address") : this.finalAddressList.length && this.isView == false? this.finalAddressList.filter(e => e.billing == true).length == 0  ? this.alertService.error("Please select at least one billing address") : this.finalAddressList.filter(e => e.billing == true).length > 1 ? this.alertService.error("Multiple billing addresses are not allowed") : this.submit() : this.submit();
        break;

      default:
        break;
    }
  }

  finishedClass(panel) {
    let finished = false;
    switch (panel) {
      case 'basicInfo':
        finished = (this.visiblePanel == 'jobDetails')  || (this.visiblePanel == 'financialDetail')
        break;
      case 'financialDetail':
        finished = (this.visiblePanel == 'jobDetails')
        break;
      default:
        break;
    }

    return finished;
  }

  addressClosed() {
    this.addAddressVisibility = 'hidden';
    this.isEditAddress  =false
    this.showAddressAction = -1
  }

  onFileDropped(files: Array<any>) {
    this.handleUpload({
      target: {
        files: files
      }
    });
  }

  showAddAddress() {
    this.addAddressVisibility = 'visible';
    // if(data) {}
  }

  contactClosed() {
    this.addContactVisibility = 'hidden';
    this.isEditContact  =false
    this.showContactAction = -1
  }

  showContactSidebar() {
    this.addContactVisibility = 'visible';
    this.isPrimaryContactLength = this.finalContactList.filter(e => e.phone_numbers[0].label == "PRIMARY").length
  }

  // diversity

  diversityClosed() {
    this.addDiversityVisibility = 'hidden';
    this.isEditDiversity  =false
    this.showDiversityAction = -1
  }

  showdDiversitySidebar() {
    this.addDiversityVisibility = 'visible';
  }

  addDiversiry(div) {
    this.diversityClosed();
    this.addItemDiversities(div);
  }


  referenceClosed() {
    this.addReferenceVisibility = 'hidden';
    this.isEditReference = false
    this.showReferencesAction = -1
  }

  showdrefSidebar() {
    this.isEditReference = false
    this.addReferenceVisibility = 'visible';
  }


  addContact(contact) {
    this.contactClosed();
    this.addItemContacts(contact);
  }

  addAddress(contact) {
    this.contactClosed();
    this.addItemAddress(contact);
  }

  submit() {
    this.loader.show();
    let basicInfo = this.basicInforForm.value;
    let financeDetail = this.financialForm.value;
    basicInfo.labor_categories = basicInfo?.labor_categories || []
    basicInfo.work_locations = basicInfo?.work_locations || []

    this.finalDiversityList.forEach(d => {
      delete d.editedIndex
    });
    const basicPayload = {
      "name": basicInfo.name,
      "description": basicInfo.description,
      "category": "VENDOR",

      "year_of_establishment": basicInfo.year_of_establishment,
      "business_ownership": basicInfo.business_ownership,
      "website": basicInfo.website?.trim() ? basicInfo.website?.trim() : false,
      "size_of_bussiness": basicInfo.size_of_business,

      "industries": basicInfo.labor_categories,
      "work_locations": basicInfo.work_locations,

      "addresses": this.finalAddressList ? this.finalAddressList : [],
      "diversities": this.finalDiversityList ? this.finalDiversityList?.map((diversity: any) => {return {...diversity, category: {id: diversity?.category?.id}}}) : [],

    }
    let tempConatcts =  this.finalContactList ? this.finalContactList : []
    let accountInfo = this.storageService.get('account')
    for(var i in tempConatcts)
    {
      tempConatcts[i].email  =  tempConatcts[i]?.email ? tempConatcts[i]?.email : accountInfo.email
      tempConatcts[i].last_name  = tempConatcts[i]?.last_name
      tempConatcts[i].type = tempConatcts[i].phone_numbers[0].label
      tempConatcts[i].phone_numbers[0].label = tempConatcts[i].phone_numbers[0].label
      tempConatcts[i].phone_numbers[0].number = tempConatcts[i]?.phone_numbers[0]?.number?.toString()

      tempConatcts[i].title = tempConatcts[i]?.title ? tempConatcts[i]?.title : ""
      delete tempConatcts[i].editedIndex
    }


    let tempAddress =  this.finalAddressList ? this.finalAddressList : []
    for(var i in tempAddress)
    {
      tempAddress[i].street_1 = tempAddress[i].street_1 ? tempAddress[i].street_1 : ""
      tempAddress[i].street_2 = tempAddress[i].street_2 ? tempAddress[i].street_2 : ""
      tempAddress[i].type  =  i.toString() == "0" ? "PRIMARY" : "SECONDARY"
      tempAddress[i].state = tempAddress[i]?.state ? tempAddress[i]?.state : ""
      tempAddress[i].zipcode = tempAddress[i]?.zipcode ? tempAddress[i]?.zipcode : ""
    }

    let finalSocialList = []
    let socialLists =  this.socialList.value.filter(s => s.link.trim() != "").length ? this.socialList.value.filter(s => s.link.trim() != "") : false
    for(var i in socialLists){
      if(socialLists[i].link != '' && socialLists[i].type != ''){
        finalSocialList.push({type : socialLists[i].type,link : socialLists[i].link})
      }
    }

    basicPayload["social_profiles"] = finalSocialList.length ? finalSocialList : false;

    basicPayload["contacts"] = tempConatcts;
    basicPayload["addresses"] = tempAddress;

    const financialPayload ={
      'financial' : {
        "tax_type": financeDetail.tax_type,
        "federal_tax_number": financeDetail.tax_number,
        "bank_name": financeDetail.bank_name,
        "bank_routing_number": financeDetail.bank_routing_number,
        "bank_account_number": financeDetail.bank_account_number
      },
      'program_vendor' : {
        "is_enabled": basicInfo?.is_enable,
        "is_onboarded": true,
        "supplier_reference": basicInfo?.supplier_reference,
        "supplier_connection_id": basicInfo?.supplier_connection_id,
      },
      "custom_fields": this.cfService.amendCFData(this.updatedCFs) || {}
    };

    const basicHttp = this.programService.put(`/configurator/organizations/${this.vendorId}`, basicPayload)
    // const basicHttp = this.http.put(`https://9e37-2607-fea8-581f-c00-c9bf-69c8-1036-4822.ngrok.io/configurator/organizations/${this.vendorId}`, basicPayload)
    const financeHttp = this.programService.put(`/configurator/programs/${this.programId}/vendors/${this.vendorId}`, financialPayload)
    forkJoin([basicHttp, financeHttp])
      .subscribe({
        next: (data: any) => {
          this.alertService.success('Onboarded Successfully');
          this.router.navigate(['/dashboard']);
          this.loader.hide();
        }, error: (err: Error | any) => {
          this.alertService.error(errorHandler(err));
          this.loader.hide();
        }
      }
    );
  }

  closePopup(){
    this.showDragDropWindow = false;
  }

  allowDropBox(index) {
    this.requiredDocList[index];
    this.selectedDocIndex = index;
    this.showDragDropWindow = true;
  }

  handleUpload(event) {
    if(event.target.files[0].size < 1048576){
      const file = event.target.files[0];
      const type = file.type;
      const name = file.name;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.uploadDoc(reader.result, name, type);
      };
    }else{
      this.alertService.error("Maximum 10 MB allowed");
    }
  }

  uploadDoc(binary, fileName, type) {
    this.loader.show();
    this.programService.put(`/configurator/programs/${this.programId}/vendors/${this.vendorId}/compliance-documents/uploads`, {
      file_name: fileName,
      mime_type: type,
      required_document_id: this.requiredDocList[this.selectedDocIndex].id,
      raw: binary
    }).subscribe((res: any) => {
      // this.requiredDocList[this.selectedDocIndex].file_name = fileName;
      // this.requiredDocList[this.selectedDocIndex].document_id = res.id;
      this.showDragDropWindow = false;
      this.loader.hide();
      this.loadDocumentList();
    })
  }

  isSocialMediaSelected(label: string) {
    const formRef: Array <any> = this.basicInforForm.get('social_profiles').value;
    let filteredList = formRef.filter((node: any) => (node?.type === label));
    return (filteredList.length !== 0);
  }

  get disableSubmit() {
    return this.basicInfoInvalid // || this.financeAndDocinvalid
  }

  get basicInfoInvalid() {
    return (this.visiblePanel == 'basicInfo' && (this.basicControl.name.errors))
  }

  get financeAndDocinvalid() {
    return (
      this.visiblePanel === 'financialDetail' &&
      (
        this.requiredDocList.some(doc => doc?.is_required_for_onboarding && !doc?.document_id)
        // || this.financeControl.tax_type.errors
        || this.financeControl.tax_number.errors
        || this.confirmAccountNumber !== this.financeControl.bank_account_number.value
      )
    )
  }
}
