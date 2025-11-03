import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent,Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { Subscription, Subject, forkJoin, of, interval } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import * as _ from 'lodash';


type Query = { page: number, term: string };

@Component({
  selector: 'app-create-new',
  templateUrl: './create-new.component.html',
  styleUrls: ['./create-new.component.scss']
})
export class CreateNewComponent implements OnInit {
  public titleToggle = {
    title: 'active',
    value: true
  };
  feesTypeOptions = [
    {
      name: 'Percentage',
      value: 'percentage'
    },
    {
      name: 'Fixed',
      value: 'fixed'
    }
  ]
  feesApplicationOn = [
    {
      name: 'Client',
      value: 'client'
    },
    {
      name: 'Vendor',
      value: 'vendor'
    }
  ]

  fundingModel = [
    {
      name: 'Client',
    },
    {
      name: 'Vendor',
    },
    {
      name: 'Hybrid',
    }
  ]

  public toggles: any = {
    msp_partner: {
      value: true,
      mspFees: [
        {
          label: 'Timesheet',
          value: 'timesheet',
          isSelected: false
        },
        {
          label: 'Expense',
          value: 'expense',
          isSelected: false
        },
        {
          label: 'Misc Expense',
          value: 'Miscexpense',
          isSelected: false
        },
        {
          label: 'SOW Project',
          value: 'SOWProject',
          isSelected: false
        }
      ],
    },
    vms: {
      value: true,
      vmsFees: [
        {
          label: 'Timesheet',
          value: 'timesheet',
          isSelected: false
        },
        {
          label: 'Expense',
          value: 'expense',
          isSelected: false
        },
        {
          label: 'Misc Expense',
          value: 'Miscexpense',
          isSelected: false
        },
        {
          label: 'SOW Project',
          value: 'SOWProject',
          isSelected: false
        }
      ],
    }
  }

  public feesForm: UntypedFormGroup;
  public programId: string;
  submitted = false;
  selectedSourceModel: any = [];

  public isAllLaborCategoriesSelected: Boolean = false;
  public labor_categories = [];
  public vendors = [];
  public isEditMode: Boolean = false;
  public isAllVendorSelected: Boolean = false;

  private subscriptions: Subscription[] = [];
  private editId: String = '';

  private hierarchySub: Subject <string> = new Subject <string> ();
  public hierarchyTree: Array <any> = [];

  vendorLoading: boolean = false;
  laborCategoryLoading: boolean = false;
  selectedVendors: any = [];
  selectedLaborCategories: any = [];

  public hierarchyEditData: Array <string>  = [];
  public laborCategoryEditData: Array <string> = [];
  public vendorEditData: Array <string> = [];

  mspPartnerFee: boolean = null;
  vmsFeePercentage: boolean = null;
  mspPartnerFeeTypeDisabled: boolean = false;
  vmsFeeTypeDisabled: boolean = false;

  private vendorSub: Subject <Query> = new Subject <Query> ();
  private laborCategorySub: Subject <Query> = new Subject <Query> ();
  private totalVendors: number = Number.POSITIVE_INFINITY;
  private totalLaborCategory: number = Number.POSITIVE_INFINITY;
  private preVendorQuery: Query = null;
  private preLaborCategoryQuery: Query = null;
  public fundingModelValue: any
  public isDisabled : boolean = false
  public isVMsFeeDisabled: boolean = false
  public isMspPartnerFeeDisabled: boolean = false

