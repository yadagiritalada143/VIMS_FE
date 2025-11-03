import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LOG_TYPE, Log } from 'src/app/library/logs/logs.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

@Component({
  selector: 'app-calculate-cost-component-group',
  templateUrl: './calculate-cost-component-group.component.html',
  styleUrls: ['./calculate-cost-component-group.component.scss'],
})
export class CalculateCostComponentGroupComponent implements OnInit {
  @Input() selectedCostComponents;
  @Input() set isShowTryOutModal(value: boolean) {
    this._isShowTryOutModal = value;
    if (value) {
      this.logs = undefined;
      if (this.selectedCostComponents && this.selectedCostComponents.length > 0) {
        this._selectedCostComponents = this.selectedCostComponents.map(entry => ({
          component_name: entry.component_name,
          level: entry.level,
          unit: entry.unit,
          value: this.accuracyPipe.transform(entry.value, entry.unit?.toLowerCase() === 'percentage' ? this.accuracyConfig.MARKUP_PERCENTAGE : this.accuracyConfig.MARKUP, { isEdit: true }),
        }));
        this.calculateTryOut();
      }
    }
  };
  @Output() close: EventEmitter <void> = new EventEmitter <void> ();

  logs: Log = undefined;
  // modal
  pay_rate: number;
  bill_rate: number;
  markup: number;
  markup_cost_amount: number;
  markup_total_amount: number;
  programId: string;
  _isShowTryOutModal: boolean;
  _selectedCostComponents: any = [];
  public accuracyConfig = AccuracyConfigEnum;

  constructor(
    private programService: ProgramService,
    private alertService: AlertService,
    private storageService: StorageService,
    private accuracyPipe: AccuracyPipe,
  ) {}

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  closeTryOut(): void {
    this.close.emit()
  }

  isValidLevels(levels:number[]): boolean{
    levels.sort()
    if (levels.some(level=> level==null))
      return false
    if (levels.length > 0 && levels[0] != 1) 
      return false
    for(let i = 0; i< levels.length -1 ; i++) {
      if(levels[i+1] - levels[i] > 1)
        return false
    }
    return true
  }

  showError(err){
    window.scrollTo(0, 0);

    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true,
      showReportButton: err?.status == 500,
      additionalInfo:{trace_id: err?.error?.trace_id }
    };

    err?.error?.error?.errors?.forEach(msg => {      
      if (msg?.message) {      
        this.logs.messages.push(msg?.message);
      }
    });
  }

  isValidateMetaData(): boolean {
    this.logs = undefined;

    if (!this.pay_rate || this.pay_rate == 0 || !this.markup || this.markup == 0) {
      this.showError("Pay Rate or Markup should not be zero.");
      return false;
    }

    const levels = this._selectedCostComponents.map(entry => entry.level)
    levels.sort()
    if (levels.length > 0 && levels[0] != 1) {
      this.showError("Level should start at 1")
      return false
    }
    for(let i = 0; i< levels.length -1 ; i++) {
      if(levels[i+1] - levels[i] > 1){
        this.showError(`Missing level(s) between level ${levels[i]} and level ${levels[i+1]}`)
        return false
      }
    }
    const values = this._selectedCostComponents.map(entry => entry.value)
    if (values.some(number=> number == null || number<=0 )) {
      this.showError(`Component value should not be empty and smaller than or equal to 0`)
      return false
    }
    return true
  }

  restrictLevelInput(e, ind) {
    const val = parseInt(e.target.value) || 1;
    if (val < 1) {
      this._selectedCostComponents[ind].level = 1;
    }
    if (val > 99) {
      this._selectedCostComponents[ind].level = parseInt(val.toString().substr(0, 2));
    }
    e.target.value = this._selectedCostComponents[ind].level;
  }

  calculateTryOut(): void {
    this.pay_rate = this.accuracyPipe.transform(this.pay_rate, this.accuracyConfig.RATE , { isEdit: true });
    this.markup = this.accuracyPipe.transform(this.markup, this.accuracyConfig.MARKUP_PERCENTAGE, { isEdit: true });
    const meta_data = this._selectedCostComponents.map(entry => ({
      component_name: entry.component_name,
      level: entry.level,
      unit: entry.unit?.toLowerCase() === 'percentage' ? 'percentage' : 'fixed_amount',
      value: parseFloat(entry.value),
    }));
    const payload = {
      pay_rate: parseFloat(this.pay_rate?.toString()) || 0,
      markup: parseFloat(this.markup?.toString()) || 0,
      meta_data,
    };

    if (this.pay_rate && this.markup && meta_data.length > 0 && this.isValidLevels(meta_data.map(data=>data.level))) {
      const url = `/core-money/programs/${this.programId}/cost-component/calculations`;
      this.programService.post(url, payload).subscribe(
        {
          next: (data: any) => {
            data = data.data;
            this.bill_rate = this.accuracyPipe.transform(data.bill_rate, this.accuracyConfig.RATE, { isEdit: true });
            data.meta_data.forEach(meta => {
              const matchComponent = this._selectedCostComponents.find(item => item.component_name == meta?.component_name);
              if (matchComponent) {
                matchComponent.total_amount = this.accuracyPipe.transform(meta.total_amount, this.accuracyConfig.RATE, { isEdit: true });
                matchComponent.cost_amount = this.accuracyPipe.transform(meta.cost_amount, this.accuracyConfig.RATE, { isEdit: true });
              } else {
                this.markup_cost_amount = this.accuracyPipe.transform(meta.markup_cost_amount, this.accuracyConfig.RATE, { isEdit: true });
                this.markup_total_amount = this.accuracyPipe.transform(meta.markup_total_amount, this.accuracyConfig.RATE, { isEdit: true });
              }
            });
          },
          error: (err) => {
            this.alertService.error(errorHandler(err));
          }
        }
      )
    }
  }

}
