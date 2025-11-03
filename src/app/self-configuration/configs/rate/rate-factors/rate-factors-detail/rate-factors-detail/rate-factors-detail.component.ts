import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { RateFactorService } from 'src/app/program-setup/rate-factor/rate-factor.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AccuracyConfigEnum } from 'src/app/shared/enums';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-rate-factors-detail',
  templateUrl: './rate-factors-detail.component.html',
  styleUrls: ['./rate-factors-detail.component.scss']
})
export class RateFactorsDetailComponent implements OnInit {

  private subscriptions: Array<Subscription> = [];
  @Output() close: EventEmitter<any> = new EventEmitter<any>();

  @Input() title: string;
  @Input() createMode: boolean = false;
  @Input() isViewMode: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() buttonTitle: string = 'Save';
  @Input() isListingMode: boolean = false;

  public tabIndex: number = 0;
  public rateFactorForm: UntypedFormGroup;
  public sidebarVisibility = 'hidden';
  public addPayAdjustment: boolean = false;
  public addBillAdjustment: boolean = false;
  public toggle = {
    is_enabled: {
      title: 'active',
      value: true
    },
    billable: {
      title: 'Billable',
      value: true
    },
    hide_rate_factors: {
      title: 'Hide Rate Factors',
      value: false
    },
    edit_rate_factors: {
      title: 'Edit Rate Factors',
      value: false
    }
  };

  public showAddBillRateBtn = true;
  public showAddPayRateBtn = true;
  public updateItemId = null;

  public jobTemplates: Array<string> = [];
  public selectedHierarchies: Array<string> = [];
  public rateFactorTypeOptions: Array<string> = [
    'Standard',
    'Over time',
    'Double time',
    'Holiday',
    'Weekend',
    'Other',
  ];

  public lockedRates: Array<string> = [
    'STANDARD',
    'OVER_TIME',
    'DOUBLE_TIME',
  ];

  public originalRateTypeCategory: string = null;
  public rateItems: Array<any> = [
    { name: 'Bill Rate', id: 'BILL_RATE' },
    { name: 'Pay Rate', id: 'PAY_RATE' },
  ];

  zeroVal = this.accuracyPipe.transform(0, AccuracyConfigEnum.AMOUNT, { isEdit: true });
  oneVal = this.accuracyPipe.transform(1, AccuracyConfigEnum.RATE, { isEdit: true });

  constructor(
    private programService: ProgramService,
    private storageService: StorageService,
    private alertService: AlertService,
    private loader: LoaderService,
    private eventStream: EventStreamService,
    public rateFactorService: RateFactorService,
    private accuracyPipe: AccuracyPipe
  ) { }

  ngOnInit(): void {
    this.showAddPayRateBtn = true;
    this.showAddBillRateBtn = true;
    this.resetForm();

    this.subscriptions.push(this.eventStream.on(Events.CREATE_RATE_FACTOR)
      .subscribe((data) => {
        this.createMode = true;
        this.isEditMode = false;
        this.isViewMode = false;
        this.resetForm();
      }));

    this.subscriptions.push(this.eventStream.on(Events.VIEW_RATE_FACTOR)
      .subscribe((data: any) => {

        let info: any = data?.data;
        if (info) {

          this.loader.show();
          this.rateFactorService.getRateFactorDetails(info?.id)
            .subscribe({
              next: (res: any) => {
                if (res?.rate_factor) {

                  this.loader.hide();
                  info = { ...info, ...res.rate_factor };

                  this.updateItemId = info.id;
                  this.createMode = false;
                  this.isViewMode = true;
                  this.isEditMode = false;

                  if (Array.isArray(info.hierarchies))
                    this.selectedHierarchies = info.hierarchies;
                  else
                    this.selectedHierarchies = [];

                  if (Array.isArray(info.job_template))
                    this.jobTemplates = info.job_template.map(node => node.id);
                  else
                    this.jobTemplates = [];

                  this.fetchTemplateNames();
                  this.populateAdjustments(info.bill_rate);
                  this.populateAdjustments(info.pay_rate);
                  this.createViewData(info);

                }
              }, error: (err: any) => {
                this.alertService.error(errorHandler(err));
                this.loader.hide();
              }
            }
            );
        }
      })
    );

    this.subscriptions.push(this.eventStream.on(Events.EDIT_RATE_FACTOR)
      .subscribe((data: any) => {

        let info: any = data?.data;
        if (info) {

          this.loader.show();
          this.rateFactorForm?.markAllAsTouched();
          this.rateFactorService.getRateFactorDetails(info?.id)
            .subscribe({
              next: (res: any) => {
                if (res?.rate_factor) {

                  this.loader.hide();
                  info = { ...info, ...res.rate_factor };

                  this.updateItemId = info.id;
                  this.createMode = false;
                  this.isViewMode = false;
                  this.isEditMode = true;
                  this.originalRateTypeCategory = info.type;

                  if (Array.isArray(info.hierarchies))
                    this.selectedHierarchies = info.hierarchies;
                  else
                    this.selectedHierarchies = [];

                  if (Array.isArray(info.job_template))
                    this.jobTemplates = info.job_template.map(node => node.id);
                  else
                    this.jobTemplates = [];

                  this.fetchTemplateNames();
                  this.populateAdjustments(info.bill_rate);
                  this.populateAdjustments(info.pay_rate);
                  this.createViewData(info);

                }
              }, error: (err: any) => {
                this.alertService.error(errorHandler(err));
                this.loader.hide();
              }
            }
            );
        }
      })
    );
  }