  constructor(
    private programService: ProgramService,
    private storageService: StorageService,
    private fb: UntypedFormBuilder,
    private userService: UserService,
    private _alertService: AlertService,
    private loader: LoaderService,
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private datePipe: LocalDateFormatPipe,
    public activatedRoute: ActivatedRoute,
    private confirmation: ConfirmationDialogService,
    ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.feesForm = this.fb.group({
      title:[null, [Validators.required]],
      hierarchy: [null, [Validators.required]],
      source_model_contingent: [null, Validators.required],
      source_model_sow: [null, Validators.required],
      source_model_direct: [null, Validators.required],
      labor_category: [null, [Validators.required]],
      vendors: [null],
      effective_date: [null],
    });

    this.subscriptions.push(
      this.hierarchySub
      .pipe(
        distinctUntilChanged((x: string, y: string) => (x === y)),
        debounceTime(600),
        switchMap((programId: string) => {
          const url = `/configurator/programs/${programId}/hierarchy`;
          return this.programService.get(url);
        })
      ).subscribe({
        next: (data: any) => {
          if(data && data.result) {
            this.hierarchyTree = data.result;
            if(this.hierarchyEditData) {
              setTimeout(() => {
                this.feesForm.get('hierarchy').setValue(this.hierarchyEditData);
              }, 1200);
            }
          }
        },
        error: err => {
          this._alertService.error(errorHandler(err));
        }
      })
    );

    this.activatedRoute.queryParams.subscribe(({ id }) => {
      setTimeout(()=>{
        if(id){
          this.editId = id;
          this.isEditMode = true;
          this.getDetailsById(id);
        } else {
          this.setCurrentDate();
        }
      },700);
    });

    // Vendor Subscription
    this.subscriptions.push(
      this.vendorSub.pipe(
        distinctUntilChanged((prev: Query, curr: Query) => {
          return (
            (prev?.page === curr?.page) &&
            (prev?.term === curr?.term)
          );
        }),
        debounceTime(400),
        switchMap((query: Query) => {

          this.vendorLoading = true;
          let { term = '', page = 1 } = query || {};
          this.preVendorQuery = { term, page };

          let url = `/configurator/programs/${this.programId}/vendors?active=true&page=${page}`;
          if (term) {
            url += `&k=${term}`;
          }

          return forkJoin([this.programService.get(url), of(page)]);
        })
      ).subscribe({
        next: (data: any) => {
          if(Array.isArray(data)) {

            const res: any = data?.[0] || {};
            const page: number = data?.[1];

            this.totalVendors = res?.total_records;
            let vendors: Array <any> =  (res?.program_vendors || [])?.map((vd: any) => (vd?.vendor || {}));
            if(page === 1) {
              this.vendors = vendors;
            } else {
              this.vendors = [ ...this.vendors, ...vendors ];
            }
          }

          this.vendorLoading = false;
        }, error: (err: Error | any) => {
          console.error(err);
          this.vendorLoading = false;
          this._alertService.error(errorHandler(err));
        }
      })
    );

    // Labor Category Subscription
    this.subscriptions.push(
      this.laborCategorySub.pipe(
        distinctUntilChanged((prev: Query, curr: Query) => {
          return (
            (prev?.page === curr?.page) &&
            (prev?.term === curr?.term)
          );
        }),
        debounceTime(400),
        switchMap((query: Query) => {

          this.laborCategoryLoading = true;
          let { term = '', page = 1 } = query || {};
          this.preLaborCategoryQuery = { term, page };

          let url = `/configurator/programs/${this.programId}/industries?page=${page}`;
          if (term) {
            url += `&name=${term}`;
          }

          return forkJoin([this.programService.get(url), of(page)]);
        })
      ).subscribe({
        next: (data: any) => {
          if(Array.isArray(data)) {

            const res: any = data?.[0] || {};
            const page: number = data?.[1];

            this.totalLaborCategory = res?.total_records;
            let labor_categories: Array <any> =  res?.industries || [];
            if(page === 1) {

              this.labor_categories = labor_categories;
            } else {
              this.labor_categories = [ ...this.labor_categories, ...labor_categories ];
            }
          }

          this.laborCategoryLoading = false;
        }, error: (err: Error | any) => {
          console.error(err);
          this.laborCategoryLoading = false;
          this._alertService.error(errorHandler(err));
        }
      })
    );

    this.hierarchySub.next(this.programId);
    this.getIndustriesList();
    this.vendorSub.next({ term: '', page: 1 });
  }

