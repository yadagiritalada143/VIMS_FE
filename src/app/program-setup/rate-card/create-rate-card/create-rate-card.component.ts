import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../../core/components/alert/alert.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { ProgramService } from '../../../programs/program.service';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

@Component({
  selector: 'app-create-rate-card',
  templateUrl: './create-rate-card.component.html',
  styleUrls: ['./create-rate-card.component.scss']
})
export class CreateRateCardComponent implements OnInit, OnDestroy {

  jobForm: UntypedFormGroup;
  zeroVal = this.accuracyPipe.transform(0,AccuracyConfigEnum.RATE,{ isEdit: true });
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
  private programId: string;

  public label: string;
  public region: string;
  public jobCategories: [];
  public unit_of_measures = [];
  public jobCreateLoading: boolean = false;
  public get title() {
    return this.label;
  }

  private subscriptions: Array <Subscription> = [];
  private jobSearchSub: Subject <string> = new Subject <string> ();

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
      maxBill: this.toggles.daily.maxBill,
      minBillRule: this.toggles.daily.minBillSetting,
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

  public newUOMList: Array <string> = [];
  public programCurrencies: Array <string> = null;
  public defaultCurrency: string = null;

  @Output() onSaveRateCard = new EventEmitter();
  @Output() onClose = new EventEmitter();

  @Input() createCardVisibility = 'hidden';
  @Input() currencies: Array <{name: string, value: string}> = [];
  @Input() public set title(title: string) {
    this.label = title;
  }

  constructor (
    private _alert: AlertService,
    private _loader: LoaderService,
    private _programService: ProgramService,
    private storageService: StorageService,
    private accuracyPipe: AccuracyPipe
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.getProgramCurrencies();
    this.get_UOM_list();
    this.jobForm = new UntypedFormGroup({
      jobCategory: new UntypedFormControl(null, [Validators.required]),
      currency: new UntypedFormControl(this.defaultCurrency ?? 'USD', [Validators.required]),
    });

    this.subscriptions.push(
      this.jobSearchSub
        .pipe(
          debounceTime(600),
          switchMap((term: string) => {

            this.jobCreateLoading = true;
            let url: string = `/job-manager/job-catalog/category_title?limit=20`;
            if(term) {
              url += `&q=${term}`;
            }

            return this._programService.get(url);
          })
        )
        .subscribe({
          next: (res: any) => {
            if (res) {
              this.jobCreateLoading = false;
              this.jobCategories = res.data;
            }
          }, error: (err: Error | any) => {
            this.jobCreateLoading = false;
            this._alert.error(errorHandler(err));
          }
        }
      )
    );

    this.jobSearchSub.next('');

  }

  getProgramCurrencies() {
    let programConfig: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config;
    let programCurrencies: any = programConfig?.billing?.supported_currencies;
    let defaultCurrency: string = programConfig?.billing?.default_currency;
    if(Array.isArray(programCurrencies)) {
      this.programCurrencies = programCurrencies;
    }

    this.defaultCurrency = defaultCurrency ?? null;
  }

  sidebarClose() {
    this.resetToggles();
    this.jobForm.reset();
    this.onClose.emit(true);
    this.uoms.forEach(uom => {
      uom.value = false;
    });
  }

  checkMinAndMaxBils() {
    if (this.toggles.hourly.value) {
      if (parseInt(this.toggles.hourly.minBill) >= 0 && parseInt(this.toggles.hourly.maxBill) >= 0) {
        return false;
      }
      else
        return true;
    }
    if (this.toggles.daily.value) {
      if (parseInt(this.toggles.daily.minBill) >= 0 && parseInt(this.toggles.daily.maxBill) >= 0) {
        return false;
      }
      else
        return true;
    }
    if (this.toggles.weekly.value) {
      if (parseInt(this.toggles.weekly.minBill) >= 0 && parseInt(this.toggles.weekly.maxBill) >= 0) {
        return false;
      }
      else
        return true;
    }
    if (this.toggles.monthly.value) {
      if (parseInt(this.toggles.monthly.minBill) >= 0 && parseInt(this.toggles.monthly.maxBill) >= 0) {
        return false;
      }
      else
        return true;
    }
    if (this.toggles.yearly.value) {
      if (parseInt(this.toggles.yearly.minBill) >= 0 && parseInt(this.toggles.yearly.maxBill) >= 0) {
        return false;
      }
      else
        return true;
    }
  }

