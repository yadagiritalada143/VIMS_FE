import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from '../../../core/services/event-stream.service';
import { ActivatedRoute } from '@angular/router';
import { ProgramService } from '../../../programs/program.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { MappingService } from '../mapping-service.service';
import { Subject, Subscription } from 'rxjs';
import { RateCardHeaderComponent } from '../components/rate-card-header/rate-card-header.component';
import { debounceTime, switchMap } from 'rxjs/operators';
import { CardRateService } from '../card-rate.service';

@Component({
  selector: 'app-rate-card-details',
  templateUrl: './rate-card-details.component.html',
  styleUrls: ['./rate-card-details.component.scss']
})
export class RateCardDetailsComponent implements OnInit, OnDestroy {

  isCreate = true;
  isFilter = false;
  isSearch = false;
  isTheme = true;
  rateCard: any;
  submenuName: string;
  activeJob = {id: null, job: null};
  addRateVisibility = 'hidden';
  disableJobTemplate: boolean = true;

  @ViewChild(RateCardHeaderComponent ) rateCardHeader: RateCardHeaderComponent;

  private subscriptions: Array <Subscription> = [];
  private touchedId: Set <string> = new Set <string> ();
  private rateCardSub: Subject <void> = new Subject <void> ();

  public editCardVisibility: string = 'hidden';
  public editRateCard: any = null;
  public selectedJobTemplate: string = null;
  public chainedTemplateKeys: Array <any> = [];
  public chainedTemplates: Map <string, Array <any>> = new Map <string, Array <any>> ();
  
  constructor (
    private eventStream: EventStreamService,
    private _programService: ProgramService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    public mapper: MappingService,
    private cardService: CardRateService
  ) {}

  ngOnInit(): void {

    this.subscriptions.push(
      this.rateCardSub.pipe(
        debounceTime(600),
        switchMap(() => {

          const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
          const rateCardId = this.route.snapshot.paramMap.get('id');

          this._loader.show();
          const url: string = `/configurator/programs/${programId}/rate-cards/${rateCardId}`;
          return this._programService.get(url);
        })
      ).subscribe({
        next: (data: any) => {
          if (data) {
            this.rateCard = data;
            this.getTalentNeuronDetails();
            this.ratesChainedList();
            this.doublePrecisionForActiveRates();
            const filtered_rates: Array<any> = this.rateCard.filtered_rates;
            if (Array.isArray(filtered_rates)) {
              this.rateCard?.filtered_rates.forEach((rate: any, it: number) => {
                this.rateCard.filtered_rates[it].template_name = this.getTemplate(rate?.job_template_id);
              });
            }

            if (data.currency)
              data.currency = data.currency.toUpperCase();
            const currency: string = data.currency;
            if (data.currency && (data.currency.includes('(')))
              data.currency = currency.split('(')[0].trim();

            const category_name = this.rateCard.job_category?.category_name || 'Undefined';
            const title_name = this.rateCard.job_title?.title || 'Undefined';
            this.submenuName = category_name + ' - ' + title_name;

            this._loader.hide();
            this.updateActiveJob();
          }
        }, error: (err: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(err));
        }
      })
    );