  get feeConfigForm() { return this.feesForm.controls; }
  getDetailsById(id){
    const url = `/configurator/programs/${this.programId}/msps/fees/${id}`;
    this.loader.show();
    this.programService.get(url)
      .subscribe({
        next: (res: any) => {
          this.loader.hide();
          // Effective date
          const { msp_fee } = res;
          this.fundingModelValue = msp_fee?.funded_by
          if(this.fundingModelValue == 'Vendor' || this.fundingModelValue == 'Client'){
            this.isDisabled = true;
          }else{
            this.isDisabled = false;
          }

          if(this.fundingModelValue == 'Hybrid'){
            this.toggles.msp_partner.feesType = 'percentage';
            this.mspPartnerFeeTypeDisabled = true;
            this.toggles.vms.feesType = 'percentage';
            this.vmsFeeTypeDisabled = true;
            this.isVMsFeeDisabled = true
          }
          if('effective_date' in msp_fee)
            this.feesForm.get('effective_date').setValue(this.datePipe.transform(msp_fee.effective_date, this.dateFormat ,null ,null , true, DATE_FORMAT.FORMATYMD));
          else
          this.feesForm.get('effective_date').setValue(null);
          this.hierarchyEditData = res['msp_fee']['hierarchy_levels'].map(h => h.id);
          this.hierarchySub.next(this.programId);
          setTimeout(() => {
            this.feesForm.get('hierarchy').setValue(this.hierarchyEditData);
          }, 1200);
          this.selectedLaborCategories = res['msp_fee']['industries'];
          this.selectedVendors = res['msp_fee']['vendors'];
          this.laborCategoryEditData = this.selectedLaborCategories.map((entry: any) => entry?.id);
          this.vendorEditData = this.selectedVendors.map((entry: any) => entry?.id);
          this.titleToggle.value =  res['msp_fee']['is_enabled'];
          this.feesForm?.patchValue({
            title:res['msp_fee']['title'],
            vendors: this.vendorEditData,
            labor_category: this.laborCategoryEditData
          })

          // Sourcing model
          let temp = res['msp_fee']['sourcing_models']?.toString(',');
          if (temp?.includes('SOW')) {
            this.feesForm.get('source_model_sow').setValue('SOW');
            this.selectedSourceModel.push('SOW');
          }
          if (temp?.includes('DIRECT_SOURCING')) {
            this.feesForm.get('source_model_direct').setValue('DIRECT_SOURCING');
            this.selectedSourceModel.push('DIRECT_SOURCING');
          }
          if (temp?.includes('CONTINGENT')) {
            this.feesForm.get('source_model_contingent').setValue('CONTINGENT');
            this.selectedSourceModel.push('CONTINGENT');
          }

          //  categorical_fees
          // this.toggles.msp_partner.value = false;
          this.toggles.vms.value = false;
          let fee_type = res['msp_fee']['categorical_fees'];
          fee_type.forEach(element => {
            if (element.fee_category == 'VMS') {
              this.toggles.vms.value = true;
              this.toggles.vms.feesType = element.fee_type == 'FIXED' ? 'fixed' : 'percentage';
              this.toggles.vms.funded_by = (element?.funded_by || '')?.toLowerCase();
              this.vmsfeesType(this.toggles.vms.feesType);
              element.applicable_config.forEach(element1 => {
                if (element1.entity_ref == 'TIMESHEETS') {
                  this.toggles.vms.vms_timesheet_fees = element1.fee;
                  element1.fee === null ? (this.toggles.vms.vmsFees[0].isSelected = false) : (this.toggles.vms.vmsFees[0].isSelected = true);
                }
                if (element1.entity_ref == 'EXPENSES') {
                  this.toggles.vms.vms_expense_fees = element1.fee;
                  element1.fee === null ? (this.toggles.vms.vmsFees[1].isSelected = false) : (this.toggles.vms.vmsFees[1].isSelected = true);
                }
                if (element1.entity_ref == 'MISC_EXPENSES') {
                  this.toggles.vms.vms_miscExpense_fees = element1.fee;
                  element1.fee === null ? (this.toggles.vms.vmsFees[2].isSelected = false) : (this.toggles.vms.vmsFees[2].isSelected = true);
                }
                if (element1.entity_ref == 'SOW_PROJECT') {
                  this.toggles.vms.vms_sow_project_fees = element1.fee;
                  element1.fee === null ? (this.toggles.vms.vmsFees[3].isSelected = false) : (this.toggles.vms.vmsFees[3].isSelected = true);
                }
              });
            }
            if (element.fee_category == 'MSP_PARTNER') {
              this.toggles.msp_partner.value = true;
              this.toggles.msp_partner.feesType = element.fee_type == 'FIXED' ? 'fixed' : 'percentage';
              this.toggles.msp_partner.funded_by = (element?.funded_by || '')?.toLowerCase();
              this.mspfeesType(this.toggles.msp_partner.feesType);
              element.applicable_config.forEach(element1 => {
                if (element1.entity_ref == 'TIMESHEETS') {
                  this.toggles.msp_partner.msp_partner_timesheet_fees = element1.fee;
                  element1.fee === null ? (this.toggles.msp_partner.mspFees[0].isSelected = false) : (this.toggles.msp_partner.mspFees[0].isSelected = true);
                }
                if (element1.entity_ref == 'EXPENSES') {
                  this.toggles.msp_partner.msp_partner_expense_fees = element1.fee;
                  element1.fee === null ? (this.toggles.msp_partner.mspFees[1].isSelected = false) : (this.toggles.msp_partner.mspFees[1].isSelected = true);
                }
                if (element1.entity_ref == 'MISC_EXPENSES') {
                  this.toggles.msp_partner.msp_partner_miscExpense_fees = element1.fee;
                  element1.fee === null ? (this.toggles.msp_partner.mspFees[2].isSelected = false) : (this.toggles.msp_partner.mspFees[2].isSelected = true);
                }
                if (element1.entity_ref == 'SOW_PROJECT') {
                  this.toggles.msp_partner.msp_partner_sow_project_fees = element1.fee;
                  element1.fee === null ? (this.toggles.msp_partner.mspFees[3].isSelected = false) : (this.toggles.msp_partner.mspFees[3].isSelected  = true);
                }
              });
            }
          });

        this.initializeVendorPopulationLock(res?.['msp_fee']?.['vendors']);
        this.initializeLaborCategoryPopulationLock(res?.['msp_fee']?.['industries']);


          /*

        TODO: (BLOCKER)
        Empty parameters received if provided:

        - categorical_fees = []
        - labor_categories = []
        - vendors = []

      */
        },
        error: err => {
          this.loader.hide();
          this._alertService.error(errorHandler(err));
        }
      }
    );
  }

