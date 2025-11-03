import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
@Component({
  selector: 'app-vendor-payment-summary',
  templateUrl: './vendor-payment-summary.component.html',
  styleUrls: ['./vendor-payment-summary.component.scss']
})
export class VendorPaymentSummaryComponent implements OnInit, OnChanges {
  
  accuracyEnum = AccuracyConfigEnum;
  chartData;
  private now = new Date().toISOString().substr(0, 10);
  vouchedDateFormat = "yyyy-mm-dd"
  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false
  };
  private _paymentDetails: any;
  public paymentInfo = {
    notes: '',
    referenceNumber: '',
    voucherDateTime: this.now
  };

  showPayment = false;
  public dateFormat = 'MM/dd/yyyy'

  @Input() voucherId;
  @Input() logs: Log = undefined;;
  programDetails: any;
  @Input() public get paymentDetails(): any {
    return this._paymentDetails;
  }
  public set paymentDetails(v: any) {
    this.updateChart();
    this._paymentDetails = v;
  }

  paymentChartData;
  // @Input() paymentDetails;
  @Input() selectedVendor;
  @Input() consolidatedInvoiceDetails;

  @Output() onSave = new EventEmitter();
  // @Input() invoiceTotal = 0;

  updateChart() {
    if (this._paymentDetails && this._paymentDetails.data && this.paymentDetails?.data?.pa_amount && this.consolidatedInvoiceDetails?.calculation?.total_amount) {

      this.chartData = [
        { amount: +this._paymentDetails.data.pa_amount, label: 'Applied Amount: ' + this.accuracyPipe.transform(this._paymentDetails.data.pa_amount, this.accuracyEnum.AMOUNT , { currencyCode: this.paymentDetails?.data?.currency })},
        {
          amount: (+this.paymentDetails?.data?.pa_amount - this.consolidatedInvoiceDetails?.calculation?.total_amount).toFixed(8), label: 'Balance Amount: '
          + this.accuracyPipe.transform((+this.paymentDetails?.data?.pa_amount - (+this.consolidatedInvoiceDetails?.calculation?.total_amount))?.toFixed(8) + '' ,this.accuracyEnum.AMOUNT , { currencyCode: this.paymentDetails?.data?.currency })
        },
      ]
    }

    if (this._invoiceTotal || this._invoiceTotal === 0) {
      const currentPayment = +this._invoiceTotal;
      if (this.paymentDetails && this.paymentDetails.data) {

        // TODO CURRENCY IS HArd coded
        this.paymentChartData = [
          { amount: currentPayment?.toFixed(8), label: 'Vendor Payment Amount : ' + this.accuracyPipe.transform(currentPayment?.toFixed(8) + '' , this.accuracyEnum.AMOUNT , { currencyCode: this.paymentDetails?.data?.currency })
        },
          { amount: (this.invGrandTotal - this._invoiceTotal).toFixed(8), label: 'Vendor Balance Payment Amount: ' + this.accuracyPipe.transform((this.invGrandTotal - this._invoiceTotal)?.toFixed(8) + '', this.accuracyEnum.AMOUNT , { currencyCode: this.paymentDetails?.data?.currency }) },
        ];
      }
    }

  }
  private _invoiceTotal: any;
  @Input() public invGrandTotal = 0;
  @Input() public get invoiceTotal(): any {
    return this._invoiceTotal;
  }
  public set invoiceTotal(v: any) {

    this._invoiceTotal = v;
  }


    constructor(
      private router: Router,
      private eventStream: EventStreamService,
      private datePipe: LocalDateFormatPipe,
      private _storageService: StorageService,
      public accuracyPipe: AccuracyPipe
    ) {
    this.programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
   }
  ngOnChanges(changes: SimpleChanges): void {
    this.updateChart();
  }
  ngOnInit(): void {


    this.eventStream.on(Events.CONSOLIDATED_VENDOR_SELECTED).subscribe(data => {
      this.showPayment = true;
    });
    this.paymentInfo.voucherDateTime = this.datePipe.transform(this.paymentInfo.voucherDateTime, this.dateFormat, undefined, undefined, true)
  }

  payNowAction() {
    let paymentInfo = {
      ...this.paymentInfo
    };
    paymentInfo.voucherDateTime = this.datePipe.transform(paymentInfo.voucherDateTime,this.vouchedDateFormat, undefined, undefined, true);
    if (this.selectedVendor && this.invoiceTotal === 0) {
      this.showError("Voucher payment amount should be greater that zero.");
    } else if (this.invoiceTotal) {
      this.onSave.emit(paymentInfo);
    } else {
      this.showError("Please select at least one invoice.");
    }
  }
  back() {
    this.router.navigateByUrl(`invoice/consolidate-invoice-details/${this.consolidatedInvoiceDetails.invoice_uuid}/Client%20Payment`);
  }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message ? err?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }
}
