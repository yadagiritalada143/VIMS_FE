import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {LoaderService} from '../../../core/components/loader/loader.service';
import {ProgramService} from '../../../programs/program.service';
import {StorageKeys, StorageService} from '../../../core/services/storage.service';
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {AlertService} from '../../../core/components/alert/alert.service';
import { MappingService } from '../mapping-service.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

@Component({
  selector: 'app-view-rate-card',
  templateUrl: './view-rate-card.component.html',
  styleUrls: ['./view-rate-card.component.scss']
})
export class ViewRateCardComponent implements OnInit {

  jobForm: UntypedFormGroup;
  label: any;
  _card: any = {};
  jobTitleId: string;
  jobCategoryName: '';
  zeroVal = this.accuracyPipe.transform(0, AccuracyConfigEnum.RATE, { isEdit: true });


  toggles = {
    yearly: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: '',
      maxBill: this.zeroVal,
      maxBillSetting: ''
    },
    monthly: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: '',
      maxBill: this.zeroVal,
      maxBillSetting: ''
    },
    weekly: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: '',
      maxBill: this.zeroVal,
      maxBillSetting: ''
    },
    daily: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: '',
      maxBill: this.zeroVal,
      maxBillSetting: ''
    },
    hourly: {
      value: false,
      minBill: this.zeroVal,
      minBillSetting: '',
      maxBill: this.zeroVal,
      maxBillSetting: ''
    },
  };

  public legacyUOMS: boolean = false;
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

  public newUOMList: Array <string> = null;
  public oldUOMList: Array <string> = null;

  public get title() {
    return this.label;
  }

  public get card() {
    return this._card;
  }

  @Output() onClose = new EventEmitter();
  @Input() viewCardVisibility = 'hidden';
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

  constructor (
    private _alert: AlertService,
    private _loader: LoaderService,
    private _programService: ProgramService,
    private storageService: StorageService,
    private mapper: MappingService,
    private accuracyPipe: AccuracyPipe
  ) {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
   }

  ngOnInit(): void {
    this.get_UOM_list();
    this.jobForm = new UntypedFormGroup({
      currency: new UntypedFormControl(null)
    });
  }

  sidebarClose() {
    this.onClose.emit(true);
  }

  getRateCardById(id) {

    this.resetToggles();
    this._loader.show();
    
    const url: string = `/configurator/programs/${this.programId}/rate-cards/${id}`;

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
            this.selectedCurrencyName = data.currency.split('(')[0].trim();

          }

          this.jobTitleId = data.job_title_id;
          if (data?.job_title?.title && data?.job_category?.category_name) {
            data.job_category.category_name = data.job_category.category_name + ' - ' + data.job_title.title;
          } else if (data?.job_title?.title && !data?.job_category?.category_name) {
            data.job_category.category_name = data.job_title.title;
          }

          this.jobCategoryName = data.job_category.category_name;
          let length = data.filtered_rates.length;

          this.oldUOMList = [];
          data.filtered_rates[length - 1].filtered_unit_of_measures.map(uom => {
            this.uoms.map(d => {
              if (d.name === uom.unit_of_measure) {

                if(uom?.is_active) {
                  this.oldUOMList.push(d?.name);
                }

                this.toggles[uom.unit_of_measure].value = uom?.is_active;
                this.toggles[uom.unit_of_measure].minBill = this.accuracyPipe.transform(uom.min_rate,AccuracyConfigEnum.RATE,{isEdit:true});
                this.toggles[uom.unit_of_measure].minBillSetting = uom.min_rate_rule;
                this.toggles[uom.unit_of_measure].maxBill = this.accuracyPipe.transform(uom.max_rate,AccuracyConfigEnum.RATE,{isEdit:true});
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

  resetToggles() {
    this.toggles = {
      yearly: {
        value: false,
        minBill: '0.00',
        minBillSetting: '',
        maxBill: '0.00',
        maxBillSetting: ''
      },
      monthly: {
        value: false,
        minBill: '0.00',
        minBillSetting: '',
        maxBill: '0.00',
        maxBillSetting: ''
      },
      weekly: {
        value: false,
        minBill: '0.00',
        minBillSetting: '',
        maxBill: '0.00',
        maxBillSetting: ''
      },
      daily: {
        value: false,
        minBill: '0.00',
        minBillSetting: '',
        maxBill: '0.00',
        maxBillSetting: ''
      },
      hourly: {
        value: false,
        minBill: '0.00',
        minBillSetting: '',
        maxBill: '0.00',
        maxBillSetting: ''
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
      this.legacyUOMS = true;
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
    } else if(this.legacyUOMS) {
      return this.uoms?.find(ele => ele.name === uom) ? true : false;
    }

    return false;
  }
}