  allFieldsFilled() {

    const values: any = this.feesForm.value;
    let hierarchy_dict: Array <any> = this.generateUpdateDictionary(this.hierarchyEditData ,this.feesForm.get('hierarchy').value);
    let labor_category_dict: Array <any> = this.generateUpdateDictionary(this.laborCategoryEditData ,this.selectedLaborCategories);

    return (
      !!(values.title) &&
      ((hierarchy_dict || [])?.length) &&
      ((this.selectedSourceModel || [])?.length) &&
      ((labor_category_dict || [])?.length) &&
      !!(values?.effective_date) &&
      this.toggles.msp_partner?.funded_by &&
      this.mspPartnerFeeTypeSelected &&
      this.mspFeeUsed && this.vmsFeeUsed
    );
  }

  onSubmit() {

    let hierarchy_dict: Array <any> = this.generateUpdateDictionary(this.hierarchyEditData ,this.feesForm.get('hierarchy').value);
    let labor_category_dict: Array <any> = this.generateUpdateDictionary(this.laborCategoryEditData ,this.selectedLaborCategories);
    let vendor_dict: Array <any> = this.generateUpdateDictionary(this.vendorEditData, this.selectedVendors);

    const msp_fee_type: string = this.toggles?.msp_partner?.feesType?.toUpperCase();
    let total_msp_fee: number = (
      Number.parseFloat(this.toggles?.msp_partner?.msp_partner_timesheet_fees || 0) +
      Number.parseFloat(this.toggles?.msp_partner?.msp_partner_expense_fees || 0) +
      Number.parseFloat(this.toggles?.msp_partner?.msp_partner_miscExpense_fees || 0) +
      Number.parseFloat(this.toggles?.msp_partner?.msp_partner_sow_project_fees || 0)
    );

    const vms_fee_type: string = this.toggles?.vms?.feesType?.toUpperCase();
    let total_vms_fee: number = (
      Number.parseFloat(this.toggles?.vms?.vms_timesheet_fees || 0) +
      Number.parseFloat(this.toggles?.vms?.vms_expense_fees || 0) +
      Number.parseFloat(this.toggles?.vms?.vms_miscExpense_fees || 0) +
      Number.parseFloat(this.toggles?.vms?.vms_sow_project_fees || 0)
    );

    const payload = {
      title:this.feesForm.value.title,
      is_enabled:this.titleToggle?.value,
      sourcing_models: this.selectedSourceModel,
      effective_date: this.datePipe.transform(this.feesForm.get('effective_date').value, DATE_FORMAT.FORMATYMD ,null ,null , true, this.dateFormat),
      hierarchy_levels: hierarchy_dict,
      industries: this.isAllLaborCategoriesSelected ? 'All' : labor_category_dict,
      vendors: this.isAllVendorSelected ? 'All' : vendor_dict,
      categorical_fees: [],
      funded_by: this.fundingModelValue
    };

    if(!vendor_dict.length)
    delete payload.vendors;

    payload.categorical_fees.push({
      fee_category: 'MSP_PARTNER',
      fee_type: (msp_fee_type === 'PERCENTAGE') ? 'PERCENT' : 'FIXED',
      funded_by: this.toggles.msp_partner.funded_by,
      applicable_config: this.isMSPsowSelected
        ? [
          {
            entity_ref: 'TIMESHEETS',
            fee: this.toggles.msp_partner.mspFees[0].isSelected ? this.toggles.msp_partner.msp_partner_timesheet_fees : null,
          },
          {
            entity_ref: 'EXPENSES',
            fee: this.toggles.msp_partner.mspFees[1].isSelected ? this.toggles.msp_partner.msp_partner_expense_fees : null,
          },
          {
            entity_ref: 'MISC_EXPENSES',
            fee: this.toggles.msp_partner.mspFees[2].isSelected ? this.toggles.msp_partner.msp_partner_miscExpense_fees : null,
          },
          {
            entity_ref: 'SOW_PROJECT',
            fee: this.toggles.msp_partner.mspFees[3].isSelected ? this.toggles.msp_partner.msp_partner_sow_project_fees : null,
          },
        ]
        : [
          {
            entity_ref: 'TIMESHEETS',
            fee: this.toggles.msp_partner.mspFees[0].isSelected ? this.toggles.msp_partner.msp_partner_timesheet_fees : null,
          },
          {
            entity_ref: 'EXPENSES',
            fee: this.toggles.msp_partner.mspFees[1].isSelected ? this.toggles.msp_partner.msp_partner_expense_fees : null,
          },
          {
            entity_ref: 'MISC_EXPENSES',
            fee: this.toggles.msp_partner.mspFees[2].isSelected ? this.toggles.msp_partner.msp_partner_miscExpense_fees : null,
          }
        ],
      is_enabled: this.toggles.msp_partner.value,
    });

    payload.categorical_fees.push({
      fee_category: 'VMS',
      fee_type: (vms_fee_type === 'PERCENTAGE') ? 'PERCENT' : 'FIXED',
      funded_by: this.toggles.vms.funded_by,
      applicable_config: this.isVMSsowSelected
        ? [
          {
            entity_ref: 'TIMESHEETS',
            fee: this.toggles.vms.vmsFees[0].isSelected ? this.toggles.vms.vms_timesheet_fees : null,
          },
          {
            entity_ref: 'EXPENSES',
            fee: this.toggles.vms.vmsFees[1].isSelected ? this.toggles.vms.vms_expense_fees : null,
          },
          {
            entity_ref: 'MISC_EXPENSES',
            fee: this.toggles.vms.vmsFees[2].isSelected ? this.toggles.vms.vms_miscExpense_fees : null,
          },
          {
            entity_ref: 'SOW_PROJECT',
            fee: this.toggles.vms.vmsFees[3].isSelected ? this.toggles.vms.vms_sow_project_fees : null,
          },
        ]
        : [
          {
            entity_ref: 'TIMESHEETS',
            fee: this.toggles.vms.vmsFees[0].isSelected ? this.toggles.vms.vms_timesheet_fees : null,
          },
          {
            entity_ref: 'EXPENSES',
            fee: this.toggles.vms.vmsFees[1].isSelected ? this.toggles.vms.vms_expense_fees : null,
          },
          {
            entity_ref: 'MISC_EXPENSES',
            fee: this.toggles.vms.vmsFees[2].isSelected ? this.toggles.vms.vms_miscExpense_fees : null,
          },
        ],
      is_enabled: this.toggles.vms.value,
    });

    const mspPartnerValidation: boolean = (Math.ceil(total_msp_fee) === 0) && this.mspFeeUsed;
    const vmsFeeValidation: boolean = (Math.ceil(total_vms_fee) === 0) && this.vmsFeeUsed;

    if(mspPartnerValidation && vmsFeeValidation) {

      let validationText: string = null;
      if(msp_fee_type === 'PERCENTAGE' && vms_fee_type === 'PERCENTAGE') {
        validationText = 'MSP Partner Fee and VMS Fee was entered as 0%. Are you sure you want to proceed ahead?';
      }

      if(msp_fee_type === 'FIXED' && vms_fee_type === 'FIXED') {
        validationText = 'MSP Partner Fee and VMS Fee was entered as 0. Are you sure you want to proceed ahead?';
      }

      if(msp_fee_type === 'PERCENTAGE' && vms_fee_type === 'FIXED') {
        validationText = 'MSP Partner Fee was entered as 0% and VMS Fee was entered as 0. Are you sure you want to proceed ahead?';
      }

      if(msp_fee_type === 'FIXED' && vms_fee_type === 'PERCENTAGE') {
        validationText = 'MSP Partner Fee was entered as 0 and VMS Fee was entered as 0%. Are you sure you want to proceed ahead?';
      }

      if(validationText) {
        this.confirmation.confirm('Warning', validationText, 'Yes', 'No', 'lg')
        .then((flag: boolean) => {
            if(flag) {
              this.saveData(payload);
            }
          });

        return;
      }
    }

    if(mspPartnerValidation) {
      if(msp_fee_type === 'PERCENTAGE') {

        this.confirmation.confirm('Warning',
          'MSP Partner Fee was entered as 0%. Are you sure you want to proceed ahead?',
          'Yes', 'No', 'lg').then((flag: boolean) => {
            if(flag) {
              this.saveData(payload);
            }
          });

        return;
      } else if(msp_fee_type === 'FIXED') {

        this.confirmation.confirm('Warning',
        'MSP Partner Fee was entered as $0. Are you sure you want to proceed ahead?',
        'Yes', 'No', 'lg').then((flag: boolean) => {
          if(flag) {
            this.saveData(payload);
          }
        });

        return;
      }
    }

    if(vmsFeeValidation) {
      if(vms_fee_type === 'PERCENTAGE') {

        this.confirmation.confirm('Warning',
          'VMS Fee was entered as 0%. Are you sure you want to proceed ahead?',
          'Yes', 'No', 'lg').then((flag: boolean) => {
            if (flag) {
              this.saveData(payload);
            }
          });

        return;
      } else if(vms_fee_type === 'FIXED') {

        this.confirmation.confirm('Warning',
          'VMS Fee was entered as 0. Are you sure you want to proceed ahead?',
          'Yes', 'No', 'lg').then((flag: boolean) => {
            if (flag) {
              this.saveData(payload);
            }
          });

        return;
      }
    }

    this.saveData(payload);
  }

