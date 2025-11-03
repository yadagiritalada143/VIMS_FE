import { Component, Input, OnInit } from '@angular/core';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { TimesheetConstants, TimesheetType } from 'src/app/wipro-timesheet/timesheet.enums';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

@Component({
  selector: 'app-timesheet-billing-details-new',
  templateUrl: './timesheet-billing-details-new.component.html',
  styleUrls: ['./timesheet-billing-details-new.component.scss']
})
export class TimesheetBillingDetailsNewComponent implements OnInit {
  row_data = [
    {slug: 'billing_data', label: null, data: null},
    {slug: 'additional_billing_data', label: 'Additional Billing Details', data: null}
  ]
  billing_data: any = undefined;
  additional_billing_data:any = undefined;
  currency: string = undefined;
  is_tax_hidden: any;
  is_adjustment_fee_allowed: any;
  totalBilling: any;
  currentTimesheetData: any;
  accuracyConfig = AccuracyConfigEnum;
  @Input() set timesheetId(data: any) {
    if (data) {
      this.getBillData(data);
    }
  }

  billingHeader: any = [
    { name: '', key: 'type', isAmount: false },
    { name: 'Hours', key: 'hours', isAmount: false },
    { name: 'Client Amount', key: 'client_amount', isAmount: true },
    { name: 'Total Client Amount', key: 'client_total_amount', isAmount: true },
    { name: 'MSP Amount', key: 'msp_amount', isAmount: true },
    { name: 'MSP Tax', key: 'msp_tax_amount', isAmount: true },
    { name: 'Total MSP Amount', key: 'msp_total_amount', isAmount: true },
    { name: 'Vendor Amount', key: 'vendor_amount', isAmount: true },
    { name: 'Vendor Tax', key: 'vendor_tax_amount', isAmount: true },
    { name: 'Vendor Adjustment', key: 'vendor_adjustment_fee_amount', isAmount: true },
    { name: 'Total Vendor Amount', key: 'vendor_total_amount', isAmount: true },
    { name: 'Total Tax', key: 'client_tax_amount', isAmount: true },
    { name: 'Total Adjustment', key: 'total_adjustment_fee_amount', isAmount: true },
  ]

  constructor(
    public StorageService: StorageService, public timesheetService: TimesheetService) {
    this.currentTimesheetData = this.StorageService.get(TimesheetConstants.TIMESHEET);
  }

  ngOnInit(): void {
    this.is_adjustment_fee_allowed = this.StorageService?.get(StorageKeys?.CURRENT_PROGRAM)?.config?.is_adjustment_fee_allowed || false;
    this.is_tax_hidden = this.StorageService?.get(StorageKeys?.CURRENT_PROGRAM)?.config?.is_tax_hidden || false;
  }

  getBillData(timesheet_UUID) {
    const program = this.StorageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${program?.id}/timesheet/${timesheet_UUID}/billable-info`;
    this.timesheetService.get(_url).subscribe(
      {
        next: (data: any) => {
          if (data) {
            if (data?.data?.hybrid_fee_funded) {
              let MSPTaxIndex = this.billingHeader?.findIndex(h => h?.name === 'MSP Tax');
              const vmsAmt = { name: 'VMS Amount', key: 'vms_amount', isAmount: true };
              const mspPartnerAmt = { name: 'MSP Partner Amount', key: 'msp_partner_amount', isAmount: true }
              this.billingHeader.splice(MSPTaxIndex + 1, 0, mspPartnerAmt);
              MSPTaxIndex++;
              this.billingHeader.splice(MSPTaxIndex + 1, 0, vmsAmt);
            }
            this.currency = data?.data?.currency;
            this.totalBilling = data?.data?.total;
            this.setBillData(data?.data?.billable_data);
            if(data?.data?.additional_data){
            this.setAdditionalBillData(data?.data?.additional_data);
            }
          }
        }, error: (err) => {
        }
      });
  }

  setBillData(data: any): void {
    if (!data) {
      this.billing_data = undefined;
      return;
    }
    this.billing_data = data;
    this.processRateBreakup(this.billing_data);
    let index = this.row_data?.findIndex(item => item?.slug === 'billing_data');
    this.row_data[index].data = data;
  }

  setAdditionalBillData(data: any): void {
    this.additional_billing_data = data;
    this.processRateBreakup(this.additional_billing_data);
    let index = this.row_data?.findIndex(item => item?.slug === 'additional_billing_data');
    this.row_data[index].data = data;
  }

  
  private processRateBreakup(data: any[]): void {
    const rateBreakupFields = ['client', 'vendor'];
    data?.forEach((d: any) => {
      rateBreakupFields.forEach((field: string) => {
        if (d[`${field}_rate_breakup`]) {
          const tooltip = this.generateTooltip(d[`${field}_rate_breakup`]);
          d[`${field}_tooltip`] = tooltip;
        }
      });
      if (d?.sub_data) {
        this.processNestedRateBreakup(d?.sub_data);
      }
    });
  }
  
  private processNestedRateBreakup(sub_data: any[]): void {
    sub_data?.forEach((c: any) => {
      const rateBreakupFields = ['client', 'vendor'];
      rateBreakupFields?.forEach((field: string) => {
        if (c[`${field}_rate_breakup`]) {
          const tooltip = this.generateTooltip(c[`${field}_rate_breakup`]);
          c[`${field}_tooltip`] = tooltip;
        }
      });
      if (c?.sub_data) {
        this.processNestedRateBreakup(c?.sub_data);
      }
    });
  }
  
  private generateTooltip(rateBreakup: any[]): string {
    return rateBreakup.map((r: any) => {
      const hoursTooltip = this.showTooltip(r?.hours, this.accuracyConfig.HOUR);
      const rateTooltip = this.showTooltip(r?.rate, this.accuracyConfig?.RATE);
      return `${hoursTooltip}${this.getTimesheetType()}*${rateTooltip}(${r?.rate_factor})`;
    }).join('+');
  }


  getTimesheetType() {
    if (this.currentTimesheetData?.meta_data?.layout?.type === TimesheetType?.DAY) {
      return 'D'
    } else {
      return 'H'
    }
  }

  totalBillableType() {
    const isDayType = this.currentTimesheetData?.meta_data?.layout?.type === TimesheetType?.DAY;
    const index = this.billingHeader?.findIndex(h => h?.key === 'hours');
    if(index){
    this.billingHeader[index].name = isDayType ? 'Days' : 'Hours';
    }
    return isDayType ? 'Days' : 'Hours';
  }

  showTooltip(data, type?) {
    return this.timesheetService?.showTooltip(data, type, this.currency);
  }

  isNumeric(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  icons: { key: string, tooltip: string }[] = [
    { key: 'vendor_amount', tooltip: 'vendor_tooltip' },
    { key: 'client_amount', tooltip: 'client_tooltip' },
    // { key: 'msp_amount', tooltip: 'candidate_tooltip' }
  ];

  shouldHideHeader(key: string): boolean {
    if ((this.is_tax_hidden && (key === 'client_tax_amount' || key === 'msp_tax_amount' || key === 'vendor_tax_amount')) || ((this.billing_data && this.billing_data?.length) ? !this.billing_data[0][key] : false || (this.additional_billing_data && this.additional_billing_data?.length) ? !this.additional_billing_data[0][key] : false)) {
      return true;
    }
    return false;
  }
  alignment(key) {
    if(key === 'client_amount') {
      return 'right'
    }
    else {
      return 'left'
    }
  }
}
