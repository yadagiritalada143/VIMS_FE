import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { InvoiceService } from 'src/app/invoice/service/invoice.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-transaction-complete',
  templateUrl: './transaction-complete.component.html',
  styleUrls: ['./transaction-complete.component.scss']
})
export class InvoiceTransactionCompleteComponent {
  @Input('transactionCompleteOptions') transactionCompleteOptions: any;
  @Input('invoiceDetails') invoiceDetails: any;
  @Input('isTransactionCompleteNotesMandatory') isTransactionCompleteNotesMandatory: any;
  @Output('transactionCompleted') transactionCompleted = new EventEmitter();
  loading:boolean= false;
  reason:any= undefined;
  TransactionCompleteVisible = "visible";
  notes:string;
  logs:Log = undefined;

  constructor(
    private invoiceService: InvoiceService,
    private accessControlService: AccessControlService
  ) { }

  ngOnInit(): void {
  }

  get hasAccess() {
    return this.accessControlService.accessControl() 
  }
  
  transactionCompleteConsolidation() {
    let payLoad = {
      "invoice_uuid": this.invoiceDetails.invoice_uuid,
      "transaction_complete": 'true',
      "reason": this.reason,
      "notes": this.notes,
    }
    this.invoiceService.invoiceTransactionComplete(this.invoiceDetails?.invoice_uuid, payLoad)
      .subscribe(res => {
     this.transactionCompleted.emit(true)
      }, (err) => {
        this.showError(err);
      });
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
