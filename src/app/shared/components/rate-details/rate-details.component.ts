import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { CurrencyConfig } from 'src/app/expense/enums/accuracy-config.enum';
import { AccuracyPipe } from '../../pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/assignment/enums/accuracy-config';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { v4 as uuidv4 } from 'uuid';
import { FormRendererService } from 'src/app/library/form-renderer/form-renderer.service';
import * as _ from 'lodash';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

const RATE_TYPE_ST = 'st';

export interface RateModelPayloadDefaults {
  hierarchy: string;
  adjusted_markup?: any;
  rate_model: string;
  max_bill_rate?: any;
  min_bill_rate?: any;
  msp_fee_types: any;
  msp_fee_value: any;
  ot_exempt?: any;
  uuid?: any;
  msp_fee_funded_by: any;
  fee_details?:any;
}

const clearFormArray = (formArray: UntypedFormArray) => {
  while (formArray.length !== 0) {
    formArray.removeAt(0);
  }
}

@Component({
  selector: 'app-rate-details',
  templateUrl: './rate-details.component.html',
  styleUrls: ['./rate-details.component.scss']
})
export class RateDetailsComponent implements OnInit, OnChanges {
  programId: string = undefined;
  currency: string;
  accuracyConfig = AccuracyConfigEnum;
  standardRatesCopy: any;
  factorsCopy: any;
  _rateDetailsVisible: boolean = false;
  _ratesArray:any = [];

  public currencyConfig = CurrencyConfig;

