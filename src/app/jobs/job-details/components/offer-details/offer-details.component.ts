import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobDetailsService } from '../../job-details.service';
import { forkJoin } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-offer-details',
  templateUrl: './offer-details.component.html',
  styleUrls: ['./offer-details.component.scss'],
})
export class OfferDetailsComponent implements OnInit, OnChanges {
  public offerData;
  public currentProgram;
  private currentJobid;
  private currentOfferId;
  private currentCandidate;
  public job: any;
  public offerNotes: any;
  public noOffer: boolean = true;
  public loading: boolean = true;
  public holidayCalender: string = '';
  public timesheetType: string = '';
  public clientOverTimeBillRateFactor;
  public clientDoubleTimeBillRateFactor;

  public clientOverTimePayRateFactor;
  public clientDoubleTimePayRateFactor;
  private rateConfig;
  public prevTimeSheetType: string;
  public prevholidayCalender: string;
  public isBillDriven = false;
  isCounteredOffer:any;
  public ratesDisplaySequence = ['Standard', 'Doubletime', 'Overtime'];
  offerJobManager;
  userType: string;
  userRole:any;
  rateFactors:any;
  jobCurrency:any;
  programRateModel:any;
  isAlertError: boolean = false;
  candidateStatus: string;
  candidateStatusReason: any;
  candidateStatusNote: any;
  offerEdited:any;
  candidateID;
  jobId;
  backEndData;
  apiData;
  user_type;
  minRate;
  maxRate;
  showTimesheetManagers = false;
  showExpenseManagers = false;
  displayFirstTimesheetManager;
  remainingTimesheetManagers = [];
  displayFirstTimesheetManagerName;
  displayFirstExpenseManagerName;
  remainingExpenseManagers = [];
  displayFirstExpenseManager;
  isVendorNeutral;
  markupByRateTypeEnabled: boolean = false;
  @Input() public set data(data: any) {
    if (data) {
      this.apiData = data?.api_data;
      this.backEndData = this.apiData?.backend_data;
      this.userType = this.storageService.get('user_type');
      this.currentJobid = data['job'] || data?.jobID ;
      this.currentCandidate = data?.candidate?.id ||  data?.candidateId ;

      if(this.backEndData?.new_data){
        this.offerData = this.backEndData?.new_data;
        this.markupByRateTypeEnabled =  this.offerData?.stages[0]?.markup_by_rate_type;
        this.offerData.modified_on = data?.modified_on;
        this.loading = false;
        this.reArrangeType();
        this.getRatefacts();
        this.getOfferManager(this.offerData);
        this.getCounteredStatus(this.offerData);
        this.getTimesheetManagers(this.offerData?.stages[0]?.timesheet_manager);
        this.getExpenseManagers(this.offerData?.stages[0]?.expense_managers);
      }
      this.offerEdited = data?.activity?.toLowerCase() =='offer edited' ? true : false;

      if (data?.offer) {
        this.currentOfferId = data?.offer?.id;
      }
      if(!this.backEndData?.new_data){
        if (this.currentOfferId) {
          this.getofferDetails().subscribe((res: any) => {
            this.offerData = res.offer;
            this.markupByRateTypeEnabled =  this.offerData?.stages[0]?.markup_by_rate_type;
            if(this.offerData){
              this.reArrangeType();
            }
            this.getCounteredStatus(this.offerData);
            this.getOfferManager(this.offerData)
            this.getTimesheetTypAndeHoliday();
            this.getTimesheetManagers(this.offerData?.stages[0]?.timesheet_manager);
            this.getExpenseManagers(this.offerData?.stages[0]?.expense_managers);
          });
        } else {
          this.fetchOffersForCandidate();
        }
      }
    }
  }
  constructor(
    private storageService: StorageService,
    private jobService: JobDetailsService,
    private alert: AlertService
  ) { }

  ngOnInit(): void {
    this.noOffer = false;
    const user = JSON.parse(localStorage.getItem('account'))
    this.user_type = JSON.parse(localStorage.getItem('user_type'))
    this.userRole = user?.role?.organization_category?.toLowerCase();
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.jobService.loadJob(this.currentJobid).subscribe(res => {
      this.job = res["job"];
      this.jobCurrency = this.job?.currency;
      // this.job = res?.data && res?.data[0];
      this.programRateModel = this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? this.job.rate_model : this.currentProgram?.config?.program_model;
      this.isVendorNeutral = this.currentProgram.config?.is_vendor_neutral;

      if(this.programRateModel === 'PAY_RATE'){
        this.minRate = this.job['min_pay_rate'];
        this.maxRate = this.job['max_pay_rate'];
      }
      else{
        if(this.userType.toLowerCase() === 'vendor') {
          if(this.clientBillRateEnabled){
            this.minRate =  this.job['min_bill_rate'];
            this.maxRate = this.job['max_bill_rate'];
          }else{
            this.minRate =  this.job['vendor_min_bill_rate'];
            this.maxRate = this.job['vendor_max_bill_rate'];
          }
        }
        else {
          this.minRate =  this.job['min_bill_rate'];
          this.maxRate = this.job['max_bill_rate'];
        }
      }
    })
    if (this.currentProgram && this.currentProgram?.config?.program_model?.toLowerCase() === 'bill_rate') {
      this.isBillDriven = true
    }

    // if(this.currentProgram?.config?.submission?.is_vendor_markup_enabled){
    //   this.getProgramConfiguration();
    // }  commented as not being used anywhere as per ticket V2M-3434
  }

