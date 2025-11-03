import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
@Component({
  selector: 'app-vendor-payment-authorization',
  templateUrl: './vendor-payment-authorization.component.html',
  styleUrls: ['./vendor-payment-authorization.component.scss']
})
export class VendorPaymentAuthorizationComponent implements OnInit {

  @Input() invoiceList;
  @Input() paymentAllocationDetails;
  @Input() consolidatedInvoiceDetails;

  @Input() vendors;
  @Output() vendorChanged = new EventEmitter();
  @Output() selectionChanged = new EventEmitter();
  noData = {
    headTitle: 'Vendor payment',
    subTitle: 'You need to choose any  vendor to make the payment.',
    imageUrl: './assets/images/Credit card-rafiki.svg'
  };
  accuracyEnum = AccuracyConfigEnum;
  allSelected = false;
  constructor(
    private eventStream: EventStreamService,
    private router: Router
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.invoiceList) {
      this.invoiceList.forEach(inv => {
        inv.invoice_start_date = inv.invoice_start_date;
        inv.invoice_end_date = inv.invoice_end_date;
      });
    }
  }

  ngOnInit(): void {
  }

  selectAll(event) {
    if (this.invoiceList && this.invoiceList.length > 0) {
      this.invoiceList.forEach(invoice => {
        invoice.isSelected = event.target.checked;
      });
      this.selectionChanged.emit();
    }
  }

  selectInvoice(event, invoice) {
    this.invoiceList.filter(i => i.group_id === invoice.group_id)
      .forEach(i => i.isSelected = event.target.checked);
    this.allSelected = this.invoiceList.every(i => i.isSelected);
    this.selectionChanged.emit();
  }

  vendorChangedHandler(event) {
    if (event && event.id) {
      this.vendorChanged.emit(event.id);
      this.eventStream.emit(new EmitEvent(Events.CONSOLIDATED_VENDOR_SELECTED, true));
    } else {
      this.invoiceList = [];
      this.vendorChanged.emit(null);
    }
  }

  backToInvoice(){
    this.router.navigateByUrl(`invoice/consolidate-invoice-details/${this.consolidatedInvoiceDetails.invoice_uuid}/History`);

  }
}