  @Input() markupByRateTypeEnabled: boolean = false;
  @Input() costComponentEnabled: boolean = false;
  @Input()  set ratesArray(value) {
     if(value) {
      this._ratesArray = value;
     }
  }
  @Input() standardRates: any;
  @Input() factors: any;
  @Input() standardFactors?: any;
  @Input() vendorRateVisible: boolean = true;
  @Input() payrateVisible: boolean = true;
  @Input() billrateVisible: boolean = true;
  @Input() editableVendorRate: boolean = true;
  @Input() editablePayrate: boolean = true;
  @Input() editableBillrate: boolean = true;
  @Input() editableFactors: boolean = false;
  @Input() editableMarkup: boolean = false;
  @Input() editableCostComponent: boolean = false;
  @Input() updateRateDetails: any;
  @Input() isSourcing: boolean;
  @Input() rateModelPayload: RateModelPayloadDefaults|undefined;
  @Input() costComponentGroupDetails: any;
  @Input() validationData;
  @Input() fees;
  rateInput : string;
  @Input() set rateDetailsVisible(value: boolean) {
    this._rateDetailsVisible = value;
    if (value) {
      this.standardRatesCopy = { ...this.standardRates };
      this.factorsCopy = _.cloneDeep(this.factors);
      this.factorsCopy.forEach(f => {
        delete f?.cost_component?.markup;
        delete f?.cost_component?.cost_component_group_id;
      });
      delete this.standardRatesCopy?.cost_component?.cost_component_group_id;

      const foundStFactor = this.factorsCopy?.find(obj => obj.abbreviation?.toLowerCase() == RATE_TYPE_ST)
      const factor = this.standardFactors ?? foundStFactor;
      const stFactor = {
        applicable: true,
        billable: true,
        ...factor
      }

      // set the markup if absent
      if (this.markupByRateTypeEnabled && stFactor?.markup===undefined) {
        stFactor.markup = this.accuracyPipe.transform(this.standardRatesCopy.markup, this.accuracyConfig.markup_percentage, { isEdit: true });
      }
      if (this.rateModelPayload?.ot_exempt) {
        for (const formRate of (this.rateDetailsForm.get('rates') as UntypedFormArray).controls) {
          formRate.get('markup').setValue(this.accuracyPipe.transform(stFactor?.markup, this.accuracyConfig.markup_percentage, { isEdit: true }));
        }
        this.factorsCopy.forEach(element => {element.markup = this.accuracyPipe.transform(stFactor?.markup, this.accuracyConfig.markup_percentage, { isEdit: true })});
      }

      // push the factor if absent
      if (foundStFactor) {
        this.factorsCopy = this.factorsCopy?.map(obj => obj.abbreviation?.toLowerCase() == RATE_TYPE_ST ? stFactor : obj);
      } else {
        this.factorsCopy?.push(stFactor);
      }
      clearFormArray(this.rateDetailsForm.get('rates') as UntypedFormArray);
      this.rateDetailsForm.get('rates').setValue([]);
      this._ratesArray.forEach(rate => {
        if (typeof rate == 'object') {
          const grp = this.fb.group({
            default: rate.default,
            is_applicable: rate.is_applicable,
            is_billable: rate.is_billable || rate?.billable,
            is_fees_applicable: rate.is_fees_applicable,
            rate_factor: rate.rate_factor,
            name: rate.name,
            payrate: this.accurate(rate.payrate),
            billrate: this.accurate(rate.billrate),
            vendor_rate: this.accurate(rate.vendor_rate),
          }, );

          const factorObj = this.factorsCopy?.find(obj => obj.abbreviation.toLowerCase() == rate.rate_factor.toLowerCase());
          if (factorObj && factorObj.rate_factor !== RATE_TYPE_ST) {
            if (factorObj && factorObj.bill_rate?.length > 0 && !this.rateModelPayload?.ot_exempt) {
              grp.addControl('bill_rate_factor', this.fb.control(this.accurate(factorObj.bill_rate[0].factor)));
            } else {
              grp.addControl('bill_rate_factor', this.fb.control(this.accurate(1.0)));
              if (this.rateModelPayload?.ot_exempt) {
                grp.get('bill_rate_factor').disable();
              }
            }
            if (factorObj && factorObj.pay_rate?.length > 0 && !this.rateModelPayload?.ot_exempt) {
              grp.addControl('pay_rate_factor', this.fb.control(this.accurate(factorObj.pay_rate[0].factor)));
            } else {
              grp.addControl('pay_rate_factor', this.fb.control(this.accurate(1.0)));
              if (this.rateModelPayload?.ot_exempt) {
                grp.get('pay_rate_factor').disable();
              }
            }
            if (this.markupByRateTypeEnabled && factorObj) {
              if (!factorObj.markup) {
                factorObj.markup = this.accuracyPipe.transform(this.standardRatesCopy.markup, this.accuracyConfig.markup_percentage, { isEdit: true });
              }
              // grp.addControl('markup', this.fb.control(this.accurate(factorObj.markup, this.accuracyConfig.markup_percentage)));
              grp.addControl('markup', this.fb.control({
                value: this.accurate(factorObj.markup, this.accuracyConfig.markup_percentage),
                disabled: this.rateModelPayload?.ot_exempt ? true : false
              }));
            }
            if(this.isSourcing){
              if(this.rateModelPayload?.rate_model == 'payrate' || this.rateModelPayload?.rate_model == 'markup'){
                grp.get('markup')?.setValidators([Validators.required]);
                grp.get('markup')?.valueChanges.subscribe((value) => {
                  if(grp.get('markup').dirty){
                    this.getMarkupValidate(value, grp?.controls);
                  }
                });
              }
              else{
                grp.get('markup').setValidators(null);
                grp.get('markup').clearValidators();
              }

            }
            const control = this.rateDetailsForm.get('rates') as UntypedFormArray;
            control.push(grp);
          }
        }
      });

      this.rateDetailsForm.controls['billrate'].setValue(this.accurate(this.standardRates['billrate']));
      this.rateDetailsForm.controls['payrate'].setValue(this.accurate(this.standardRates['payrate']));
      this.rateDetailsForm.controls['vendor_rate'].setValue(this.accurate(this.standardRates['vendor_rate']));
      this.rateDetailsForm.controls['markup'].setValue(this.accurate(this.markupByRateTypeEnabled ? stFactor.markup : this.standardRates['markup'], this.accuracyConfig.markup_percentage));

      this.factorsCopy = this.factorsCopy?.map(obj => this.cleanUpRateFactor(obj));
      if (this.isEdit && this.rateModelPayload) {
        if (this.rateModelPayload?.rate_model == 'payrate') {
          this.rateInput = 'candidate';
        } else {
          this.rateInput = 'client';
          if (this.standardRatesCopy?.billrate <= 0) {
            this.rateInput = 'vendor';
          }
        }
        //this.makeRateModelRequest({ rate_input: this.rateInput });
      }

      if (this._costComponentEnabled) {
        this.formatCostComponentArray();
      }
    }
  }
  @Input() set selectedCurrency(value: string) {
    if (value) {
      this.currency = value;
    }
  };