  private saveData(payload: any) {

    this.submitted = true;
    this.feesForm.value.titleToggle = this.titleToggle.value;
    this.loader.show();

    if (this.isEditMode === true) {
      this.isEditMode = false;
      this.subscriptions.push(
        this.userService.put(`/configurator/programs/${this.programId}/msps/fees/${this.editId}`, payload).subscribe({
          next: (
            (data: any) => {
              if (data) {
                this.loader.hide();
                this._alertService.success(`Fee updated successfully.`);
                this.router.navigate(['configuration', 'fees-configuration', 'detail-page'], { queryParams: { id: data?.id } }).then(() => {
                  setTimeout(() => {
                    this.eventStream.emit(new EmitEvent(Events.FEE_CONFIG_EDIT, data.id));
                  }, 800);
                });
              }
            }), error:
            err => {
              this.loader.hide();
              this._alertService.error(errorHandler(err));
            },
        }
        ),
      );
      return;
    }

    this.subscriptions.push(
      this.userService.post(`/configurator/programs/${this.programId}/msps/fees`, payload).subscribe({
        next:
          data => {
            if (data) {
              this.loader.hide();
              this._alertService.success(`Fee created successfully.`);
              this.router.navigate(['configuration', 'fees-configuration', 'detail-page'], { queryParams: { id: data?.id } }).then(() => {
                setTimeout(() => {
                  this.eventStream.emit(new EmitEvent(Events.FEE_CONFIG_EDIT, data?.id));
                }, 800);
              });
            }
          }, error:
          err => {
            this.loader.hide();
            this._alertService.error(errorHandler(err));
          },
      }
      ),
    );
  }

generateUpdateDictionary(prev: Array <string>, curr: Array <string>): Array <any> {

  let result: Array <any> = [];
  if(Array.isArray(curr)) {
    result = curr.map((id: string) => {
      return { [id]: true };
    });
  }

  if(Array.isArray(prev)) {
    let removedIds: Array <string> = prev.filter((id: string) => {
      return !(curr || []).includes(id);
    });

    result = [
      ...result,
      ...removedIds.map((id: string) => {
        return {[id]: false};
      })
    ];
  }

  return result;
}

// checkbox click
onClickCheckBox(event, type){
}

