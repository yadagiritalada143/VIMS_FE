import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Events, EventStreamService, EmitEvent } from 'src/app/core/services/event-stream.service';
import { InvoiceService } from 'src/app/invoice/service/invoice.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DatePipe } from '@angular/common';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';

@Component({
  selector: 'app-create-new-payment-sidebar',
  templateUrl: './create-new-payment-sidebar.component.html',
  styleUrls: ['./create-new-payment-sidebar.component.scss']
})
export class CreateNewPaymentSidebarComponent implements OnInit, OnDestroy {
  @Output() closesidebar = new EventEmitter();
  accuracyEnum = AccuracyConfigEnum;
  logs: Log= undefined;
  paymentAuthorisation = "hidden";
  dateFormat = 'dd/MM/yyyy';
  InvoicesWithDuration:any;
  isVisible = "visible"
  selectedType: any  = 'Consolidated Invoice Number';
  order_by: string = '';
  sort_by: string = '';
  programId: string;
  duration:any=new Date();
  isChange: boolean = false;
  public selectedTab:string = 'All';
  private params = { history: false, page: 1, limit: 10, status: 'approved', search: '', complete: false, order_by:'', sort_by:'' , start_date:'', end_date: ''};
  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true,
    enabledDateRanges: [{ end: new Date()}],
  };
  onClose: boolean;
  effectiveDate: any = {
    language: 'English',
  };
  startDate: string;
  endDate: string;
  readonly durationDateFormat='yyyy-MM-dd';
  constructor(private fb: UntypedFormBuilder,
    private datePipe: DatePipe,
    private invoiceService: InvoiceService,
    private alertService: AlertService,
    private localDatePipe: LocalDateFormatPipe,
    public accuracyPipe: AccuracyPipe,
    private _storageService: StorageService, private changeDetectorRef: ChangeDetectorRef,
    private _eventStrem: EventStreamService) { 
     
    }
  invoices: any;
  saveInProgress:Boolean = false;
  isLoaded = false
  @Input() consolidatedInvoice;
  @Input() showAuthorizationSideBar;
  form;
  @Input() consolidatedInvoice$;
  isShowForm = false;
  subscriptions = []; balanceAmount;

  ngOnInit(): void {
    this.onSearch('invoice_id','')
    let programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetails) {
      this.programId = programDetails['id'];
      this.dateFormat = this.invoiceService.getDefaultDateFormat();
    }
    this.createForm();
    this.subscriptions.push(this._eventStrem.on(Events.INVOICE_OPEN_PAYMENET_AUTH_SIDE_BAR).subscribe((event) => {
      this.paymentAuthorisation = "visible";
      this.consolidatedInvoice = event.data;
      this.consolidatedInvoice.invoice_start_date = new Date(this.consolidatedInvoice.invoice_start_date);
      this.consolidatedInvoice.invoice_end_date = new Date(this.consolidatedInvoice.invoice_end_date)
      this.createForm();
    }))
  }


  setCurrentDate() {
    let date: Date = new Date();
    let datepickerInput = this.localDatePipe.transform(date, this.dateFormat, undefined, undefined, true);
    this.form.get('entered_date').setValue(datepickerInput);
  }

  onendDateChange(event){
    this.onClose = true;
    this.invoiceService.getAllconsolidatedInvoiceList({ ...this.params, search : event.term, start_date: this.startDate, end_date: this.endDate }).subscribe(res => {
      this.InvoicesWithDuration = res?.data?.invoices;
    })
  }

  onClick(){
    this.isChange = false;
    
  }
  onChange(){
    this.isChange = false;
  }
  onInvoiceDetail(evt){
    this.isLoaded = false
    this.form.controls.consolidate_invoice_uuid.setValue(evt.invoice_uuid)
    this.invoiceService.getConsolidatedInvoiceBasiDetail(evt.invoice_uuid).subscribe((res) => {
      console.log(res.data)
      this.consolidatedInvoice = res.data
      this.isLoaded = true;
      this.isChange = true
      this.balanceAmount = this.consolidatedInvoice?.calculation?.total_remaining_amount
      const created_at = this.consolidatedInvoice.created_at;
      let startDate = typeof this.consolidatedInvoice.created_at === 'number' ? new Date(new Date(created_at).getUTCFullYear()+ "-"+ (new Date(created_at).getUTCMonth() +1)+ "-" +new Date(created_at).getUTCDate()) : new Date(this.consolidatedInvoice.created_at);
      let endDate = new Date();
       this.effectiveDate = {
      enabledDateRanges: [
      { start: startDate, end: endDate },
      ]
    };
    })
  }

  onSearch(type,event) {
    if(type=='invoice_id'){
    this.invoiceService.getAllconsolidatedInvoiceList({ ...this.params, search : event.term}).subscribe(res => {
      this.invoices = res.data.invoices;
    })
  }
  }

  onDateChange(event) {
    this.isChange = false;
    if (event?.endDate && event?.startDate) {
      this.startDate = this.datePipe.transform(new Date(this.localDatePipe.transform(event?.startDate, this.durationDateFormat, "", "", true) + " 00:00:00.000Z")?.getTime(),this.durationDateFormat);
      this.endDate = this.datePipe.transform(new Date(this.localDatePipe.transform(event?.endDate, this.durationDateFormat, "", "", true) + " 00:00:00.000Z")?.getTime(),this.durationDateFormat);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  showTooltip(data) {
    return this.invoiceService?.showTooltip(data, this.consolidatedInvoice?.currency);
  }

  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message, messages: [], autoClose: true, isShown: true,showReportButton: err?.status == 500 || err?.status == 400, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
      this.changeDetectorRef.detectChanges();
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
    this.form.controls['pa_amount'].valueChanges.subscribe((newValue) => {
      this.balanceAmount = (this.consolidatedInvoice?.calculation?.total_remaining_amount - (+newValue))?.toFixed(8);
      if (this.balanceAmount <= 0) {
        this.form.controls['full_or_partial'].setValue('full')
        this.form.controls['full'].setValue(true);
        this.form.controls['partial'].setValue(false);
        this.balanceAmount = 0;
      } else {
        this.form.controls['full_or_partial'].setValue('partial')
        this.form.controls['partial'].setValue(true);
        this.form.controls['full'].setValue(false);
      }
    })
    this.setCurrentDate();
  }

  clearForm() {
    this.paymentAuthorisation = "hidden"
    this.consolidatedInvoice = null;
    this.form = null;
    this.closesidebar.emit('true');
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

  getPaAmount(): UntypedFormControl {
    return this.form.get('pa_amount') as UntypedFormControl;
  }
  
  onBlurAmount() {
    const pa_amount: number = this.getPaAmount().value;
    if (pa_amount) {
      this.getPaAmount().setValue(this.accuracyPipe.transform(pa_amount, this.accuracyEnum.AMOUNT, {isEdit : true}));
    }
  }

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
    }, (error) => {
      this.showError(error);
      this.saveInProgress = false;
    });

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
}
