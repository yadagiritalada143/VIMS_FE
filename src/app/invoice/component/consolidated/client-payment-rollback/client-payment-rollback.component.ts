import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { InvoiceService } from 'src/app/invoice/service/invoice.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';


@Component({
  selector: 'app-client-payment-rollback',
  templateUrl: './client-payment-rollback..component.html',
  styleUrls: ['./client-payment-rollback..component.scss']
})
export class ClientPaymentRollbackComponent {
  accuracyEnum = AccuracyConfigEnum;
  @Input() reasonCodes;
  @Output() rollbacked = new EventEmitter();
  @Input() consolidatedInvoice;
  @Input() basicDetails;
  @Input() current_pa_uuid:any;
  logs: Log= undefined;
  reason;
  notes;
  loading;
  currentProgram: any;

  constructor(private localDatePipe: LocalDateFormatPipe,private storageService: StorageService,  private cdref: ChangeDetectorRef,private eventStream: EventStreamService, private invoiceService:InvoiceService) {
       this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
   }

  sidebarClose(escape = true) {
  
    if(!escape) {
      this.loading = true;
      let rollbackObj = {
        "rollback_reason" : this.reason,
        "rollback_notes" : this.notes
      }
      this.logs = undefined;
      this.invoiceService.rollbackPaymentAllocation(this.current_pa_uuid, rollbackObj).subscribe(data => {
      this.rollbacked.emit(true);
      this.eventStream.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED, true));
      this.eventStream.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED_CP, true));
    }, (error) => {
      this.showError(error);
    })
    }else {
      this.rollbacked.emit(null);
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
  getDate(d) {
    if (!d) {
      return '--';
    }
    return this.localDatePipe.transform(`${d}`,'dd/MM/yyyy');
  }
}
