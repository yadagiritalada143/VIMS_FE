import { Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild, Renderer2, ElementRef, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { InvoiceService } from '../../../service/invoice.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

export enum SOW_TYPE {
  SOW = 'sow',
  PROJECT = 'project',
}
@Component({
  selector: 'app-consolidate-invoice-basic-details',
  templateUrl: './consolidated-invoice-basic-details.component.html',
  styleUrls: ['./consolidated-invoice-basic-details.component.scss']
})
export class ConsolidatedInvoiceBasicDetailComponent implements OnInit, OnChanges {
  showTable = false;
  accuracyEnum = AccuracyConfigEnum;
  @Input() invoiceDetails: any;
  @Input() impersonatedBy: any;
  @Output() clearIntervalStatus = new EventEmitter();
  @Output() onRetryConsolidationInvoice = new EventEmitter();
  @Output() onCancelConsolidateInvoice = new EventEmitter();
  public redirectToSow = '';
  public redirectSow = false;
  project_id: any;
  user_type: any;
  sow_id: any;
  public showModal: boolean = false;
  reasonCodes
  cancellingApprovedConsolidation: boolean = false;
  showTransactionCompleteSideBar: boolean = false;
  @ViewChild('modal') modal: TemplateRef<any>;
  isTransactionCompleteNotesMandatory: boolean;
  public showpayment: boolean = false;
  isShowCancelConsolidationButton: boolean = false;
  optPickListData: any;
  reasonCodesForTransactionComplete: any;
  logs:Log  = undefined;
  isClientPaymentEnable: boolean;
  isCreditDebitEnable: boolean;
  actionVisibility:boolean = false;
  @ViewChild('invActionButton', { read: ElementRef, static: false })
  invActionButton: ElementRef;
  @ViewChild('invActionDropdown', { read: ElementRef, static: false })
  invActionDropdown: ElementRef;
  metaTooltip: boolean = false;
  constructor(private router: Router,
    private localDateFormatPipe: LocalDateFormatPipe,
    private eventStream: EventStreamService,
    private invoiceService: InvoiceService,
    private confirmService: ConfirmationDialogService,
    private _alerts: AlertService,
    private _storageService: StorageService,
    private activatedRoute: ActivatedRoute,
    private _loader: LoaderService,
    private reasonCodesService: ReasonCodesService,
    public accuracyPipe: AccuracyPipe,
    private render: Renderer2,
    private accessControlService: AccessControlService,
    private authorizationService: AuthorizationService,
  ) { 
    this.activatedRoute.queryParamMap
    .subscribe((params) => {
      this.redirectToSow = params['params']?.redirectToSow;
      if(this.redirectToSow && this.redirectToSow === SOW_TYPE.PROJECT || this.redirectToSow === SOW_TYPE.SOW) {
        this.redirectSow = true;
       }
      this.sow_id = params['params']?.sow_id;
      this.project_id = params['params']?.project_id;
    });

    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.invActionButton && this.invActionButton.nativeElement.contains(e.target) && !this.actionVisibility) ||
        (this.invActionDropdown && this.invActionDropdown.nativeElement.contains(e.target))
      ) {
        this.actionVisibility = true;
      } else {
        this.actionVisibility = false;
      }
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
      this.invoiceService.getInvoiceConfigDetails().subscribe((res) => {
        if(res && res?.data){
          this.isTransactionCompleteNotesMandatory = res?.data?.is_transaction_complete_notes_mandatory;
          this.isShowCancelConsolidationButton = res?.data?.is_cancel_consolidation_enable;
          this.isClientPaymentEnable = res?.data?.is_client_payment_enable;
          this.isCreditDebitEnable = res?.data?.is_credit_debit_enable;
        }
      })
    if (this.invoiceDetails) {
      this._loader.show();
      this.updateChart();
    }
  }
  
  get hasAccess () {
    return  this.accessControlService.accessControl();
  }

  get showAction() {
    return (this.invoiceDetails?.data?.invoice_status === 'draft' && this.authorizationService.authorize('view_confirm_consolidation')) ||
      (this.invoiceDetails?.data?.invoice_status === 'draft' && this.authorizationService.authorize('view_cancel_consolidation')) ||
      (this.invoiceDetails?.data?.invoice_status === 'approved' && this.invoiceDetails?.data?.show_cancel_approved_consolidated_invoice_button && this.authorizationService.authorize('view_cancel_consolidation')) ||
      (this.invoiceDetails?.data?.cancel_flag && this.authorizationService.authorize('view_cancel_consolidation')) || 
      this.invoiceDetails?.data?.retry_flag || 
      (this.invoiceDetails?.data?.invoice_status === 'approved' && this.invoiceDetails?.data?.show_transaction_complete_button) ||
      (this.invoiceDetails?.data?.invoice_status === 'approved' && !this.invoiceDetails?.data?.transaction_complete && this.isCreditDebitEnable && this.authorizationService.authorize('create_credit_debit')) ||
      (this.invoiceDetails?.data?.invoice_status === 'approved' && !this.invoiceDetails?.data?.transaction_complete && this.isClientPaymentEnable && this.authorizationService.authorize('view_add_client_payment'))
  }

  getDate(d, noDateConversion) {
    if (d) {
      return this.localDateFormatPipe.transform(d, undefined, undefined, undefined, noDateConversion);
    } else {
      return d;
    }
  }

  chartData;
  consolidationDetails;
  ngOnInit(): void {
    this.user_type = this._storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.eventStream.on(Events.CANCEL_CONSOLIDATION).subscribe((data) => {
      if (data?.cancel) {
        this.invoiceDetails = this.invoiceService.getConsolidatedInvoiceBasiDetail(this.invoiceDetails?.data?.invoice_uuid);
        this.router.navigate(['/invoice/individual-list'])
      }
    });
    this.eventStream.on(Events.CANCEL_APPROVED_CONSOLIDATION).subscribe((data) => {
      if (data?.cancel) {
        this.invoiceDetails = this.invoiceService.getConsolidatedInvoiceBasiDetail(this.invoiceDetails?.data?.invoice_uuid);
        this.router.navigate(['/invoice/individual-list'])
      }
    });
    this.eventStream.on(Events.INVOICE_PAYMENT_COMPLETED).subscribe((data) => {
      this.updateChart();
    });
  }

  approvedConsolidateCancel() {
    this.reasonCodesService.getResoncodesFor('CANCEL_CONSOLIDATE_INVOICE').subscribe(res => {
      this.cancellingApprovedConsolidation = true;
      this.optPickListData = res?.reason_codes?.map(x => {
        return { ...x, label: x.name }
      })
      this.eventStream.emit(
        new EmitEvent(Events.CANCEL_CONSOLIDATION, {
          data: {}
        })
      );
    });
  }

  getDateTime(date, noDateConversion) {
    return `${this.localDateFormatPipe.transform(date, undefined, undefined, undefined,noDateConversion)} ${this.localDateFormatPipe.transform(date , 'h:mm a z', undefined, undefined, noDateConversion)}` ;
  }

  onTransactionComplete() {
    this.showTransactionCompleteSideBar = true;
    this.reasonCodesService.getResoncodesFor('TRANSACTION_COMPLETE').subscribe(res => {
      if(res){
         this.reasonCodesForTransactionComplete = res?.reason_codes?.map(x => {
            return { ...x, label: x.name }
        })
      }
    });
  }


  invoiceCancelled($event) {
    if ($event) {
      this.cancellingApprovedConsolidation = true
    }
  }

  transactionComplete($event) {
    if ($event) {
      this.showTransactionCompleteSideBar = false;
      this.invoiceDetails = this.invoiceService.getConsolidatedInvoiceBasiDetail(this.invoiceDetails?.data?.invoice_uuid).subscribe(data => {
        this.invoiceDetails = data;
        this.updateChart();
      });
    }
  }
  updateChart() {
    if (this.invoiceDetails && this.invoiceDetails.data && this.invoiceDetails.data.calculation) {
      this.chartData = [
        {
          amount: +this.invoiceDetails.data.calculation.total_paid_amount, label: 'Paid Amount: ' +
            this.accuracyPipe.transform(this.invoiceDetails?.data?.calculation?.total_paid_amount , this.accuracyEnum.AMOUNT , { currencyCode: this.invoiceDetails?.data?.currency })
        },
        {
          amount: +this.invoiceDetails.data.calculation.total_remaining_amount, label: 'Remaining Amount: ' +
            this.accuracyPipe.transform(this.invoiceDetails?.data?.calculation?.total_remaining_amount , this.accuracyEnum.AMOUNT , { currencyCode: this.invoiceDetails?.data?.currency })
        },
      ];
    this._loader.hide();
  }
  
  }

  back() {
    if(!(this.redirectToSow === SOW_TYPE.PROJECT) && !(this.redirectToSow === SOW_TYPE.SOW)) {
      this.router.navigate(['/invoice/consolidated-list']);
    }
  }

  cancellingConsolidation;
  consolidateCancel() {
    this.reasonCodesService.getResoncodesFor('CANCEL_CONSOLIDATE_INVOICE').subscribe(res => {
      this.cancellingApprovedConsolidation = true;
      this.optPickListData = res?.reason_codes?.map(x => {
        return { ...x, label: x.name }
      })
      this.eventStream.emit(
        new EmitEvent(Events.CANCEL_CONSOLIDATION, {
          data: {}
        })
      );
    });
    // this.eventStream.emit(new EmitEvent(Events.CANCEL_CONSOLIDATION, { isopen: true, invoiceId: this.invoiceDetails?.data?.invoice_uuid }));
    //let withdrawData = this.withdrawForm.value;

    // this._loader.show();
    // this.cancellingConsolidation = true;
    // this.invoiceService.cancelConfirmConsolidation('cancel', this.invoiceDetails?.data?.invoice_uuid, 'cancel', 'cancel')
    //   .subscribe(res => {
        // this._loader.hide();
        // this.cancellingConsolidation = false;
        // this.eventStream.emit(
        //   new EmitEvent(Events.CANCEL_CONSOLIDATION, { isopen: false, cancel: true })
        // );
      // }, (err) => {
      //   this.cancellingConsolidation = false;
        // this._loader.hide();
      //   this.showError('Error while Cancel Invoice consolidation.');
      // });
  }

  consolidateConfirm() {
    // this.showModal = true;
    this.confirmService.confirm('', `Do you want to confirm consolidation?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.confirm();
        }
      });
  }

  onActionSuccess(event) {
  }

  onWithdrawnCandidate(event) {

  }
  createPaymentAuthorization() {
    this.eventStream.emit(
      new EmitEvent(Events.INVOICE_OPEN_PAYMENET_AUTH_SIDE_BAR, {
        data: this.invoiceDetails?.data
      })
    );
  }

  consoilidationBeingConfirmed;
  confirm() {
    this.consoilidationBeingConfirmed = true;
    this.invoiceService.cancelConfirmConsolidation('confirm', this.invoiceDetails?.data?.invoice_uuid)
      .subscribe(res => {
        this.consoilidationBeingConfirmed = false;
        this.showModal = false;
        this.showpayment = true;
        this._alerts.success('Invoice consolidation completed.');
        this.invoiceDetails = this.invoiceService.getConsolidatedInvoiceBasiDetail(this.invoiceDetails?.data?.invoice_uuid).subscribe(data => {
          this.invoiceDetails = data;
          this.eventStream.emit( new EmitEvent(Events?.CONFIRM_CONSOLIDATION) );
          this.updateChart();
        });
      }, (err) => {
        this.consoilidationBeingConfirmed = false;
        this.showModal = false;
        this.showpayment = true;
        this.showError('Error while Invoice consolidation.');
      })
  }

  creditDebit() {
    this.eventStream.emit(
      new EmitEvent(Events.CREDIT_DEBIT_ON_CON_INVOICE, { consolidatedInvoiceId: this.invoiceDetails.data?.invoice_uuid })
    );
  }
  showTooltip(data) {
    return this.invoiceService?.showTooltip(data, this.invoiceDetails?.data?.currency);
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

  
  regenerateConsolidateInvoice() {
    this.onRetryConsolidationInvoice.emit(this.invoiceDetails?.data?.invoice_uuid);
  }

  cancelConsolidateInvoice() {
    this.onCancelConsolidateInvoice.emit(this.invoiceDetails?.data?.invoice_uuid);
  }

  showDetailTooltip() {
    const metabox = document.querySelector(".invoice-meta").getBoundingClientRect();
    const targettooltip = document.querySelector(".meta-tooltip");
    if(targettooltip) {
      targettooltip.setAttribute('style', 'left:' + metabox.left + 'px; top:' + metabox.top + 'px');
      this.metaTooltip = true;
    }
  }

  hideDetailTooltip() {
    this.metaTooltip = false;
  }
}
