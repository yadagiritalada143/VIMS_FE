import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { ICreateExpenseData, IExpenseItem, IExpenseType } from '../../interfaces/expense.interfaces';
import { HttpService } from '../../../core/services/http.service';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ExpenseService } from '../../expense.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { mergeMap,map, takeUntil } from 'rxjs/operators';
import { ExpenseDetailService } from '../../pages/expense-detail/expense-detail.service';
import { ExpenseDetailsModel } from '../../models/expense-details.model';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { IExpenseResponse } from '../../interfaces/expense-data.interfaces';
import { EmitEvent, Events, EventStreamService } from '../../../core/services/event-stream.service';
import { AddExpenseService } from '../../services/add-expense.service';
import { ExpenseStatusMessage, NavigationPaths, ExpenseType } from '../../enums/expense.enums';
import { Router } from '@angular/router';
import { AttachmentModel } from '../../models/attachment.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import {AccuracyConfigTypes} from '../../enums/accuracy-config.enum';

@Injectable()
export class EditExpenseService {
  //private readonly currentProgram: IProgram;

  public calendarOptions: {
    enabledDateRanges: { start: Date; end: Date }[];
    timepicker: boolean;
    format12h: boolean;
    range: boolean;
    showRangeOption: boolean;
    language: string;
  } = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true,
    showRangeOption:false,
    enabledDateRanges: undefined,
  };
  expenseConfigs:any;
  unitBaseConfig: any = null;
  public attachment: { file: File }[];
  public isLoaded = false;
  public isLoadedExpenseItems = false;
  public isAttachmentMandatory = false;
  public isNegativeExpenseAllowed = false;
  public isNotesMandatory = false;
  public isFeeMandatory = false;
  public isTaxMandatory = false;
  public showTaxes = false;
  public editItem: any;
  public editExpenseForm: UntypedFormGroup;
  public expenseType: IExpenseType;
  public attachmentValidationError;
  public errorFromBE;
  public expenseItems: Array<IExpenseItem> = [];
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public detailIndex: number;
  public attachmentsToDelete: AttachmentModel[];
  public customFields = [];
  public customFieldCodes$: Observable<any>;
  logs: Log = undefined;
  isTaxValid:boolean = false;
   constructor(
    public http: HttpService,
    private storageService: StorageService,
    private expenseService: ExpenseService,
    private formBuilder: UntypedFormBuilder,
    private alertService: AlertService,
    private loader: LoaderService,
    private eventStream: EventStreamService,
    private expenseDetailService: ExpenseDetailService,
    private addExpenseService: AddExpenseService,
    private router: Router,
    private localDatePipe: LocalDateFormatPipe,
    private accuracyPipe: AccuracyPipe
  ) {
    //this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  }
  public createForm(expenseDetailId: string) {
    const index = this.expenseDetailService.expenseDetail.expenseDetail.findIndex(
      (item: ExpenseDetailsModel) => item.expense_detail_id === expenseDetailId,
    );
    this.detailIndex = index;
    this.editItem = this.expenseDetailService?.expenseDetail.expenseDetail[index];
    this.editItem.taxes = this.expenseDetailService?.expenseDetail?.taxes;
    this.formatDate()
    this.setAvailableDateRange();
    this.selectExpenseType(this.editItem.expense_type.id);
    let convertedAmount: number = Math?.abs(parseFloat(this.editItem?.calculation?.expense_amount));
    this.editItem.calculation.expense_amount = this.editItem?.transaction === 'credit' ? this.editItem?.calculation?.expense_amount : convertedAmount;
    this.editExpenseForm = this.formBuilder.group({
      custom: [this.editItem?.custom],
      expense_item_id: [this.editItem.expense_type.id, Validators.required],
      expense_date: [null, Validators.required],
      expense_type: [this.expenseType.name],
      transaction: [this.editItem?.transaction || 'credit'],
      allow_negative_expense: [this.editItem?.transaction === 'credit' ? false : true],
      amount: [this.accuracyPipe?.transform(+this.editItem?.calculation?.expense_amount,AccuracyConfigTypes.AMOUNT, {isEdit:true}), [Validators.required, control => (control.value >= 0 ? null : { valid: true })]],
      unit: [this.editItem?.unit],
      expense_item_notes: [
        this.editItem.expense_item_notes && this.editItem.expense_item_notes !== 'null' ? this.editItem.expense_item_notes : '',
      ],
      assignment_uuid: [this.expenseDetailService?.expenseDetail?.assignment?.id || null],
      hierarchy_uuid: [this.expenseDetailService?.expenseDetail?.hierarchy?.id || null],
      taxes: this.formBuilder.array([]),
      total_amount: [this.accuracyPipe?.transform(+this.editItem?.calculation?.total_amount,AccuracyConfigTypes.AMOUNT, {isEdit:true}), Validators.required],
      total_vendor_billable_amount: [this.accuracyPipe?.transform(+this.editItem?.calculation?.vendor_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}), Validators.required],
      total_msp_billable_amount: [this.accuracyPipe?.transform(+this.editItem?.calculation?.msp_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}), Validators.required]
    });

    for (const tax of (this.editItem.taxes || [])) {
      this.formTaxes.push(
        this.formBuilder.group({
          amount_type: [tax.amount_type],
          amount_value: [this.accuracyPipe?.transform(tax?.amount_value,AccuracyConfigTypes.TAX, {isEdit:true}),[Validators.required, control => (1/control.value >= 0 ? null : { valid: false })]],
          applicable_on: [tax.applicable_on],
          calculated_on:[tax.calculated_on],
          entity_name: [tax.entity_name],
          funded_by: [tax.funded_by],
          entity_type: [tax.entity_type],
          slug: [tax.slug],
          total_amount: [this.accuracyPipe?.transform(tax?.amount,AccuracyConfigTypes.AMOUNT, {isEdit:true})],
        }),
      );
    }
  }

  getCustomFieldUpdatedData(assignmentId: string, hierarchyId: string): Observable<any> {
    const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    return this.http
      .get(`/expense/programs/${currentProgram?.id}/config/${hierarchyId}/assignment/${assignmentId}/projects`)
      .pipe(map((res: any) => res.data));
  }

  public getExpenseType(): void {
    this.expenseService.expenseType$.pipe(takeUntil(this.destroy$)).subscribe(type => {
      this.expenseType = type;
      this.expenseDetailService.getDefaultConfig(this.expenseDetailService?.expenseDetail?.hierarchy?.id).subscribe(res => {
        this.getExpenseItems(type, res.config_uuid);
        this.showTaxes = res.expense_config.is_taxable
        this.expenseConfigs = res.expense_config;
        if (res.expense_config.custom_fields?.is_enabled) {
          this.addExpenseService.getCustomFieldUpdatedData(this.expenseDetailService?.expenseDetail?.assignment?.id,this.expenseDetailService?.expenseDetail?.hierarchy?.id).subscribe((res)=>{
            this.customFields = res;
          this.customFields.forEach(field => {
            if(this.editItem?.custom_fields?.length > 0){
              (this.editItem.custom_fields)?.forEach((customItem)=>{
                // if(customItem.slug == field.slug){
                  field.isMandatory = true;
                  this.editExpenseForm.addControl(field?.slug, new UntypedFormControl(customItem?.value));
                  this.editExpenseForm.get(field?.slug).setValidators([Validators.required]);
                  this.editExpenseForm.get(field?.slug).updateValueAndValidity();
                // }
                this.updateAccountCode(field);
              });
            } else {
              field.isMandatory = true;
              this.editExpenseForm.addControl(field?.slug, new UntypedFormControl(null));
              this.editExpenseForm.get(field?.slug).setValidators([Validators.required]);
              this.editExpenseForm.get(field?.slug).updateValueAndValidity();
              this.updateAccountCode(field);
            }
          });
        });
      }
    });
  });
}
  updateAccountCode(field){
    if (field?.slug == 'account_code' && !field?.data?.length) {
      this.editExpenseForm.removeControl('account_code')
      let ind = this.customFields?.findIndex((val) => val?.slug === 'account_code');
      this.customFields?.splice(ind, 1)
    }
  }
  getExpenseCalculation():any{     
    const selectedTransaction = this.editExpenseForm.get('allow_negative_expense').value;  
    let payload = this.addExpenseService.createExpensePayload(this.formTaxes, this.editExpenseForm.get('amount').value, this.isFeeMandatory, selectedTransaction ,this.isTaxMandatory,this.showTaxes, this.editExpenseForm?.get('expense_item_id')?.value);
    if(payload.amount!=null){
      this.addExpenseService.getExpenseCalculation(payload).subscribe((res)=>{
        res?.taxes?.forEach((calc) => {
          this.formTaxes?.controls?.forEach((val) => {
            if(calc?.entity_name ==  val?.value?.entity_name && val?.value?.entity_type === 'tax')  val?.get('total_amount')?.setValue(calc?.total_amount)
          })
        })
        this.editExpenseForm.get('total_amount').setValue(this.accuracyPipe?.transform(res?.total_amount_with_tax_fee,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.editExpenseForm.get('total_vendor_billable_amount').setValue(this.accuracyPipe?.transform(res?.vendor_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.editExpenseForm.get('total_msp_billable_amount').setValue(this.accuracyPipe?.transform(res?.msp_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
      });
    }
  }

 public modifyExpense(expensePayload: FormData) {
  const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    this.loader.show();
    this.expenseDetailService
      .modifyExpense(this.editItem.expense_id)
      .pipe(
        mergeMap((res: any) => {
          if (res.status === 201) {
            return this.http.get(`/expense/programs/${currentProgram?.id}/expense/${res.data.expense_uuid}`);
          }
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res:any) => {
        this.editItem = res.data.expenseDetail[this.detailIndex];
        this.formatDate()
        this.editExpense(expensePayload);
      });
  }

  public sendEditedData(expensePayload: FormData) {
    const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    return this.http.post(
      `/expense/programs/${currentProgram?.id}/expense-detail-item/${this.editItem.expense_detail_id}`,
      expensePayload,
    );
  }

  public editExpense(expensePayload: FormData) {
    this.loader.show();
    let request: Observable<IExpenseResponse<ICreateExpenseData | { message: string }>> | any;
    if (this.attachmentsToDelete) {
      request = this.deleteAttachment(this.attachmentsToDelete).pipe(mergeMap(() => this.sendEditedData(expensePayload)));
    } else {
      request = this.sendEditedData(expensePayload);
    }
    this.logs = undefined;
    request.pipe(takeUntil(this.destroy$)).subscribe(
      result => {
        this.loader.hide();
        this.eventStream.emit(new EmitEvent(Events.EDI_EXPENSE, false));
        this.expenseDetailService.getExpenseDetailsById(this.editItem.expense_id, false);
        this.alertService.success(result.data.message);
        this.router.navigateByUrl(NavigationPaths.user.generalListItemDetails(this.editItem.expense_id));
      },
      error => {
        this.loader.hide();
        this.errorFromBE = error.error.error.errors;
        this.showError(error,true);
        return throwError(error);
      },
    );
  }

  formatDate(){
    const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    this.editItem.item_start_date_updated= this.editItem.item_start_date ? this.localDatePipe.transform(this.editItem.item_start_date,currentProgram['defaultDateFormat'],'','',true) : null;
    // this.editItem.item_start_date_updated= this.editItem.item_start_date ? this.localDatePipe.transform(this.editItem.item_start_date,'','','',true) : null;
    if(this.editItem.item_end_date){
      this.editItem.item_end_date_updated= this.localDatePipe.transform(this.editItem.item_end_date,currentProgram['defaultDateFormat'],'','',true ) 
      // this.editItem.item_end_date_updated= this.localDatePipe.transform(this.editItem.item_end_date,'','','',true ) 
    }else{
      this.editItem.item_end_date_updated= this.localDatePipe.transform(this.editItem.item_start_date,currentProgram['defaultDateFormat'],'','',true ) 
      // this.editItem.item_end_date_updated= this.localDatePipe.transform(this.editItem.item_start_date,'','','',true ) 
    }
  }

  setAvailableDateRange(){
    const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    this.expenseService
    .getAssignmentDetails(currentProgram?.id, this.expenseDetailService?.expenseDetail?.assignment?.id)
    .subscribe((data:any) => {
      var configuredStartDate: Date;
      var configuredEndDate: Date;
      const currentDate = new Date().toISOString().slice(0, 10);
      configuredEndDate = getDateFromString(data.assignment.end_date);
      if (
        this.expenseType?.value === ExpenseType.Expense &&
        this.expenseConfigs?.grace_period_submission?.value !== 0
      ) {
        const calculatedDate = this.changeDateByConfigValue(
          currentDate,
          -this.expenseConfigs.grace_period_submission.value,
          this.expenseConfigs.grace_period_submission.type,
        );
        const assignment_start_date = getDateFromString(data.assignment.start_date);
        configuredStartDate = calculatedDate;
        configuredStartDate =
        calculatedDate < assignment_start_date ? assignment_start_date : calculatedDate;
        const current_date = getDateFromString(currentDate);
        const assignment_end_date = getDateFromString(data.assignment.end_date);
        configuredEndDate = 
        current_date > assignment_end_date ? assignment_end_date : current_date
      } else {
        configuredStartDate = getDateFromString(data.assignment.start_date);
      }
      this.calendarOptions = {
        ...this.calendarOptions,
        enabledDateRanges: [{ start: configuredStartDate, end: configuredEndDate }],
      };
      });
  }

  public changeDateByConfigValue(initialDate: string, value: number, type: string) {
    const date = getDateFromString(initialDate);
    if (type.toLowerCase() === 'month') {
      date.setMonth(date.getMonth() + Number(value));
    } else {
      value = type.toLowerCase() === 'weeks' ? value * 7 : value;
      date.setDate(date.getDate() + Number(value));
    }
    return date;
  }

  public deleteAttachment(attachmentNames: AttachmentModel[]) {
    const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    const attachmentParams = {};
    attachmentNames
      .map(({ attachment_name }) => attachment_name)
      .forEach((name, i) => {
        attachmentParams[`attachment_name[${i}]`] = name;
      });
    let params = {
      ...attachmentParams,
      expense_detail_uuid: this.editItem.expense_detail_id,
    };
    return this.http.delete(`/expense/programs/${currentProgram?.id}/expense-attachment/${this.editItem.expense_id}`, params);
  }

  async encodeAttachmentsToBase64(attachments) {
    let attachmentList = [];
      attachments.forEach((val) => {
        this.expenseService.encodeToBase64(val.file)
       .then((data)=>{
         attachmentList.push({
           file_name: val?.file?.name,
           data: data
         })
       });
      }
      )
      return attachmentList;
}

  public async submitUpdateExpense(): Promise<void> {
    let attachmentList = [];
    if(this.attachment?.length) {
    attachmentList = await this.encodeAttachmentsToBase64(this.attachment)
    }
    const currentAttachments = this.attachmentsToDelete
      ? this.editItem.attachment.filter(
          ({ attachment_name }) => !this.attachmentsToDelete.some(item => item.attachment_name === attachment_name),
        )
      : this.editItem.attachment;
    if (
      this.isAttachmentMandatory &&
      (!attachmentList || !attachmentList?.length) &&
      (!currentAttachments || !currentAttachments?.length)
    ) {
      this.attachmentValidationError = 'Attachment is required';
    } else if (this.editExpenseForm.valid) {
      const assignment = {
        assignment_uuid: this.expenseDetailService?.expenseDetail?.assignment?.id,
        hierarchy: { id: this.expenseDetailService?.expenseDetail?.hierarchy.id },
        end_date: this.editExpenseForm.get('expense_date').value.split('-')[0],
      };
      const selectedTransaction = this.editExpenseForm.get('allow_negative_expense').value;
      let payload = this.addExpenseService.createExpensePayload(this.formTaxes, this.editExpenseForm.get('amount').value, this.isFeeMandatory, selectedTransaction, this.isTaxMandatory,this.showTaxes, this.editExpenseForm?.get('expense_item_id')?.value);
      if(payload.amount!=null){
        this.addExpenseService.getExpenseCalculation(payload).subscribe((res)=>{
          const taxes = this.formTaxes.value
        .map(tax => {
          if (tax && tax.entity_type === 'tax' && (this.isTaxMandatory || this.showTaxes)) {
            let updatedTax;
            var taxValue = res.taxes?.find(
              restax =>
                restax &&
                restax.entity_type === 'tax' && (restax.entity_name === tax.entity_name ),
            )?.total_amount || 0;
            updatedTax = { ...tax, total_amount: this.accuracyPipe?.transform(taxValue,AccuracyConfigTypes.AMOUNT, {isEdit:true}) };
            return updatedTax;
          } else {
            if (tax && tax.entity_type === 'fee' && (this.isFeeMandatory || this.showTaxes)) {
              let updatedFee;
              var feeValue = res.taxes?.find(
                restax =>
                  restax && restax.entity_type === 'fee' &&  (restax.entity_name === tax.entity_name),
              )?.total_amount || 0;
              updatedFee = { ...tax, total_amount: this.accuracyPipe?.transform(feeValue,AccuracyConfigTypes.AMOUNT, {isEdit:true}) };
              return updatedFee;
            }
          }
        })
        .filter(tax => tax?.entity_type && tax?.amount_value);
      const formData = this.addExpenseService.generateFormData(
        this.editExpenseForm,
        attachmentList,
        (this.isTaxMandatory || this.isFeeMandatory || this.showTaxes) ? taxes : [],
        assignment,
        this.expenseType.value,
        this.customFields,
        this.editExpenseForm?.value?.custom
      );
      const expenseStatus = this.expenseDetailService.expenseDetail.expense_status.toLocaleLowerCase();
      if (expenseStatus === ExpenseStatusMessage.withdrawn || expenseStatus === ExpenseStatusMessage.rejected) {
        this.modifyExpense(formData);
      } else {
        this.editExpense(formData);
      }
    });
  }
    } else {
      this.attachmentValidationError = 'Form is not valid';
    }
  }

  public uploadAttachmentFiles(event: { file: File }[]): void {
    this.attachment = event;
    if (this.attachment && this.attachmentValidationError === 'Attachment is required') {
      this.attachmentValidationError = null;
    }
  }

  public setAttachmentsToDelete(event: AttachmentModel): void {
    if (!this.attachmentsToDelete) {
      this.attachmentsToDelete = [event];
    } else if (!this.attachmentsToDelete.some(({ attachment_name }) => attachment_name === event.attachment_name)) {
      this.attachmentsToDelete.push(event);
    }
  }

  public removeFromNewAttachments(event: string) {
    if (this.attachment) {
      this.attachment = this.attachment.filter(({ file }) => file.name !== event);
    }
  }

  public getExpenseNotes(): UntypedFormControl {
    return this.editExpenseForm.get('expense_item_notes') as UntypedFormControl;
  }

  public get formTaxes() {
    return this.editExpenseForm.get('taxes') as UntypedFormArray;
  }

  public selectExpenseType(event: string): void {
    this.addExpenseService.getDetailOfExpenseItem(event).subscribe(data => {
       // Changed due to V2M-29082
      if (data?.allow_negative_expense == '1') {
        this.isNegativeExpenseAllowed = true;
      } else {
        this.isNegativeExpenseAllowed = false;
      }
      // End
      if (data.notes_mandatory == '1') {
        this.getExpenseNotes().setValidators([Validators.required]);
        this.isNotesMandatory = true;
      } else {
        this.getExpenseNotes().setValidators(null);
        this.isNotesMandatory = false;
      }
      if (this.editItem?.taxes?.length) {
        if (data.is_taxable == '1') {
          this.formTaxes.setValidators([Validators.required]);
          this.isTaxMandatory = true;
        } else {
          this.isTaxMandatory = false;
        }
        if (data.msp_applicable == '1') {
          this.formTaxes.setValidators([Validators.required]);
          this.isFeeMandatory = true;
        } else {
          this.isFeeMandatory = false;
        }
      }
      if (data.is_taxable != '1' && data.msp_applicable != '1') {
        this.formTaxes.setValidators(null);
      }
      if (data.unit_base_config?.unit_base) {
        this.unitBaseConfig = { ...data.unit_base_config };
        this.editExpenseForm.get('unit').addValidators(Validators.required);
        if (parseFloat(this.editExpenseForm.get('unit').value) <= 0) {
          this.editExpenseForm.get('amount').setValue('0.00');
        }
      } else {
        this.unitBaseConfig = null;
        this.editExpenseForm.get('unit').removeValidators(Validators.required);
      }
      this.formTaxes.updateValueAndValidity();
      this.getExpenseNotes().updateValueAndValidity();
      this.isAttachmentMandatory = data.attachment_mandatory == '1';
      this.getExpenseCalculation();
    });
  }

  public getExpenseItems(type: IExpenseType, configId: string): void {
    this.logs = undefined;
    this.addExpenseService
      .getExpenseItems(type, configId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        items => {
          this.expenseItems = items.map(({ expense_name, expense_item_id, expense_icon, unit_base_config }) => ({
            name: expense_name,
            id: expense_item_id,
            icon: expense_icon,
            unit_base_config
          }));
          this.isLoadedExpenseItems = true;
        },
        err => {
          this.showError(err);
        },
      );
  }

  taxAmountValueChange(){
    var mspFeeArr = [];
    var mspTaxArr = [];
    var mspTaxIndex;
    var mspFeeIndex;
    (this.formTaxes.value).forEach((element,index) => {
      if((element?.entity_name == 'msp_partner' || element?.entity_name == 'vms') && element?.entity_type == 'tax' ){
        mspTaxArr.push(parseFloat(element?.amount_value));
      }      
      if((element?.entity_name == 'msp_partner' || element?.entity_name == 'vms') && element?.entity_type == 'fee' ){
        mspFeeArr.push(parseFloat(element?.amount_value)); 
      }      
      if(element?.entity_name == 'msp' && element?.entity_type == 'tax' ){
        mspTaxIndex = index;
      }
      if(element?.entity_name == 'msp' && element?.entity_type == 'fee' ){
        mspFeeIndex = index;
      }
    });
    if(typeof mspTaxIndex !== "undefined"){
      this.addExpenseService.getCalculatedValue(mspTaxArr, 'add', AccuracyConfigTypes.TAX).subscribe((res) => {
        this.formTaxes.at(mspTaxIndex).patchValue({amount_value: this.accuracyPipe?.transform(res, AccuracyConfigTypes.TAX, {isEdit:true})})
        this.isTaxValid = this.accuracyPipe?.transform(res, AccuracyConfigTypes.TAX, {isEdit:true}) > 100;
      });
    }
    if(typeof mspFeeIndex !== "undefined"){
      this.addExpenseService.getCalculatedValue(mspFeeArr, 'add', AccuracyConfigTypes.FEE).subscribe((res) => {
        this.formTaxes.at(mspFeeIndex).patchValue({amount_value: this.accuracyPipe?.transform(res, AccuracyConfigTypes.FEE, {isEdit:true})});
        this.isTaxValid = this.accuracyPipe?.transform(res, AccuracyConfigTypes.FEE, {isEdit:true}) > 100;
      });
    }
    (this.formTaxes.value).forEach((element) => {
      if(parseFloat(element?.amount_value) > 100){
        this.isTaxValid = true;
      }
    });
    return this.isTaxValid;
  }

  taxAmountChange() {
    var mspFeeArr = [];
    var mspTaxArr = [];
    var mspTaxIndex;
    var mspFeeIndex;
    (this.formTaxes.value).forEach((element,index) => {
      if((element?.entity_name == 'msp_partner' || element?.entity_name == 'vms') && element?.entity_type == 'tax' ){
        mspTaxArr.push(parseFloat(element?.amount_value));
      }      
      if((element?.entity_name == 'msp_partner' || element?.entity_name == 'vms') && element?.entity_type == 'fee' ){
        mspFeeArr.push(parseFloat(element?.amount_value)); 
      }      
      if(element?.entity_name == 'msp' && element?.entity_type == 'tax' ){
        mspTaxIndex = index;
      }
      if(element?.entity_name == 'msp' && element?.entity_type == 'fee' ){
        mspFeeIndex = index;
      }
    });
    if(typeof mspTaxIndex !== "undefined"){
      this.addExpenseService.getCalculatedValue(mspTaxArr, 'add', AccuracyConfigTypes.TAX).subscribe((res) => {
        this.formTaxes.at(mspTaxIndex).patchValue({amount_value: this.accuracyPipe?.transform(res, AccuracyConfigTypes.TAX, {isEdit:true})})
      });
    }
    if(typeof mspFeeIndex !== "undefined"){
      this.addExpenseService.getCalculatedValue(mspFeeArr, 'add', AccuracyConfigTypes.FEE).subscribe((res) => {
        this.formTaxes.at(mspFeeIndex).patchValue({amount_value: this.accuracyPipe?.transform(res, AccuracyConfigTypes.FEE, {isEdit:true})});
      });
    }
    // this.isTaxValid = (this.currencyFormat(mspTax) > 100 || this.currencyFormat(mspFee) > 100) ? true :  false; 
    // (this.formTaxes.value).forEach((element) => {
    //   if(parseFloat(element?.amount_value) > 100){
    //     this.isTaxValid = true;
    //   }
    // });
    const selectedTransaction = this.editExpenseForm.get('allow_negative_expense').value;
    let payload = this.addExpenseService.createExpensePayload(this.formTaxes, this.editExpenseForm.get('amount').value, this.isFeeMandatory,selectedTransaction, this.isTaxMandatory, this.showTaxes, this.editExpenseForm?.get('expense_item_id')?.value);
    if(payload.amount && payload.amount!=null){
      this.addExpenseService.getExpenseCalculation(payload).subscribe((res)=>{
        res?.taxes?.forEach((calc) => {
          this.formTaxes?.controls?.forEach((val) => {
            if(calc?.entity_name ==  val?.value?.entity_name && val?.value?.entity_type === 'tax')  val?.get('total_amount')?.setValue(calc?.total_amount)
          })
        })
        this.editExpenseForm.get('total_amount').setValue(this.accuracyPipe?.transform(res?.total_amount_with_tax_fee,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.editExpenseForm.get('total_vendor_billable_amount').setValue(this.accuracyPipe?.transform(res?.vendor_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.editExpenseForm.get('total_msp_billable_amount').setValue(this.accuracyPipe?.transform(res?.msp_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
      });
    }    
  }

  public onBlurAmount() {
    const amount: number = Number(this.editExpenseForm.get('amount').value);
    if (amount) {
      this.editExpenseForm.get('amount').setValue(this.accuracyPipe?.transform(amount,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
    }
    const selectedTransaction = this.editExpenseForm.get('allow_negative_expense').value;
    let payload = this.addExpenseService.createExpensePayload(this.formTaxes, this.editExpenseForm.get('amount').value, this.isFeeMandatory, selectedTransaction, this.isTaxMandatory,this.showTaxes, this.editExpenseForm?.get('expense_item_id')?.value);
    if(payload.amount && payload.amount!=null){
      this.addExpenseService.getExpenseCalculation(payload).subscribe((res)=>{
        res?.taxes?.forEach((calc) => {
          this.formTaxes?.controls?.forEach((val) => {
            if(calc?.entity_name ==  val?.value?.entity_name && val?.value?.entity_type === 'tax')  val?.get('total_amount')?.setValue(calc?.total_amount)
          })
        })
        this.editExpenseForm.get('total_amount').setValue(this.accuracyPipe?.transform(res?.total_amount_with_tax_fee,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.editExpenseForm.get('total_vendor_billable_amount').setValue(this.accuracyPipe?.transform(res?.vendor_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.editExpenseForm.get('total_msp_billable_amount').setValue(this.accuracyPipe?.transform(res?.msp_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
      });
    }
  }

  public roundTo(n) {
    return this.addExpenseService.roundTo(n);
  }
   
  public currencyFormat(n) {
    return this.addExpenseService.currencyFormat(n);
  }

  public trancateTwoDecimal(n) {
    return this.addExpenseService.trancateTwoDecimal(n);
  }
  
  public unsubscribe() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.attachmentsToDelete = null;
  }
  showError(err,isEdit?) {
    window.scrollTo(0, 0);
    let logs:Log = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        logs.messages.push(msg?.message);
      }
    });
    if(isEdit){
      this.eventStream.emit(new EmitEvent(Events.SHOW_ERROR_SIDEBAR_EXPENSE_LOGS, logs));
    } else{
      this.eventStream.emit(new EmitEvent(Events.SHOW_ERROR_STATUS_EXPENSE_LOGS, logs));
    }
  }

}
