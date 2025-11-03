import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Events, EventStreamService, EmitEvent } from 'src/app/core/services/event-stream.service';
import { InvoiceService } from 'src/app/invoice/service/invoice.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccessControlService } from 'src/app/core/services/access-control.service';
@Component({
  selector: 'app-payment-authorization-sidebar',
  templateUrl: './payment-authorization-sidebar.component.html',
  styleUrls: ['./payment-authorization-sidebar.component.scss']
})
export class PaymentAuthorizationSidebarComponent implements OnInit, OnDestroy {
  accuracyEnum = AccuracyConfigEnum;
  paymentAuthorisation = "hidden";
  dateFormat = 'dd/MM/yyyy';
  logs: Log= undefined;
  programId: string;
  isPaAmount: boolean;
  currentDate = new Date();
  options: any = {
    language: 'English'
  };
  constructor(private fb: UntypedFormBuilder,
    private cdref: ChangeDetectorRef,
    private invoiceService: InvoiceService,
    private alertService: AlertService,
    private localDatePipe: LocalDateFormatPipe,
    public accuracyPipe: AccuracyPipe,
    private _storageService: StorageService, 
    private _eventStrem: EventStreamService, 
    private accessControlService: AccessControlService
  ) { }

  @Input() consolidatedInvoice;
  @Input() showAuthorizationSideBar;
  form;
  @Input() consolidatedInvoice$;
  programDetails
  subscriptions = []; balanceAmount;

  ngOnInit(): void {
    this.programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (this.programDetails) {
      this.programId = this.programDetails['id'];
      this.dateFormat = this.invoiceService.getDefaultDateFormat();
    }
    this.subscriptions.push(this._eventStrem.on(Events.INVOICE_OPEN_PAYMENET_AUTH_SIDE_BAR).subscribe((event) => {
      this.paymentAuthorisation = "visible";
      this.consolidatedInvoice = event.data;
      this.consolidatedInvoice.invoice_start_date = new Date(this.consolidatedInvoice.invoice_start_date);
      this.consolidatedInvoice.invoice_end_date = new Date(this.consolidatedInvoice.invoice_end_date)
      this.createForm();
    }))
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  get hasAccess() {
    return this.accessControlService.accessControl() 
  }

  createForm() {
    this.form = this.fb.group({
      payment: [null, Validators.required],
      check_number: [null, Validators.required],
      check_type: [null, Validators.required],
      received_date: [null, Validators.required],
      entered_date: [null, Validators.required],
      pa_amount: [null, Validators.required],
      notes: [null],
      full_or_partial: [null, Validators.required],
      full: [null],
      partial: [null],
      consolidate_invoice_uuid: [this.consolidatedInvoice?.invoice_uuid, Validators.required]
    }
    );
    this.form.controls.entered_date.setValue(this.getDate(this.currentDate, false));
    this.balanceAmount = this.consolidatedInvoice?.calculation?.total_remaining_amount
    const created_at = this.consolidatedInvoice.created_at;
    let startDate = typeof this.consolidatedInvoice.created_at === 'number' ? new Date(new Date(created_at).getUTCFullYear()+ "-"+ (new Date(created_at).getUTCMonth() +1)+ "-" +new Date(created_at).getUTCDate()) : new Date(this.consolidatedInvoice.created_at);
    let endDate = new Date();
    this.options = {
      enabledDateRanges: [
        { start: startDate.setHours(0, 0, 0, 0), end: endDate.setHours(0, 0, 0, 0) },
      ]
    };
    this.form.controls['pa_amount'].valueChanges.subscribe(newValue => {
      this.balanceAmount = (this.consolidatedInvoice?.calculation?.total_remaining_amount - (+newValue))?.toFixed(8);
      if (this.balanceAmount <= 0) {
        this.balanceAmount < 0 ? this.isPaAmount = true : this.isPaAmount = false;
        this.form.controls['full_or_partial'].setValue('full')
        this.form.controls['full'].setValue(true);
        this.form.controls['partial'].setValue(false);
        this.balanceAmount = 0;
      } else {
        this.isPaAmount = false;
        this.form.controls['full_or_partial'].setValue('partial')
        this.form.controls['partial'].setValue(true);
        this.form.controls['full'].setValue(false);
      }
      // First User will enter the PA Amount, If the amount is less that the Invoice Amount, then set Partial Payment.
    })
  }

  clearForm() {
    this.paymentAuthorisation = "hidden"
    this.consolidatedInvoice = null;
    this.form = null;
  }

  getDate(d, noDateConversion) {
    if (!d) {
      return '--';
    }
    return this.localDatePipe.transform(d,this.dateFormat, undefined, undefined, noDateConversion);
  }
  // need to insert cancle button or handle this on close of side nav
  cancel() {
    // AND redirect me back to Consolidated Invoice - Client Bill (TAB)
    this.clearForm();
  }
  saveInProgress;
  saveAuthorization() {
    if (!this.form.valid) {
      return
    }
    const saveData = { ...this.form.value };
    saveData.pa_amount = +(saveData.pa_amount);
    saveData.entered_date = this.convertDateFormat(this.form?.value?.entered_date);
    saveData.received_date = this.convertDateFormat(this.form?.value?.received_date);
    delete saveData.full;
    delete saveData.partial;
    this.logs = undefined;
    this.saveInProgress = true;
    this.invoiceService.saveConsilidatedInvoiceAuthorization(saveData).subscribe(arg => {
      // success cases
      this.saveInProgress = false;
      this.alertService.success('Saved successfully');
      this.clearForm();
      this._eventStrem.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED, true));
      this._eventStrem.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED_CP, true));

      // Redirection details

      // redirect user to Client Payment Tab of Consolidated Invoice
      // Ask tania to take a query/route param , tabToOpen and select the bottom tab as per its value
    }, (error) => {
      // failure cases
      this.showError(error);
      this.saveInProgress = false;
    });

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
  convertDateFormat(dateString: string) {
    if (!dateString) {
      return;
    }
    let date, month, year, dateArray, formatArray;
    if (dateString.includes('-')) {
      dateArray = dateString.split('-');
      formatArray = this.dateFormat.split('-');

    } else if (dateString.includes('/')) {
      dateArray = dateString.split('/');
      formatArray = this.dateFormat.split('/');
    }

    if (this.dateFormat.includes('-')) {
      formatArray = this.dateFormat.split('-');

    } else if (this.dateFormat.includes('/')) {
      formatArray = this.dateFormat.split('/');
    }

    for (let index = 0; index < formatArray.length; index++) {
      const abb = formatArray[index];
      if (abb.toLowerCase().includes('mm')) {
        month = dateArray[index];
      } else if (abb.toLowerCase().includes('yy')) {
        year = dateArray[index];
      } else if (abb.toLowerCase().includes('dd')) {
        date = dateArray[index];
      }
    }
    return `${year}-${month}-${date}`
  }

  getPaAmount(): UntypedFormControl {
    return this.form.get('pa_amount') as UntypedFormControl;
  }

  showTooltip(data) {
    return this.invoiceService?.showTooltip(data, this.consolidatedInvoice?.currency);
  }

  currencyFormat(n) {
    return this.invoiceService.currencyFormat(n);
  }

  onBlurAmount() {
    const pa_amount: number = this.getPaAmount().value;
    if (pa_amount) {
      this.getPaAmount().setValue(this.accuracyPipe.transform(pa_amount, this.accuracyEnum.AMOUNT, {isEdit : true}));
    }
  }
}
