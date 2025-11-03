import { Component, Input, OnInit } from '@angular/core';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { TimesheetConstants, TimesheetType } from 'src/app/wipro-timesheet/timesheet.enums';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

@Component({
  selector: 'app-timesheet-billing-details',
  templateUrl: './timesheet-billing-details.component.html',
  styleUrls: ['./timesheet-billing-details.component.scss']
})
export class TimesheetBillingDetailsComponent implements OnInit {
  billing_data:any= undefined;
  currency:string=undefined;
  is_tax_hidden: any;
  currentTimesheetData: any;
  accuracyConfig = AccuracyConfigEnum;
  @Input() set billingData(data: any) {
    if(data){
      this.setBillData(data);
    }else{
      this.billing_data= undefined;
    }
  }

  constructor(
    public StorageService: StorageService, 
    public timesheetService: TimesheetService
  ) {
      this.currentTimesheetData = this.StorageService.get(TimesheetConstants.TIMESHEET);
  }

  ngOnInit(): void {
    this.is_tax_hidden = this.StorageService?.get(StorageKeys?.CURRENT_PROGRAM)?.config?.is_tax_hidden || false;
  }
  
  setBillData(data){
    if(data?.bill_data?.length > 0){
      this.currency= data?.currency?.toUpperCase();
      data?.bill_data?.forEach((d,i) => {
        if(d?.client_rate_breakup){
          let client_tooltip = new Array();
          d?.client_rate_breakup?.forEach(r => {
            client_tooltip?.push(this.showTooltip(r?.hours,this.accuracyConfig.HOUR)  + this.getTimesheetType() + '*' + this.showTooltip(r?.rate,this.accuracyConfig?.RATE) + '('+ r?.rate_factor + ')')
           });
           d.client_tooltip = client_tooltip?.join('+');
        }
         if(d?.vendor_rate_breakup){
          let vendor_tooltip = new Array();
          d?.vendor_rate_breakup?.forEach(r => {
            vendor_tooltip?.push(this.showTooltip(r?.hours,this.accuracyConfig.HOUR) + this.getTimesheetType() + '*' + this.showTooltip(r?.rate ,this.accuracyConfig?.RATE) + '('+ r?.rate_factor + ')')
           });
           d.vendor_tooltip = vendor_tooltip?.join('+');
        } 
        if(d?.candidate_rate_breakup){
          let candidate_tooltip = new Array();
          d?.candidate_rate_breakup?.forEach(r => {
            candidate_tooltip?.push(this.showTooltip(r?.hours,this.accuracyConfig.HOUR) + this.getTimesheetType() + '*' + this.showTooltip(r?.rate ,this.accuracyConfig?.RATE) + '('+ r?.rate_factor + ')')
           });
           d.candidate_tooltip = candidate_tooltip?.join('+');
        }
      });
      this.billing_data= data?.bill_data;
      /*]] let regular= getFilteredObjectFromArray(data.bill_data, 'type', TimesheetWorkType.REGULAR);
      let overtime= getFilteredObjectFromArray(data.bill_data, 'type', TimesheetWorkType.OVERTIME);
      let doubletime= getFilteredObjectFromArray(data.bill_data, 'type', TimesheetWorkType.DOUBLETIME);
      let total= getFilteredObjectFromArray(data.bill_data, 'type', TimesheetWorkType.ALL);
      this.billing_data=[];
      if(regular?.length > 0){
        this.billing_data?.push(regular[0]);
      }
      if(overtime?.length > 0){
        this.billing_data?.push(overtime[0]);
      }
      if(doubletime?.length > 0){
        this.billing_data?.push(doubletime[0]);
      }
      if(total?.length > 0){
        this.billing_data?.push(total[0]);
      } */    
    }else{
      this.billing_data= undefined;
    }
  }
  
  getTimesheetType() {
    if(this.currentTimesheetData?.meta_data?.layout?.type === TimesheetType?.DAY) {
      return 'D'
    } else {
      return 'H'
    }
  }

  totalBillableType() {
    if(this.currentTimesheetData?.meta_data?.layout?.type === TimesheetType?.DAY) {
      return 'Days'
    } else {
      return 'Hours'
    }
  }
  showTooltip(data, type?) {
    return this.timesheetService?.showTooltip(data, type, this.currency);
  }
}
