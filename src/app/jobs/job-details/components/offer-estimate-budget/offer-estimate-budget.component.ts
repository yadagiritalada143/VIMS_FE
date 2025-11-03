import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, } from '@angular/forms';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobDetailsService } from '../../job-details.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-offer-estimate-budget',
  templateUrl: './offer-estimate-budget.component.html',
  styleUrls: ['./offer-estimate-budget.component.scss']
})
export class OfferEstimateBudgetComponent implements OnInit {
  offerEstimateForm: UntypedFormGroup;
  logs: Log= undefined;
  currency: any;
  offerDetails;
  @Input() isOfferDetailPage;
  @Input() clientBillRate
  @Input() isCreateEstimate = 'visible';
  @Input() workingData;
  @Input() set offerStartDate(startDate){
    this.startDate = startDate;
  }
  @Input() set offerEndDate(endDate){
    this.endDate = endDate;
  }
  data:any;
  jobDetailsData:any = undefined;
  @Input() set jobData(jobDetailsData){
    this.jobDetailsData = jobDetailsData;
  }
  @Input() set estimateFields(estimateData){
      this.data = estimateData;
        this.adjustment_value = this.data?.adjustment_value;
        this.adjustment_type = this.data?.adjustment_type ? this.data?.adjustment_type : 'fixed' ;
        this.additional_amount = this.data?.additional_amount;
        if (this.adjustment_type === 'percentage') {
            this.place_data = '%';
          } else if (this.adjustment_type === 'fixed') {
            this.place_data = this?.accuracyPipe?.transform(null, null, { currencyCode: this.currency,  display: 'symbol' });
          }


  };
  @Input() set selectedCurrency(value: any) {
    if (value) {
      this.currency = value
    }
  };
  @Output() onCreateClose = new EventEmitter();
  place_data;
  adjustment_type;
  adjustment_value;
  additional_amount;
  startDate;
  endDate;
  dateFormat;
  currentProgram;
  programId;
  isOfferEstBtnDisable = false;
  rateTypeMap = new Map<string, string>([
    ['per_hour', 'Hourly'],
    ['per_day', 'Daily'],
    ['per_month', 'Monthly'],
    ['per_week', 'Weekly'],
    ['per_year', 'Yearly'],
  ]);
  dataLoading: boolean = false;

  constructor(
    public accuracyPipe: AccuracyPipe,
    public formBuilder : UntypedFormBuilder,
    private datePipe: LocalDateFormatPipe,
    private storageService: StorageService,
    private jobdetailService: JobDetailsService,
  ) { }
  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.storageService.get('PROGRAM_ID');
    this.dateFormat = this.currentProgram?.defaultDateFormat;
      if (this.adjustment_type === 'percentage') {
        this.place_data = '%';
      } else if (this.adjustment_type === 'fixed') {
        this.place_data = this?.accuracyPipe?.transform(null, null, { currencyCode: this.currency,  display: 'symbol' });
      }
    this.offerEstimateForm = this.formBuilder.group({
      adjustment_type:['fixed'],
      adjustment_value: [],
      additional_amount:[],
      single_initial_budget:[],
      single_net_budget:[],
      budget_estimate:[],
      estimated_adjustment:[],
      adjustmentData:[]
    });