  onClickToggle(event) {
    const toggleName = event;
    this.toggles[toggleName].value = !this.toggles[toggleName].value;
    this.uoms.map(uom => {
      if (uom.name === toggleName) {
        uom.value = !uom.value;
      }
    });
  }

  onChangeCategory(event) { }

  onChangeCurrency(event) { }

  onSearchCategory({term}) {
    this.jobSearchSub.next(term);
  }

  onSave() {
    this.unit_of_measures = [];
    if (!this.toggles.yearly.value && !this.toggles.monthly.value
      && !this.toggles.weekly.value && !this.toggles.daily.value
      && !this.toggles.hourly.value) {
      return this._alert.error('Atleast one UOM should be enabled');
    } else if (
      parseFloat(this.toggles.yearly.minBill) > parseFloat(this.toggles.yearly.maxBill) || 
      parseFloat(this.toggles.monthly.minBill) > parseFloat(this.toggles.monthly.maxBill)
      || parseFloat(this.toggles.weekly.minBill) > parseFloat(this.toggles.weekly.maxBill) || 
      parseFloat(this.toggles.daily.minBill) > parseFloat(this.toggles.daily.maxBill)
      || parseFloat(this.toggles.hourly.minBill) > parseFloat(this.toggles.hourly.maxBill)) {
      return this._alert.error('Min Rate should be <= Max Rate');
    }
    let rateError = false;
    this.uoms.map(uom => {
      if (uom.value) {
        if ((this.toggles[uom.name].minBill >= 0 && this.toggles[uom.name].maxBill >= 0) && (this.toggles[uom.name].minBill != null && this.toggles[uom.name].maxBill != null)) {
          rateError = false;
        }
        else if (!this.toggles[uom.name].minBill || !this.toggles[uom.name].maxBill) {
          rateError = true;
        }
        const newUnit = {
          unit_of_measure: uom.name,
          min_rate: this.toggles[uom.name].minBill,
          max_rate: this.toggles[uom.name].maxBill,
          min_rate_rule: this.toggles[uom.name].minBillSetting,
          max_rate_rule: this.toggles[uom.name].maxBillSetting,
          is_active: true
        };
        this.unit_of_measures.push(newUnit);
      }
    });
    if (rateError) {
      rateError = false;
      return this._alert.error('Min Bill Rate and Max Bill Rate are required');
    } else {
      const url: string = `/configurator/programs/${this.programId}/rate-cards`;
      this._loader.show();
      this._programService.post(url, {
        job_category_id: this.jobForm.value.jobCategory?.category.id,
        job_title_id: this.jobForm.value.jobCategory?.id,
        currency: this.jobForm.value.currency,
        job_level: 1,
        region: this.region,
        rates: [
          {
            is_default: true,
            unit_of_measures: this.unit_of_measures
          }
        ]
      }).subscribe({
        next: (data: any) => {
          this._loader.hide();
          this._alert.success('Rate card created successfully');
          this.onSaveRateCard.emit(data);
          this.sidebarClose();
        },
        error: (err: any) => {
          this._loader.hide();
          console.error(errorHandler(err));
          this._alert.error('Combination of selected Job Category - Job Title - Currency already exists');
        }
      });
    }
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
    if(programUOMs) {
      this.newUOMList = [...Object.keys(programUOMs ?? {})].filter((unit: string) => {
        return !!programUOMs[unit];
      });
    } else {
      // Fallback to old picklist provider API
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
    if(Array.isArray(this.newUOMList)) {
      return this.newUOMList.includes(uom);
    } else {
      return this.uoms?.find(ele => ele.name === uom) ? true : false;
    }
  }

  get allowedCurrencies() {
    if(Array.isArray(this.programCurrencies)) {
      return this.currencies.filter((currency: any) => this.programCurrencies.includes(currency?.value));
    }

    return this.currencies;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
