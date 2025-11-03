import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { UntypedFormGroup, UntypedFormControl, UntypedFormArray } from '@angular/forms';
import {
  IExpenseItem,
  IExpenseType,
} from '../../interfaces/expense.interfaces';
import { EditExpenseService } from './edit-expense.service';
import { FormHelperService } from '../../services/form-helper/form-helper.service';
import { AttachmentModel } from '../../models/attachment.model';
import { Subscription } from 'rxjs';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { AddExpenseService } from '../../services/add-expense.service';
import { UserPermissionService } from '../../services/user-permission.service';
import { UserType } from 'src/app/dashboard/dashboard.enums';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { Log } from 'src/app/library/logs/logs.model';
import { ExpenseService } from '../../expense.service';
import { AccuracyConfigTypes, CurrencyConfig }  from '../../enums/accuracy-config.enum';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
@Component({
  selector: 'app-edit-expense',
  templateUrl: './edit-expense.component.html',
  styleUrls: ['./edit-expense.component.scss'],
  providers: [EditExpenseService]
})
export class EditExpenseComponent implements OnInit, OnDestroy {
  @Input() expenseItemId: string;
  @Input() currency: string;
  @Input() expenseConfiguration;
  @Input() is_tax_hidden: boolean;
  @Input() hierarchyIds:any;

  @Output() closeEditModal = new EventEmitter();

  // public headerTitle = 'Edit Expense';
  public clickOutside: boolean;
  public sidebarVisibility = 'hidden';
  public isWorker = false;
  public formIsInvalid = false;
  private subscrptions: Subscription[] = [];
  logs: Log = undefined;
  showClientBillable = false;
  showVendorBillable = false;
  showFeeTaxesRoleBased = false;
  showMspBillable = false;
  dateFormat = 'dd/MM/yyyy';
  show_only_codes = false;
  public accuracyConfig = AccuracyConfigTypes;
  public currencyConfig = CurrencyConfig;
  isTaxValid:boolean = false;
  dynamicCustomFields: any;
  isCustomFieldsValid: any;
  roleId: any;
  selectedCustomData = {};
  transaction = [ { value: 'credit', label: '+' },{ value: 'debit', label: '-' }];
  constructor(
    private eventStream: EventStreamService,
    private editExpenseService: EditExpenseService,
    private formHelperService: FormHelperService,
    private storageService: StorageService,
    private addExpenseService: AddExpenseService,
    private userPermissionService: UserPermissionService,
    public customcurrency: CustomcurrencyPipe,
    private expenseService: ExpenseService,
    private confirmService: ConfirmationDialogService,
    private accuracyPipe: AccuracyPipe,
    public alert: AlertService

    ) { }

  ngOnInit(): void {
    const user = this.storageService.get('user');
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.roleId = this.storageService.get(StorageKeys.CURRENT_ACCOUNT)?.role?.id;
    this.showFeeTaxesRoleBased = !this.expenseConfiguration?.expense_config?.exp_amnt_based_on_role?.value?.includes(this.roleId);
    this.show_only_codes = programDetails?.config?.show_only_codes || false;
    if (programDetails) {
      this.dateFormat = this.expenseService.getDefaultDateFormat();
    }
    this.isWorker = user?.is_candidate;
    this.editExpenseService.getExpenseType();
    this.getVisibleAmount();
    // Event Handler to check if any event available to edit expense.
    this.subscrptions.push(this.eventStream.on(Events.EDI_EXPENSE).subscribe((data) => {
      this.clickOutside = false;
      if (data) {
        this.expenseItemId = data;
        this.editExpenseService.createForm(this.expenseItemId);
        this.sidebarVisibility = 'visible';
      } else {
        this.closeEditModal.emit();
        this.sidebarVisibility = 'hidden';
      }
    }));
    this.subscrptions.push(this.eventStream.on(Events.SHOW_ERROR_SIDEBAR_EXPENSE_LOGS).subscribe((data) => {
      this.logs = data
    }));
  }

  getVisibleAmount(){
    let data = this.addExpenseService.getVisibleAmount();
    this.showClientBillable = data.showClientBillable;
    this.showVendorBillable = data.showVendorBillable;
    this.showMspBillable = data.showMspBillable;
   }

  public get isLoadedExpenseItems(): boolean {
    return this.editExpenseService.isLoadedExpenseItems;
  }

