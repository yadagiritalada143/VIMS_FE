import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { InvoiceService } from 'src/app/invoice/service/invoice.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-vendor-payment-rollback',
  templateUrl: './vendor-payment-rollback..component.html',
  styleUrls: ['./vendor-payment-rollback..component.scss']
})
export class VendorPaymentRollbackComponent {
  @Input('vendorRollbackOptions') vendorRollbackOptions: any;
  @Input('invoiceDetails') invoiceDetails: any;
  @Output('vendorPaymentRollback') vendorPaymentRollback = new EventEmitter();
  @Input() current_pa_uuid:any;
  logs: Log= undefined;

  loading:boolean= false;
  vendorPaymentRollbackVisible = "visible";
  reason:any= undefined;
  notes:string;
  constructor(private cdref: ChangeDetectorRef,private eventStream: EventStreamService, private invoiceService:InvoiceService) { }

  ngOnInit(): void {
  }
  onRollbackPayment(escape = true) {
    if (!escape) {
      let rollbackDetail = {
        "rollback_reason": this.reason,
        "rollback_notes": this.notes,
      }
      this.logs = undefined;
      this.invoiceService.vendorPaymentRollbackAllocation(this.current_pa_uuid, rollbackDetail).subscribe(data => {
        this.vendorPaymentRollback.emit(true)
        this.eventStream.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED, true));
        this.eventStream.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED_CP, true));
      }, (error) => {
        this.showError(error);
      })
    } else {
      this.vendorPaymentRollback.emit(null);
    }
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
