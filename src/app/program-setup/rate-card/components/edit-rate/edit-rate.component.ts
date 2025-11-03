import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertService } from '../../../../core/components/alert/alert.service';
import { LoaderService } from '../../../../core/components/loader/loader.service';
import { ProgramService } from '../../../../programs/program.service';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { MappingService } from '../../mapping-service.service';
import { CardRateService } from '../../card-rate.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

@Component({
  selector: 'app-edit-rate',
  templateUrl: './edit-rate.component.html',
  styleUrls: ['./edit-rate.component.scss']
})
export class EditRateComponent implements OnInit {

  public isRateEnabled: boolean = false;
  public activeRates: Array <string> = [];
  public editRateCardVisibility: string = 'hidden';
  public uomMap: Map <string, number> = new Map <string, number> ();
  public legacyUOM: boolean = false;
  public newUOMList: Array <string> = null;

  public jobCategoryTitle: string = null;
  public jobTemplate: string = null;
  public selectedHierarchy: string = null;
  public workLocation: string = null;
  zeroVal = this.accuracyPipe.transform(0,AccuracyConfigEnum.RATE, { isEdit: true });
  public toggles: Array<any> = [
    {
      name: 'hourly',
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    }, {
      name: 'daily',
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    }, {
      name: 'weekly',
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    }, {
      name: 'monthly',
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    }, {
      name: 'yearly',
      value: false,
      minBill: this.zeroVal,
      minBillSetting: 'Can Change',
      maxBill: this.zeroVal,
      maxBillSetting: 'Can Change'
    },
  ];

  @Input('editRateCardVisibility') set visibility(data: string) {
    this.editRateCardVisibility = data;
    if(data === 'visible') {
      if(this._card && this._card.filtered_rates && (this.selectedFilterIndex !== null) || (this.selectedFilterIndex !== undefined)) {
          
          this.setActiveRates();
          const filtered_rate = this._card.filtered_rates[this.selectedFilterIndex];
          this.isRateEnabled = filtered_rate?.is_active;
          let uoms: Array <any> = filtered_rate.filtered_unit_of_measures;
          this.setFormData(filtered_rate);

          if(uoms)
            uoms.forEach((uom: any) => {

              let name = uom?.unit_of_measure?.toLowerCase();
              let index: number = this.uomMap.get(name);
              
              this.toggles[index].minBill = this.accuracyPipe.transform(uom.min_rate,AccuracyConfigEnum.RATE,{ isEdit: true });
              this.toggles[index].minBillSetting = uom.min_rate_rule;
              this.toggles[index].maxBill = this.accuracyPipe.transform(uom.max_rate,AccuracyConfigEnum.RATE,{ isEdit: true });
              this.toggles[index].maxBillSetting = uom.max_rate_rule;
              this.toggles[index].value = uom.is_active;

            });
        
      }
    }
  }  

  @Input() title: string = 'Edit Rate';
  @Output() onRateUpdate = new EventEmitter();
  @Output() onClose = new EventEmitter();

  public _card: any = {};
  @Input() currency: string = 'USD';
  @Input() set selectedCard(selectedCard: any) {
    this._card = selectedCard;
  }

  public selectedFilterIndex: number = null;
  @Input('selectedFilter') set setFilter(data: string) {
    if(data) {
      const filtered_rates: Array <any> = this._card?.filtered_rates;
      if(filtered_rates) {
        filtered_rates.forEach((rate: any, it: number) => {
          const { id } = rate;
          if(id === data) {
            this.selectedFilterIndex = it;
          }
        });
      }
    }
  }
  private programId: string;

