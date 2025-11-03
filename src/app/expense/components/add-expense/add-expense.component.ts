import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl, UntypedFormArray } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ExpenseStatusMessage, ExpenseType, NavigationPaths, UserType } from '../../enums/expense.enums';
import { Router } from '@angular/router';
import { AssignmentDataModel } from '../../models/assignment.model';
import { ExpenseDetailService } from '../../pages/expense-detail/expense-detail.service';
import { AddExpenseService } from '../../services/add-expense.service';
import { TaxModel } from '../../models/tax.model';
import { Observable, Subscription } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { StatusMessageTypes } from 'src/app/shared/enums';
import { HttpErrorResponse } from '@angular/common/http';
import { IExpenseConfigData } from '../../interfaces/expense-configuration.interface';
import { UserPermissionService } from '../../services/user-permission.service';
import { ExpenseService } from '../../expense.service';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AccountCodeService } from 'src/app/account-code-setup/services/account-code-setup.service';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { AccuracyConfigTypes, CurrencyConfig }  from '../../enums/accuracy-config.enum';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.component.html',
  styleUrls: ['./add-expense.component.scss'],
})
export class AddExpenseComponent implements OnInit, OnDestroy {
  @Input() assignment: AssignmentDataModel;
  @Input() existingExpense: string;
  @Input() hierarchyId: string;
  @Input() is_tax_hidden: boolean;

