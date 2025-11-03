import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {errorHandler} from '../../../shared/util/error-handler';
import {AlertService} from '../../../core/components/alert/alert.service';
import {LoaderService} from '../../../core/components/loader/loader.service';
import {ProgramService} from '../../../programs/program.service';
import {StorageKeys, StorageService} from '../../../core/services/storage.service';
import { MappingService } from '../mapping-service.service';
import { CardRateService } from '../card-rate.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

@Component({
  selector: 'app-edit-rate-card',
  templateUrl: './edit-rate-card.component.html',
  styleUrls: ['./edit-rate-card.component.scss']
})
export class EditRateCardComponent implements OnInit {

  jobForm: UntypedFormGroup;
  label: any;
  _card: any = {};
  zeroVal = this.accuracyPipe.transform(0, AccuracyConfigEnum.RATE, { isEdit: true });
  toggles = {
    yearly: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    },
    monthly: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    },
    weekly: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    },
    daily: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    },
    hourly: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    },
  };

  jobCategoryName: '';
  unit_of_measures = [];
  public uoms: Array <any> = [
    {
      name: 'yearly',
      value: false,
      minBill: this.toggles.yearly.minBill,
      maxBill: this.toggles.yearly.maxBill,
      minBillRule: this.toggles.yearly.minBillSetting,
      maxBillRUle: this.toggles.yearly.maxBillSetting
    },
    {
      name: 'monthly',
      value: false,
      minBill: this.toggles.monthly.minBill,
      maxBill: this.toggles.monthly.maxBill,
      minBillRule: this.toggles.monthly.minBillSetting,
      maxBillRUle: this.toggles.monthly.maxBillSetting
    },
    {
      name: 'weekly',
      value: false,
      minBill: this.toggles.weekly.minBill,
      maxBill: this.toggles.weekly.maxBill,
      minBillRule: this.toggles.weekly.minBillSetting,
      maxBillRUle: this.toggles.weekly.maxBillSetting
    },
    {
      name: 'daily',
      value: false,
      minBill: this.toggles.daily.minBill,
      maxBill: this.toggles.daily.minBillSetting,
      minBillRule: this.toggles.daily.maxBill,
      maxBillRUle: this.toggles.daily.maxBillSetting
    },
    {
      name: 'hourly',
      value: false,
      minBill: this.toggles.hourly.minBill,
      maxBill: this.toggles.hourly.maxBill,
      minBillRule: this.toggles.hourly.minBillSetting,
      maxBillRUle: this.toggles.hourly.maxBillSetting
    }
  ];

  public legacyUOM: boolean = false;
  public oldUOMList: Array <string> = null;
  public newUOMList: Array <string> = null;

  public get title() {
    return this.label;
  }

  public get card() {
    return this._card;
  }

  @Output() onClose = new EventEmitter();
  @Output() onUpdateRateCard = new EventEmitter();
  @Input() editCardVisibility = 'hidden';
  @Input() public set card(data) {
    this._card = data;
    if (data && data.id) {
      this.getRateCardById(data.id);
    }
  }

  public selectedCurrencyDetail: string = 'USD ($)';
  public selectedCurrencyName: string = 'USD';
  @Input() public set title(title: string) {
    this.label = title;
  }
  private programId: string;

  constructor(
    private _alert: AlertService,
    private _loader: LoaderService,
    private _programService: ProgramService,
    private storageService: StorageService,
    public mapper: MappingService,
    private rateService: CardRateService,
    private accuracyPipe: AccuracyPipe
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.get_UOM_list();
    if(!this.mapper.currencies.size)
      this.fetchCurrencyList();
    
    this.jobForm = new UntypedFormGroup({
      currency: new UntypedFormControl(null, [Validators.required])
    });
  }

  sidebarClose() {
    this.onClose.emit(true);
    this.uoms.forEach(uom => {
      uom.value = false;
    });
    this.toggles = {
      yearly: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
      monthly: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
      weekly: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
      daily: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
      hourly: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
    };
    this.jobForm.reset();
    this.jobCategoryName = '';
  }

  onClickToggle(event) {
    const toggleName = event.target.id;
    this.toggles[toggleName].value = !this.toggles[toggleName].value;
    this.uoms.map(uom => {
      if (uom.name === toggleName) {
        uom.value = !uom.value;
      }
    });
  }

  getRateCardById(id: string) {

    this.resetToggles();
    this._loader.show();

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url: string = `/configurator/programs/${programId}/rate-cards/${id}`;

    this._programService.get(url)
      .subscribe({
        next: (data: any) => {

          this._loader.hide();
          if (data.currency) {
            data.currency = data.currency.toUpperCase();
            if (!data.currency.includes('(')) {
              data.currency = data.currency.trim();
              data.currency = this.mapper.currencies.get(data.currency);
            }

            this.selectedCurrencyDetail = data.currency;
            this.jobForm.get('currency').setValue(data.currency);
            this.selectedCurrencyName = data.currency.split('(')[0].trim();

          }

          if (data?.job_title?.title && data?.job_category?.category_name) {
            data.job_category.category_name = data.job_category.category_name + ' - ' + data.job_title.title;
          } else if (data?.job_title?.title && !data?.job_category?.category_name) {
            data.job_category.category_name = data.job_title.title;
          }

          this.oldUOMList = [];
          this.jobCategoryName = data.job_category.category_name;
          let length = data.filtered_rates.length;
          data.filtered_rates[length - 1].filtered_unit_of_measures.map(uom => {
            this.uoms.map(d => {
              if (d.name === uom.unit_of_measure) {

                if(uom?.is_active) {
                  this.oldUOMList.push(d?.name);
                }

                this.toggles[uom.unit_of_measure].value = uom?.is_active;
                this.toggles[uom.unit_of_measure].minBill = this.accuracyPipe.transform(uom.min_rate,AccuracyConfigEnum.RATE,{ isEdit: true });
                this.toggles[uom.unit_of_measure].minBillSetting = uom.min_rate_rule;
                this.toggles[uom.unit_of_measure].maxBill = this.accuracyPipe.transform(uom.max_rate,AccuracyConfigEnum.RATE,{ isEdit: true });
                this.toggles[uom.unit_of_measure].maxBillSetting = uom.max_rate_rule;
              }
            });
          });
        }, error: (err: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(err));
        }
      }
    );
  }

  onSave() {

    if (
      !this.toggles.yearly.value &&
      !this.toggles.monthly.value &&
      !this.toggles.weekly.value &&
      !this.toggles.daily.value &&
      !this.toggles.hourly.value
    ) {
      return this._alert.error('At least one UOM should be enabled');
    }
    else if (
      (parseFloat(this.toggles.yearly.minBill) > parseFloat(this.toggles.yearly.maxBill)) ||
      (parseFloat(this.toggles.monthly.minBill) > parseFloat(this.toggles.monthly.maxBill)) ||
      (parseFloat(this.toggles.weekly.minBill) > parseFloat(this.toggles.weekly.maxBill)) ||
      (parseFloat(this.toggles.daily.minBill) > parseFloat(this.toggles.daily.maxBill)) ||
      (parseFloat(this.toggles.hourly.minBill) > parseFloat(this.toggles.hourly.maxBill))
    ) {
      return this._alert.error('Min Rate should be <= Max Rate');
    }

    this.unit_of_measures = [];
    this.uoms.map(uom => {
      const name=uom.name;
      const newUnit = {
        unit_of_measure: name,
        min_rate: this.toggles[name].minBill,
        max_rate: this.toggles[name].maxBill,
        min_rate_rule: this.toggles[name].minBillSetting,
        max_rate_rule: this.toggles[name].maxBillSetting,
        is_active: this.toggles[name].value
      };
      
      this.unit_of_measures.push(newUnit);
    });

    let payload = {
      job_category_id: this._card.job_category_id,
      job_title_id: this._card.job_title_id,
      currency: this._card.currency,
      job_level: this._card.job_level,
      region: this._card.region,
      rates: []
    };

    let length = this._card.filtered_rates.length;
    const specified_rate = this._card.filtered_rates[length - 1];

    payload.rates.push({
      "id": specified_rate?.id,
      "job_template_id": specified_rate?.job_template_id,
      "hierarchies": specified_rate?.hierarchy_id?[specified_rate?.hierarchy_id]:null,
      "work_locations": specified_rate?.work_location_id?[specified_rate?.work_location_id]:null,
      "unit_of_measures": this.unit_of_measures
    });

    this._loader.show();
    payload = this.rateService.deleteNullKeys(payload);
    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/rate-cards/${this._card.id}`;
    this._programService.put(url, payload)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this._loader.hide();
            this.sidebarClose();
            this.onUpdateRateCard.emit(data);
            this._alert.success('Rate card edited successfully');
          }
        }, error: (error: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(error));
        }
      }
    );
  }

  fetchCurrencyList() {

    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/currencies?limit=300`;

    let currencies: Array<any> = [];
    this._programService.get(url)
      .subscribe({
        next: (res: any) => {
          if (res) {

            let currency_list: Array<any> = res?.currencies;
            currency_list.forEach(node => {
              currencies.push({
                value: node?.code,
                name: node?.code + " (" + node?.symbol + ")"
              })
            });

            currencies.forEach((node: any) => {
              this.mapper.currencies.set(node.value.toUpperCase(), node.name);
            });

          }
        },
        error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
        }
      });

  }

  resetToggles() {
    this.toggles = {
      yearly: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
      monthly: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
      weekly: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
      daily: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
      hourly: {
        value: false,
        minBill: this.zeroVal,
        minBillSetting: 'Can Change',
        maxBill: this.zeroVal,
        maxBillSetting: 'Can Change'
      },
    };
  }

  get_UOM_list() {
    // Use program configuration options (if applicable for program)
    let programConfig: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config;
    const programUOMs: any = programConfig?.unit_of_measures;
    if(!!programUOMs) {
      this.newUOMList = [...Object.keys(programUOMs ?? {})].filter((unit: string) => {
        return !!programUOMs[unit];
      });
    } else {
      // Fallback to old picklist provider API
      this.legacyUOM = true;
      const url = `/configurator/programs/${this.programId}/picklists/*/items?picklist_slug=unit_of_measure&is_enabled=true`;
      this._programService.get(url).subscribe({
        next: (data: any) => {
          const uomList = data.picklist_items.map(record => record?.label?.toLowerCase());
          this.uoms = this.uoms?.filter(record => uomList?.includes(record.name));
        },
        error: err => {
          this._alert.error(errorHandler(err));
        },
      });
    }
  }

  showUOM(uom: string): boolean {
    if(Array.isArray(this.oldUOMList) && this.oldUOMList.includes(uom))
      return true;

    if(Array.isArray(this.newUOMList)) {
      return this.newUOMList.includes(uom);
    } else if(this.legacyUOM) {
      return this.uoms?.find(ele => ele.name === uom) ? true : false;
    }

    return false;
  }
}