    if (this.offerEstimateForm){
      if(this.isOfferDetailPage){
        this.offerEstimateForm.controls.adjustment_value.disable();
        this.offerEstimateForm.patchValue({
          additional_amount: this.data?.adjustment_amount ?? 0,
          single_initial_budget: this.data?.single_initial_budget,
          single_net_budget: this.data?.single_net_budget,
          budget_estimate: this.data?.net_budget,
          estimated_adjustment: this.data?.estimated_adjustment,
          adjustment_type: this.data?.adjustment_type,
          adjustmentData: this.data?.adjustmentData

        });
      }
      this.offerEstimateForm.patchValue({
        adjustment_type: this.adjustment_type,
        additional_amount: this.additional_amount,
        adjustment_value: this.adjustment_value,
        single_initial_budget: this.data?.single_initial_budget,
        single_net_budget: this.data?.single_net_budget,
        budget_estimate: this.data?.budget_estimate,
        estimated_adjustment: this.data?.estimated_adjustment,
        adjustmentData: this.data?.adjustmentData
      });
    }
    this.offerEstimateForm.controls.adjustment_value.valueChanges
     .pipe(
      tap(() => this.isOfferEstBtnDisable = this.dataLoading = true),
      debounceTime(2000), distinctUntilChanged())
     .subscribe(value => {
        this.getResourceBudget();
     });
  }
  sidebarClose(value?) {
    let values = undefined;
    if (value) {
      values = this.offerEstimateForm.value;
    }
    this.isCreateEstimate = 'hidden';
    this.onCreateClose.emit(values);
  }
  onAdjustmentTypeChange(e) {
    this.dataLoading = true;
    this.adjustment_type = e === 'percentage' || e === 'fixed' ? e : null;
    if (this.adjustment_type) {
      if (e === 'percentage') {
        this.place_data = '%';
      } else if (e === 'fixed') {
        this.place_data = this?.accuracyPipe?.transform(null, null, { currencyCode: this.currency,  display: 'symbol' });
      }
      this.offerEstimateForm.patchValue({
        adjustment_type: this.adjustment_type,
        adjustment_value: null,
      });
      this.getResourceBudget();
    }
  }
  jsonToQueryString(json) {
    return '?' +
      Object.keys(json).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(json[key]);
      }).join('&');
  }

  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading:err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }

  getResourceBudget() {
    let data = this.jobDetailsData;
    let effective_data_arr = [];
    let payload = {
      start_date: this.datePipe.transform(this.startDate, DATE_FORMAT?.FORMATYMD, null, null, true, this.dateFormat),
      end_date: this.datePipe.transform(this.endDate, DATE_FORMAT?.FORMATYMD, null, null, true, this.dateFormat),
      num_resources: 1,
      additional_budget: 0,
      adjustment_type: this.offerEstimateForm.controls.adjustment_type.value,
      adjustment_value: this.offerEstimateForm.controls.adjustment_value.value ?? 0,
    }
    let effective_data_obj: any = {
      effective_start_date : payload?.start_date,
      effective_end_date : payload?.end_date,
      hours_per_day: data?.estimated_hours,
      week_working_days: data?.day_per_week,
      rate:this.clientBillRate,
      total_hours: data?.working_hours,
      rate_type: data?.rate_type,
      tax: [],
      adjustment_fee: this.offerEstimateForm.controls.adjustmentData.value || []
    };
    effective_data_arr.push(effective_data_obj);
    payload['effective_data'] = effective_data_arr;
    this.jobdetailService.post(`/core-money/programs/${this.currentProgram?.id}/resource-budget`, payload).subscribe({
    next: (data: any) => {
      if (data && data.data) {
        this.isOfferEstBtnDisable = false;
        const budgetInfo = data?.data;
        this.offerEstimateForm.patchValue({
          additional_amount: this.offerEstimateForm.controls.adjustment_value.value === null ? null : budgetInfo?.adjustment_amount,
          single_initial_budget: budgetInfo?.single_initial_budget,
          single_net_budget: budgetInfo?.single_net_budget,
          budget_estimate: budgetInfo?.net_budget,
          estimated_adjustment: this.data?.estimated_adjustment,
        });
      }
      this.dataLoading = false;
  },
  error: error => {
    this.showError(error);
    this.isOfferEstBtnDisable = true;
  }});
}

  /*
    hours - no. of hours in the 'working_hours'
    days - no. of days in the 'working_days'
    weeks - no. of weeks in the 'formatted_working_days' +
            (no. of days in the 'formatted_working_days' / no. of days in the 'week_working_days')
    months - yet to be calculated
    years - yet to be calculated
  */
  getWorkingUnits() {
    switch (this.jobDetailsData?.rate_type) {
      case 'per_hour':
        if (this.workingData?.working_hours)
          return this.accuracyPipe?.transform(this.workingData?.working_hours, 'hour') + ' hours';
        return '--';
      case 'per_day':
        if (this.workingData?.working_days)
          return this.accuracyPipe?.transform(this.workingData?.working_days, 'hour') + ' days';
        return '--';
      case 'per_week':
        const weeks =
          +this.workingData?.formatted_working_days?.toString().split(' ')[0] +
          +this.workingData?.formatted_working_days?.toString().split(' ')[2] /
            +this.jobDetailsData?.day_per_week;
        if (weeks) return this.accuracyPipe.transform(weeks ?? 0, 'hour', { view_accurate: true }) + ' weeks';
        return '--';
      case 'per_month':
        const months =
          (+this.workingData?.formatted_working_days?.toString().split(' ')[0] * 7 +
            +this.workingData?.formatted_working_days?.toString().split(' ')[2]) /
          30;
        if (months)
          return this.accuracyPipe.transform(months, 'hour', { view_accurate: true }) + ' months';
        return '--';
      case 'per_year':
        const years = 0;
        if (years)
          return this.accuracyPipe.transform(years, 'hour', { view_accurate: true }) + ' years';
        return '--';
      default:
        return '--'
    }
  }
}