  @Output() onUpdateClose = new EventEmitter();
  @Output() updateRateDetailsVisibility = new EventEmitter();
  rateDetailsForm: UntypedFormGroup;
  updateBtnDisabled: boolean = true;
  constructor(
    private fb: UntypedFormBuilder,
    private _storageService: StorageService,
    private _formRendererService: FormRendererService,
    private accuracyPipe: AccuracyPipe,
    private loader: LoaderService
  ) {

    this.rateDetailsForm = this.fb.group({
      payrate: [0, Validators.required],
      billrate: [0, Validators.required],
      vendor_rate: [0, Validators.required],
      markup: [this.accuracyPipe.transform(0, this.accuracyConfig.markup_percentage, { isEdit: true }) , Validators.required],
      rates: this.fb.array([]),
    });

    this.rateDetailsForm.get('markup')?.valueChanges.subscribe((value) => {
      if(this.rateDetailsForm?.controls?.markup?.dirty && this.isSourcing) {
        this.getMarkupValidate(value,this.rateDetailsForm?.controls);
      }
    });

    this.rateDetailsForm.get('payrate')?.valueChanges.subscribe((value) => {
      if(this.rateDetailsForm?.controls?.payrate?.dirty && this.isSourcing) {
        this.getRatesValidate(value,this.rateDetailsForm.get('payrate'));
      }
    });

    this.rateDetailsForm.get('billrate')?.valueChanges.subscribe((value) => {
      if(this.rateDetailsForm?.controls?.billrate?.dirty && this.isSourcing) {
        this.getRatesValidate(value,this.rateDetailsForm.get('billrate'));
      }
    });

    this.rateDetailsForm.get('vendor_rate')?.valueChanges.subscribe((value) => {
      if(this.rateDetailsForm?.controls?.vendor_rate?.dirty && this.isSourcing) {
        this.getRatesValidate(value,this.rateDetailsForm.get('vendor_rate'));
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.rateDetailsForm.updateValueAndValidity();
  }

  ngOnInit(): void {
    this.programId = this._storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
  }

  accurate(value, config: string = this.accuracyConfig.rate, isEdit: boolean = true, view_accurate: boolean = false) {
    return this.accuracyPipe?.transform(value || '0.0', config, { isEdit, view_accurate });
  }

  get isEdit(): boolean {
    return this.editableFactors || this.editableMarkup || this.editableCostComponent;
  }

  get rateDetails() {
    return this.rateDetailsForm?.get('rates') as UntypedFormArray;
  }

  get showRateDetails() {
    return this._rateDetailsVisible ? 'visible' : 'hidden';
  }

  get pageTitle() {
    return ((this.editableFactors || this.editableMarkup || this.editableCostComponent) ? "Manage" : "View") + " Rate Details";
  }

  get _costComponentEnabled(): boolean {
    return this.showRateDetails === 'visible' && this.costComponentEnabled;
  }

  formatCostComponentArray() {
    if (typeof this.standardRatesCopy?.cost_component !== 'object') return;

    const stFactor = this.factorsCopy?.find(obj => obj.abbreviation.toLowerCase() === RATE_TYPE_ST);
    if (stFactor) {
      stFactor.cost_component = _.cloneDeep(this.standardRatesCopy.cost_component);
      delete stFactor.cost_component?.markup;
    }
    const markupValues = { ...this.standardRatesCopy.cost_component?.markup };
    this.standardRatesCopy.cost_component = Object.entries(this.standardRatesCopy.cost_component || {})
      .filter(([code, _]: [string, any]) => code !== 'markup')
      .map(([code, details]: [string, any]) => {
        return {
          code,
          level: details?.level,
          type: details?.type,
          value: this.accurate(details?.value, details?.type === 'percent' || details?.type === 'percentage' ? this.accuracyConfig?.markup_percentage : this.accuracyConfig?.markup),
          component_name: details?.component_name,
          cost_amount: this.accurate(details?.cost_amount),
          total_amount: this.accurate(details?.total_amount),
        }
    });
    this.standardRatesCopy.cost_component?.sort((a, b) => {
      return (a?.level || 0) - (b?.level || 0) || a?.component_name?.localeCompare(b?.component_name);
    });
    this.standardRatesCopy.cost_component.push(markupValues);

    for (let rate of this._ratesArray) {
      delete rate?.cost_component?.cost_component_group_id;
      if (typeof rate?.cost_component == 'object') {
        const factor = this.factorsCopy?.find(obj => obj.abbreviation.toLowerCase() === rate?.rate_factor?.toLowerCase());
        if (factor) {
          factor.cost_component = _.cloneDeep(rate.cost_component);
          delete factor.cost_component?.markup;
        }

        const formRate = (this.rateDetailsForm.get('rates') as UntypedFormArray)?.controls
                        ?.find(r => r.get('rate_factor')?.value?.toLowerCase() === rate?.rate_factor?.toLowerCase());
        if (!formRate) continue;
        const costComponents = Object.entries(rate?.cost_component || {})
          .filter(([code, _]: [any, any]) => code !== 'markup')
          .sort((a: any, b: any) => {
            return (a?.[1]?.level || 0) - (b?.[1]?.level || 0) || a?.[1]?.component_name?.localeCompare(b?.[1]?.component_name);
          });
        (formRate as UntypedFormGroup).addControl(
          'cost_component',
          this.fb.array(
            costComponents.map(([code, details]: [string, any]) => {
              return this.fb.group({
                code,
                ...details,
                value: this.accurate(details?.value, details?.type === 'percent' || details?.type === 'percentage' ? this.accuracyConfig?.markup_percentage : this.accuracyConfig?.markup)
              })
            })
          )
        );
        (formRate as UntypedFormGroup).addControl('markup', new UntypedFormControl(
          this.accurate(rate.markup || this.standardRatesCopy?.markup || '0', this.accuracyConfig.markup_percentage)
        ));
        (formRate.get('cost_component') as UntypedFormArray).push(this.fb.group({
          cost_amount: this.accurate(rate.cost_component?.markup?.cost_amount),
          total_amount: this.accurate(rate.cost_component?.markup?.total_amount),
        }));
      }
    }
    if (this.isEdit) {
      this.makeRateModelRequest({}, true);
    }
  }

  updateCostComponentFormValues(components: any, abbr: string) {
    if (!components || !abbr) return;

    if (abbr === RATE_TYPE_ST) {
      for (const ind in this.standardRatesCopy?.cost_component) {
        try {
          parseInt(ind);
          const cc = this.standardRatesCopy.cost_component[ind];
          if (cc.code) {
            cc.value = this.accurate(components?.[cc.code]?.value, ['percent', 'percentage'].includes(components?.[cc.code]?.type) ? this.accuracyConfig?.markup_percentage : this.accuracyConfig?.markup)
            cc.cost_amount = this.accurate(components?.[cc.code]?.calculate_amount);
            cc.total_amount = this.accurate(components?.[cc.code]?.total_amount);
          } else {
            cc.cost_amount = this.accurate(components?.['markup']?.calculate_amount);
            cc.total_amount = this.accurate(components?.['markup']?.total_amount);
          }
        } catch (e) {
          continue;
        }
      }
    } else {
      const formGroup = (this.rateDetailsForm.get('rates') as UntypedFormArray)?.controls?.find(control => control.get('rate_factor')?.value?.toLowerCase() === abbr.toLowerCase());
      if (!formGroup) return;

      for (const ind in (formGroup.get('cost_component') as UntypedFormArray)?.controls) {
        try {
          parseInt(ind);
          const cc = (formGroup.get('cost_component') as UntypedFormArray).controls[ind];
          const code = cc.get('code').value;
          cc.get('value').setValue(this.accurate(components?.[code]?.value, ['percent', 'percentage'].includes(components?.[code]?.type) ? this.accuracyConfig?.markup_percentage : this.accuracyConfig?.markup));
          cc.get('cost_amount').setValue(this.accurate(components?.[code]?.calculate_amount));
          cc.get('total_amount').setValue(this.accurate(components?.[code]?.total_amount));
        } catch (e) {
          continue;
        }
      }
      const control = formGroup.get('cost_component') as UntypedFormArray;
      control?.at(control.controls?.length - 1).patchValue({
        cost_amount: this.accurate(components?.markup?.calculate_amount),
        total_amount: this.accurate(components?.markup?.total_amount)
      });
    }
  }

  getCostComponentName(code: string) {
    return this.costComponentGroupDetails?.find(obj => obj.code.toLowerCase() === code.toLowerCase())?.name;
  }

  addCostComponentsToFactors() {
    this.factorsCopy = this.factorsCopy.map(f => {
      let rate = this.rateDetails.getRawValue()?.find(r => r?.rate_factor?.toLowerCase() === f.abbreviation?.toLowerCase());
      if (!rate && f?.abbreviation?.toLowerCase() === RATE_TYPE_ST) {
        rate = this.standardRatesCopy;
      }
      if (rate?.cost_component) {
        f.cost_component = {};
        for (const cc of rate.cost_component) {
          if (!cc.code) {
            continue;
          }
          f.cost_component[cc.code] = {
            level: cc.level,
            type: cc.type,
            value: cc.value
          }
        }
      }
      return f;
    });
    return this.factorsCopy;
  }

  cleanUpRateFactor(obj) {
    const keys = ['abbreviation', 'billable', 'applicable', 'bill_rate', 'pay_rate', 'cost_component'];
    if(this.isSourcing){
      keys.push('id');
    }
    if (this.markupByRateTypeEnabled) {
      keys.push('markup');
    }

    for (const k in obj) {
      if (keys.indexOf(k) < 0) {
        delete obj[k];
      }
    }

    return obj;
  }

  sidebarClose(allowUpdate) {
    const data = {};
    // in case user hits 'update' after editing
    if (allowUpdate) {
      this.loader.show();
      // just to ensure that the latest values will be updated
      //this.makeRateModelRequest();

      data['update'] = true;
      data['standardRates'] = this.standardRatesCopy;
      data['rateValues'] = this.rateDetails.getRawValue();
      data['factors'] = this._costComponentEnabled ? this.addCostComponentsToFactors() : this.factorsCopy;
      this.loader.hide();
    } else {
      data['update'] = false;
    }

    this.updateRateDetailsVisibility.emit(false);
    this.onUpdateClose.emit(data);
    this.updateBtnDisabled = true;
  }

  async makeRateModelRequest(data = {}, isInitialCall: boolean = false) {
    this.updateBtnDisabled = true;
    const ui_unique_id = `${this.rateModelPayload['uuid'] || uuidv4()}-${new Date().getTime()}`;
    let payload:any = {
      ...this.rateModelPayload,
      rate_input: this.rateInput,
      candidate_pay_rate: this.rateDetailsForm.get('payrate').value,
      client_bill_rate: this.rateDetailsForm.get('billrate').value,
      vendor_bill_rate: this.rateDetailsForm.get('vendor_rate').value,
      vendor_markup: this.rateDetailsForm.get('markup').value,
      rate_factors: this.factorsCopy,
      abbreviation: RATE_TYPE_ST,
      ui_unique_id,
      is_markup_by_rate_type: this.markupByRateTypeEnabled,
      is_cost_component: this._costComponentEnabled,
      ...data
    }
    if(this.isSourcing){
      payload.adjusted_markup = this.rateDetailsForm.get('markup').value
    }

    if (data) {
      payload = { ...payload, ...data };
    }

    if(!this.isSourcing){
      let is_funded_by_same =  this.areAllFundedByValuesSame();
      const mspFee =  this.fees?.find(entity => entity?.name?.toLowerCase() === 'msp');
      if(!is_funded_by_same && mspFee?.funded_by === 'hybrid') {
        payload.msp_fee_funded_by = 'hybrid';
        payload.fee_details = this.fees;
      } else {
        delete  payload.fee_details;
      }
    }

    if(this.isSourcing && !this.rateDetailsForm?.valid){
      return;
    }

    this._formRendererService.post(`/core-money/programs/${this.programId}/rate-model`, payload)
      .subscribe({next:(res: any) => {
        if (res && res.data) {
          const rates = res.data.rate;
          // standard rates
          const standard = rates['regular'];
          this.standardRatesCopy['billrate'] = this.accurate(standard['billrate']);
          this.standardRatesCopy['payrate'] = this.accurate(standard['payrate']);
          this.standardRatesCopy['vendor_rate'] = this.accurate(standard['vendor_rate']);
          this.rateDetailsForm.controls['billrate'].setValue(this.accurate(standard['billrate']));
          this.rateDetailsForm.controls['payrate'].setValue(this.accurate(standard['payrate']));
          this.rateDetailsForm.controls['vendor_rate'].setValue(this.accurate(standard['vendor_rate']));
          if (this.markupByRateTypeEnabled) {
            this.standardRatesCopy['markup'] = this.accurate(standard['markup'] || '0');
            this.rateDetailsForm.controls['markup'].setValue(this.accurate(standard['markup'] || '0'));
          }
          if (this._costComponentEnabled && standard.cost_component) {
            this.updateCostComponentFormValues(standard.cost_component, 'st');
          }

          // other rates
          for (const formRate of (this.rateDetailsForm.get('rates') as UntypedFormArray).controls) {
            const rateObj = rates[formRate.get('rate_factor').value.toLowerCase()];
            formRate.get('billrate').setValue(this.accurate(rateObj.billrate));
            formRate.get('payrate').setValue(this.accurate(rateObj.payrate));
            formRate.get('vendor_rate').setValue(this.accurate(rateObj.vendor_rate));
            if (this.markupByRateTypeEnabled) {
              formRate.get('markup').setValue(this.accurate(rateObj.markup, this.accuracyConfig.markup_percentage));
            }
            if (this._costComponentEnabled && rateObj.cost_component) {
              this.updateCostComponentFormValues(rateObj.cost_component, formRate.get('rate_factor').value.toLowerCase());
            }
          }
          if (!isInitialCall) {
            this.updateBtnDisabled = false;
          }
        }
      }});
  }

  updatePayrate(event) {
    this.returnRateInput('payrate')
    this.makeRateModelRequest({ candidate_pay_rate: event?.target?.value || this.rateDetailsForm.get('payrate').value });
  }

  updateBillrate(event) {
    this.returnRateInput('billrate');
    this.makeRateModelRequest({ client_bill_rate: event?.target?.value || this.rateDetailsForm.get('billrate').value, rate_input: 'client' });
  }

  updateVendorRate(event) {
    this.returnRateInput('vendor_rate')
    this.makeRateModelRequest({ vendor_bill_rate: event?.target?.value || this.rateDetailsForm.get('vendor_rate').value, rate_input: 'vendor' });
  }

  returnRateInput(rate: any) {
    if (rate === 'payrate') {
      this.rateInput =  "candidate";
    } else if (rate === 'vendor_rate') {
      this.rateInput =  "vendor";
    } else {
      this.rateInput =  "client";
    }
  }
  updateFactor(event, rate: string, abbr: string , i?) {
    (this.rateDetailsForm?.get('rates') as UntypedFormArray)?.controls[i]?.get(`${rate}_factor`)?.setValue(this.accuracyPipe.transform(event?.target?.value, this.accuracyConfig.rate, { isEdit: true }));
    for (const factor of this.factorsCopy) {
      if (factor.abbreviation.toLowerCase() == abbr.toLowerCase()) {
        factor[rate][0].factor = this.accuracyPipe.transform(event?.target?.value, this.accuracyConfig.rate, { isEdit: true });
        break;
      }
    }
    this.makeRateModelRequest();
  }

  updateMarkup(event, abbr: string) {
    const newMarkupValue = this.accuracyPipe.transform(event?.target?.value, this.accuracyConfig.markup_percentage, { isEdit: true });
    if (abbr.toLowerCase() === RATE_TYPE_ST) {
      this.standardRatesCopy.markup = newMarkupValue;
      this.rateDetailsForm.get('markup').setValue(newMarkupValue);
    }
    for (const factor of this.factorsCopy) {
      if (factor?.abbreviation?.toLowerCase() == abbr.toLowerCase()) {
        factor.markup = newMarkupValue;
        break;
      }
    }
    for (const formRate of (this.rateDetailsForm.get('rates') as UntypedFormArray).controls) {
      if (this.rateModelPayload?.ot_exempt) {
        formRate.get('markup').setValue(newMarkupValue);
        this.factorsCopy.forEach(element => {element.markup = newMarkupValue});
      }
    }

    this.makeRateModelRequest();
  }

  updateCostComponentValue(event: any, abbr: string, index: number, type: string) {
    if (event?.target?.value) {
      event.target.value = this.accurate(event.target.value, type === 'percent' || type === 'percentage' ? this.accuracyConfig?.markup_percentage : this.accuracyConfig?.markup);
    }
    const factorCC = this.factorsCopy.find(factor => factor?.abbreviation?.toLowerCase() === abbr?.toLowerCase())?.cost_component;
    if (abbr === RATE_TYPE_ST) {
      if (this.standardRatesCopy.cost_component?.[index]) {
        this.standardRatesCopy.cost_component[index].value = event?.target?.value || '0';
        if (factorCC[this.standardRatesCopy.cost_component[index].code]) {
          factorCC[this.standardRatesCopy.cost_component[index].code].value = event?.target?.value || '0';
        }
      }
    } else {
      const rate = this.rateDetails.controls?.find(control => control.get('rate_factor').value.toLowerCase() === abbr.toLowerCase());
      if (rate) {
        (rate.get('cost_component') as UntypedFormArray)?.controls?.[index]?.get('value')?.setValue(event?.target?.value || '0');
        if (factorCC[(rate.get('cost_component') as UntypedFormArray)?.controls?.[index]?.get('code').value]) {
          factorCC[(rate.get('cost_component') as UntypedFormArray).controls[index].get('code').value].value = event?.target?.value || '0';
        }
      }
    }

    this.makeRateModelRequest();
  }

  getMarkupValidate(value:number, control) {
      if (value > Number(this.validationData?.markup)) {
        control?.markup?.setErrors({
          max: `Maximum number can be ${this.validationData?.markup}`,
        });
        return;
      }
      else if (value <= 0 || value == 0) {
        control?.markup?.setErrors({
          min: `Mark up can not be zero or empty`,
        });
        return;
      }
      else {
        control?.markup?.setErrors(null);
      }
  }

  getRatesValidate(val, control){
    let validatorObj = this.validationData;
    if(!validatorObj?.hideRateAuthority){
      if (val > validatorObj?.maxValue && !validatorObj?.submission_exceed_max_bill_rate ) {
        control.setErrors({
          max: `Maximum number can be ${validatorObj?.maxValue}`,
        });
        return;
      } else if (validatorObj?.allowOfferMinRate ? validatorObj?.allowOfferMinRate : val < validatorObj?.minValue) {
        control.setErrors({
          min: `Minimum number can be ${validatorObj?.minValue}`,
        });
        return;
      }
      else if (val <= 0 || val == 0) {
        control.setErrors({
          min: `Value can not be zero or empty`
        });
        return;
      }
      else {
        control.setErrors(null);
      }
    }
  }

  updateButtonDisabled(){
    if(this.isSourcing && !this.rateDetailsForm.valid){
      return true;
    }
    else{
      return false;
    }
  }

  areAllFundedByValuesSame(): boolean {
    return this.fees?.length > 0 &&
    this.fees?.every(control => control?.funded_by === this.fees[0]?.funded_by);
  }
}