    this.rateCardSub.next();
    this.subscriptions.push(
      this.eventStream
        .on(Events.REFRESH_RATE_LISTING)
        .subscribe(res => {
          if (res) {
            this.rateCardSub.next();
          }
        })
    );
  }

  getTalentNeuronDetails() {
    let category_name: string = this.rateCard?.job_category?.category_name;
    let o_net_soc_code: string = this.rateCard?.job_category?.o_net_soc_code;
    if(category_name && o_net_soc_code) {

      let url: string = `/job-manager/talentneuron?o_net_soc_code=${o_net_soc_code}&category_name=${category_name}`;
      this._programService.get(url).subscribe({
        next: (data: any) => {
          this.rateCard = {
            ...this.rateCard,
            talent_neuron: data
          };
        }
      });
    }
  }

  doublePrecisionForActiveRates() {
    if (this.rateCard) {

      const filtered_rates: Array<any> = this.rateCard?.filtered_rates;
      if (filtered_rates && Array.isArray(filtered_rates)) {

        filtered_rates.forEach((rate: any) => {
          if (rate) {

            const uoms: Array<any> = rate?.filtered_unit_of_measures;
            if (uoms && Array.isArray(uoms)) {
              uoms.forEach((uom: any) => {

                if (Number.isInteger(uom.min_rate)) {
                  uom.min_rate = this.cardService.doubleDecimal(uom.min_rate);
                }

                if (Number.isInteger(uom.max_rate)) {
                  uom.max_rate = this.cardService.doubleDecimal(uom.max_rate);
                }
              });
            }
          }
        })
      }
    }
  }

  updateActiveJob() {
    this.activeJob = {id: null, job: null};
  }

  onUpdateData(event) {
    this.rateCard = event;
    this.addRateVisibility = 'hidden';
    this.selectedJobTemplate = null;
  }

  onCreate(event) {
    this.addRateVisibility = 'visible';
    this.disableJobTemplate = false;
    setTimeout(() => {
      this.eventStream.emit(
        new EmitEvent(
          Events.ADD_RATE_DETAILS,
          null
        ));
    }, 800);
  }

  onClose() {
    this.addRateVisibility = 'hidden';
    this.disableJobTemplate = true;
  }

  getTemplate(id) {

    const template = 'Undefined';
    let template_name;

    if(this.touchedId.has(id))
      return;
    else
      this.touchedId.add(id);    

    if (id && !this.mapper.jobTemplates.get(id)) {
      const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
      const url: string = `/job-manager/programs/${programId}/job-templates/${id}`;
      this._programService.get(url)
        .subscribe({
          next: (data: any) => {
            this.rateCard.filtered_rates.forEach(item => {
              if (item.job_template_id === data.job_template.id) {
                item.template_name = data.job_template.template_name;
                this.mapper.jobTemplates.set(id, item.template_name);
              } else if (item.job_template_id === null) {
                item.template_name = template;
              }

              template_name = item.template_name;
            });
          }, error: (err: Error | any) => {
            this._alert.error(errorHandler(err));
          }
        }
      );
    }

    return template_name;
  }

  openEditRate() {
   this.editRateCard = this.rateCard;
   this.editCardVisibility = 'visible'; 
  }

  onCloseEditCard() {
    this.editRateCard = null;
    this.editCardVisibility = 'hidden';
  }

  onUpdateRateCard(evt: any) {
    if(evt) {
      this.rateCardSub.next();
    }
  }

  ratesChainedList() {

    this.chainedTemplates.clear();
    this.chainedTemplateKeys = [];

    const card = this.rateCard;
    let filtered_rates: Array <any> = card?.filtered_rates;
    if(filtered_rates && filtered_rates.length) {

      let length = filtered_rates.length;
      filtered_rates.forEach((rate, it) => {
        if(rate && it < length-1) {

          let job_template_id: string = rate?.job_template_id;
          rate.index = it;
          
          if(!job_template_id)
            job_template_id = 'Undefined';

          let hasEntry = this.chainedTemplates.get(job_template_id);
          if(hasEntry)
            this.chainedTemplates.set(job_template_id, [...hasEntry, rate]);
          else
            this.chainedTemplates.set(job_template_id, [rate]);

        }
      });
    }

    let template_iterator = this.chainedTemplates.keys();
    for(let entry of template_iterator) {
      this.chainedTemplateKeys.push(entry);
    }
  }

  selectActiveTemplate(id: string) {
    if(this.selectedJobTemplate === id){
      this.rateCardHeader?.clearFilters();
      this.rateCardHeader!.searchValue = "";
      this.selectedJobTemplate = null;
      this.isSearch = false;
      this.isFilter = false;
    }  
    else{
      this.rateCardHeader?.clearFilters();
      this.rateCardHeader!.searchValue = "";
      this.selectedJobTemplate = id;
      this.isSearch = true;
      this.isFilter = true;
    }
      
  }

  onSearch(term: string) {
    if(term === "" || term === null){
      this.rateCardSub.next();
      return;
    }
    
    let arr = this.chainedTemplates.get(this.selectedJobTemplate);
    for(let i=0;i<arr.length;i++){
      if(this.mapper.hierarchies.get(arr[i].hierarchy_id)){
        if(!this.mapper.hierarchies.get(arr[i].hierarchy_id).toLowerCase().includes(term.toLowerCase())){
          arr.splice(i,1);
          i=i-1;
        }
      }
      else {
        arr.splice(i,1);
        i=i-1;
      }
    }
    this.chainedTemplates.set(this.selectedJobTemplate,arr);
    
  }

  clearFilterList() {
    this.rateCardSub.next();
  }

  filtersAppliedList(event: any) {
    let arr = this.chainedTemplates.get(this.selectedJobTemplate);
    let tempevent=event.toLowerCase();
    for(let i=0;i<arr.length;i++){
      tempevent = event.toLowerCase();
      for(let j=0;j<arr[i].filtered_unit_of_measures.length;j++){
        if(arr[i].filtered_unit_of_measures[j].is_active){
          if(tempevent?.includes(arr[i].filtered_unit_of_measures[j].unit_of_measure.toLowerCase())){
            tempevent = tempevent.replace(arr[i].filtered_unit_of_measures[j].unit_of_measure.toLowerCase(),"");
          }
            
        }
      }
      if(tempevent===event){
        arr.splice(i,1);
        i--;
      }
    }
    this.chainedTemplates.set(this.selectedJobTemplate, arr);
  }
  
  get activeDefaultRateCount() {

    if(!this.rateCard)
      return '0';

    const filtered_rates = this.rateCard.filtered_rates;
    let length = filtered_rates.length;
    let count = 0;

    let uoms: Array <any> = filtered_rates[length-1].filtered_unit_of_measures;
    uoms.forEach(rate => {
      if(rate?.is_active)
        count++;
    });

    return count;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