  // fees input value
  valueChanged(event, field) {
    if (field == 'msp_partner_timesheet_fees') {
      this.toggles.msp_partner.msp_partner_timesheet_fees = event;
    }
    if (field == 'msp_partner_expense_fees') {
      this.toggles.msp_partner.msp_partner_expense_fees = event;
    }
    if (field == 'msp_partner_miscExpense_fees') {
      this.toggles.msp_partner.msp_partner_miscExpense_fees = event;
    }
    if (field == 'msp_partner_sow_project_fees') {
      this.toggles.msp_partner.msp_partner_sow_project_fees = event;
    }

    if (field == 'vms_timesheet_fees') {
      this.toggles.vms.vms_timesheet_fees = event;
    }
    if (field == 'vms_expense_fees') {
      this.toggles.vms.vms_expense_fees = event;
    }
    if (field == 'vms_miscExpense_fees') {
      this.toggles.vms.vms_miscExpense_fees = event;
    }
    if (field == 'vms_sow_project_fees') {
      this.toggles.vms.vms_sow_project_fees = event;
    }
  }

// dropdown click
  dropDownValueChanged(event, field) {
    this.isVMsFeeDisabled = false;
    this.isMspPartnerFeeDisabled = false;

    if(Array.isArray(field)) {
      field.forEach((val: string) => {
        this.dropDownValueChanged(event, val);
      });

      return;
    }

    if (field == 'MspPartnerFeesType' || field == 'vmsFeeType') {
      this.mspfeesType(event);
      this.vmsfeesType(event);
    }

    if (field === 'MspPartnerFeesType') {
      this.toggles.msp_partner.feesType = event;
      if (this.fundingModelValue !== 'Hybrid') {
        this.toggles.vms.feesType = event;
        if (event) {
          this.vmsFeeTypeDisabled = true;
        } else {
          this.vmsFeeTypeDisabled = false;
        }
      }
    }

    if (field === 'vmsFeeType') {
      this.toggles.vms.feesType = event;
      if (this.fundingModelValue !== 'Hybrid') {
        this.toggles.msp_partner.feesType = event;
        if (event) {
          this.mspPartnerFeeTypeDisabled = true;
        } else {
          this.mspPartnerFeeTypeDisabled = false;
        }
      }
    }

    if (field === 'MspPartnerFeeApplicationOn') {
      this.toggles.msp_partner.funded_by = event;
      if (!event) {
        this.toggles.vms.funded_by = event;
      }
      if(event?.toLowerCase() == 'vendor' && this.fundingModelValue == 'Hybrid'){
        this.toggles.vms.funded_by = 'client';
        this.isVMsFeeDisabled = true;
      }
      if(event.toLowerCase() == 'client' && this.fundingModelValue == 'Hybrid'){
        this.toggles.vms.funded_by = 'vendor';
        this.isVMsFeeDisabled = true;
      }
    }

    if (field === 'VmsFeeApplicationOn') {
      this.toggles.vms.funded_by = event;
      if (!event) {
        this.toggles.msp_partner.funded_by = event;
      }
      if(event?.toLowerCase() == 'vendor' && this.fundingModelValue == 'Hybrid'){
        this.toggles.msp_partner.funded_by = 'client';
        this.isMspPartnerFeeDisabled = true;
      }
      if(event.toLowerCase() == 'client' && this.fundingModelValue == 'Hybrid'){
        this.toggles.msp_partner.funded_by = 'vendor';
        this.isMspPartnerFeeDisabled = true;
      }
    }
  }