  fetchTemplateNames() {

    let no_name_ids: Array<string> = [];
    this.jobTemplates.forEach((id: string) => {
      let name: string = this.rateFactorService.jobTemplateMap.get(id);
      if (!name) { no_name_ids.push(id); }
    });

    no_name_ids.forEach((id: string) => {
      this.rateFactorService.fetchJobTemplate(id)
        .subscribe({
          next: (res: any) => {
            if (res && ('job_template' in res)) {
              let template: any = res.job_template;
              const { id, template_name } = template;
              this.rateFactorService.jobTemplateMap.set(id, template_name);
            }
          },
          error: (err: Error | any) => {
            this.alertService.error(errorHandler(err));
          }
        }
        );
    });
  }

  jobTemplateClick() {
    this.sidebarVisibility = 'visible';
    this.tabIndex = 0;

    this.eventStream.emit(new EmitEvent(Events.RATE_FACTOR_POPULATE, {
      job_templates: this.jobTemplates,
      hierarchies: this.selectedHierarchies
    }));
  }

  hierarchyClick() {
    this.sidebarVisibility = 'visible';
    this.tabIndex = 1;

    this.eventStream.emit(new EmitEvent(Events.RATE_FACTOR_POPULATE, {
      job_templates: this.jobTemplates,
      hierarchies: this.selectedHierarchies
    }));
  }

  onSave() {

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const billForm = this.rateFactorForm.get('bill_rate');
    const payForm = this.rateFactorForm.get('pay_rate');

    let payload = this.createPayload();
    if (this.addBillAdjustment) {
      payload.bill_rate = payload.bill_rate.map(rate => {

        if (!this.isBillable)
          return rate;

        return {
          ...rate,
          "adjustment_type": billForm.get('adjustment_type').value,
          "adjustment": parseFloat(billForm.get('adjustment_value').value) || 0
        };
      });
    }

    if (this.addPayAdjustment) {
      payload.pay_rate = payload.pay_rate.map(rate => {

        if (!this.isBillable)
          return rate;

        return {
          ...rate,
          "adjustment_type": payForm.get('adjustment_type').value,
          "adjustment": parseFloat(payForm.get('adjustment_value').value) || 0
        };
      });
    }

    if (this.isStandardFactor) {
      if (payload.bill_rate.length === 2)
        payload.bill_rate = [payload.bill_rate[0]];
      if (payload.pay_rate.length === 2)
        payload.pay_rate = [payload.pay_rate[0]];
    }

    this.loader.show();
    if (!this.isEditMode) {

      const url = `/configurator/programs/${programId}/rate-factors`;
      this.subscriptions.push(
        this.programService.post(url, payload)
          .subscribe({
            next: (data: any) => {

              this.alertService.success('Rate Factor Created Successfully');
              this.loader.hide();
              this.resetForm();

              this.selectedHierarchies = [];
              this.jobTemplates = [];
              this.eventStream.emit(new EmitEvent(Events.REFRESH, { list: true, edit: false, view: false, create: false }))

            }, error: (err: Error | any) => {
              this.alertService.error(errorHandler(err));
              this.loader.hide();
            }
          })
      );

    } else {

      const url = `/configurator/programs/${programId}/rate-factors/${this.updateItemId}`;
      this.subscriptions.push(
        this.programService.put(url, payload)
          .subscribe({
            next: (data: any) => {

              this.alertService.success('Rate Factor Updated Successfully');
              this.loader.hide();
              this.resetForm();

              this.selectedHierarchies = [];
              this.jobTemplates = [];
              this.eventStream.emit(new EmitEvent(Events.REFRESH, { list: true, edit: false, view: false, create: false }))

            }, error: (err: Error | any) => {
              this.alertService.error(errorHandler(err));
              this.loader.hide();
            }
          }
          )
      );
    }
  }