  public get formTaxes() {
    return this.editExpenseService.formTaxes;
  }
  checkConfirmation() {
    if (this.editExpenseForm.value.amount && this.editExpenseForm.value.amount == 0) {
      this.openConfirmation();
    } else {
      this.submitUpdateExpense();
    }
  }
  openConfirmation() {
    this.confirmService.confirm('', `Expense amount is $0.00, are you sure you want to proceed ?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.submitUpdateExpense();
        }
      })
      .catch(() => {

      });
  }

  get showAmountDetails() {
    if(!this.isTaxMandatory || (this.isTaxMandatory && this.is_tax_hidden)) {
      return null;
    }
    return this.formTaxes?.value?.filter(val => val?.entity_type === 'tax')?.length;
  }
  public submitUpdateExpense(): void {
    if(this.isCustomFieldsValid){
    if (this.isBlocked) {
      this.formHelperService.showErrors(this.editExpenseForm);
      this.formIsInvalid = true;
      return;
    } else {
      this.formIsInvalid = false;
    }
    this.editExpenseForm.value.custom = this.dynamicCustomFields;
    this.editExpenseService.submitUpdateExpense();
  } else {
    this.formIsInvalid = false;
    this.alert.error('Please fill all the custom fields');
  }
  }

  onBlurFormTaxes(entity_name){
    this.formTaxes?.controls?.forEach((val) => {
      if(val.get('entity_type').value === 'fee' && val.get('entity_name').value === entity_name){
      val.get('amount_value').setValue(this.accuracyPipe?.transform(val.get('amount_value')?.value, AccuracyConfigTypes.FEE, {isEdit:true}) )
      }
    })
  }
  
  unitBaseValueChanged(event) {
    const value = event?.target?.value;
    if (isNaN(value) || !parseFloat(value)) {
      this.editExpenseForm.get('unit').setValue('');
      this.editExpenseForm.get('amount').setValue(null);
      return;
    }
    this.addExpenseService.getCalculatedValue([parseFloat(value), parseFloat(this.unitBaseConfig?.amount_per_unit || 0)], 'multiply', AccuracyConfigTypes.AMOUNT).subscribe((res) => {
      this.editExpenseForm.get('amount').setValue(this.accuracyPipe?.transform(res, AccuracyConfigTypes.AMOUNT, {isEdit:true, view_accurate: true}));
    });
  }

  public onBlurUnit() {
    this.onBlurAmount();
  }

  public get expenseType(): IExpenseType {
    return this.editExpenseService.expenseType;
  }

  public get unitBaseConfig() {
    return this.editExpenseService.unitBaseConfig;
  }

  public get calendarOptions(): object {
    return this.editExpenseService.calendarOptions;
  }

  public get isNotesMandatory(): boolean {
    return this.editExpenseService.isNotesMandatory;
  }

  public get isNegativeExpenseAllowed(): boolean {
    return this.editExpenseService.isNegativeExpenseAllowed;
  }

  public get isFeeMandatory(): boolean {
    return this.editExpenseService.isFeeMandatory;
  }
  public get isTaxMandatory(): boolean {
    return this.editExpenseService.isTaxMandatory;
  }
  public get attachmentToDelete() {
    return this.editExpenseService.attachmentsToDelete;
  }

  public get customFields() {
    return this.editExpenseService.customFields;
  }

  public get customFieldCodes$() {
    return this.editExpenseService.customFieldCodes$;
  }

  public sidebarClose(event: boolean): void {
    this.closeEditModal.emit();

    if (event) {
      this.editExpenseForm.reset();
      this.eventStream.emit(new EmitEvent(Events.EDI_EXPENSE, false));

    }
  }

  public get isBlocked(): boolean {
    return this.editExpenseService.editExpenseForm.invalid;
  }

  public get editExpenseForm(): UntypedFormGroup {
    this.selectedCustomData = this.editExpenseService?.editExpenseForm?.value?.custom;
    return this.editExpenseService.editExpenseForm;
  }

  public getExpenseNotes(): UntypedFormControl {
    return this.editExpenseService.getExpenseNotes();
  }

  public uploadAttachmentFiles(event: { file: File }[]): void {
    this.editExpenseService.uploadAttachmentFiles(event);
  }

  public setAttachmentsToDelete(event: AttachmentModel): void {
    this.editExpenseService.setAttachmentsToDelete(event);
  }

  public selectExpenseType(event: string): void {
    this.editExpenseService.selectExpenseType(event);
    this.onBlurAmount();
  }

  public get attachmentValidationError(): string {
    return this.editExpenseService.attachmentValidationError;
  }
  public get errorFromBE(): Array<object> {
    return this.editExpenseService.errorFromBE;
  }

  public get expenseItems(): Array<IExpenseItem> {
    return this.editExpenseService.expenseItems;
  }
  public get expenseAttachment(): Array<AttachmentModel> {
    return this.editExpenseService.editItem.attachment;
  }

  public get editItem(): any {
    return this.editExpenseService.editItem;
  }

  public onBlurAmount() {
    this.editExpenseService.onBlurAmount();
  }

  public filteredAttachments(attachments: Array<AttachmentModel>) {
    return this.editExpenseService.attachmentsToDelete
      ? attachments.filter(({ attachment_name }) =>
        !this.editExpenseService.attachmentsToDelete.some(item => item.attachment_name === attachment_name))
      : attachments;
  }

  public removeFile($event: string) {
    this.editExpenseService.removeFromNewAttachments($event);
  }

  public taxAmountChange() {
    this.editExpenseService.taxAmountChange();
  }

  taxAmountValueChange(event:any){
    this.isTaxValid = event?.target?.value > 100 ? true : false;
    this.isTaxValid =  this.editExpenseService.taxAmountValueChange();
  }

  public isReadonlyTax(controlIndex: number) {
    const control = (this.editExpenseForm.get('taxes') as UntypedFormArray).controls[controlIndex];
    return (
      control.get('entity_name').value === 'msp' &&
      (control.get('entity_type').value === 'tax' || control.get('entity_type').value === 'fee')
    ) && this.userPermissionService.currentUserRole() !== UserType.MSP;
  }

  public hideTaxControl(control): boolean {
    return this.addExpenseService.hideTaxControl(control, this.isTaxMandatory, this.isFeeMandatory);
  }

  setCustomFieldsFormValid(event) {
    this.isCustomFieldsValid = event;
    
  }
  customFieldUpdated(event) {
    this.dynamicCustomFields = event;    
  }

  selectedModule() {
    if(!this.expenseType?.name){
      return
    }
    return this.expenseType?.name === 'General Expense' ? 'EXPENSES': 'MISC_EXPENSES';
  }

  
  onSelectionChange(event: any) {
    if(event?.value === 'debit'){
      this.editExpenseForm.get('transaction').setValue('debit');
      this.editExpenseForm.get('allow_negative_expense').setValue(true);
    } else {
      this.editExpenseForm.get('transaction').setValue('credit');
      this.editExpenseForm.get('allow_negative_expense').setValue(false);
    }
    this.onBlurAmount()
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
}