  @Output() closeCreateModal = new EventEmitter();
  selectedCustomData = {};
  isCustomFieldsValid: any;
  unitBaseConfig: any = null;
  public headerTitle = 'Add New Expense';
  public clickOutside: boolean;
  public sidebarVisibility = 'hidden';
  public addExpenseForm: UntypedFormGroup;
  public isAttachmentMandatory = false;
  public isNotesMandatory = false;
  public isFeeMandatory = false;
  public isTaxMandatory = false;
  public isNegativeExpenseAllowed = false;
  public selectedValue = null;
  public validationError = '';
  public assignmentDetails: any;
  public validationErrorArray;
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
  public isLoading = false;
  public clearedCalendar = false;
  public customFieldsEnabled = false;
  public customFields = [];
  public customFieldCodes$: Observable<any>;
  public showTaxes = false;
  public expenseConfigInactive = false;
  public expenseModuleDisabled = false;
  public currency = 'USD';
  public expenseInactiveMessage = '';
  public isWorker = false;
  public workerId: any;
  public readonly StatusMessageTypes = StatusMessageTypes;
  private attachments: { file: File }[];
  private taxes: TaxModel[];
  private subscrptions: Subscription[] = [];
  selectedExpenseItemsId: string;
  logs: Log = undefined;
  showClientBillable = false;
  showVendorBillable = false;
  showMspBillable = false;
  show_only_codes = false;
  showFeeTaxesRoleBased = false;
  dateFormat = 'dd/MM/yyyy';
  isTaxValid:boolean = false;
  public accuracyConfig = AccuracyConfigTypes;
  public currencyConfig = CurrencyConfig;
  roleId: any;
  defaultOption = '-';
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private alertService: AlertService,
    private router: Router,
    private expenseDetailService: ExpenseDetailService,
    private addExpenseService: AddExpenseService,
    private expenseService: ExpenseService,
    private loader: LoaderService,
    private changeDetectorRef: ChangeDetectorRef,
    private storageService: StorageService,
    private userPermissionService: UserPermissionService,
    public customcurrency: CustomcurrencyPipe,
    private accountCodeService: AccountCodeService,
    private confirmService: ConfirmationDialogService,
    private accuracyPipe: AccuracyPipe,
    ) {}

  ngOnInit(): void {
    const user = this.storageService.get('user');
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetails) {
      this.dateFormat = this.expenseService.getDefaultDateFormat();
    }
    this.isWorker = user?.is_candidate;
    this.roleId = this.storageService.get(StorageKeys.CURRENT_ACCOUNT)?.role?.id;
    this.getVisibleAmount();
    this.addExpenseFormBuilder();
    this.setAvailableDateRange();
    if (this.assignment?.assignment_uuid) {
      this.getAssignmentDetails();
    }
     // Event Handler to check if any event available to add new expense.
    this.subscrptions.push(
      this.eventStream.on(Events.ADD_EXPENSE).subscribe((data: boolean) => {
        this.sidebarVisibility = data ? 'visible' : 'hidden';
        this.clickOutside = false;
      }),
    );
  }

  transaction = [ { value: 'credit', label: '+' },{ value: 'debit', label: '-' }];

 
  onSelectionChange(event: any) {
    if(event?.value === 'debit'){
      this.addExpenseForm.get('transaction').setValue('debit');
      this.addExpenseForm.get('allow_negative_expense').setValue(true);
    } else {
      this.addExpenseForm.get('transaction').setValue('credit');
      this.addExpenseForm.get('allow_negative_expense').setValue(false);
    }
    this.onBlurAmount();
  }
  getVisibleAmount(){
    let data = this.addExpenseService.getVisibleAmount();
    this.showClientBillable = data.showClientBillable;
    this.showVendorBillable = data.showVendorBillable;
    this.showMspBillable = data.showMspBillable;
   }

  public getExpenseNotes(): UntypedFormControl {
    return this.addExpenseForm.get('expense_item_notes') as UntypedFormControl;
  }

  public getAmount(): UntypedFormControl {
    return this.addExpenseForm.get('amount') as UntypedFormControl;
  }

  public getTotalAmount(): UntypedFormControl {
    return this.addExpenseForm.get('total_amount') as UntypedFormControl;
  }
  
  public getVendorTotalAmount(): UntypedFormControl {
    return this.addExpenseForm.get('total_vendor_billable_amount') as UntypedFormControl;
  }
  public getMspTotalAmount(): UntypedFormControl {
    return this.addExpenseForm.get('total_msp_billable_amount') as UntypedFormControl;
  }

  public get expenseItems() {
    return this.addExpenseService.expenseItemsData;
  }

  public get expenseType() {
    return this.addExpenseService.expenseType;
  }

  public get formTaxes() {
    return this.addExpenseForm.get('taxes') as UntypedFormArray;
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

  public sidebarClose(event: boolean): void {
    this.closeCreateModal.emit();

    if (event) {
      this.addExpenseForm.reset();
      this.eventStream.emit(new EmitEvent(Events.ADD_EXPENSE, false));
      if (this.existingExpense) {
        this.router.navigateByUrl(NavigationPaths.user.generalListItemDetails(this.existingExpense));
      }
    }
  }

  public selectExpenseType(event?: string): void {
    if (!event) {
      this.isNotesMandatory = false;
      this.isTaxMandatory = false;
      this.isFeeMandatory = false;
      this.isNegativeExpenseAllowed = false;
      return;
    }
    this.selectedExpenseItemsId = event;
    this.subscrptions.push(
      this.addExpenseService.getDetailOfExpenseItem(event).subscribe(itemDetails => {
        if (itemDetails.notes_mandatory == '1') {
          this.getExpenseNotes().setValidators([Validators.required]);
          this.isNotesMandatory = true;
        } else {
          this.getExpenseNotes().setValidators(null);
          this.isNotesMandatory = false;
        }
        if (this.taxes && this.taxes?.length) {
          if (itemDetails.is_taxable == '1') {
              this.formTaxes.setValidators([Validators.required]);
            this.isTaxMandatory = true;
          } else {
            this.isTaxMandatory = false;
          }
          if (itemDetails.msp_applicable == '1') {
            this.formTaxes.setValidators([Validators.required]);
            this.isFeeMandatory = true;
          } else {
            this.isFeeMandatory = false;
          }
         
           // Changed due to V2M-29082
          if (itemDetails.allow_negative_expense == '1') {
            this.isNegativeExpenseAllowed = true;
            this.addExpenseForm.get('transaction').setValue('debit');
            this.addExpenseForm.get('allow_negative_expense').setValue(true);
          } else {
            this.isNegativeExpenseAllowed = false;
            this.addExpenseForm.get('transaction').setValue('credit');
            this.addExpenseForm.get('allow_negative_expense').setValue(false);
          }
          // End
        }
        if (itemDetails.is_taxable != '1' && itemDetails.msp_applicable != '1' && this.is_tax_hidden) {
          this.formTaxes.setValidators(null);
        }
        this.formTaxes.updateValueAndValidity();
        this.getExpenseNotes().updateValueAndValidity();
        this.isAttachmentMandatory = itemDetails.attachment_mandatory == '1';
        if (itemDetails.unit_base_config?.unit_base) {
          this.unitBaseConfig = { ...itemDetails.unit_base_config };
          this.addExpenseForm.get('unit').addValidators(Validators.required);
          this.addExpenseService.getCalculatedValue([parseFloat(this.addExpenseForm?.value?.unit), parseFloat(this.unitBaseConfig?.amount_per_unit || 0)], 'multiply', AccuracyConfigTypes.AMOUNT).subscribe((res) => {
            this.addExpenseForm.get('amount').setValue(this.accuracyPipe?.transform(res, AccuracyConfigTypes.AMOUNT, {isEdit:true, view_accurate: true}));
            this.onBlurAmount();
          });
        } else {
          this.unitBaseConfig = null;
          this.addExpenseForm.get('unit').removeValidators(Validators.required);
          this.addExpenseForm.get('unit').setValue(0);
          this.addExpenseForm.get('amount').setValue(null);
          this.addExpenseForm.get('total_amount').setValue(0);
          this.formTaxes?.controls?.forEach((val) => {
             val?.get('total_amount')?.setValue(0)
          })
          this.onBlurAmount();
        }
      }),
    );
  }

  unitBaseValueChanged(event) {
    const value = event?.target?.value;
    if (isNaN(value) || !parseFloat(value)) {
      this.addExpenseForm.get('unit').setValue('');
      this.addExpenseForm.get('amount').setValue(null);
      return;
    }
    this.addExpenseService.getCalculatedValue([parseFloat(value), parseFloat(this.unitBaseConfig?.amount_per_unit || 0)], 'multiply', AccuracyConfigTypes.AMOUNT).subscribe((res) => {
      this.addExpenseForm.get('amount').setValue(this.accuracyPipe?.transform(res, AccuracyConfigTypes.AMOUNT, {isEdit:true, view_accurate: true}));
    });
  }

  public onBlurUnit() {
    this.onBlurAmount();
  }

  public uploadFiles(event: { file: File }[]): void {
    this.attachments = event;
    this.validationErrorArray = null;
    if (this.attachments && this.validationError === 'Attachment is required') {
      this.validationError = '';
    }
  }
  
  openConfirmation(ifClose: boolean) {
    if(this.addExpenseForm.value.amount == 0){
    this.confirmService.confirm('', `Expense amount is $0.00, are you sure you want to proceed ?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.saveExpense(ifClose);
        }
      })
      .catch(() => {

      });
    } else{
      this.saveExpense(ifClose);
    }
  }

  async saveExpense(ifClose: boolean) {
    if(this.isCustomFieldsValid){
    const accountConfig = this.storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    if (accountConfig && accountConfig?.is_validation_required && this.addExpenseForm?.value?.account_code) {
      const isValidProject = this.getProjectInfo(this.addExpenseForm?.value);
      const data: any = await this.isProjectCodeValid(isValidProject, this.workerId);
      if (!data?.isvalid) {
        this.showError(data?.errors);
      } else {
        this.submit(ifClose);
      }
    } else {
      this.submit(ifClose);
    }
  } else {
    this.isLoading = false;
    this.alertService.error('Please fill all the custom fields');
  }
  }
  getProjectInfo(data) {
    return this.customFields[0]?.data?.find(p => p?.title === data?.account_code)
  }

  isProjectCodeValid(data, user_id) {
    return new Promise((resolve) => {      
      const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
      const accountCodeSelected = this.addExpenseService.getVerifyAccountCodePayload(data, user_id);
      this.accountCodeService.verifyAccountCodeToken(currentProgram?.id, accountCodeSelected).subscribe((res: any) => {
        const isvalid = res?.response?.isValid;
        if (!isvalid) {
          this.showError(res?.response?.message);
        }
        resolve({ isvalid });
      });
    });
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

  async submit(ifClose) {
    let attachmentList = [];
    if(this.attachments?.length) {
    attachmentList = await this.encodeAttachmentsToBase64(this.attachments)
    }
    if (this.isAttachmentMandatory && !attachmentList) {
      this.validationError = 'Attachment is required';
    } else if (this.addExpenseForm.valid) {
      const selectedTransaction = this.addExpenseForm.get('allow_negative_expense').value;
      let payload = this.addExpenseService.createExpensePayload(this.formTaxes, this.getAmount().value, this.isFeeMandatory, selectedTransaction, this.isTaxMandatory,this.showTaxes, this.selectedExpenseItemsId);
      if (payload.amount != null) {
        this.addExpenseService.getExpenseCalculation(payload).subscribe((res) => {
              const taxes = this.formTaxes.value
            .map(tax => {
              if (tax && tax.entity_type === 'tax' && (this.showTaxes && this.isTaxMandatory)) {
                let updatedTax;
                var taxValue = res.taxes?.find(
                  restax =>
                    restax && restax.entity_type === 'tax' && (restax.entity_name === tax.entity_name),
                )?.total_amount;
                updatedTax = { ...tax, total_amount: this.accuracyPipe?.transform(taxValue, AccuracyConfigTypes.TAX, { isEdit: true }) };
                return updatedTax;
              }
              if (tax && tax.entity_type === 'fee' && (this.isFeeMandatory || this.showTaxes)) {
                let updatedFee;
                var feeValue = res.taxes?.find(
                  restax =>
                    restax && restax.entity_type === 'fee' && (restax.entity_name === tax.entity_name),
                )?.total_amount;
                updatedFee = { ...tax, total_amount: this.accuracyPipe?.transform(feeValue, AccuracyConfigTypes.FEE, { isEdit: true }) };
                return updatedFee;
              }
            })
            .filter(tax => tax?.entity_type && tax?.amount_value);
          const formData = this.addExpenseService.generateFormData(
            this.addExpenseForm,
            attachmentList,
            ((this.showTaxes && this.isTaxMandatory) || this.isFeeMandatory) ? taxes : [],
            this.assignment,
            this.expenseType.value,
            this.customFields,
            this.dynamicCustomFields
          );
          const expenseStatus = this.existingExpense ? this.expenseDetailService.expenseDetail?.expense_status.toLocaleLowerCase() : '';
          if (expenseStatus && (expenseStatus === ExpenseStatusMessage.withdrawn || expenseStatus === ExpenseStatusMessage.rejected)) {
            this.modifyExpense(formData, ifClose);
          } else {
            this.createExpense(formData, ifClose, this.existingExpense);
          }
        });
      }
    } else {
      this.validationError = 'Form is not valid';
    }
  }

  saveExpenseAndClose() {
    if(this.addExpenseForm.value.amount == 0){
    this.confirmService.confirm('', `Expense amount is $0.00, are you sure you want to proceed ?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.saveExpense(true);
        }
      })
      .catch(() => {

      });
    } else{
      this.saveExpense(true);
    }
  }

  public removeFile(fileName: string) {
    this.attachments = this.attachments.filter(({ file }) => file.name !== fileName);
  }

  private addExpenseFormBuilder(): void {
    // Form builder started.
    this.addExpenseForm = this.fb.group({
      expense_item_id: [null, Validators.required],
      expense_date: [null,Validators.required],
      expense_type: [''],
      amount: [null, [Validators.required, control => (control.value >= 0 ? null : { valid: true })]],
      transaction: ['credit'],
      allow_negative_expense: [false],
      expense_item_notes: [''],
      taxes: this.fb.array([]),
      total_amount: [0],
      total_vendor_billable_amount: [null],
      total_msp_billable_amount: [null],
      unit: [null]
    });
  }

  private modifyExpense(formData: FormData, ifClose: boolean) {
    this.subscrptions.push(
      this.expenseDetailService.modifyExpense(this.existingExpense).subscribe(res => {
        if (res.status === 201) {
          this.createExpense(formData, ifClose, res.data.expense_uuid);
        }
      }),
    );
  }

  private createExpense(formData: FormData, isClose: boolean, existingExpenseId: string): void {
    this.logs = undefined;
    this.loader.show();
    this.isLoading = true;
    // let data = this.dynamicCustomFields?.filter((ele)=> ele?.values).map((element, index )=> {
    //   if(element?.slug === 'expense_time') {
    //     formData.append(`custom[${index}][key]`, element?.slug);
    //     formData.append(`custom[${index}][value]`, '2023-04-13 13:06:38');
    //   } else {
    //   formData.append(`custom[${index}][key]`, element?.slug);
    //   formData.append(`custom[${index}][value]`, element?.values);
    //   }
    // });
    this.subscrptions.push(
      this.addExpenseService.createExpense(formData, existingExpenseId).subscribe(
        data => {
          this.getAssignmentDetails();
          this.clearedCalendar = true;
          this.changeDetectorRef.detectChanges();
          this.alertService.success(
            this.expenseType.name.charAt(0).toUpperCase() + this.expenseType.name.slice(1) + ' created successfully',
          );
          this.setAvailableDateRange();
          this.addExpenseForm.reset();
          let customData = this.dynamicCustomFields?.map((c: any, index) => {
            return Object?.assign({ [c.slug]: '' });
          });
          if(customData){
            this.selectedCustomData = Object?.assign({}, ...customData);
          }
          this.selectExpenseType();
          this.existingExpense = data.expense_uuid;
          if (isClose) {
            this.router.navigateByUrl(NavigationPaths.user.generalListItemDetails(this.existingExpense));
            this.sidebarVisibility = 'hidden';
          }else{
            this.addExpenseFormBuilder();
          }
          this.expenseDetailService.getExpenseDetailsById(this.existingExpense, false);
          this.attachments = undefined;
          this.isLoading = false;
          this.loader.hide();
          this.clearedCalendar = false;
        },
        err => {
          if (err) {
            this.isLoading = false;
            this.loader.hide();
            if (err.data) {
              const errorText = Object.values(err.data)[0];
              this.validationErrorArray = errorText;
              this.showError(errorText.toString());
            } else {
              this.validationErrorArray = err;
              this.showError(err);
            }
          }
        },
      ),
    );
  }

  private getAssignmentDetails() {    
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.loader.show();
    this.subscrptions.push(
      this.expenseService
        .getAssignmentDetails(currentProgram?.id, this.assignment?.assignment_uuid)
        .subscribe((assignments:any) => {
          if (assignments) {
            this.assignmentDetails = assignments;
            this.selectedCustomData = this.expenseService?.populateCustomFields(assignments?.custom, this.selectedCustomData);
            this.workerId = assignments?.worker?.id;
            this.currency = assignments.finance?.currency;
            this.taxes = assignments.assignment?.tax;
            if (!this.formTaxes.value.length) {
              for (const tax of this.taxes) {
                this.formTaxes.push(
                  this.fb.group({
                    amount_type: [tax.amount_type],
                    amount_value: [this.accuracyPipe?.transform(tax?.amount_value,AccuracyConfigTypes.AMOUNT, {isEdit:true}),[ Validators.required,control => ( 1/control.value >= 0  ? null : { valid: false })]],
                    applicable_on: [tax.applicable_on],
                    calculated_on:[tax.calculated_on],
                    entity_name: [tax.entity_name],
                    entity_type: [tax.entity_type],
                    funded_by: [tax.funded_by],
                    slug: [tax.slug],
                    total_amount: [this.accuracyPipe?.transform(tax?.amount | 0,AccuracyConfigTypes.AMOUNT, {isEdit:true})],
                  }),
                );
              }
            }
            this.loader.hide();
          }
        },
        (err)=>{
          this.loader.hide();
        }),
    );
  }

  public onBlurAmount() {   
    const amount: number = this.getAmount().value;
    if (amount) {
      this.getAmount().setValue(this.accuracyPipe?.transform(amount,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
    }
    const selectedTransaction = this.addExpenseForm.get('allow_negative_expense').value;
    let payload = this.addExpenseService.createExpensePayload(this.formTaxes,this.getAmount().value, this.isFeeMandatory, selectedTransaction, this.isTaxMandatory,this.showTaxes, this.selectedExpenseItemsId);
    if(payload.amount!=null){
      this.addExpenseService.getExpenseCalculation(payload).subscribe((res)=>{
        res?.taxes?.forEach((calc) => {
          this.formTaxes?.controls?.forEach((val) => {
            if(calc?.entity_name ==  val?.value?.entity_name && val?.value?.entity_type === 'tax')  val?.get('total_amount')?.setValue(calc?.total_amount)
          })
        })
        this.getTotalAmount().setValue(this.accuracyPipe?.transform(res?.total_amount_with_tax_fee,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.getVendorTotalAmount().setValue(this.accuracyPipe?.transform(res?.vendor_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.getMspTotalAmount().setValue(this.accuracyPipe?.transform(res?.msp_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
      });
    }
  }

   

  getExpenseCalculation():any{   
    const selectedTransaction = this.addExpenseForm.get('allow_negative_expense').value;    
    let payload = this.addExpenseService.createExpensePayload(this.formTaxes,this.getAmount().value, this.isFeeMandatory, selectedTransaction , this.isTaxMandatory,this.showTaxes, this.selectedExpenseItemsId);
    if(payload.amount!=null){
      this.addExpenseService.getExpenseCalculation(payload).subscribe((res)=>{
        this.getTotalAmount().setValue(this.accuracyPipe?.transform(res?.total_amount_with_tax_fee,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.getVendorTotalAmount().setValue(this.accuracyPipe?.transform(res?.vendor_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
        this.getMspTotalAmount().setValue(this.accuracyPipe?.transform(res?.msp_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
      });
    }
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

  private setAvailableDateRange() {
    if (this.hierarchyId) {
      this.subscrptions.push(
        this.expenseDetailService.getDefaultConfig(this.hierarchyId).subscribe(
          (res: IExpenseConfigData) => {
            this.showTaxes = res?.expense_config?.is_taxable;
            this.showFeeTaxesRoleBased = !res?.expense_config?.exp_amnt_based_on_role?.value?.includes(this.roleId);
            this.expenseConfigInactive = res.status === 'inactive';
            this.expenseModuleDisabled = !(res?.status === 'active');
            if (this.expenseConfigInactive) {
              this.expenseInactiveMessage =
                'Expense Configuration is made Inactive for your Hierarchy. For Additional details please contact the Admin.';
            } else if (this.expenseModuleDisabled) {
              this.expenseInactiveMessage =
                'Expense module is disabled for your Hierarchy. For Additional details please contact the Admin.';
            }
            this.addExpenseService.getExpenseType(res.config_uuid);
            let configuredStartDate: Date;
            let configuredEndDate: Date;
            const currentDate = new Date().toISOString().slice(0, 10);
            configuredEndDate = getDateFromString(this.assignment.end_date);
            if (
              this.addExpenseService.expenseType?.value === ExpenseType.Expense &&
              res.expense_config.grace_period_submission?.value !== 0
            ) {
              const calculatedDate = this.changeDateByConfigValue(
                currentDate,
                -res.expense_config.grace_period_submission.value,
                res.expense_config.grace_period_submission.type,
              );
              const assignment_start_date = getDateFromString(this.assignment.start_date);
              configuredStartDate = calculatedDate;
              configuredStartDate =
              calculatedDate < assignment_start_date ? assignment_start_date : calculatedDate;
              const current_date = getDateFromString(currentDate);
              const assignment_end_date = getDateFromString(this.assignment.end_date);
              configuredEndDate = 
              current_date > assignment_end_date ? assignment_end_date : current_date
            } else {
              configuredStartDate = getDateFromString(this.assignment.start_date);
            }
            const startDate = getDateFromString(this.assignment.start_date);
            this.calendarOptions = {
              ...this.calendarOptions,
              enabledDateRanges: [{ start: configuredStartDate, end: configuredEndDate }],
            };
            if (startDate > configuredEndDate) {
              this.expenseInactiveMessage =
                'Access for enter expense has been removed from configuration. For Additional details please contact the Admin.';
              this.expenseConfigInactive = true;
            }
            if (res.expense_config.custom_fields?.is_enabled) {
              this.addExpenseService.getCustomFieldUpdatedData(this.assignment.assignment_uuid,this.hierarchyId).subscribe((res)=>{
                this.customFields = res;
                const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM); 
                this.show_only_codes = currentProgram?.config?.show_only_codes || false;
                this.customFields?.forEach(field => {
                  // if (field?.slug == 'account_code' && field?.data && field?.data?.length > 0) {
                    if(field?.slug){
                    field.isMandatory = true;
                    this.addExpenseForm.addControl(field?.slug, new UntypedFormControl(null));                    
                    this.addExpenseForm.get(field?.slug).setValidators([Validators.required]);
                    this.addExpenseForm.get(field?.slug).updateValueAndValidity();  
                  }
                  if (field?.slug == 'account_code' && !field?.data?.length) {
                    this.addExpenseForm.removeControl('account_code')
                    let ind = this.customFields?.findIndex((val) => val?.slug === 'account_code');
                    this.customFields?.splice(ind, 1)
                  }
                  // } else{
                  //   this.addExpenseForm.addControl(field?.slug, new FormControl(null));
                  // }
                });
              this.customFieldsEnabled = true;
              })
              
            }
          },
          (res: HttpErrorResponse) => {
            if (res?.error?.error?.message) {
              this.showError(res.error.error.message);
            }
            this.addExpenseService.getExpenseType();
          },
        ),
      );
    }
  }
  onBlurFormTaxes(entity_name){
    this.formTaxes?.controls?.forEach((val) => {
      if(val.get('entity_type').value === 'fee' && val.get('entity_name').value === entity_name){
      val.get('amount_value').setValue(this.accuracyPipe?.transform(val.get('amount_value')?.value, AccuracyConfigTypes.FEE, {isEdit:true}) )
      }
    })
  }

  taxAmountValueChange(event:any){
    this.isTaxValid = event?.target?.value > 100 ? true : false;
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
  }

  public taxAmountChange() {
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
    const selectedTransaction = this.addExpenseForm.get('allow_negative_expense').value;
    let payload = this.addExpenseService.createExpensePayload(this.formTaxes,this.getAmount().value, this.isFeeMandatory, selectedTransaction, this.isTaxMandatory,this.showTaxes, this.selectedExpenseItemsId);
    if(payload.amount!=null){
      this.addExpenseService.getExpenseCalculation(payload).subscribe((res)=>{
        res?.taxes?.forEach((calc) => {
          this.formTaxes?.controls?.forEach((val) => {
            if(calc?.entity_name ==  val?.value?.entity_name && val?.value?.entity_type === 'tax')  val?.get('total_amount')?.setValue(calc?.total_amount)
          })
        })
      this.getTotalAmount().setValue(this.accuracyPipe?.transform(res?.total_amount_with_tax_fee,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
      this.getVendorTotalAmount().setValue(this.accuracyPipe?.transform(res?.vendor_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
      this.getMspTotalAmount().setValue(this.accuracyPipe?.transform(res?.msp_amount_with_tax,AccuracyConfigTypes.AMOUNT, {isEdit:true}));
    });
    }
  }

  public isReadonlyTax(controlIndex: number) {
    const control = (this.addExpenseForm.get('taxes') as UntypedFormArray).controls[controlIndex];
    return (
      control.get('entity_name').value === 'msp' &&
      (control.get('entity_type').value === 'tax' || control.get('entity_type').value === 'fee') &&
      this.userPermissionService.currentUserRole() !== UserType.MSP
    );
  }

  public hideTaxControl(control): boolean {
    return this.addExpenseService.hideTaxControl(control, this.isTaxMandatory, this.isFeeMandatory);
  }
  
  get showAmountDetails() {
    if(!this.isTaxMandatory || (this.isTaxMandatory && this.is_tax_hidden)) {
      return null;
    }
    return this.formTaxes?.value?.filter(val => val?.entity_type === 'tax')?.length;
  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  dynamicCustomFields: any;
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

}
