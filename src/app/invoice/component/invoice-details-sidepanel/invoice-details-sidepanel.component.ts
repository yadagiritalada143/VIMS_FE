import { Component, OnInit } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { InvoiceService } from '../../service/invoice.service';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { StorageService } from 'src/app/core/services/storage.service';
@Component({
  selector: 'app-invoice-details-sidepanel',
  templateUrl: './invoice-details-sidepanel.component.html',
  styleUrls: ['./invoice-details-sidepanel.component.scss']
})
export class InvoiceDetailsSidepanelComponent implements OnInit {
  isDetails = 'hidden';
  subscriptions = [];
  accuracyEnum = AccuracyConfigEnum;
  invoiceDetails: any;
  currency: string;
  public userType = this.storageService.get('user_type');
  constructor(
    private _eventStream: EventStreamService,
    private invoiceService: InvoiceService,
    private localDatePipe: LocalDateFormatPipe,
    public accuracyPipe: AccuracyPipe,
    public storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this._eventStream.on(Events.INVOICE_DETAILS_SIDE_PANEL).subscribe((event) => {
      this.invoiceDetails = [];
      this.currency = event?.data?.currency;
      this.getInvoiceDetails(event.data.invoice_uuid);
      this.isDetails = 'visible';
    }));
  }

  getInvoiceDetails(invoice_uuid) {
    this.invoiceService.getInvoiceDetailForFlyout(invoice_uuid).subscribe(
      (res: any) => {
        this.invoiceDetails = res?.data;
      }
    );
  }

  capitalizeWords(string) {
    return string?.replace(/(?:^|\s)\S/g, function (a) {
      return a?.toUpperCase();
    });
  }
  clearForm() {
    this.isDetails = 'hidden';
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