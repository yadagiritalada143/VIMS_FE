import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { AlertService } from '../../../../core/components/alert/alert.service';
import { LoaderService } from '../../../../core/components/loader/loader.service';
import { ProgramService } from '../../../../programs/program.service';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { MappingService } from '../../mapping-service.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { interval, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

@Component({
  selector: 'app-add-rate',
  templateUrl: './add-rate.component.html',
  styleUrls: ['./add-rate.component.scss']
})
export class AddRateComponent implements OnInit, OnDestroy {

  @Input() currency: string = 'USD';
  @Input() jobTemplateDisabled: boolean = false;

  private _card: any = {};
  private subscriptions: Array <Subscription> = [];
  private $haltJobListener: Subject <void> = new Subject <void> ();
  private jobTemplateSub: Subject <string> = new Subject <string> ();
  private workLocationSub: Subject <string> = new Subject <string> ();
  private programId: string;

  public jobForm: UntypedFormGroup = null;
  public label: any = null;  
  public activeUnits: string[] = [];
  zeroVal = this.accuracyPipe.transform(0, AccuracyConfigEnum.RATE, { isEdit: true })
  public toggles = {
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

  public legacyUOM: boolean = false;
  public newUOMList: Array <string> = null;

  public region: string;
  public jobTemplates: [];
  public unit_of_measures = [];
  public locations = [];
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

  public hierarchyTree: any = [];
  public get title() {
    return this.label;
  }

  public get card() {
    return this._card;
  }

  @Output() onClose = new EventEmitter();
  @Output() onUpdate = new EventEmitter();

  public addRateVisibility: string = 'hidden';
  @Input('addRateVisibility') set visibilityValue(data) {
    if(data) {
      if(this.jobForm) {
        this.jobForm.reset();
        if(this.selectedJobTemplate !== 'Undefined')
          this.jobForm.get('jobTemplate').setValue(this.selectedJobTemplate);
        else
          this.jobForm.get('jobTemplate').setValue(null); 
      }
      this.addRateVisibility = data;
      this.initJobTemplateListener();
      if(this.jobTemplateDisabled) {
        this.jobForm.reset();
      }
    }
  };

  public selectedJobTemplate: string = null;
  @Input('selectedJobTemplate') set selectTemplate(template: string) {
    if(template && template !== 'Undefined') {
      this.selectedJobTemplate = template;
      this.jobForm.get('jobTemplate').setValue(template);
    } else {
      try {
        this.jobForm.get('jobTemplate').setValue(null);
        this.selectedJobTemplate = template;
      } catch(err) { }
    }
  }

  public templateLoading: boolean = false;
  public locationLoading: boolean = false;

  @Input()
  public set title(title: string) {
    this.label = title;
  }

  @Input()
  public set card(data) {
    this._card = data;
  }


  constructor (
    private _alert: AlertService,
    private _loader: LoaderService,
    private _programService: ProgramService,
    private storageService: StorageService,
    private mapper: MappingService,
    private eventStream: EventStreamService,
    private accuracyPipe: AccuracyPipe
  ) 
   { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.get_UOM_list();
    this.jobForm = new UntypedFormGroup({
      jobTemplate: new UntypedFormControl(null),
      hierarchy: new UntypedFormControl(null),
      workLocation: new UntypedFormControl(null),
      jobCategoryTitle: new UntypedFormControl(null)
    });

    this.subscriptions.push(
      this.eventStream
        .on(Events.ADD_RATE_DETAILS)
        .subscribe((res: Array<any>) => {
          if (this._card?.filtered_rates) {
            this.setActiveUnits(this._card.filtered_rates.length - 1, this._card);
          }
        })
    );

    this.subscriptions.push(
      this.jobTemplateSub
        .pipe(
          debounceTime(600),
          switchMap(term => {
            this.templateLoading = true;
            const url = `/job-manager/programs/${this.programId}/job-templates?q=${term}`;
            return this._programService.get(url);
          })
      ).subscribe({
        next: (res: any) => {
          if (res) {
            this.templateLoading = false;
            this.jobTemplates = res.job_templates;
          }
        }, error: (err: Error | any) => {
          this.templateLoading = false
          this._alert.error(errorHandler(err));
        }
      })
    );

    this.subscriptions.push(
      this.workLocationSub
        .pipe(
          debounceTime(600),
          switchMap(term => {
            this.locationLoading = true;
            const url = `/configurator/programs/${this.programId}/work-locations?k=${term}`;
            return this._programService.get(url);
          })
      ).subscribe({
        next: (res: any) => {
          if (res) {
            this.locationLoading = false;
            this.locations = res.work_locations;
            this.locations.forEach(node => {
              this.mapper.workLocations.set(node.id, node.name);
            });
          }
        }, error: (err: Error | any) => {
          this.locationLoading = false;
          this._alert.error(errorHandler(err));
        }
      })
    );

    this.workLocationSub.next('');
    this.jobTemplateSub.next('');
    this._programService.get(`/configurator/programs/${this.programId}/hierarchy`)
      .subscribe({
        next: (res: any) => {
          if (res) {
            if ('result' in res) {
              res = res.result;
              this.hierarchyTree = res;
              if (Array.isArray(res)) {
                res.forEach((tree: any) => {
                  this.mapHierarchies(tree);
                });
              }
            }
          }
        }, error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
        }
      }
    );
  }