  fillInputFields(template: Array<any>, hierarchy: Array<any>) {

    let templates: string = '';
    let hierarchies: string = '';

    if (template)
      templates = template.map(node => node.name).join(', ');

    if (hierarchy)
      hierarchies = hierarchy.map(node => node.name).join(', ');

    this.rateFactorForm.get('template').setValue(templates);
    this.rateFactorForm.get('hierarchy').setValue(hierarchies);

  }

  onClose(evt) {

    if (evt) {
      const { hierarchyList, jobTemplates } = evt;
      this.jobTemplates = jobTemplates.map(node => node.id);
      this.selectedHierarchies = hierarchyList.map(node => node.id);
      this.fillInputFields(jobTemplates, hierarchyList);
    }

    this.tabIndex = 0;
    this.close.emit(true);
    this.sidebarVisibility = 'hidden';

  }

  resetForm() {
    this.rateFactorForm = new UntypedFormGroup({
      name: new UntypedFormControl(null, [Validators.required]),
      abbreviation: new UntypedFormControl(null, [Validators.required, Validators.maxLength(7)]),
      description: new UntypedFormControl(null, []),
      template: new UntypedFormControl(null, []),
      hierarchy: new UntypedFormControl(null, []),
      bill_rate: new UntypedFormGroup({
        first_factor: new UntypedFormControl(this.oneVal, [Validators.min(0.01), Validators.max(10), Validators.required]),
        first_rate: new UntypedFormControl('BILL_RATE', [Validators.required]),
        second_factor: new UntypedFormControl(null, [Validators.min(0.01), Validators.max(10)]),
        second_rate: new UntypedFormControl(null, []),
        adjustment_type: new UntypedFormControl('FLAT', []),
        adjustment_value: new UntypedFormControl(this.zeroVal, [])
      }),
      pay_rate: new UntypedFormGroup({
        first_factor: new UntypedFormControl(this.oneVal, [Validators.min(0.01), Validators.max(10), Validators.required]),
        first_rate: new UntypedFormControl('PAY_RATE', [Validators.required]),
        second_factor: new UntypedFormControl(null, [Validators.min(0.01), Validators.max(10)]),
        second_rate: new UntypedFormControl(null, []),
        adjustment_type: new UntypedFormControl('FLAT', []),
        adjustment_value: new UntypedFormControl(this.zeroVal, [])
      }),
      is_enabled: new UntypedFormControl(true, []),
      hide_rate_factors: new UntypedFormControl(false, []),
      edit_rate_factors: new UntypedFormControl(false, []),
      rate_factor_type: new UntypedFormControl(null, [Validators.required])
    });

    this.addPayAdjustment = false;
    this.addBillAdjustment = false;
    this.showAddBillRateBtn = true;
    this.showAddPayRateBtn = true;
    this.originalRateTypeCategory = null;
  }

  onClickToggle(toggles) {
    if (this.toggle) {

      const { is_enabled, hide_rate_factors, edit_rate_factors, billable } = this.toggle;

      if (toggles === 'is_enabled' && is_enabled) {
        if (this.toggle.is_enabled.value) {
          this.toggle.is_enabled.value = false;
          this.toggle.is_enabled.title = 'inactive';
        } else {
          this.toggle.is_enabled.value = true;
          this.toggle.is_enabled.title = 'active';
        }
      }

      if (toggles === 'hide_rate_factors' && hide_rate_factors) {
        if (this.toggle.hide_rate_factors.value) {
          this.toggle.hide_rate_factors.value = false;
        } else {
          this.toggle.hide_rate_factors.value = true;
          this.toggle.edit_rate_factors.value = false;
        }
      }

      if (toggles === 'edit_rate_factors' && edit_rate_factors) {
        if (this.toggle.edit_rate_factors.value) {
          this.toggle.edit_rate_factors.value = false;
        } else {
          this.toggle.edit_rate_factors.value = true;
        }
      }

      if (toggles === 'billable' && billable) {
        this.toggle.billable.value = !this.isBillable;
      }
    }
  }

