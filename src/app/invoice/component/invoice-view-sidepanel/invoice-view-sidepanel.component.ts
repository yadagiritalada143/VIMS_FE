import { Component, Input, OnInit } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { InvoiceService } from '../../service/invoice.service';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
import { getDateFromString } from 'src/app/shared/util/date.util';
@Component({
  selector: 'app-invoice-view-sidepanel',
  templateUrl: './invoice-view-sidepanel.component.html',
  styleUrls: ['./invoice-view-sidepanel.component.scss']
})
export class InvoiceViewSidepanelComponent implements OnInit {
  creditDebit = 'hidden';
  subscriptions = [];
  getDateFromString = getDateFromString;
  public historyRecord: any = {};
  @Input() invoiceDetails: any;
  public paymentAllocationDetails;
  public creditDebitDetails;
  public supplierPaymentDetails;
  public workerDetails;
  accuracyEnum = AccuracyConfigEnum;
    
  constructor(
    private _eventStream: EventStreamService,
    private invoiceService: InvoiceService,
    private localDatePipe: LocalDateFormatPipe,
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this._eventStream.on(Events.INVOICE_VIEW_SIDE_PANEL).subscribe((event) => {
      this.historyRecord = event.data;
 
      if(this.historyRecord.history_type =="rollback_supplier_payment"){
        this.invoiceService.getVendorPaymentAllocationDetails(this.historyRecord.pa_vendor_uuid).subscribe(details => {
          this.paymentAllocationDetails = details.data;
          this.creditDebit = 'visible';
        });
      }
     else if (this.historyRecord.pa_uuid) {
        this.invoiceService.getPaymentAllowcationDetails(this.historyRecord.pa_uuid).subscribe(details => {
          this.paymentAllocationDetails = details.data;
          this.creditDebit = 'visible';
        });
      } else if (this.historyRecord.cd_uuid) {
        this.invoiceService.getCreditDebitDetails(this.historyRecord.cd_uuid).subscribe(details => {
          this.creditDebitDetails = details.data;
          this.creditDebit = 'visible';
        });
      } else if (this.historyRecord.pa_vendor_uuid) {
        this.invoiceService.getVendorPaymentAllocationDetails(this.historyRecord.pa_vendor_uuid).subscribe(details => {
          this.supplierPaymentDetails = details.data;
          this.creditDebit = 'visible';
        });
      } else if (this.historyRecord.candidate_uuid) {
        this.invoiceService.getWorkerDetails(this.historyRecord.candidate_uuid).subscribe(details => {
          this.workerDetails = details.data.worker;
          this.creditDebit = 'visible';

        });

      }
      else {
        this.creditDebit = 'visible';
      }
    }));
  }

  clearForm() {
    this.creditDebit = 'hidden';
  }

  getDate(d, noDateConversion) {
    if (!d) {
      return '--';
    }
    return this.localDatePipe.transform(d, undefined, undefined, undefined, noDateConversion);
  }

  getDateTime(d, noDateConversion) {
    if (!d) {
      return '--';
    }
    return `${this.localDatePipe.transform(d, undefined, undefined, undefined, noDateConversion)} ${this.localDatePipe.transform(d , 'h:mm a z', undefined, undefined, noDateConversion)}` ;
  }

}