  constructor (
    private alert: AlertService,
    private loader: LoaderService,
    private programService: ProgramService,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private mapper: MappingService,
    private rateService: CardRateService,
    private accuracyPipe: AccuracyPipe
  ) { 

  }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.get_UOM_list();
    this.uomMap.set('hourly', 0);
    this.uomMap.set('daily', 1);
    this.uomMap.set('weekly', 2);
    this.uomMap.set('monthly', 3);
    this.uomMap.set('yearly', 4);
  }

  sidebarClose() {
    this.onClose.emit(true);
    this.toggles?.forEach((node: any) => {
      node.value = false;
      node.minBill = this.zeroVal;
      node.minBillSetting = 'Can Change';
      node.maxBill = this.zeroVal;
      node.maxBillSetting = 'Can Change';
    });
  }

  onSave() {
    let url = `/configurator/programs/${this.programId}/rate-cards/${this._card.id}`;

    if (
      !this.toggles[0]?.value && 
      !this.toggles[1]?.value && 
      !this.toggles[2]?.value && 
      !this.toggles[3]?.value && 
      !this.toggles[4]?.value
    ) {
      this.alert.error('At least one UOM should be enabled');
      return;
    }

    else if (
      parseFloat(this.toggles[0]?.minBill) > parseFloat(this.toggles[0]?.maxBill) || 
      parseFloat(this.toggles[1]?.minBill) > parseFloat(this.toggles[1]?.maxBill) || 
      parseFloat(this.toggles[2]?.minBill) > parseFloat(this.toggles[2]?.maxBill) || 
      parseFloat(this.toggles[3]?.minBill) > parseFloat(this.toggles[3]?.maxBill) || 
      parseFloat(this.toggles[4]?.minBill) > parseFloat(this.toggles[4]?.maxBill)) {
      this.alert.error('Min Rate should be <= Max Rate');
      return;
    }

    let payload = {
      job_category_id: this._card.job_category_id,
      job_title_id: this._card.job_title_id,
      currency: this._card.currency,
      job_level: this._card.job_level,
      region: this._card.region,
      rates: []
    };
    
    if(this._card.filtered_rates) {

      const filtered_rate: any = this._card.filtered_rates[this.selectedFilterIndex];
      let work_locations = filtered_rate?.work_location_id?[filtered_rate?.work_location_id]:null;
      let job_template_id = filtered_rate?.job_template_id;
      let hierarchies = filtered_rate?.hierarchy_id?[filtered_rate?.hierarchy_id]:null;
      let id = filtered_rate?.id;
      let unit_of_measures = [];

      this.activeRates.forEach((name: string) => {
        let index: number = this.uomMap.get(name);
        unit_of_measures.push({
          "unit_of_measure": name,
          "min_rate": this.toggles[index]?.minBill,
          "max_rate": this.toggles[index]?.maxBill,
          "min_rate_rule": this.toggles[index]?.minBillSetting,
          "max_rate_rule": this.toggles[index]?.maxBillSetting,
          "is_active": this.toggles[index]?.value
        });
      });
      
      payload.rates.push({ id, job_template_id, hierarchies, work_locations, unit_of_measures, is_active: this.isRateEnabled });

    }

    this.loader.show();
    payload = this.rateService.deleteNullKeys(payload);
    this.programService.put(url, payload)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.sidebarClose();
            this.onRateUpdate.emit(data);
            this.alert.success('Rate card edited successfully');
            this.eventStream.emit(new EmitEvent(Events.REFRESH_RATE_LISTING, data));
          }
        },
        error: (error: Error | any) => {
          this.loader.hide();
          this.alert.error(errorHandler(error));
        }
      }
    );
  }

  setActiveRates() {

    this.activeRates = [];
    const filtered_rates: Array <any> = this._card.filtered_rates;
    let end = filtered_rates.length - 1;
    
    const default_rate = this._card.filtered_rates[end];
    const { filtered_unit_of_measures } = default_rate;

    if(filtered_unit_of_measures && Array.isArray(filtered_unit_of_measures)) {
      filtered_unit_of_measures.forEach((node: any) => {
        if(node.is_active)
          this.activeRates.push(node.unit_of_measure);
      });
    }

  }

  setFormData(filtered_rate: any) {
    
    const card = this._card;
    if(card.job_category && card.job_title) {
      let category = card.job_category?.category_name;
      let title = card.job_title?.title;
      this.jobCategoryTitle = category + " - " + title;
    } else if(card.job_category) {
      this.jobCategoryTitle = card.job_category?.category_name;
    } else if(card.job_title) {
      this.jobCategoryTitle = card.job_title?.title;
    }

    const {
      job_template_id,
      hierarchy_id,
      work_location_id
    } = filtered_rate;

    this.selectedHierarchy = this.mapper.hierarchies.get(hierarchy_id);
    this.workLocation = this.mapper.workLocations.get(work_location_id);
    this.jobTemplate = this.mapper.jobTemplates.get(job_template_id);

  }

  onClickToggle(evt: string) {
    this.toggles?.forEach((node: any) => {
      if(node.name === evt)
        node.value = !node.value;
    });
  }

  public setToggleValue(res: any) {
    this.isRateEnabled = res;
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
      this.programService.get(url).subscribe({
        next: (data: any) => {
          const uomList = data.picklist_items.map(record => record?.label?.toLowerCase());
          this.toggles = this.toggles?.filter(record => uomList?.includes(record.name));
        },
        error: err => {
          this.alert.error(errorHandler(err));
        },
      });
    }
  }

  showUOM(uom: string): boolean {
    if(Array.isArray(this.activeRates) && this.activeRates.includes(uom))
      return true;

    if(Array.isArray(this.newUOMList)) {
      return this.newUOMList.includes(uom);
    } else if(this.legacyUOM) {
      return this.toggles?.find(ele => ele.name === uom) ? true : false;
    }

    return false;
  }
}