  backClicked(){
    this.router.navigate(['configuration', 'fees-configuration', 'list']);
  }

changeSelectedHierarchies(selected: Array <string>) {
  if(Array.isArray(selected)) {
    this.feesForm.get('hierarchy').setValue(selected);
  }
}

get hierarchySelected() {
  const selection: any = this.feesForm.get('hierarchy').value;
  return Array.isArray(selection) && selection.length;
}

setCurrentDate() {
  let date: Date = new Date();
  let datepickerInput = this.datePipe.transform(date, this.dateFormat ,null ,null , true,);
  this.feesForm.get('effective_date').setValue(datepickerInput);
}
getIndustriesList() {
  this.programService.get(`/configurator/programs/${this.programId}/industries`).subscribe((data: any) => {
    this.labor_categories = data.industries;
  });
}

onChangeVendor(value) {
  if (value == 'All') {
    this.isAllVendorSelected = true;
    this.selectedVendors = this.vendors;
    this.feesForm.controls['vendors'].disable();
  } else {
    const isAlreadyExist = this.selectedVendors.findIndex(entity => entity?.id === value);
    if (isAlreadyExist === -1) {
      this.selectedVendors.push({ name: this.vendors.filter((t: any) => t.id == value)[0].name, id: value });
      this.feesForm.get('vendors').setValue(null);
    }
  }
}

showMoreVendors() {
  if(!this.vendorLoading) {
    if(this.vendors?.length < this.totalVendors) {
      this.vendorSub.next({
        ...this.preVendorQuery,
        page: (this.preVendorQuery?.page || 0) + 1
      });
    }
  }
}

showMoreLaborCategory() {
  if(!this.laborCategoryLoading) {
    if(this.labor_categories?.length < this.totalLaborCategory) {
      this.laborCategorySub.next({
        ...this.preLaborCategoryQuery,
        page: (this.preLaborCategoryQuery?.page || 0) + 1
      });
    }
  }
}


onChangeIndustry(value) {
  if (value == 'All') {
    this.isAllLaborCategoriesSelected = true;
    this.selectedLaborCategories = this.labor_categories;
    this.feesForm.controls['labor_category'].disable();
  } else {
    const isAlreadyExist = this.selectedLaborCategories.findIndex(entity => entity?.id === value);
    if (isAlreadyExist === -1) {
      this.selectedLaborCategories.push({ name: this.labor_categories.filter((t: any) => t.id == value)[0].name, id: value });
      this.feesForm.get('labor_category').setValue(null);
    }
  }
}

setSourceModel(controlName, e) {
  const isAlreadyExist = this.selectedSourceModel.findIndex(entity => entity === e.target.value);
  if (isAlreadyExist === -1) {
    let selected = e.target.value;
    this.selectedSourceModel.push(selected);
    this.feesForm.get(controlName).setValue(selected);
  } else {
    this.selectedSourceModel.splice(isAlreadyExist, 1);
  }
}
searchVendor(evt: any) {
  this.vendorSub.next({ term: evt?.term, page: 1 });
}
searchLaborCategory(evt: any) {
  this.laborCategorySub.next({ term: evt?.term, page: 1 });
}
mspfeesType(event){
  if(event){
    if (event == 'percentage') {
      this.mspPartnerFee = true;
    } else{
      this.mspPartnerFee = false;
    }
  }else{
    this.mspPartnerFee = null;
  }
}
vmsfeesType(event){
  if (event == 'percentage') {
    this.vmsFeePercentage = true;
  } else{
    this.vmsFeePercentage = false;
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

  onClickToggleMsp() {
    if (this.toggles.msp_partner.value) {
      this.toggles.msp_partner.value = false;
    } else {
      this.toggles.msp_partner.value = true;
    }
  }

  onClickToggleVmsFee() {
    if (this.toggles?.vms?.value) {
      this.toggles.vms.value = false
    } else {
      this.toggles.vms.value = true;
    }
  }

  initializeVendorPopulationLock(vendors: Array <any>) {
    if(Array.isArray(vendors)) {

      let $destroySub: Subject <void> = new Subject <void> ();
      interval(200).pipe(
        takeUntil($destroySub)
      ).subscribe(() => {
        if(!this.vendorLoading) {
          $destroySub.next();
          let _vendors: any = _.cloneDeep(this.vendors);
          this.vendors = [ ...this.vendors, ...vendors ];
          setTimeout(() => {
            this.vendors = _vendors;
          }, 0);
        }
      });
    }
  }

  initializeLaborCategoryPopulationLock(labor_categories: Array <any>) {
    if(Array.isArray(labor_categories)) {

      let $destroySub: Subject <void> = new Subject <void> ();
      interval(200).pipe(
        takeUntil($destroySub)
      ).subscribe(() => {
        if(!this.laborCategoryLoading) {
          $destroySub.next();
          let _labor_categories: any = _.cloneDeep(this.labor_categories);
          this.labor_categories = [ ...this.labor_categories, ...labor_categories ];
          setTimeout(() => {
            this.labor_categories = _labor_categories;
          }, 0);
        }
      });
    }
  }

  get dateFormat(): string {
    let format: string = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat.toUpperCase() ?? DATE_FORMAT.FORMATMDY;
    // while(format.includes('D')) {
    //   format = format.replace('D', 'd');
    // }

    return format;
  }

  get mspFeeValidationError() {

    const mspPartnerRef: any = this.toggles.msp_partner;
    const invalid_values: Array <any> = [null, undefined, ''];

    return (
      (mspPartnerRef?.mspFees?.[0]?.isSelected && invalid_values.includes(mspPartnerRef?.msp_partner_timesheet_fees)) ||
      (mspPartnerRef?.mspFees?.[1]?.isSelected && invalid_values.includes(mspPartnerRef?.msp_partner_expense_fees)) ||
      (mspPartnerRef?.mspFees?.[2]?.isSelected && invalid_values.includes(mspPartnerRef?.msp_partner_miscExpense_fees)) ||
      (mspPartnerRef?.mspFees?.[3]?.isSelected && invalid_values.includes(mspPartnerRef?.msp_partner_sow_project_fees))
    );
  }

  get vmsFeeValidationError() {

    const invalid_values: Array <any> = [null, undefined, ''];
    return (
      (this.toggles?.vms?.vmsFees?.[0]?.isSelected && invalid_values.includes(this.toggles?.vms?.vms_timesheet_fees)) ||
      (this.toggles?.vms?.vmsFees?.[1]?.isSelected && invalid_values.includes(this.toggles?.vms?.vms_expense_fees)) ||
      (this.toggles?.vms?.vmsFees?.[2]?.isSelected && invalid_values.includes(this.toggles?.vms?.vms_miscExpense_fees)) ||
      (this.toggles?.vms?.vmsFees?.[3]?.isSelected && invalid_values.includes(this.toggles?.vms?.vms_sow_project_fees))
    );
  }

  get mspPartnerFeeTypeSelected() {
    return (typeof(this.mspPartnerFee) === 'boolean');
  }

  get vmsFeeTypeSelected() {
    return (typeof(this.vmsFeePercentage) === 'boolean');
  }

  get mspFeeUsed(): boolean {
    return (
      this.toggles?.msp_partner?.mspFees?.[0]?.isSelected ||
      this.toggles?.msp_partner?.mspFees?.[1]?.isSelected ||
      this.toggles?.msp_partner?.mspFees?.[2]?.isSelected ||
      this.toggles?.msp_partner?.mspFees?.[3]?.isSelected
    );
  }

  get vmsFeeUsed(): boolean {
    return (
      this.toggles?.vms?.vmsFees?.[0]?.isSelected ||
      this.toggles?.vms?.vmsFees?.[1]?.isSelected ||
      this.toggles?.vms?.vmsFees?.[2]?.isSelected ||
      this.toggles?.vms?.vmsFees?.[3]?.isSelected
    );
  }

  get isMSPsowSelected(): boolean {
    return this.toggles?.msp_partner?.mspFees?.[3]?.isSelected;
  }

  get isVMSsowSelected(): boolean {
    return this.toggles?.vms?.vmsFees?.[3]?.isSelected;
  }

  updateFundingModel(){
    this.toggles.msp_partner.funded_by = this.toggles.vms.funded_by = this.fundingModelValue !== 'Hybrid' ? this.fundingModelValue : null
    if(this.fundingModelValue == 'Vendor' || this.fundingModelValue == 'Client'){
      this.mspPartnerFeeTypeDisabled = false;
      this.vmsFeeTypeDisabled = false;
      this.isDisabled = true;
    }else{
      this.dropDownValueChanged('percentage', 'MspPartnerFeesType');
      this.mspPartnerFeeTypeDisabled = true;
      this.dropDownValueChanged('percentage', 'vmsFeeType');
      this.vmsFeeTypeDisabled = true;
      this.isDisabled = false;
    }
  }
}
