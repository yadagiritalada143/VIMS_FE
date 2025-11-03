import {Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { MappingService } from '../../mapping-service.service';

@Component({
  selector: 'app-rate-card-uom',
  templateUrl: './rate-card-uom.component.html',
  styleUrls: ['./rate-card-uom.component.scss']
})
export class RateCardUomComponent implements OnInit {

  private touchedWorkLocation: Set <string> = new Set <string> ();
  public defaultDateFormat: string = 'MM/dd/yyyy - HH:mm:ss';
  public chartVisibility = false;
  public selectedUom;
  public tabIndex = 0;
  
  public currency: string = 'USD';
  @Input('currency') set setCurrency(data: string) {
    if(data) {
      this.currency = data;
    }
  }

  public talentNeuron: any = null;
  @Input('talent_neuron') set talentNeuronData(data: any) {
    if(Array.isArray(data?.results) && data?.results?.length) {
      this.talentNeuron = data.results[0];
    } else {
      this.talentNeuron = null;
    }
  };

  public o_net_soc_code: string = null;
  public category_name: string = null;
  @Input('soc') set soc_code(data: any) {
    if(data) {

      this.o_net_soc_code = data?.o_net_soc_code;
      let category: string = data?.category_name;

      if(category) {
        while(category.includes(' '))
          category = category.replace(' ','%20');
        this.category_name = category;
      }
    }
  }

  public job: any = null;
  public modified_on: number = null;
  @Input('job') set setJob(data) {
    if(data) {
      const { modified_on } = data;
      this.modified_on = this.localDate.transform(this.dateParser(modified_on), this.defaultDateFormat);
      this.job = data;
    }
  }

  @Output() onEdit = new EventEmitter();

  constructor (
    public mapper: MappingService,
    private userService: UserService,
    private storage: StorageService,
    private localDate: LocalDateFormatPipe
  ) { }

  ngOnInit(): void {
    const currentProgram = this.storage.get(StorageKeys.CURRENT_PROGRAM);
    let dateFormat = currentProgram?.defaultDateFormat;
    if(dateFormat) {
      this.defaultDateFormat = this.caseCorrection(dateFormat) + ' - HH:mm:ss';
    }
  }

  onEditClick(event) {
    this.onEdit.emit(this.job?.id);
  }

  changeSelectedUom(event) {
      this.tabIndex = event;
      let modified_on = this.job.filtered_unit_of_measures[event]?.modified_on_timestamp;
      let parsed_date = this.dateParser(modified_on);
      this.modified_on = this.localDate.transform(parsed_date, this.defaultDateFormat);
      this.selectedUom = this.job.filtered_unit_of_measures[event];
  }

  dateParser(date: number) {
    if(!date)
      return new Date();
    let result = new Date(date*1000);
    return result;
  }

  getWorkLocationName(id: string) {

    if(this.touchedWorkLocation.has(id))
      return;
    else
      this.touchedWorkLocation.add(id);

    if (id) {
      const value = this.mapper.workLocations.get(id);
      if (value)
        return value;
      else {

        let programId = this.storage.get(StorageKeys.PROGRAM_ID);
        const url = `/configurator/programs/${programId}/work-locations/${id}`;
        this.userService.get(url)
          .subscribe({
            next: (res: any) => {
              if (res) {
                const { work_location } = res;
                this.mapper.workLocations.set(id, work_location?.name);
              }
            },
            error: (err: Error | any) => {
              console.error(errorHandler(err));
            }
          });
      }

      return value;
    }

    return undefined;
  }

  fetchTalentNeuronDetails() {

    const url = `/job-manager/talentneuron?o_net_soc_code=${this.o_net_soc_code}&category_name=${this.category_name}`;
    this.userService.get(url)
      .subscribe({
        next: (res: any) => {
          console.log(res);
        },
        error: (err: Error | any) => {
          console.error(errorHandler(err));
        }
      }
    );
  }

  caseCorrection(format: string): string {

    let result = '';
    for (let it = 0; it < format.length; it++) {
      if (format[it] === 'm')
        result += format[it].toUpperCase();
      else
        result += format[it];
    }

    return result;
  }

  get meanRate() {
    let min: number = Number.parseFloat(this.selectedUom?.min_rate);
    let max: number = Number.parseFloat(this.selectedUom?.max_rate);
    return (min+max)/2;
  }
}