  get showRemoteWorker(){
    return this.jobService.remoteWorker();
  }

  get getOfferNotes() {
    return this.jobService.getOfferNotes(
      this.currentJobid,
      this.currentCandidate,
      this.currentOfferId
    );
  }

  ngOnChanges(change: SimpleChanges): void { }

  getOfferManager(offerData){
    let arr = [];
    if(!(this.isVendorNeutral && this.userType.toLowerCase() === 'vendor')){
        offerData?.stages.forEach(element => {
          if(Object?.keys(element?.job_manager).length != 0){
            arr.push(element?.job_manager);
          }
        });
      this.offerJobManager = arr[0];
    }
  }

  showPopoverInt() {
    this.showTimesheetManagers = true;
  }

  hidePopOverInt() {
    this.showTimesheetManagers = false;
  }

  showExpenceManagers(){
    this.showExpenseManagers = true;
  }

  hideExpenceManagers(){
    this.showExpenseManagers = false;
  }

  get clientBillRateEnabled(){
    return this.jobService.clientBillRateEnabled();
  }

  checkConfig(){
    return this.jobService.checkConfig(this.programRateModel,this.clientBillRateEnabled,this.userType);
   }
  getCounteredStatus(offerData){
    this.isCounteredOffer = (offerData?.status?.toLowerCase() == 'countered') ? true : false;
  }
  getofferDetails() {
    if (this.currentJobid) {
      return this.jobService.getOfferDetails(
        this.currentJobid,
        this.currentCandidate,
        this.currentOfferId
      );
    }
    this.getRatefacts();
  }
  getStatus(str){
    return str?.toLowerCase().replace(/_/g, ' ')
    .replace(/(?: |\b)(\w)/g, function(key, p1) {
        return key.toUpperCase();
    })
  }

  fetchOffersForCandidate() {
    this.loading = true;
    let currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.jobService
      .fetchOfferForCandidate(currentProgram?.id, this.currentCandidate, this.currentJobid)
      .subscribe({
       next: (res: any) => {
          this.currentOfferId = !!res?.offers.length ? res.offers[0].id : 0;
          if (!!this.currentOfferId) {
            this.noOffer = false;
            this.getofferDetails().subscribe((data: any) => {
              this.offerData = data.offer;
              this.markupByRateTypeEnabled =  this.offerData?.stages[0]?.markup_by_rate_type;
              this.getOfferManager(this.offerData);
              if(this.offerData){
                this.reArrangeType();
              }
              this.getTimesheetManagers(this.offerData?.stages[0]?.timesheet_manager);
              this.getExpenseManagers(this.offerData?.stages[0]?.expense_managers);
              this.alertHandler(this.offerData);
              this.getCounteredStatus(this.offerData)
              this.getTimesheetTypAndeHoliday();
            });
          } else {
            this.noOffer = true;
            this.loading = false;
          }
        },
        error: (err) => { }
  });
  }

  reArrangeType() {
    this.offerData?.stages[0]?.rates
    let RateInfo = new Array();
    var regular = this.offerData?.stages[0]?.rates.filter(function (e, index) {
      if (e.rate_factor?.toLowerCase() == 'regular' || e.rate_factor?.toLowerCase() == 'st') {
        e.index = index;
        e.name = e.name || 'Regular';
      }
      return e.rate_factor?.toLowerCase() === 'regular' || e.rate_factor?.toLowerCase() == 'st';
    });
    if (regular?.length > 0 && regular[0].index >= 0) {
      this.offerData?.stages[0]?.rates.splice(regular[0].index, 1);
      RateInfo = [...regular];

    }
    var ot = this.offerData?.stages[0]?.rates.filter(function (e, index) {
      if (e.rate_factor?.toLowerCase() == 'ot') {
        e.index = index;
      }
      return e.rate_factor?.toLowerCase() === 'ot';
    });
    if (ot?.length > 0 && ot[0].index >= 0) {
      this.offerData?.stages[0]?.rates.splice(ot[0].index, 1);
      RateInfo = [...RateInfo, ...ot];
    }

    var dt = this.offerData?.stages[0]?.rates.filter(function (e, index) {
      if (e.rate_factor?.toLowerCase() == 'dt') {
        e.index = index;
      }
      return e.rate_factor?.toLowerCase() === 'dt';
    });
    if (dt?.length > 0 && dt[0].index >= 0) {
      this.offerData?.stages[0]?.rates.splice(dt[0].index, 1);
      RateInfo = [...RateInfo, ...dt];
    }
    if (this.offerData?.stages[0]?.rates) {
      this.offerData.stages[0].rates = [...RateInfo, ...this.offerData?.stages[0]?.rates].sort((a, b) => (a.billable === b.billable) ? 0 : (a.billable ? -1 : 1));;
    }
  }