  get formValue() {
    return this.rateFactorForm.controls;
  }

  get payRateValue() {
    return this.rateFactorForm.controls.pay_rate;
  }

  get billRateValue() {
    return this.rateFactorForm.controls.bill_rate;
  }

  addNewBillRate(action: string) {
    if (!this.isViewMode) {
      if (this.billRateValue.value.first_factor && this.billRateValue.value.first_rate) {
        if (action === 'add') {
          this.showAddBillRateBtn = false;
          this.billRateValue.patchValue({
            second_rate: (this.billRateValue.value.first_rate === 'BILL_RATE') ? 'PAY_RATE' : 'BILL_RATE',
            second_factor: this.oneVal
          });
        } else {
          this.showAddBillRateBtn = true;
          this.billRateValue.patchValue({
            second_factor: null,
            second_rate: null,
          });
        }
      }
    }
  }

  addNewPayRate(action) {
    if (!this.isViewMode) {
      if (this.payRateValue.value.first_factor && this.payRateValue.value.first_rate) {
        if (action === 'add') {
          this.showAddPayRateBtn = false;
          this.payRateValue.patchValue({
            second_rate: (this.payRateValue.value.first_rate === 'BILL_RATE') ? 'PAY_RATE' : 'BILL_RATE',
            second_factor: this.oneVal,
          });
        } else {
          this.showAddPayRateBtn = true;
          this.payRateValue.patchValue({
            second_factor: null,
            second_rate: null
          });
        }
      }
    }
  }

  createPayload() {
    return {
      name: this.formValue.name.value,
      abbreviation: this.formValue.abbreviation.value,
      description: this.formValue.description.value,
      bill_rate: this.createRateConfig(this.rateFactorForm.value.bill_rate),
      pay_rate: this.createRateConfig(this.rateFactorForm.value.pay_rate),
      is_enabled: this.toggle?.is_enabled?.value,
      hide_rate_factors: this.isBillable && this.toggle?.hide_rate_factors?.value,
      edit_rate_factors: this.isBillable && this.toggle?.edit_rate_factors?.value,
      hierarchies: this.selectedHierarchies,
      job_template: this.jobTemplates,
      type: this.formValue.rate_factor_type.value,
      billable: this.isBillable
    };
  }

  onRateChange(event: any, rateType: string, rate: string) {
    if (rateType === 'bill_rate') {
      if (!this.showAddBillRateBtn) {
        if (rate === 'first_rate') {
          this.billRateValue.patchValue({
            second_rate: this.billRateValue.value.second_rate === 'BILL_RATE' ? 'PAY_RATE' : 'BILL_RATE',
          });
        } else {
          this.billRateValue.patchValue({
            first_rate: this.billRateValue.value.first_rate === 'BILL_RATE' ? 'PAY_RATE' : 'BILL_RATE',
          });
        }
      }
    } else {
      if (!this.showAddPayRateBtn) {
        if (rate === 'first_rate') {
          this.payRateValue.patchValue({
            second_rate: this.payRateValue.value.second_rate === 'BILL_RATE' ? 'PAY_RATE' : 'BILL_RATE',
          });
        } else {
          this.payRateValue.patchValue({
            first_rate: this.payRateValue.value.first_rate === 'BILL_RATE' ? 'PAY_RATE' : 'BILL_RATE',
          });
        }
      }
    }
  }

  createRateConfig(data: any) {
    const config: Array<any> = [];
    config.push({
      factor: this.isBillable ? data.first_factor : '0.00',
      rate_type: data.first_rate,
    });

    if (data.second_factor && data.second_rate) {
      config.push({
        factor: this.isBillable ? data.second_factor : '0.00',
        rate_type: data.second_rate,
      });
    } else if (data.second_factor && !data.second_rate) {
      config.push({
        factor: this.isBillable ? data.second_factor : '0.00',
      });
    }

    return config;
  }

