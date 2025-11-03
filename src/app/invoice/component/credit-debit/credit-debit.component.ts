import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { merge, Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, pluck, switchMap, tap } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { InvoiceService } from '../../service/invoice.service';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccessControlService } from 'src/app/core/services/access-control.service';
@Component({
  selector: 'app-credit-debit',
  templateUrl: './credit-debit.component.html',
  styleUrls: ['./credit-debit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditDebitComponent implements OnInit, OnDestroy {

  accuracyEnum = AccuracyConfigEnum;
  logs: Log= undefined;
  public form: UntypedFormGroup;
  public creditDebit = "hidden";
  private subscrptions: Subscription[] = [];
  public workerLst: any[];
  public workerTypeAhead$: Observable<any>;
  public $vendorList: Observable<any>;
  public distcintInvoiceTypesList$: Observable<any>;
  public submitted: false;
  public distcintTimesheetTypesList$: Observable<any>;
  public invoiceDetails: any;

  workersLoading = false;
  vendorsLoading = false;
  typesLoading = false;
  InvoicesLoading = false;
  reasonCodes;
  workerSearchManager = new Subject<{term: string}>();
  vendorSearchManager = new Subject<{term: string}>();
  invoiceTypeSearchManager = new Subject<{term: string}>();
  timesheetSearchManager = new Subject<{term: string}>();
  @Input() currency: string;


  @ViewChild('start_date_invoice') start_date_invoice: ElementRef;
  @ViewChild('end_date_invoice') end_date_invoice: ElementRef;
  public options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
  };

  conslidatedInvoice;
  public currentProgram: any;
  constructor(private fb: UntypedFormBuilder,private cdref: ChangeDetectorRef, private _alerts: AlertService, private eventStream: EventStreamService,
     private invoiceService: InvoiceService, private localDatePipe: LocalDateFormatPipe,
    private reasonCodesService: ReasonCodesService,  public accuracyPipe: AccuracyPipe,
    private cd: ChangeDetectorRef, private storageService: StorageService, private accessControlService: AccessControlService) { }

  resetFormValues(controls) {
    controls.forEach(control => this.form.get(control).reset());
  }

  get hasAccess() {
    return this.accessControlService.accessControl() 
  }

  CreateFormAndAddEvents() {
    this.createForm();
    // this.form.reset();
    this.creditDebit = "visible";
    this.cd.detectChanges();
    this.workersLoading = true;
    this.workerLst = [];
    merge(
      of({}),
      this.workerSearchManager.pipe(
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => {
          this.workersLoading = true;
          this.workerLst = [];
        })
      )
    ).pipe(switchMap((value:any) => this.workerList(value?.term)))
    .subscribe(res => {
      this.workerLst = res;
      this.workersLoading = false;
      this.cd.detectChanges();
    })
    this.form.get('worker_name').valueChanges.subscribe(value => {
      this.resetFormValues(['vendor_name', 'type', 'timesheet', 'invoice_no', 'start_date', 'end_date']);
      if (!!value) {
        this.$vendorList = merge(
          of({}),
          this.vendorSearchManager.pipe(map(search => search?.term), debounceTime(500), distinctUntilChanged())
        ).pipe(
          tap(() => this.vendorsLoading = true),
          switchMap((term:any) => this.getvendorList(value, term)));
      }
    });

    this.form.get('vendor_name').valueChanges.subscribe(value => {
      this.resetFormValues(['type', 'timesheet', 'invoice_no', 'start_date', 'end_date']);
      if (!!value) {
        this.distcintInvoiceTypesList$ = merge(
          of({}),
          this.invoiceTypeSearchManager.pipe(map(search => search?.term), debounceTime(500), distinctUntilChanged())
        ).pipe(
          tap(() => this.typesLoading = true),
          switchMap((term:any) => this.getDistinctInvoiceTypes(
          { search: term, 'vendor_uuid': value, worker_uuid: this.form.get('worker_name').value }
        )));
      }
    });

    this.form.get('type').valueChanges.subscribe(value => {
      this.resetFormValues(['timesheet', 'invoice_no', 'start_date', 'end_date']);
      if (!!value) {
        this.distcintTimesheetTypesList$ = merge(
          of({}),
          this.timesheetSearchManager.pipe(map(search => search?.term), debounceTime(500), distinctUntilChanged())
        ).pipe(
          tap(() => this.InvoicesLoading = true),
          switchMap((term:any) => this.getTimesheeteTypes(
          { search: term, 'vendor_uuid': this.form.get('vendor_name').value, worker_uuid: this.form.get('worker_name').value, invoice_type: value }
        )));
      }
    });

    this.form.get('timesheet').valueChanges.subscribe(value => {
      this.resetFormValues(['invoice_no', 'start_date', 'end_date']);
      if (!!value) {
        this.fetchInvoiceDetail(value);
      }
    });
  }

  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.CREDIT_DEBIT).subscribe((data) => {
      this.CreateFormAndAddEvents();
    }));
    this.subscrptions.push(this.eventStream.on(Events.CREDIT_DEBIT_ON_CON_INVOICE).subscribe((data) => {
      this.conslidatedInvoice = data.consolidatedInvoiceId;
      this.CreateFormAndAddEvents();
    }));
    this.subscrptions.push(this.reasonCodesService.getResoncodesFor('CONSOLIDATED_CREDIT_DEBIT').subscribe(data => {
      this.reasonCodes = data.reason_codes;
    }));
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);

  }

  workerList(search = '') {
    return this.invoiceService.getWorkerList({ search, consolidatedInvoiceId: this.conslidatedInvoice }).pipe(
      pluck('data', 'worker_list')
    )
  }

  getvendorList(worker_uuid: string, search = ''): Observable<any> {
    return this.invoiceService.getVendorList({ search, worker_uuid, "consolidatedInvoiceId": this.conslidatedInvoice }).pipe(
      tap(_ => this.vendorsLoading = false),
      pluck('data', 'vendor')
    )
  }

  getDistinctInvoiceTypes(args) {
    return this.invoiceService.getDistinctInvoiceTypes({ ...args, "consolidatedInvoiceId": this.conslidatedInvoice }).pipe(
      tap(_ => this.typesLoading = false),
      pluck('data', 'vendor')
    );
  }

  getTimesheeteTypes(args) {
    return this.invoiceService.getTimeSheetTypes({ ...args, "consolidatedInvoiceId": this.conslidatedInvoice }).pipe(
      tap(_ => this.InvoicesLoading = false),
      pluck('data', 'vendor')
    );
  }

  getDate(date, noDateConversion) {
    return this.localDatePipe.transform(date, undefined, undefined, undefined, noDateConversion);
  }
  
  fetchInvoiceDetail(invdtl) {
    this.invoiceService.getInvoiceDetails(invdtl).pipe(pluck('data')).subscribe(res => {
      this.invoiceDetails = res[0];
      let { invoice_number, invoice_end_date, invoice_start_date } = this.invoiceDetails;
      this.form.patchValue({
        msp_fee: this.accuracyPipe?.transform(this.invoiceDetails?.tax_and_fees?.fees?.all?.msp?.rate || 0, this.accuracyEnum.FEE_PERCENTAGE),
        tax: this.accuracyPipe?.transform(this.invoiceDetails?.tax_and_fees?.taxes?.total?.rate || 0, this.accuracyEnum.TAX_PERCENTAGE),
        invoice_no: invoice_number,
        start_date: this.getDate(invoice_start_date, true),
        end_date: this.getDate(invoice_end_date, true)
      })
      this.form.updateValueAndValidity();
      this.cd.detectChanges();
    })
  }

  createForm() {
    this.form = this.fb.group({
      worker_name: [null, Validators.required],
      vendor_name: [null, Validators.required],
      type: [null, Validators.required],
      timesheet: [null, Validators.required],
      credit_dbit_type: [null, Validators.required],
      cdfund: [null, Validators.required],
      invoice_no: [null, Validators.required],
      start_date: [null, Validators.required],
      end_date: [null, Validators.required],
      amount: ['', Validators.required],
      msp_fee: [''],
      tax: [''],
      notes: [''],
      cd_reason: [null, Validators.required]
    }, {
      validator: customDisableValidator
    }
    );
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message, messages: [], autoClose: true, isShown: true,showReportButton: err?.status == 500 || err?.status == 400, additionalInfo:{trace_id: err?.error?.trace_id }};
      err?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
      this.cdref.detectChanges();
  }
  
  getAmount(): UntypedFormControl {
    return this.form.get('amount') as UntypedFormControl;
  }

  onBlurAmount() {
    const amount: number = this.getAmount().value;
    if (this.getAmount().value) {
      this.getAmount().setValue(this.accuracyPipe.transform(amount, this.accuracyEnum.AMOUNT, {isEdit : true}));
    }
  }
  saveInProgress;
  saveCreditDebitDetails() {
    const data = this.form.value;
    this.saveInProgress = true;
    this.logs = undefined;
    this.invoiceService.saveCreditDebitDetails(
      { consolidate_uuid: this.conslidatedInvoice, invoice_uuid: data?.timesheet, cd_amount: +(data?.amount), cd_fund: data?.cdfund, cd_type: data?.credit_dbit_type, cd_reason: data?.cd_reason, cd_notes: data?.notes })
      .subscribe(res => {
        this.eventStream.emit(
          new EmitEvent(Events.CREDIT_DEBIT_CLOSE, null)
        );
        this.form = null;
        this.creditDebit = "hidden"
        this.cd.detectChanges();
        this.saveInProgress = false;
        this._alerts.success('Saved Successfully');
      }, (error)=> {
        this.showError(error);
        this.saveInProgress = false;
      })
  }
  cancelForm(){
    this.creditDebit = 'hidden';
    this.form = null;
  }

  get f() {
    return this.form.controls;
  }
}

const customDisableValidator: ValidatorFn = (form: UntypedFormGroup): { [key: string]: boolean } | null => {
  let worklist_crtl = form.get('worker_name').value;
  let vendorList_ctrl = form.get('vendor_name').value;
  let invoice_type_ctrl = form.get('type').value;

  const validator = !worklist_crtl ?
    { 'vendor_name_disabled': true, 'type_disabled': true, 'timesheet_disbaled': true } :
    (!vendorList_ctrl ? { 'type_disabled': true, 'timesheet_disbaled': true } :
      (!invoice_type_ctrl) ? { 'timesheet_disbaled': true } : null);
  return { ...validator }
}
