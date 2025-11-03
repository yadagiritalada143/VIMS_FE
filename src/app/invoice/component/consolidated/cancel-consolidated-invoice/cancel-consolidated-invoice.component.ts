import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { InvoiceService } from 'src/app/invoice/service/invoice.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-cancel-consolidated-invoice',
  templateUrl: './cancel-consolidated-invoice.component.html',
  styleUrls: ['./cancel-consolidated-invoice.component.scss']
})
export class CancelConsolidatedInvoiceComponent implements OnInit {
  @Input('cancelConsolidateOptions') cancelConsolidateOptions: any;
  @Input('invoiceDetails') invoiceDetails: any;
  @Output('invoiceCancelled') invoiceCancelled = new EventEmitter();
  loading:boolean= false;
  reason:any= undefined;
  notes:string;
  logs: Log= undefined;
  isCancelInvoice:string = 'hidden';
  subscriptions = [];
  constructor(
    private invoiceService: InvoiceService,
    private cdref: ChangeDetectorRef,
    private eventStream: EventStreamService,
    private accessControlService: AccessControlService
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.CANCEL_CONSOLIDATION).subscribe((event) => {
      // this.invoiceDetails = [];
      this.isCancelInvoice = 'visible';
    }));
  }

  get hasAccess() {
    return this.accessControlService.accessControl() 
  }
  cancelApprovedConsolidation() {
    this.logs = undefined;
    this.invoiceService.cancelApprovedConsolidation('cancel', this.invoiceDetails?.invoice_uuid, this.notes,this.reason)
      .subscribe(res => {
        this.eventStream.emit(
          new EmitEvent(Events.CANCEL_APPROVED_CONSOLIDATION, { isopen: false, cancel: true })
        );
      }, (err) => {
        this.showError(err);
      });
  }
  sidebarClose() {
    this.isCancelInvoice = 'hidden';
    this.invoiceCancelled.emit(true)
  }
  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message, messages: [], autoClose: true, isShown: true,showReportButton: err?.status == 500 || err?.status == 400, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
      this.cdref.detectChanges();
  }
}