  createViewData(data: any): void {

    if (!data) {
      return;
    }

    this.rateFactorForm.patchValue({
      name: data.name,
      abbreviation: data.abbreviation,
      description: data.description,
      is_enabled: data.is_enabled,
      rate_factor_type: data.type,
      hide_rate_factors: data.hide_rate_factors,
      edit_rate_factors: data.edit_rate_factors
    });

    if (this.toggle) {
      const { is_enabled, hide_rate_factors, edit_rate_factors, billable } = this.toggle;
      if (is_enabled) {
        this.toggle.is_enabled.value = data.is_enabled;
        this.toggle.is_enabled.title = data.is_enabled ? 'active' : 'inactive';
      }
      if (hide_rate_factors) {
        this.toggle.hide_rate_factors.value = data.hide_rate_factors;
      }
      if (edit_rate_factors) {
        this.toggle.edit_rate_factors.value = data.edit_rate_factors;
      }
      if (billable) {
        this.toggle.billable.value = !!data?.billable;
      }
    }

    this.billRateValue.patchValue({
      first_factor: data.bill_rate[0].factor ? this.accuracyPipe.transform(data.bill_rate[0].factor, AccuracyConfigEnum.RATE, { isEdit: true }) : null,
      first_rate: data.bill_rate[0].rate_type ? data.bill_rate[0].rate_type : null,
    });

    if (data.bill_rate[1]) {
      this.showAddBillRateBtn = false;
      this.billRateValue.patchValue({
        second_factor: data.bill_rate[1].factor ? this.accuracyPipe.transform(data.bill_rate[1].factor, AccuracyConfigEnum.RATE, { isEdit: true }) : null,
        second_rate: data.bill_rate[1].rate_type ? data.bill_rate[1].rate_type : null,
      });
    }

    this.payRateValue.patchValue({
      first_factor: data.pay_rate[0].factor ? this.accuracyPipe.transform(data.pay_rate[0].factor, AccuracyConfigEnum.RATE, { isEdit: true }) : null,
      first_rate: data.pay_rate[0].rate_type ? data.pay_rate[0].rate_type : null,
    });

    if (data.pay_rate[1]) {
      this.showAddPayRateBtn = false;
      this.payRateValue.patchValue({
        second_factor: data.pay_rate[1].factor ? this.accuracyPipe.transform(data.pay_rate[1].factor, AccuracyConfigEnum.RATE, { isEdit: true }) : null,
        second_rate: data.pay_rate[1].rate_type ? data.pay_rate[1].rate_type : null,
      });
    }
  }

  get saveBtnDisabled() {

    let disabled: boolean = false;
    const { name, abbreviation, rate_factor_type } = this.rateFactorForm?.controls;

    const noHierarchySelected: boolean = (this.selectedHierarchies.length === 0);
    const invalidBillRate: boolean = this.rateFactorForm.get('bill_rate').invalid;
    const invalidPayRate: boolean = this.rateFactorForm.get('pay_rate').invalid;
    const invalidForm: boolean = name?.invalid || abbreviation?.invalid || rate_factor_type?.invalid;

    if (!this.isBillable) {
      disabled = (invalidForm || noHierarchySelected);
    } else {
      disabled = invalidBillRate || invalidPayRate || invalidForm || noHierarchySelected;
    }

    return disabled;
  }

