import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject, Subscription, interval } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { environment } from 'src/environments/environment';
import { AccuracyConfigEnum, ProgramConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';
import { VendorService } from '../vendor.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { CustomFieldsComponent } from 'src/app/library/custom-fields/custom-fields/custom-fields.component';
import { CommonService } from 'src/app/library/custom-fields/common.service';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
@Component({
  selector: 'app-create-vendor',
  templateUrl: './create-vendor.component.html',
  styleUrls: ['./create-vendor.component.scss'],
})
export class CreateVendorComponent implements OnInit, OnDestroy {

  @ViewChild(CustomFieldsComponent) cfCmp: CustomFieldsComponent;
  public updatedCFs: Array <any>;
  public recievedCFs: Array <any>;
  public isCFValid: boolean = true;

  private pageNo = 0;
  private subscriptions: Subscription[] = [];
  private vendorGroupSub: Subject <string> = new Subject <string> ();

  @Input() createManageVendor = 'visible';
  @Input() editData;
  @Input() viewData;
  @Input() isViewClicked;

  @Output() onClose: EventEmitter <any> = new EventEmitter <any> ();
  @ViewChild('userSelect') ngSelectComponent: NgSelectComponent;

  public input$ = new Subject<string | null>();
  public vendorUserSearch$ = new Subject<string | null>();
  public orgUser$ = new Subject<string | null>();
  public createVendorForm: UntypedFormGroup;

  tabIndex = 0;
  vendorData: any;
  vendorGroupList: any;
  vendorListData: any =[];
  selectedVendor: any;
  selectedVendorUser = [];
  moduleGroup = [];
  vendorUserList = [];
  requiredDocGroup: any[] = [];

  public onselectVendor: any;
  public currency: string[] = ['USD', 'GBP', 'AUD'];
  public languages = { 'en-US': 'English (United States)' };
  public isViewMode = false;
  public isDisabled = false;
  public clientId: string;
  public programId: string;
  public isViewVendor;
  public isUpdateReq: any;
  public isCompleteVendorSetup: any;
  public is_onboarded: any;
  public toUPdateIteamId: any;
  public hierarchyListData = [];
  public selectedHierarchies = [];
  public showDirectSourching = false;
  public showPayrollerField = false;
  public showErrorMessage = false;
  public currentVendorId : any = ''
  public title = 'Associate New Vendor to Program';
  public toggle = {
    title: 'active',
    value: true,
  };
  public is_all_work_locations = true
  public JOB = {
    value: true,
  };
  public SOW = {
    value: true,
  };

  errType = 0;
  rendererData : any = ['All'];
  rendererDataWithoutAll : any = [];
  clickOutside: boolean;
  isSaveLoader: boolean = false;

  public locations: Array<Object> = [];
  public labor_categories: Array<Object> = [];
  public global_labor_categories: Array<Object> = [];
  public payroller_vendors: Array<Object> = [];
  public vendorLoading: boolean = false;
  public vendorsearchManager$ = new Subject<string>();
  public alphaNumeric: RegExp = /^[a-zA-Z0-9]{0,}$/;

  public jobTypesLoading: boolean = true;
  public selectedJobTypes = [];

  public jobTypesList = [];
  public jobTypesLoaded: boolean = false;

  markupLaborCategories: any = ["All"];
  markupLaborCategoriesWithoutAll: any = ["All"];
  usersearchLocation = new Subject<string>();
  markupRadioitems = [
    { label: "Bill Rate", value: 'BILL_RATE' },
    { label: "Pay Rate", value: 'PAY_RATE' }
  ];

  vendorGroupName: boolean = false;

  constructor(
    private fb: UntypedFormBuilder,
    private _programService: ProgramService,
    private localStorage: StorageService,
    private _vendorService: VendorService,
    private _alertService: AlertService,
    private storageService: StorageService,
    public router: SvmsRouterService,
    private eventStream: EventStreamService,
    private accuracyPipe: AccuracyPipe,
    private cfService: CommonService,private uniqueHelper: UniqueKeyPipe,
  ) {

    this.vendorsearchManager$
      .pipe(
        tap((term) => {
          this.vendorLoading = true;
          this.vendorData = [];
        }),
        debounceTime(400),
        switchMap((term:any) => this.VendorService(term) )
      )
      .subscribe((data: any) => {
        this.vendorData = data?.organizations;
        this.vendorLoading = false;
    });

    this.usersearchLocation.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
      if (value?.term) {
        this.getWorkLocations(value?.term, true);
      } else {
        this.getWorkLocations(value?.term, true);
      }
    });
  }

  private VendorService(term) {
    if (term == null || !term) {
      this.getVendors();
    }
    const id = this.programId ? this.programId : environment.SIMPLIFY_ORG_ID;
    let url = `/configurator/organizations?category=vendor&active=true&exclude_program_id=${id}`;
    if (term) {
      url += `&name=${term}`;
    }
    return this._vendorService.get(url);
  }

  ngOnInit(): void {

    this.subscriptions.push(
      this.input$.pipe(debounceTime(1000)).subscribe(newTerm => {
        this.getVendors(1, newTerm);
      }),
    );

    this.subscriptions.push(
      this.vendorUserSearch$.pipe(debounceTime(1000)).subscribe(newTerm => {
        if (newTerm) {
          this.getVendorUsers(1, newTerm);
        }
      }),
    );

    let programid = this.localStorage.get(ProgramConfig[0]);
    programid = JSON.parse(programid);
    if (programid) {
      this.clientId = programid['clientId'];
      this.programId = programid['program_req_id'];
    }

    this.createVendorForm = this.fb.group({
      vendor_id: ['', Validators.required],
      hierarchy_units: [''],
      vendor_groups: ['', ''],
      workflow: ['STANDARD'],
      preferred_language: this.languages['en-US'],
      preferred_currency: this.currency[0],
      is_enabled: this.toggle.value,
      members: [null],
      is_job: [this.JOB.value ? 'ON' : 'OFF'],
      is_sow: [this.SOW.value ? 'ON' : 'OFF'],
      is_reference_required: [false],
      is_invitation_required: [false],
      compliance_document_group: [null],
      business_structure: [null, []],
      labor_categories: [null, ],
      work_locations: [[],],
      is_all_work_locations: [true, ],
      direct_sourcing_payroller: [null, ],
      hierarchies: [null, ],
      sourced : [false],
      payrolled : [false],
      direct_sourcing: [false],
      supplier_ref_id: [null],
      markup_config: this.fb.array([
        this.fb.group({
          rate_model: ['BILL_RATE'],
          labor_category: [''],
          hierarchy_id: [''],
          work_location_id: [''],
          is_sliding_scale: [false],
          markups: this.fb.group({
            sourced_markup: ['', [Validators.max(100)]],
            payrolled_markup: ['', [Validators.max(100)]],
          })
        })
      ])
    });
    this.subscriptions.push(
      this.createVendorForm.get('labor_categories').valueChanges.subscribe(labor_categories => {
        if(!labor_categories){
          this.markupLaborCategories = ['All'];
          this.markupLaborCategoriesWithoutAll = [];
        } else {
          this.markupLaborCategoriesWithoutAll = this.labor_categories.filter(laborCategory => labor_categories.includes(laborCategory['id']));
          this.markupLaborCategories = this.labor_categories.filter(laborCategory => labor_categories.includes(laborCategory['id']));
          this.markupLaborCategories.unshift('All')
        }
        const laborCategoryIds = this.markupLaborCategories.map(laborCategory => laborCategory.id);
        for (const [index, control] of (<UntypedFormArray>this.createVendorForm.get('markup_config')).controls.entries()) {
          if (index === 0) continue;
          const laborCategoryControl = control.get('labor_category');
          if(!laborCategoryIds.includes(laborCategoryControl.value)) {
            laborCategoryControl.setValue(null);
          }
        }
      })
    );
    this.hierarchyList();
    this.getLaborCategoryList();
    this.getGlobalLaborCategoryList();
    this.getVendors();
    this.getHierarchyList(this.programId);
    this.getVendorGroupList();
    this.getModuleList();
    this.getDocumentGroup();
    this.getWorkLocations(null, true);
    this.getProgramConfig()
    this.getJobTypesPicklist();
    this.createVendorForm.reset();
    (this.createVendorForm.get('markup_config') as UntypedFormArray).at(0).get('rate_model').setValue('BILL_RATE');
    (this.createVendorForm.get('markup_config') as UntypedFormArray).at(0).get('hierarchy_id').setValue('All');
    (this.createVendorForm.get('markup_config') as UntypedFormArray).at(0).get('labor_category').setValue('All');
    (this.createVendorForm.get('markup_config') as UntypedFormArray).at(0).get('work_location_id').setValue('All');
    let c = this;
    this.subscriptions.push(
      this.eventStream.on(Events.CREATE_VENDOR).subscribe((data:any) => {
        this.isCompleteVendorSetup = false;
        this.getProgramConfig();
        c.title = `Add Vendor`;
        if (data) {
          this.createManageVendor = 'visible';
          c.title = `Add Vendor`;
        } else {
          this.createManageVendor = 'hidden';
          c.title = `Add Vendor`;
        }
        this.clickOutside = false;
      }),
    );

    this.subscriptions.push(
      this.eventStream.on(Events.VENDOR_VIEW).subscribe((data: any) => {
        if (data.event) {
          setTimeout(() => {
            this.cfService.queueCFpopulation(data?.data?.custom_fields || {}, this.cfCmp).then((cfs: any) => {
              this.recievedCFs = cfs;
            });
          }, 0);

          this.updateJobType(data?.data?.job_type);
          this.toggle.title = data?.data?.is_enabled == true ? 'active' : 'inactive';
          this.toggle.value = data?.data?.is_enabled;
          this.title = `${data?.data?.vendor?.name} detail view`;
          this.isViewMode = true;
          this.isUpdateReq = false;
          this.isCompleteVendorSetup = !data?.data.is_setup;
          this.getProgramConfig();
          this.getVendorDetails(data?.data?.vendor?.id);
          this.createManageVendor = 'visible';
          this.selectedHierarchies = data?.data?.hierarchy_units.map(hierarchy => hierarchy.id);
          this.rendererData = ['All']
          data?.data?.hierarchy_units.forEach(x => {this.rendererData.push(x)})
          this.rendererDataWithoutAll = []
          this.rendererDataWithoutAll = data?.data?.hierarchy_units
        }
        this.clickOutside = true;
      }),
    );

    this.subscriptions.push(
      this.eventStream.on(Events.EDIT_VENDOR).subscribe((data:any) => {
        if (data.event) {
          setTimeout(() => {
            this.cfService.queueCFpopulation(data?.data?.custom_fields || {}, this.cfCmp).then((cfs: any) => {
              this.recievedCFs = cfs;
            });
          }, 0);

          this.updateJobType(data?.data?.job_type);
          this.getProgramConfig();
          this.title = `Edit (${data?.data?.vendor?.name})`;
          this.createManageVendor = 'visible';
          this.toggle.value = data.data.is_enabled;
          this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
          this.isUpdateReq = true;
          this.isCompleteVendorSetup = false;
          this.isViewMode = false;
          this.selectedHierarchies = data?.data?.hierarchy_units.map(hierarchy => hierarchy.id);
          this.rendererData = ['All']
          data?.data?.hierarchy_units.forEach(x => {this.rendererData.push(x)})
          this.rendererDataWithoutAll = []
          this.rendererDataWithoutAll = data?.data?.hierarchy_units
          this.toUPdateIteamId = data?.data?.vendor?.id;
          this.getVendorDetails(data?.data?.vendor?.id);
        }
        this.clickOutside = false;
      }),
    );

    this.subscriptions.push(
      this.eventStream.on(Events.COMPLETE_VENDOR_SETUP).subscribe((data:any) => {
        if (data.event) {
          setTimeout(() => {
            this.cfService.queueCFpopulation(data?.data?.custom_fields || {}, this.cfCmp).then((cfs: any) => {
              this.recievedCFs = cfs;
            });
          }, 0);

          this.updateJobType(data?.data?.job_type);
          this.getProgramConfig();
          this.title = `Complete Vendor Setup`;
          this.createManageVendor = 'visible';
          this.toggle.value = data.data.is_enabled;
          this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
          this.isUpdateReq = true;
          this.isCompleteVendorSetup = true;
          this.is_onboarded = data.data.is_onboarded;
          this.isViewMode = false;
          this.selectedHierarchies = data?.data?.hierarchy_units.map(hierarchy => hierarchy.id);
          this.rendererData = ['All']
          data?.data?.hierarchy_units.forEach(x => {this.rendererData.push(x)})
          this.rendererDataWithoutAll = []
          this.rendererDataWithoutAll = data?.data?.hierarchy_units
          this.toUPdateIteamId = data?.data?.vendor?.id;
          this.getVendorDetails(data?.data?.vendor?.id);
          this.updateJobType(data?.data?.job_type);
        }
        this.clickOutside = false;
      }),
    );

    this.subscriptions.push(
      this.vendorGroupSub
        .asObservable()
        .pipe(debounceTime(800))
        .subscribe((res:any) => {
          this.getVendorGroupList(res);
        })
    )
  }

  changedHierarchy(event) {
    this.rendererData = ['All']
    this.rendererDataWithoutAll = []
    this.hierarchyListData.forEach(hierarchie => {
      event.forEach(id => {
        if(id == hierarchie.id) {
          this.rendererData.push(hierarchie)
          this.rendererDataWithoutAll.push(hierarchie)
        }
      })
    })
  }

  fetchHierarchyList(hierarchy, flag) {
    if(flag) {
      this.hierarchyListData.push({
        id: hierarchy.id,
        name: hierarchy.name
      });
    }
     else {
       flag = true;
     }

    if(Array(hierarchy?.hierarchies).length === 0)
      return;

    hierarchy?.hierarchies.forEach(item => {
      this.fetchHierarchyList(item, true);
    });

  }

  // get Hierarchy List
  getHierarchyList(programId: any) {
    this._vendorService.get(`/configurator/programs/${programId}/hierarchy`).subscribe((data:any) => {
      if(data) {
        this.hierarchyListData = [];
        this.fetchHierarchyList(data.result[0], false);
      }
    })
  }

  ngOnChanges() {
    if (this.editData) {
      this.createVendorForm.patchValue(this.editData);
      if (this.isViewClicked) {
        this.isViewVendor = true;
      } else {
        this.isViewVendor = false;
      }
    }
    if (!this.viewData && !this.editData) {
      this.isViewVendor = false;
    }
  }

  getVendorDetails(id) {
    let _url = `/configurator/programs/${this.programId}/vendors/${id}?vendor_work_locations=true`;
    this._vendorService.get(_url).subscribe(
      (data:any) => {
        if (data.program_vendor) {
          this.updateData(data?.program_vendor);
          this.currentVendorId = data.program_vendor.id;
        }
      },
      err => {
        this._alertService.error(errorHandler(err));
      },
    );
  }

  updateData(data) {

    if(typeof(data?.compliance_document_group) === 'object') {
      data.compliance_document_group = data.compliance_document_group?.id;
    }

    this.createVendorForm.patchValue(data);

    if(data?.supplier_reference) {
      this.createVendorForm.patchValue({
        supplier_ref_id: data?.supplier_reference
      });
    }

    if(data.vendor_type == "BOTH") {
      this.createVendorForm.get('sourced').setValue(true);
      this.createVendorForm.get('payrolled').setValue(true);
    }
    if(data.vendor_type == "SOURCED") {
      this.createVendorForm.get('sourced').setValue(true);
    }
    if(data.vendor_type == "PAYROLLED") {
      this.createVendorForm.get('payrolled').setValue(true);
    }
    if(data.vendor_type == "DIRECT_SOURCING") {
      this.showDirectSourching = true;
      data.direct_source_org_vendor = data?.direct_source_org_vendor?.id ? {id : data?.direct_sourcing_payroller_id, name : data?.direct_source_org_vendor.name} : {}
      this.getPayrollerVendor(data?.direct_source_org_vendor);
      this.showPayrollerField = true;
      this.createVendorForm.get('direct_sourcing').setValue(true);
      this.createVendorForm.get('direct_sourcing_payroller').setValue(data?.direct_sourcing_payroller_id);
    }
    let labor_categories = data.industries.map(laborCategory => laborCategory.id);
    labor_categories = labor_categories.filter(x => !this.global_labor_categories.includes(x));
    this.createVendorForm.patchValue({labor_categories});
    this.markupConfigControl.clear();
    const markupConfig = data.markup_config;
    for (let i = 0; i < markupConfig.length; i++) {
      this.markupConfigControl.push(this.fb.group({
        ...markupConfig[i],
        labor_category: [!markupConfig[i].industry && i==0 ? 'All' : markupConfig[i].industry?.id],
        hierarchy_id: [!markupConfig[i].hierarchy ? 'All' : markupConfig[i].hierarchy?.id],
        work_location_id: [!markupConfig[i].work_location ? 'All' : markupConfig[i].work_location?.id],
        markups: markupConfig[i].is_sliding_scale ? this.fb.array(
          markupConfig[i].markups.map(d =>
            this.fb.group({
              min: [this.accuracyPipe.transform(d.min,AccuracyConfigEnum.RATE,{isEdit: true}), Validators.required],
              max: [this.accuracyPipe.transform(d.max,AccuracyConfigEnum.RATE,{isEdit: true}), Validators.required],
              sourced_markup: [this.accuracyPipe.transform(d.sourced_markup,AccuracyConfigEnum.MARKUP_PERCENTAGE,{isEdit: true}), [Validators.max(100)]],
              payrolled_markup: [this.accuracyPipe.transform(d.payrolled_markup,AccuracyConfigEnum.MARKUP_PERCENTAGE,{isEdit: true}), [Validators.max(100)]],
            })
          )
         ) : this.fb.group({
            sourced_markup: [markupConfig[i].markups.sourced_markup == 0 ? 0 : this.accuracyPipe.transform(markupConfig[i].markups.sourced_markup,AccuracyConfigEnum.MARKUP_PERCENTAGE,{isEdit: true}), [Validators.max(100)]],
            payrolled_markup: [markupConfig[i].markups.payrolled_markup == 0 ? 0 : this.accuracyPipe.transform(markupConfig[i].markups.payrolled_markup,AccuracyConfigEnum.MARKUP_PERCENTAGE,{isEdit: true}), [Validators.max(100)]],
        })
      }))
    }
    this.is_all_work_locations = data?.is_all_work_locations
    if(data?.is_all_work_locations){
      this.createVendorForm.get('work_locations').clearValidators();
    }else{
      this.createVendorForm.get('work_locations').addValidators(Validators.required);
    }
    this.createVendorForm.controls['work_locations'].updateValueAndValidity();
    this.createVendorForm.patchValue({
      vendor_id: data?.vendor?.id,
      work_locations: data?.work_locations,
      is_all_work_locations: data?.is_all_work_locations,
    });
    if (this.vendorData && this.vendorData.length > 0) {
      let duplicateData = JSON.parse(JSON.stringify(this.vendorData));
      duplicateData.push(data?.vendor);
      this.vendorData = [...duplicateData];
    }
    this.updateVendorGroupselect(data);
    this.selectedVendor = data?.vendor;
    this.onselectVendor = data?.vendor;
//    this.vendorGroupList = data?.vendor_groups;
    if (data?.members && data?.members?.length > 0) {
      this.createVendorForm.patchValue({
        is_invitation_required: true,
      });
    }
    this.selectedVendorUser = data?.program_invite_mail_users;
    if (data?.vendor?.labor_categories && data?.vendor?.labor_categories?.length > 0) {
      this.selectedVendor.labor_categories = [...data?.vendor?.labor_categories];
    }

    // Set WL labels
    let workLocationsValues: Array <any> = Object.entries(data?.vendor_work_locations || {})
      .map((entry: any) => {
        return {
          id: entry?.[0],
          name: entry?.[1]
        }
      }
    );

    let oldLocations = this.locations;
    this.locations = workLocationsValues;
    setTimeout(() => {
      this.locations = oldLocations;
    }, 0);
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
  }

  onClickToggleLocation(){
    this.is_all_work_locations = !this.is_all_work_locations
    if(this.is_all_work_locations){
      this.createVendorForm.controls.work_locations.setValue([]);
      this.createVendorForm.get('work_locations').clearValidators();
    }else{
      this.createVendorForm.get('work_locations').addValidators(Validators.required);
    }
    this.createVendorForm.controls['work_locations'].updateValueAndValidity();
  }

  onClickToggleJob() {
    if (this.JOB.value) {
      this.JOB.value = false;
    } else {
      this.JOB.value = true;
    }
  }

  onClickToggleSOW() {
    if (this.SOW.value) {
      this.SOW.value = false;
    } else {
      this.SOW.value = true;
    }
  }

  vendorUserSelected(event) {
    if (event) {
      const index = this.selectedVendorUser.findIndex(usr => usr.id === event.id);
      if (index < 0) {
        this.selectedVendorUser.push(event);
      }
      this.ngSelectComponent.handleClearClick();
    }
  }

  sidebarClose() {
    this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR, false));
    if (this.onselectVendor && this.onselectVendor?.id) {
      let index = this.vendorData.findIndex(v => v.id === this.onselectVendor.id);
      if (index !== -1) {
        this.vendorData.splice(index, 1);
      }
    }

    this.isCFValid = true;
    this.updatedCFs = undefined;
    this.recievedCFs = undefined;
    this.toUPdateIteamId = undefined;
    this.selectedJobTypes = [];

    this.onClose.emit(true);
    this.editData = [];
    this.createVendorForm.reset();
    this.markupConfigControl.clear();
    this.markupConfigControl.push(
      this.fb.group({
        rate_model: 'BILL_RATE',
        labor_category: ['All'],
        hierarchy_id: ['All'],
        work_location_id: ['All'],
        is_sliding_scale: false,
        markups: this.fb.group({
          sourced_markup: ['', [Validators.max(100)]],
          payrolled_markup: ['', [Validators.max(100)]],
        })
      }),
    );
    this.tabIndex = 0;
    this.selectedHierarchies = [];
    this.toggle.value = true;
    // this.title = "";
    this.title = `Add Vendor`;
    this.isViewMode = false;
    this.isUpdateReq = false;
    this.isCompleteVendorSetup = false;
    this.is_onboarded = undefined;
    this.showPayrollerField = false
    this.showDirectSourching = false
    this.showErrorMessage = false
    this.currentVendorId = null
    this.toggle.title = 'active';
    this.createManageVendor = 'hidden';
    this.vendorListData = new Array();
    this.selectedVendor = null;
    this.router.navigate(['vendor', 'vendor-list']);
  }

  hierarchyList() {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    this.subscriptions.push(
      this._programService.get(`/configurator/programs/${programId}/hierarchy`).subscribe((data:any) => {
        if (data) {
          // this.rendererData = data.result[0].hierarchies;
        }
      }),
    );
  }

  vendorTypeChanged(event) {
    if(event.target.value == 'DIRECT_SOURCING' && event.target.checked) {
      this.createVendorForm.get('payrolled').setValue(null)
      this.createVendorForm.get('sourced').setValue(null)
      this.showPayroller()
    }
    else if((event.target.value == 'PAYROLLED' && event.target.checked) || (event.target.value == 'SOURCED' && event.target.checked)) {
      this.createVendorForm.get('direct_sourcing').setValue(null)
      this.showPayrollerField = false;
      this.showErrorMessage = false
    } else {
      this.showPayrollerField = false;
      this.showErrorMessage = false
    }
  }

  showPayroller(){
    const id = this.programId ? this.programId : environment.SIMPLIFY_ORG_ID;
    let url = `/configurator/programs/${id}/vendors?is_enabled=True&vendor_type=DIRECT_SOURCING&is_deleted=False`;
    this.subscriptions.push(
      this._vendorService.get(url).subscribe(
        (data:any) => {
          if(data.program_vendors?.length >= 1 && this.currentVendorId != data.program_vendors[0]?.id) {
            this.showPayrollerField = false;
            this.createVendorForm.get('direct_sourcing').setValue(null)
            this.showErrorMessage = true;
          } else {
            this.showPayrollerField = true;
            this.getPayrollerVendor();
          }
        },
        error => {
          this._alertService.error(errorHandler(error));
        },
        () => {},
      ),
    );
  }

  getPayrollerVendor(selectedObject?) {
    const id = this.programId ? this.programId : environment.SIMPLIFY_ORG_ID;
    let url = `/configurator/programs/${id}/vendors?is_enabled=True&vendor_type=PAYROLLED,BOTH&is_deleted=False`;
    this.subscriptions.push(
      this._vendorService.get(url).subscribe(
        (data:any) => {
          this.payroller_vendors = data.program_vendors.map(vendor => { return {id : vendor.id,name : vendor.vendor.name}})
          selectedObject = selectedObject ? [selectedObject] : []
          this.payroller_vendors = [...selectedObject, ...this.payroller_vendors]
          this.payroller_vendors = [...new Set(this.payroller_vendors)]
          let uniqueDataValues = [];
          this.payroller_vendors.forEach(function(item:any){
            let i = uniqueDataValues.findIndex(x => x.id == item.id);
            if(i <= -1){
              uniqueDataValues.push({id: item.id, name: item.name});
            }
          });
          this.payroller_vendors = uniqueDataValues
        },
        error => {
          this._alertService.error(errorHandler(error));
        },
        () => {},
      ),
    );
  }

  getProgramConfig() {
    const id = this.programId ? this.programId : environment.SIMPLIFY_ORG_ID;
    let url = `/configurator/programs/${id}`;
    this.subscriptions.push(
      this._vendorService.get(url).subscribe(
        (data:any) => {
          if(data.program.config.direct_sourcing.enabled) {
            this.showDirectSourching = true
          }
        },
        error => {
          this._alertService.error(errorHandler(error));
        },
        () => {},
      ),
    );
  }

  getVendors(pageNo = 1, term = '') {
    if (pageNo == 1) {
    }
    this.vendorData = []
    const id = this.programId ? this.programId : environment.SIMPLIFY_ORG_ID;
    let url = `/configurator/organizations?category=vendor&active=true&exclude_program_id=${id}`;
    if (term) {
      url += `&name=${term}`;
    }
    this.subscriptions.push(
      this._vendorService.get(url).subscribe(
        (data:any) => {
          this.vendorData = data?.organizations;
        },
        error => {
          this._alertService.error(errorHandler(error));
        },
        () => {},
      ),
    );
  }

  removeSelectedVendor(index) {
    this.selectedVendorUser.splice(index, 1);
  }

  getVendorUsers(pageNo = 1, term = '') {
    let url = `/profile-manager/organizations/${this.selectedVendor?.id}/members?k=${encodeURIComponent(term)}`;
    if (term) {
      url += `&name=${encodeURIComponent(term)}`;
    }
    this.subscriptions.push(
      this._vendorService.get(url).subscribe(
        (data:any) => {
          this.vendorUserList = data?.memberList; // data?.organizations;
        },
        error => {
          this._alertService.error(errorHandler(error));
        },
        () => {},
      ),
    );
  }

  getModuleList(pageNo = 1) {
    this.subscriptions.push(
      this._vendorService.get(`/configurator/programs/${this.programId}/module-groups `).subscribe(
        (data:any) => {
          if (data && data.module_groups) {
            data?.module_groups?.forEach((mGroup: any) => {
              mGroup.is_enabled = true;
              mGroup.is_edit_allowed = false;
            });
            this.moduleGroup = data.module_groups;
          }
        },
        error => {
          this._alertService.error(errorHandler(error));
        },
        () => {},
      ),
    );
  }

  getDocumentGroup(pageNo = 1) {
    this.subscriptions.push(
      this._vendorService.get(`/configurator/programs/${this.programId}/vendor-compliance/required-document-groups`).subscribe(
        (data:any) => {
          const { required_document_groups } = data;
          this.requiredDocGroup = required_document_groups.filter(doc => {
            return doc.is_enabled;
          });
        },
        error => {
          this._alertService.error(errorHandler(error));
        },
        () => {},
      ),
    );
  }

  updateVendorGroupselect(data) {
    if (data && data.vendor_groups && data.vendor_groups.length > 0) {
      //this.vendorListData = data.vendor_groups;
      this.vendorListData.push(data.vendor_groups)
      this.vendorListData = this.uniqueHelper.transform(this.vendorListData, 'id');
      const vendorId = data.vendor_groups.map(vendorGroup => {
        return vendorGroup.id;
      });
      if (vendorId && vendorId.length > 0) {
        this.createVendorForm.patchValue({
          vendor_groups: vendorId[0],
        });
      }
    }else{
      this.createVendorForm.patchValue({
        vendor_groups: null,
      });
    }
  }

  onClickModule(e) {}

  selectVendor(data) {
    this.selectedVendorUser = [];
    if (data) {
      this.selectedVendor = data;
      this.getVendorUsers(1, '');
    }
    else{
      this.selectedVendor = null;
      this.vendorUserList = [];
      this.createVendorForm.patchValue({
        is_invitation_required: false,
      });
    }
  }

  getVendorGroupList(term = '') {

    let url = `/configurator/programs/${this.programId}/vendor-groups/advanced-filters?limit=25&page=1`;

    let payload = {
      is_enabled : true
    }
    if (term !== ''){
      payload["name"] = term
    }

    this._vendorService.post(url,payload)
      .toPromise()
      .then((data:any) => {
        if (data) {
          this.vendorGroupList = data.vendor_groups;
        }
      }, err => {
        console.error(err)
    });

  }

  addVendorGroup() {
    this.vendorListData = new Array();
    this.createVendorForm.controls.vendor_groups.value.forEach(e => {
      this.vendorGroupList.forEach(v => {
        if (v.id === e) {
          this.vendorListData.push(v);
        }
      });
    });

    if(this.vendorListData.length > 0) {
      this.vendorGroupName = true;
    }
    else {
      this.vendorGroupName = false;
    }
  }

  get vendorFormControl() {
    return this.createVendorForm.controls;
  }

  invitationRequiredChange() {
    const form: AbstractControl = this.createVendorForm;
    if(form) {
      const invitationState: boolean = form?.get('is_invitation_required')?.value;
      if(!invitationState) {
        form?.patchValue({ is_reference_required: false });
      }

      if(!this.toUPdateIteamId) {
        this.selectedVendorUser = [];
      }

      if(!Array.isArray(this.vendorUserList) || !this.vendorUserList?.length) {
        this.getVendorUsers(1, '');
      }
    }
  }

  referenceRequiredChange() {
    this.selectedVendorUser = [];
  }

  removeVendor(v, i) {
    this.createVendorForm.controls.vendor_groups.value.forEach(e => {
      if (e === v) {
        this.createVendorForm.controls.vendor_groups.value.splice(i, 1);
        this.vendorListData.splice(i, 1);
      }
    });
    let vendorGroupIds: any = [];
    this.vendorListData.forEach(v => {
      vendorGroupIds.push(v.id);
    });
    this.createVendorForm.patchValue({
      vendor_groups: vendorGroupIds,
    });

    if(this.vendorListData.length > 0) {
      this.vendorGroupName = true;
    }
    else {
      this.vendorGroupName = false;
    }
  }

  onIndexChange(event) {
    // Mark Up validations
    // if(event == 2) {
    //   let markup_config = this.createVendorForm.value.markup_config;
    //   if(this.createVendorForm.value.sourced == true) {
    //     markup_config.filter(x => (x.is_sliding_scale == false || x.is_sliding_scale == null) && (x.markups.sourced_markup == null || x.markups.sourced_markup == "")).length > 0 ? this.isDisabled = true : this.isDisabled = false
    //     if(markup_config.filter(x => (x.is_sliding_scale == false || x.is_sliding_scale == null) && (x.markups.sourced_markup === 0)).length > 0) {
    //       this.isDisabled = false;
    //       event = event - 1
    //       this._alertService.error(`Sourced Mark Up can not be 0.`);
    //       return;
    //     }
    //     if(this.isDisabled) {
    //       this.tabIndex = event - 1
    //       this._alertService.error(`Please fill the required fields.`);
    //       return;
    //     }
    //   }
    //   if(this.createVendorForm.value.payrolled == true) {
    //     markup_config.filter(x => (x.is_sliding_scale == false || x.is_sliding_scale == null) && (x.markups.payrolled_markup == null || x.markups.payrolled_markup == "")).length > 0 ? this.isDisabled = true : this.isDisabled = false
    //     if(markup_config.filter(x => (x.is_sliding_scale == false || x.is_sliding_scale == null) && (x.markups.payrolled_markup === 0)).length > 0) {
    //       this.isDisabled = false;
    //       event = event - 1
    //       this._alertService.error(`Payrolled Mark Up can not be 0.`);
    //       return;
    //     }
    //     if(this.isDisabled) {
    //       this.tabIndex = event - 1
    //       this._alertService.error(`Please fill the required fields.`);
    //       return;
    //     }
    //   }
    //   let raisErr = false
    //   if (!this.isMarkupMinMaxValid()) {
    //     if(this.errType == 1) {
    //       this._alertService.error(`Please fill the required fields.`);
    //       this.errType = 0;
    //     }
    //     else if (this.errType == 2) {
    //       this._alertService.error(`Sourced Mark Up can not be 0.`);
    //       this.errType = 0;
    //     }
    //     else if (this.errType == 3) {
    //       this._alertService.error(`Payrolled Mark Up can not be 0.`);
    //       this.errType = 0;
    //     }
    //     else {
    //       this._alertService.error(`Please use correct values of greater than and less than values in markup.`);
    //     }
    //     raisErr = true
    //   }
    //   if (!this.isLaborCategoryHierarchyLocationSelected()) {
    //     this._alertService.error(`Please select at least one parameter among Program Labor Category, Hierarchy, Work Location.`);
    //     return;
    //   }
    //   if (!this.isMarkupCombinationValid()) {
    //     this._alertService.error(`Please use unique combination of labor_category, heirarchy and location in markup.`);
    //     return;
    //   }
    //   raisErr == false && this.isDisabled == false ? this.tabIndex = event : this.tabIndex = event - 1
    // }else {
    //   this.tabIndex = event;
    // }
    this.tabIndex = event;
  }

  goToNext() {
    this.cfCmp?.onEmit();
    if(this.isCFValid) {
      this.onIndexChange(this.tabIndex + 1);
    }
  }

  get markupConfigControl() {
    return this.createVendorForm.get('markup_config') as UntypedFormArray;
  }

  isLaborCategoryHierarchyLocationSelected() {
    const markup_config = this.createVendorForm.value.markup_config;
    if (markup_config.length < 2) return true;
    for (let i = 1; i < markup_config.length; i++) {
      const {
        labor_category,
        hierarchy_id,
        work_location_id
      } = markup_config[i];
      if (!labor_category && !hierarchy_id && !work_location_id) return false;
    }
    return true;
  }

  isMarkupCombinationValid() {
    const uniqueCombination = {};
    const markup_config = this.createVendorForm.value.markup_config;
    if (markup_config.length < 2) return true;
    for (let i = 1; i < markup_config.length; i++) {
      let {
        labor_category,
        hierarchy_id,
        work_location_id
      } = markup_config[i];
      labor_category = labor_category || '';
      hierarchy_id = hierarchy_id || '';
      work_location_id = work_location_id || '';
      if (uniqueCombination[labor_category.toString()+hierarchy_id.toString()+work_location_id.toString()]) {
        return false;
      }
      uniqueCombination[labor_category.toString()+hierarchy_id.toString()+work_location_id.toString()] = true;
    }
    return true;
  }

  isMarkupMinMaxValid() {
    const markup_config = this.createVendorForm.value.markup_config;
    for (let i = 0; i < markup_config.length; i++) {
      if (!markup_config[i].is_sliding_scale) continue;
      let previousMax;
      for (let j = 0; j < markup_config[i].markups.length; j++) {
        const {
          min,
          max,
          sourced_markup,
          payrolled_markup,
        } = markup_config[i].markups[j];
        const isLastRow = j === markup_config[i].markups.length - 1;
        if (j === 0 && Number(min) !== 0) {
          return false;
        }
        if (isLastRow && max !== 'MAX') {
          return false;
        }
        if (isNaN(min) || !isLastRow && (isNaN(max) || Number(max) <= Number(min))) {
          return false;
        }
        if (previousMax && Number(min) !== previousMax) {
          return false;
        }
        if(this.createVendorForm.value.sourced == true && (sourced_markup === 0)) {
          this.errType = 2;
         return false;
        }
        if(this.createVendorForm.value.payrolled == true && (payrolled_markup === 0)) {
          this.errType = 3;
          return false;
        }
        if(this.createVendorForm.value.sourced == true && (sourced_markup == "" || sourced_markup == null)) {
          this.errType = 1;
         return false;
        }
        if(this.createVendorForm.value.payrolled == true && (payrolled_markup == "" || payrolled_markup == null)) {
          this.errType = 1;
          return false;
        }
        previousMax = Number(max);
      }
    }
    return true;
  }

  markupValidation(obj: any) {

    for(let keys in obj) {
      if(keys !== 'max') {
          obj[keys] = parseFloat(obj[keys]);
          if(isNaN(obj[keys]))
            return false;
      }
    }
    return false;
  }

  addVendor() {
    if (this.createVendorForm.invalid) {
      this._alertService.error(`Please fill the required fields.`);
      return;
    }

    this.cfCmp?.onEmit();
    if(!this.isCFValid) {
      this._alertService.error("Please specify all the required Custom Fields!");
      return;
    }

    // if (!this.isMarkupMinMaxValid()) {
    //   this._alertService.error(`Please use correct values of greater than and less than values in markup.`);
    //   return;
    // }
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails['program_req_id'];
    const addVendorItem = this.createVendorForm.value;

    if(addVendorItem.direct_sourcing && addVendorItem.direct_sourcing != null && !addVendorItem.direct_sourcing_payroller) {
      this._alertService.error(`Please fill the required fields.`);
      return;
    }

    let flag: boolean = false;
    let markupRequiredFlag: boolean = false;
    addVendorItem.markup_config.forEach((node, index) => {
      if(Array.isArray(node.markups)) {
        // Array Case
          node.markups.forEach(innerNode => {
            if(this.markupValidation(innerNode))
              flag = true;
          });
      }
        else {
          // Entry case
          const obj = node.markups;
          if(this.markupValidation(obj))
            flag = true;
        }

        if(index != 0 && (!node.labor_category || !node.hierarchy_id || !node.work_location_id)) {
          markupRequiredFlag = true;
        }

    });

    if(flag) {
      this._alertService.error('Only Integer/Float fields are allowed');
      return;
    }
    if(markupRequiredFlag) {
      this._alertService.error('Please fill the required fields on Mark Up screen.');
      return;
    }
    let hierarchies = this.selectedHierarchies;
    let vendorType = addVendorItem.sourced == true && addVendorItem.payrolled == true ? "BOTH" : addVendorItem.sourced == true && !addVendorItem.payrolled ? "SOURCED" : !addVendorItem.sourced && addVendorItem.payrolled == true ? "PAYROLLED" : !addVendorItem.sourced && !addVendorItem.payrolled && addVendorItem.direct_sourcing == true ? "DIRECT_SOURCING" : ""
    let payLoad = {
      vendor_id: addVendorItem.vendor_id,
      work_locations:this.is_all_work_locations ? [] : addVendorItem.work_locations,
      is_all_work_locations: this.is_all_work_locations,
      is_enabled: this.toggle?.value,
      hierarchy_units: hierarchies,
      vendor_groups: addVendorItem.vendor_groups ? [addVendorItem.vendor_groups] : addVendorItem.vendor_groups,
      workflow: 'STANDARD',
      preferred_language: this.languages['en-US'],
      preferred_currency: this.currency[0],
      is_job: this.JOB.value ? 'ON' : 'OFF',
      is_sow: this.SOW.value ? 'ON' : 'OFF',
      industries: addVendorItem.labor_categories,
      vendor_type : vendorType,
      compliance_document_group: addVendorItem.compliance_document_group,
     // is_reference_required: addVendorItem.is_reference_required,
     // members: (this.selectedVendorUser && this.selectedVendorUser.length !== 0) ? this.selectedVendorUser.map(mem => mem.id) : null,
      //is_invitation_required: addVendorItem.is_invitation_required,
      markup_config: addVendorItem.markup_config.map(({hierarchy_id, labor_category, work_location_id, ...markups}) => {

        if(markups?.markups?.payrolled_markup) {
          markups.markups.payrolled_markup = Number.parseFloat(markups?.markups?.payrolled_markup);
        }

        if(markups?.markups?.sourced_markup) {
          markups.markups.sourced_markup = Number.parseFloat(markups?.markups?.sourced_markup);
        }

        return ({
          ...markups,
          ...(hierarchy_id && hierarchy_id!=='All' ? {hierarchy_id} : {}),
          industry_id : (labor_category && labor_category!=='All' ? labor_category : {}),
          ...(work_location_id && work_location_id!=='All' ? {work_location_id} : {})
        })
      })
    };

    payLoad['custom_fields'] = this.cfService.amendCFData(this.updatedCFs);
    if(addVendorItem.direct_sourcing_payroller && addVendorItem.direct_sourcing_payroller != null && payLoad.vendor_type == 'DIRECT_SOURCING') {
      payLoad['direct_sourcing_payroller'] = addVendorItem.direct_sourcing_payroller
    }
    if(!payLoad?.industries){
      payLoad.industries = null;
    }
    if(addVendorItem?.supplier_ref_id) {
      payLoad['supplier_reference'] = addVendorItem?.supplier_ref_id;
    }

    if(addVendorItem.labor_categories?.length === 0){
        payLoad.industries = false;
    }

    for(let i=0 ; i<payLoad.markup_config.length; i++) {
      if(payLoad.markup_config[i].is_sliding_scale == true) {
        payLoad.markup_config[i].markups.forEach(element => {
          if(!element.payrolled_markup){
            element.payrolled_markup = 0
          }
          if(!element.sourced_markup){
            element.sourced_markup = 0
          }
          if(payLoad.vendor_type == 'SOURCED'){
            element.payrolled_markup = 0
          }
          if(payLoad.vendor_type == 'PAYROLLED'){
            element.sourced_markup = 0
          }
        });
      }else {
        delete payLoad.markup_config[i].is_sliding_scale
        if(!payLoad.markup_config[i].markups.payrolled_markup){
          payLoad.markup_config[i].markups.payrolled_markup = 0;
        }
        if(!payLoad.markup_config[i].markups.sourced_markup){
          payLoad.markup_config[i].markups.sourced_markup = 0;
        }
        if(payLoad.vendor_type == 'SOURCED'){
          delete payLoad.markup_config[i].markups.payrolled_markup
        }
        if(payLoad.vendor_type == 'PAYROLLED'){
          delete payLoad.markup_config[i].markups.sourced_markup
        }
      }
      if(!payLoad.markup_config[i].industry_id?.length) {
        delete payLoad.markup_config[i].industry_id
      }
      if(!payLoad.markup_config[i].hierarchy)
      { delete payLoad.markup_config[i].hierarchy }
      if(!payLoad.markup_config[i].industries)
      { delete payLoad.markup_config[i].industries }
      if(!payLoad.markup_config[i].work_location)
      { delete payLoad.markup_config[i].work_location }
      // if(JSON.stringify(payLoad.markup_config[i].markups) === JSON.stringify({})){
      //   delete payLoad.markup_config[i].markups;
      // }
      // if(JSON.stringify(payLoad.markup_config[i]) === JSON.stringify({"rate_model":"BILL_RATE"}) || JSON.stringify(payLoad.markup_config[i]) === JSON.stringify({"rate_model":"PAY_RATE"})){
      //   delete payLoad.markup_config[i];
      // }
      // if(!payLoad.markup_config[i]){
      //   delete payLoad.markup_config[i];
      // }
    }
    if(!payLoad.markup_config.length || payLoad.markup_config.length == 0 || payLoad.markup_config[0]==null){
      delete payLoad.markup_config;
    }

    if (payLoad.is_job === 'OFF' && payLoad.is_sow === 'OFF') {
      this._alertService.error(`Please fill the required fields.`);
      return;
    }
    if(this.createVendorForm.get('business_structure').value) {
      payLoad['business_structure'] = this.createVendorForm.get('business_structure').value;
    }
    this.isSaveLoader = true;
    if(this.jobTypeAllowed) {
      payLoad['job_type'] = this.selectedJobTypes;
    }

    if (this.isUpdateReq) {

      if(this.isCompleteVendorSetup) {
        payLoad['is_setup'] = true
        delete payLoad.is_enabled
      }
      if(payLoad?.vendor_groups && payLoad.vendor_groups.length === 0)
        delete payLoad.vendor_groups;

      delete payLoad.vendor_id;
      delete payLoad.workflow;
      delete payLoad.preferred_currency;
      delete payLoad.preferred_language;
      delete payLoad.is_job;
      delete payLoad.is_sow;


      this.subscriptions.push(
        this._vendorService.put(`/configurator/programs/${programId}/vendors/${this.toUPdateIteamId}`, payLoad).subscribe(
          (data:any) => {
            if (data) {
              this._alertService.success(`You have updated vendor successfully.`);
              this.createVendorForm.reset();
              this.vendorListData = new Array();
              this.selectedVendor = '';
              this.createVendorForm.reset();
              // this.router.navigate(['/program-setup/vendor/vendor-list']);
              this.sidebarClose();
              // this._loader.hide();
              this.isSaveLoader = false;
            }
          },
          err => {
            // this._loader.hide();
            this.isSaveLoader = false;
            this._alertService.error(errorHandler(err));
          },
        ),
      );
    } else {
      this.subscriptions.push(
        this._vendorService.post(`/configurator/programs/${programId}/vendors`, payLoad).subscribe(
          (data:any) => {
            if (data) {
              this._alertService.success(`You have added vendor successfully.`);
              this.createVendorForm.reset();
              // this.router.navigate(['/program-setup/vendor/vendor-list']);
              this.sidebarClose();
              // this._loader.hide();
              this.isSaveLoader = false;
            }
          },
          err => {
            // this._loader.hide();
            this.isSaveLoader = false;
            this._alertService.error(errorHandler(err));
          },
        ),
      );
    }
  }

  searchOrgUser(term) {
    this.subscriptions.push(
      this._programService.get(`/profile-manager/organizations/${this.selectedVendor.id}/members?k=${term}`).subscribe(data => {}),
    );
  }

  vendorGroupSearch(term) {
    this.vendorGroupSub.next(term);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  addMarkup() {
    this.markupConfigControl.push(
      this.fb.group({
        rate_model: 'BILL_RATE',
        labor_category: null,
        hierarchy_id: null,
        work_location_id: null,
        is_sliding_scale: false,
        markups: this.fb.group({
          sourced_markup: ['', [Validators.max(100)]],
          payrolled_markup: ['', [Validators.max(100)]],
        })
      }),
    );
  }

  removeMarkup(index) {
    this.markupConfigControl.removeAt(index);
  }

  addSlidingMarkup(markupForm, index) {
    (markupForm.get('markups') as UntypedFormArray).insert(
      index + 1,
      this.fb.group({
          min: ['', Validators.required],
          max: ['', Validators.required],
          sourced_markup: ['', [Validators.max(100)]],
          payrolled_markup: ['', [Validators.max(100)]],
      })
    );
  }

  removeSlidingMarkup(markupForm, index) {
    const markups = markupForm.get('markups') as UntypedFormArray;
    if (markups.controls.length == 2) {
      return;
    }
    markups.removeAt(index);
  }

  onMarkupSlide(markupForm: UntypedFormGroup) {
    if (this.isViewMode) return;
    const isSlidingControl = markupForm.get('is_sliding_scale');
    if (isSlidingControl.value) {
      isSlidingControl.setValue(false);
      markupForm.setControl('markups', this.fb.group({
        sourced_markup: ['', [Validators.max(100)]],
        payrolled_markup: ['', [Validators.max(100)]]
      }));
    } else {
      isSlidingControl.setValue(true);
      markupForm.setControl('markups', this.fb.array([
        this.fb.group({
            min: [0, Validators.required],
            max: ['', Validators.required],
            sourced_markup: ['', [Validators.max(100)]],
            payrolled_markup: ['', [Validators.max(100)]],
        }),
        this.fb.group({
          min: ['', Validators.required],
          max: ['', Validators.required],
          sourced_markup: ['', [Validators.max(100)]],
          payrolled_markup: ['', [Validators.max(100)]],
        })
      ]));
    }
  }

  getLaborCategoryList() {
    this._vendorService.get(`/configurator/programs/${this.programId}/industries?active=true`).subscribe( (data:any) => {
      this.labor_categories = data.industries;
    });
  }
  getGlobalLaborCategoryList() {
    this._vendorService.get(`/configurator/resources/industries`).subscribe( (data:any) => {
      this.global_labor_categories = data.industries.map(x=>x.id);
    });
  }
  getWorkLocations(term, reset = false) {
    if (reset) {
      this.pageNo = 1;
    }
    const url = `/configurator/programs/${this.programId}/work-locations?limit=25&status=true&page=${this.pageNo}${
      term ? '&k=' + term : ''
    }`;
    this._vendorService.get(url).subscribe(
      (data:any) => {
        if (data && data.work_locations && data.work_locations.length > 0) {
          if (data.work_locations && data.work_locations?.length > 0) {
            data.work_locations.push(data.work_locations[0]);
            const uniqueLocations: any = [...new Map(data.work_locations.map(item => [item.name, item])).values()];
            const locations = uniqueLocations.filter(l => l.name);
            this.locations = locations;
          }
        }
      },
      error => {
        this._alertService.error(errorHandler(error), {});
      },
    );
  }

  getJobTypesPicklist() {
    if(!this.jobTypeAllowed) {
      return;
    }

    let url: string = `/configurator/programs/${this.programId}/pick-lists?limit=50&slug=job_type&active_picklist_items=True`;
    this._programService.get(url).subscribe({
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
        this._alertService.error(errorHandler(err));
        this.jobTypesLoading = false;
      }
    })
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

            this.selectedJobTypes = result;
            destroyer$.next();
          }
        })
      )
    }
  }

  get isContinueDisabled() {
    const {vendor_id, is_invitation_required} = this.createVendorForm.controls;
    const isVendorEmailNotSelected = is_invitation_required.value && this.selectedVendorUser.length === 0;
    return vendor_id.invalid || isVendorEmailNotSelected || !this.isCFValid;
  }

  get jobTypeAllowed() {
    return this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.job_type;
  }
}