  mapHierarchies(result: any) {

    if(!result)
      return;

    const { id, name, hierarchies } = result;
    this.mapper.hierarchies.set(id, name);
    if(Array.isArray(hierarchies)) {
      hierarchies.forEach((hierarchy: any) => {
        this.mapHierarchies(hierarchy);
      })
    }
  }

  sidebarClose() {

    this.$haltJobListener.next();
    this.jobForm.reset();
    this.uoms.forEach((node: any, it: number) => {
      const name = node.name;
      const form = this.toggles[name];
      form.value = false;
      form.minBill = this.zeroVal;
      form.maxBill = this.zeroVal;
      form.minBillSetting = 'Can Change';
      form.maxBillSetting = 'Can Change';
    });

    this.onClose.emit(true);
  }

  initJobTemplateListener() {
    interval(2000)
    .pipe(takeUntil(this.$haltJobListener))
    .subscribe((retry_limit) => {

      if((retry_limit > 3) || !this.jobTemplateDisabled) {
        this.$haltJobListener.next();
        return;
      }

      if(this.selectedJobTemplate && this.jobTemplateDisabled) {
        this.jobForm.get('jobTemplate').setValue(this.selectedJobTemplate);
        this.$haltJobListener.next();
        return;
      }
            
    });
  }


  setActiveUnits(num: number, card: any) {

    this.activeUnits = [];
    this.isRateEnabled = card.filtered_rates[num]?.is_active;
    card.filtered_rates[num].filtered_unit_of_measures.map(uom => {

      if(uom?.is_active)
        this.activeUnits.push(uom.unit_of_measure);
      
      this.toggles[uom.unit_of_measure].value = uom?.is_active;
      this.toggles[uom.unit_of_measure].minBill = this.accuracyPipe.transform(uom.min_rate, AccuracyConfigEnum.RATE, { isEdit: true });
      this.toggles[uom.unit_of_measure].minBillSetting = uom.min_rate_rule;
      this.toggles[uom.unit_of_measure].maxBill = this.accuracyPipe.transform(uom.max_rate, AccuracyConfigEnum.RATE, { isEdit: true });
      this.toggles[uom.unit_of_measure].maxBillSetting = uom.max_rate_rule;

    });

    let units: Array <string> = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
    units.forEach(unit => {
      if(!this.activeUnits.includes(unit)) {
        this.toggles[unit].value = false;
      }
    });

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

  onSave() {

    this.unit_of_measures = [];

    if (!this.toggles.yearly.value && !this.toggles.monthly.value
      && !this.toggles.weekly.value && !this.toggles.daily.value
      && !this.toggles.hourly.value) {
      return this._alert.error('At least one UOM should be enabled');
    }

    else if (
      parseFloat(this.toggles.yearly.minBill) > parseFloat(this.toggles.yearly.maxBill) || 
      parseFloat(this.toggles.monthly.minBill) > parseFloat(this.toggles.monthly.maxBill) || 
      parseFloat(this.toggles.weekly.minBill) > parseFloat(this.toggles.weekly.maxBill) || 
      parseFloat(this.toggles.daily.minBill) > parseFloat(this.toggles.daily.maxBill) || 
      parseFloat(this.toggles.hourly.minBill) > parseFloat(this.toggles.hourly.maxBill)) {
      return this._alert.error('Min Rate should be <= Max Rate');
    }

    this.uoms.forEach((uom, it) => {
      const node = this.toggles[uom.name];
      if (node?.value) {
        const newUnit = {
          unit_of_measure: uom.name,
          min_rate: node?.minBill,
          max_rate: node?.maxBill,
          min_rate_rule: node?.minBillSetting,
          max_rate_rule: node?.maxBillSetting,
          is_active: true
        };
        this.unit_of_measures.push(newUnit);
      }
    });

    const url = `/configurator/programs/${this.programId}/rate-cards/${this._card.id}`;
    let payload = {
      job_category_id: this._card.job_category_id,
      job_title_id: this._card.job_title_id,
      currency: this._card.currency,
      job_level: 1,
      region: this.region,
      rates: [
        {
          job_template_id: this.jobForm.value.jobTemplate ? this.jobForm.value.jobTemplate : '',
          hierarchies: this.jobForm.value.hierarchy ? this.jobForm.value.hierarchy : '',
          work_locations: this.jobForm.value.workLocation ? this.jobForm.value.workLocation : '',
          unit_of_measures: this.unit_of_measures,
          is_active: this.isRateEnabled
        }
      ]
    };

    const rateRef = payload.rates[0];

    if(!rateRef.job_template_id)
      delete rateRef.job_template_id;

    if(!rateRef.hierarchies || rateRef.hierarchies.length === 0)
      delete rateRef.hierarchies;
    
    if(!rateRef.work_locations || rateRef.work_locations.length === 0)
      delete rateRef.work_locations;

    const rates: Array <any> = payload.rates;
    rates.forEach(rate => {
      if(rate.job_template_id === 'Undefined' || rate.job_template_id === 'undefined')
        delete rate.job_template_id;
    });

    this._programService.put(url, payload)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.onUpdate.emit(data);
            this._loader.hide();
            this.jobForm.reset();
            this.sidebarClose();
            this._alert.success('New Rate added successfully');
            this.eventStream.emit(new EmitEvent(Events.REFRESH_RATE_LISTING, data));
          }
        },
        error: (error: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(error));
        }
      }
    );
  }

  updateHierarchySelections(evt: Array <string>) {
    this.jobForm.get('hierarchy').setValue(evt);
  }

  ngOnDestroy(): void {
    this.$haltJobListener.next();
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  getJobInformation() {
    if(!this._card)
      return 'Undefined';
    
    return this._card?.job_category?.category_name + ' - ' +
           this._card?.job_title?.title;
  }

  public isRateEnabled: boolean = false;
  public setToggleValue(res: any) {
    this.isRateEnabled = res;
  }

  searchLocation(evt: any): void {
    const {term} = evt;
    this.workLocationSub.next(term);
  }

  searchTemplate(evt: any): void {
    const {term} = evt;
    this.jobTemplateSub.next(term);
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
    if(Array.isArray(this.activeUnits) && this.activeUnits.includes(uom))
      return true;

    if(Array.isArray(this.newUOMList)) {
      return this.newUOMList.includes(uom);
    } else if(this.legacyUOM) {
      return this.uoms?.find(ele => ele.name === uom) ? true : false;
    }

    return false;
  }

}