  rateName(name: string) {
    let rateName: string = '';
    this.rateItems.forEach((item: any) => {
      if (item.id === name) {
        rateName = item.name;
      }
    });

    return rateName;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  onCancel() {

    this.toggle.edit_rate_factors.value = false;
    this.toggle.hide_rate_factors.value = false;
    this.addBillAdjustment = false;
    this.addPayAdjustment = false;
    this.showAddBillRateBtn = true;
    this.showAddPayRateBtn = true;

    this.selectedHierarchies = [];
    this.jobTemplates = [];
    this.resetForm();

    this.eventStream.emit(new EmitEvent(Events.REFRESH, { list: true, edit: false, view: false, create: false }));

  }

  removeSelectedTemplate(id: string, index: any) {
    this.jobTemplates.splice(index, 1);
    let placeholder: Array<string> = this.jobTemplates.map((id: string) => this.rateFactorService.jobTemplateMap.get(id));
    this.rateFactorForm.get('template').setValue(placeholder.join(', '));
  }

  removeSelectedHierarchies(id: string, index: any) {
    this.selectedHierarchies.splice(index, 1);
    let placeholder: Array<string> = this.selectedHierarchies.map((id: string) => this.rateFactorService.hierarchyMap.get(id));
    this.rateFactorForm.get('hierarchy').setValue(placeholder.join(', '));
  }

  get isStandardFactor() {
    return (this.rateFactorForm.get('rate_factor_type').value === 'STANDARD');
  }

  isFlatAdjustment(type: 'bill_rate' | 'pay_rate') {
    return (this.rateFactorForm.get(type).get('adjustment_type').value === 'FLAT');
  }

  populateAdjustments(rates: (Array<any> | undefined)) {
    if (Array.isArray(rates) && rates.length) {

      const field: string = rates[0].rate_type;
      const currForm = this.rateFactorForm.get(field.toLowerCase());

      if ((field === 'BILL_RATE') && rates[0].adjustment_type)
        this.addBillAdjustment = true;
      if ((field === 'PAY_RATE') && rates[0].adjustment_type)
        this.addPayAdjustment = true;

      rates.forEach((rate: any) => {

        if (rate.adjustment_type)
          currForm.get('adjustment_type').setValue(rate.adjustment_type);
        const accuracyType = rate?.adjustment_type?.toLowerCase() == 'flat' ? AccuracyConfigEnum.AMOUNT : AccuracyConfigEnum.AMOUNT_PERCENTAGE;
        if (rate.adjustment_value)
          currForm.get('adjustment_value').setValue(this.accuracyPipe.transform(rate.adjustment_value, accuracyType, { isEdit: true }));

        if (rate.adjustment)
          currForm.get('adjustment_value').setValue(this.accuracyPipe.transform(rate.adjustment, accuracyType, { isEdit: true }));

      });
    }
  }

  swapToEditMode() {
    this.createMode = false;
    this.isViewMode = false;
    this.isEditMode = true;
  }

  toggleAdjustment(type: 'bill_rate' | 'pay_rate') {
    switch (type) {
      case 'bill_rate':
        this.addBillAdjustment = !this.addBillAdjustment;
        if (this.addBillAdjustment)
          this.rateFactorForm.get('bill_rate').get('adjustment_value').setValue(this.zeroVal);
        break;
      case 'pay_rate':
        this.addPayAdjustment = !this.addPayAdjustment;
        if (this.addPayAdjustment)
          this.rateFactorForm.get('pay_rate').get('adjustment_value').setValue(this.zeroVal);
        break;
    }
  }

  changeAbbreviation(evt: string) {
    switch (evt) {
      case 'STANDARD':
        this.rateFactorForm.get('abbreviation').setValue('ST');
        break;
      case 'OVER_TIME':
        this.rateFactorForm.get('abbreviation').setValue('OT');
        break;
      case 'DOUBLE_TIME':
        this.rateFactorForm.get('abbreviation').setValue('DT');
        break;
      case 'HOLIDAY':
        this.rateFactorForm.get('abbreviation').setValue('HP');
        break;
      case 'WEEKEND':
        this.rateFactorForm.get('abbreviation').setValue('WE');
        break;
      case 'OTHER':
        this.rateFactorForm.get('abbreviation').setValue('OTH');
        break;
      default:
        this.rateFactorForm.get('abbreviation').setValue('');
        break;
    }

    if (this.lockedRateType) {
      this.toggle.billable.value = true;
    }
  }

  addToFactor(position: string) {

    if (this.isViewMode)
      return;

    let $form;
    switch (position) {
      case 'first_bill':
        $form = this.rateFactorForm.get('bill_rate').get('first_factor');
        $form.setValue(parseFloat($form.value) + 0.5);
        return;
      case 'second_bill':
        $form = this.rateFactorForm.get('bill_rate').get('second_factor');
        $form.setValue(parseFloat($form.value) + 0.5);
        return;
      case 'first_pay':
        $form = this.rateFactorForm.get('pay_rate').get('first_factor');
        $form.setValue(parseFloat($form.value) + 0.5);
        return;
      case 'second_pay':
        $form = this.rateFactorForm.get('pay_rate').get('second_factor');
        $form.setValue(parseFloat($form.value) + 0.5);
        return;
    }
  }

  getKeyValueType(val: string) {
    return val.toUpperCase().replace('-', '_').replace(' ', '_');
  }

  changeAdjustmentType(rateType, event) {
    const zeroVal = this.accuracyPipe.transform(0, event == 'FLAT' ? AccuracyConfigEnum.AMOUNT : AccuracyConfigEnum.AMOUNT_PERCENTAGE, { isEdit: true });
    this.rateFactorForm.get(rateType).get('adjustment_value').setValue(zeroVal);
  }

  get lockedRateType() {
    if (!this.rateFactorForm) {
      return false;
    }

    let rateTypeSelected: string = this.rateFactorForm?.get('rate_factor_type')?.value;
    if (this.lockedRates.includes(rateTypeSelected)) {
      return true;
    }

    return false;
  }

  get isBillable() {
    return this.toggle.billable.value;
  }
}