  getTimesheetTypAndeHoliday() {
    forkJoin([
      this.jobService.getHolidayCalenderList(),

    ]).subscribe((list: any) => {
      this.holidayCalender = list[0].holiday_calendars.filter(
        (x) => x.id === this.offerData.stages[0].holiday_calendar_id
      )[0]?.name;

      if (this.offerData?.stages.length > 1) {
        this.prevholidayCalender = list[0].holiday_calendars.filter(
          (x) => x.id === this.offerData.stages[1].holiday_calendar_id
        )[0]?.name || '-';
      }
      this.jobService
        .getPickListItems(this.currentProgram.id, 'timesheet_type')
        .subscribe((response) => {
          this.timesheetType = response['picklist_items'].filter(
            (y) => y.id === this.offerData.stages[0].timesheet_type_id
          )[0]?.label;

          if (this.offerData?.stages.length > 1) {
            this.prevTimeSheetType = response['picklist_items'].filter(
              (y) => y.id === this.offerData.stages[1].timesheet_type_id
            )[0]?.label || '-';
          }

          this.loading = false;
        });
    });
  }

  getProgramConfiguration() {
    forkJoin([this.vendorMarkUp, this.rateFactor]).subscribe({
      next: (data: any) => {
        if (data) {
          this.rateConfig = data[1]?.config;//JSON.parse(data[1].config);
          this.clientOverTimeBillRateFactor = this.rateConfig.rate_factors[0].rate_factors.filter(
            (r) => r.applies_to === 'VENDOR'
          )[0].rate_factor;
          this.clientDoubleTimeBillRateFactor = this.rateConfig.rate_factors[1].rate_factors.filter(
            (r) => r.applies_to === 'VENDOR'
          )[0].rate_factor;

          this.clientOverTimePayRateFactor = this.rateConfig.rate_factors[0].rate_factors.filter(
            (r) => r.applies_to === 'CANDIDATE'
          )[0].rate_factor;
          this.clientDoubleTimePayRateFactor = this.rateConfig.rate_factors[1].rate_factors.filter(
            (r) => r.applies_to === 'CANDIDATE'
          )[0].rate_factor;
        }
      },
      error: (err) => {
        this.alert.error(errorHandler(err));
      }
  });
  }

  get vendorMarkUp() {
    return this.jobService.getProgramConfig('vendor_markup');
  }

  get rateFactor() {
    return this.jobService.getProgramConfig('rate_factor');
  }

  getRatefacts(){
    this.jobService.getRateFactors().subscribe(data =>{
      this.rateFactors = data;
    });
  }

  getTimesheetManagers(timesheet_manager){
    let timesheetManagers = timesheet_manager;
    this.displayFirstTimesheetManager = timesheetManagers?.splice(0,1);
    this.displayFirstTimesheetManagerName =
    this.displayFirstTimesheetManager && this.displayFirstTimesheetManager?.length > 0
      ? this.displayFirstTimesheetManager?.map((u) => u?.full_name).join(',')
      : '';
    this.remainingTimesheetManagers = timesheetManagers;
  }

  getExpenseManagers(expense_manager){
    let expenseManagers = expense_manager;
    this.displayFirstExpenseManager = expenseManagers?.splice(0,1);
    this.displayFirstExpenseManagerName =
    this.displayFirstExpenseManager && this.displayFirstExpenseManager?.length > 0
      ? this.displayFirstExpenseManager?.map((u) => u?.full_name).join(',')
      : '';
    this.remainingExpenseManagers = expenseManagers;
  }

  getPastData(rate_factor) {
    return (this.offerData?.stages && this.offerData?.stages?.length > 1) ? this.offerData?.stages[1]?.rates?.find(val => val.rate_factor?.toLowerCase() === rate_factor?.toLowerCase()) : null;
  }

  get hideRateAuthority() {
    return this.jobService.rateAuthority();
  }

  alertHandler(data) {
    const candidateStatus = data?.status;
    switch(candidateStatus) {
      case 'REJECTED':
        this.isAlertError = true;
        this.candidateStatus = "Candidate Rejected";
        break;
    }
    if(this.isAlertError) {
      this.candidateStatusReason = data?.status_reason;
      this.candidateStatusNote = data?.status_note;
    }
    this.isAlertError = this.isAlertError && (!!this.candidateStatusReason || !!this.candidateStatusNote);
  }

}
