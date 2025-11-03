import { Injectable } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { HttpService } from '../../core/services/http.service';
import { ExpenseType } from '../enums/expense.enums';
import { ExpenseService } from '../expense.service';
import { ICreateExpenseData, IExpenseItem, IExpenseItemData, IExpenseType } from '../interfaces/expense.interfaces';
import { CustomFieldModel } from '../models/expense-configuration.model';
import { TaxModel } from '../models/tax.model';
import { IExpenseResponse } from '../interfaces/expense-data.interfaces';
import { AccountCodeValidationParams, AccountCodeValidationPayload, AccoutCodeValidationRequest } from 'src/app/account-code-setup/models/account-code-setup-model';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigTypes }  from '../enums/accuracy-config.enum';
import * as moment from 'moment-timezone';
@Injectable({
  providedIn: 'root',
})
export class AddExpenseService {
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public expenseType: IExpenseType;
 // public readonly programId: string;
  public expenseItemsData: IExpenseItem[];

  private readonly expenseUrl = '/expense/programs/';
  // private readonly currentProgram: IProgram;
  public viewCurrencyStrict: string = '0.4-4' ;
  public accuracyConfig = AccuracyConfigTypes;
  constructor(public http: HttpService, private storageService: StorageService, private expenseService: ExpenseService,public currencyPipe: CustomcurrencyPipe,public accuracyPipe: AccuracyPipe, private localDatePipe: LocalDateFormatPipe) {
    //const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    //this.programId = currentProgram.id;
    // const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // let edit_accuracy = currentProgram?.config?.currency?.edit_accuracy;
    // this.viewCurrencyStrict = edit_accuracy ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewCurrencyStrict;
  }
  
  showTooltip(val,accuracyConfigVal,currency) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // return this.currencyPipe?.transform(val, undefined, undefined, this.viewCurrencyStrict, undefined, true);
    if(currentProgram?.config?.accuracy_config){
      return this.accuracyPipe?.transform(val, accuracyConfigVal,{currencyCode: currency});
    } else{
      return this.accuracyPipe?.transform(val, accuracyConfigVal, {currencyCode: currency,digitInfo: this.viewCurrencyStrict});
    }  
  }

  public getDetailOfExpenseItem(expenseItemId: string): Observable<IExpenseItemData> {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http.get(this.expenseUrl + `${currentProgramId}/expense-item/${expenseItemId}`).pipe(
      map((res: IExpenseResponse<IExpenseItemData>) => res.data),
      takeUntil(this.destroy$),
    );
  }

  public formatDate(dateNumber: number): string {
    const newDate = new Date(dateNumber);
    return newDate.getFullYear() + '-' + ('0' + (newDate.getMonth() + 1)).slice(-2) + '-' + ('0' + newDate.getDate()).slice(-2);
  }

  public getGeneralExpenseItems(configId: string): Observable<IExpenseItemData[]> {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http.get(this.expenseUrl + `${currentProgramId}/config/expense-items`, '', { status: 'active', config_uuid: configId }).pipe(
      map((res:any) => res.data.expenseItems),
      takeUntil(this.destroy$),
    );
  }

  public getMiscExpenseItems(configId: string): Observable<IExpenseItemData[]> {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http
      .get(this.expenseUrl + `${currentProgramId}/config/miscexpense-items`, '', { status: 'active', config_uuid: configId })
      .pipe(
        map((res:any) => res.data.expenseItems),
        takeUntil(this.destroy$),
      );
  }

  public getExpenseItems(type: IExpenseType, configId: string): Observable<IExpenseItemData[]> {
    return type.value === ExpenseType.Expense ? this.getGeneralExpenseItems(configId) : this.getMiscExpenseItems(configId);
  }

  public getCalculatedValue(arr: any, action: string, type: string) {
    this.destroy$.next(true);
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    const payload = {
      input: arr,
      type,
      action
    }
    return this.http
      .post(`/expense/programs/${currentProgramId}/calculate-expense-amount`, payload)
      .pipe(
        map((res:any) => res.result),
        takeUntil(this.destroy$),
      )
  }

  public getExpenseType(configId?: string): void {
    this.expenseService.expenseType$.pipe(takeUntil(this.destroy$)).subscribe((type:any) => {
      this.expenseType = type;
      if (configId) {
        this.getExpenseItems(type, configId)
          .pipe(takeUntil(this.destroy$))
          .subscribe((items:any) => {
            this.expenseItemsData = items.map(({ expense_name, expense_item_id, expense_icon, unit_base_config }) => ({
              name: expense_name,
              id: expense_item_id,
              icon: expense_icon,
              unit_base_config
            }));
          });
      }
    });
  }

  public generateFormData(
    form: UntypedFormGroup,
    attachments: { file: File }[],
    taxes: TaxModel[],
    assignment,
    type,
    customFields: CustomFieldModel[],
    custom
  ) {
   
    // added this to support hyphen date format like yyyy-mm-dd
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);

    // Changed due to V2M-29082
    const value = parseFloat(form?.value?.amount || 0);
    if(form?.value?.allow_negative_expense){
      form.value.amount = -value;
    } else {
      form.value.amount = value;
    }
    // End
    const { expense_item_id,  transaction, allow_negative_expense, expense_date, amount, expense_item_notes, total_amount, unit } = form.value;
    const dateFormat = currentProgram?.defaultDateFormat; 
    var startRange = moment(expense_date,dateFormat).format(dateFormat);
      var endRange =moment(expense_date,dateFormat + '-' + dateFormat).format(dateFormat);
      var dateRange = [startRange, endRange];
    
    let expensePayload: any = {
      expense_item_id,
      amount,
      transaction,
      allow_negative_expense,
      unit,
      expense_item_notes,
      assignment_uuid: assignment.assignment_uuid,
      hierarchy_uuid: assignment.hierarchy.id,
      expense_item_start_date: this.localDatePipe.transform(dateRange[0],DATE_FORMAT.FORMATYMD,'','',true,currentProgram['defaultDateFormat']),
      expense_item_end_date: dateRange[1] ? this.localDatePipe.transform(dateRange[1],DATE_FORMAT?.FORMATYMD,'','',true,currentProgram['defaultDateFormat']) : assignment.end_date,
      // expense_item_start_date: this.formatDate(startDate),
      // expense_item_end_date: endDate ? this.formatDate(endDate) : assignment.end_date,
      expense_type: type,
      total_amount,
    };

    // custom payload
    let customFieldsData = [];
    custom?.filter(ele => ele?.values).map(element => {
      customFieldsData.push({
        key: element?.slug,
        value: element?.values
      })
    });
    // end
    expensePayload = {...expensePayload, attachment: attachments, taxes: taxes, custom: customFieldsData};
    if (customFields?.length) {
      customFields.forEach((field, idx) => {
        let  requestField = { 
          id:    this.getCustomFieldIdByTitle(customFields,form.value[field.slug],field.slug),
          slug : field.slug,
          type : field.type,
          name : field['label'],
          value : form.value[field.slug],
          account_code: this.getCustomFieldSlug(customFields,form.value[field.slug],field.slug),
        };
        customFields[idx] = requestField;
      });
      expensePayload = {...expensePayload,custom_fields:customFields};
    }
    return expensePayload;
  }

  getCustomFieldIdByTitle(customFields,title:any,slug:string): string{
   let Id = '';
    customFields.forEach((value)=>{
      if(value.slug == slug){
        (value.data).forEach((dataValue)=>{
          if(dataValue.title == title){
            Id =  dataValue.id;
          }
        })
      }
    })
    return Id;
  }
  getCustomFieldSlug(customFields,title:any,slug:string): string{
    let slugName = '';
     customFields.forEach((value)=>{
       if(value?.slug == slug){
         (value?.data)?.forEach((dataValue)=>{
           if(dataValue?.title == title){
            slugName =  dataValue?.account_code;
           }
         })
       }
     })
     return slugName;
   }

  public createExpense(expensePayload: FormData, expenseId?: string): Observable<ICreateExpenseData> {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http.post(this.expenseUrl + `${currentProgramId}/expense` + (expenseId ? `/${expenseId}` : ''), expensePayload).pipe(
      map((res: IExpenseResponse<ICreateExpenseData>) => res.data),
      takeUntil(this.destroy$),
    );
  }

  public getCustomFieldUpdatedData(assignmentId: string, hierarchyId: string): Observable<any> {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http
      .get(`/expense/programs/${currentProgramId}/config/${hierarchyId}/assignment/${assignmentId}/projects`)
      .pipe(map((res:any) => res.data));
  }

  public getCustomFieldData(assignmentId: string, slug: string): Observable<any> {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http
      .get(`/assignment/programs/${currentProgramId}/assignment/${assignmentId}/project_code?type=${slug}`)
      .pipe(map((res:any) => res.data.codes));
  }

  public trancateTwoDecimal(value) {
    if(typeof value !== "undefined"){
      var num = value;
      var with2Decimals = num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
      return with2Decimals;
    }else{
      return 0.00;
    }    
  }

  public roundTo(n, digits = 2) {
    let negative = false;
    if (digits === undefined) {
      digits = 0;
    }
    if (n < 0) {
      negative = true;
      n = n * -1;
    }
    const multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    n = (Math.round(n) / multiplicator).toFixed(digits);
    if (negative) {
      n = (n * -1).toFixed(digits);
    }
    return n;
  }

  public currencyFormat(value) { 
    // const programDetails = this.storageService?.get(StorageKeys.CURRENT_PROGRAM);
    // const accuracy = parseInt(programDetails?.config?.currency?.edit_accuracy);
    if(value !== undefined && value !== null){
      return parseFloat(value);
      // return parseFloat(value).toFixed(accuracy);
    } else{
      return value;
    }
  }

  public getVisibleAmount(){
    var showClientBillable = false;
    var showVendorBillable = false;
    var showMspBillable = false;
    const curent_user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    switch (curent_user_type) {
        case 'client':
        showClientBillable = true;
        showVendorBillable = false;
        showMspBillable = false;
        break;
        case 'vendor':
        showClientBillable = false;
        showVendorBillable = true;    
        showMspBillable = false;   
        break;
        case 'msp':
        showClientBillable = true;
        showVendorBillable = true;  
        showMspBillable = true;
        break;  
        case 'super_org':
        showClientBillable = true;
        showVendorBillable = true;  
        showMspBillable = true;
        break;       
        default:
        showClientBillable = false;
        showVendorBillable = false;
        showMspBillable = false;
        break;
    }
    return { 
            "showClientBillable" : showClientBillable,
            "showVendorBillable" : showVendorBillable,
            "showMspBillable" : showMspBillable
            }
  }
  
  createExpensePayload(formTaxes,amount, isFeesMandatory, isNegativeExpenseAllowed, isTaxMandatory,showTaxes, expense_item_id?):any{
    var taxes = [];
    var fees = [];
    if(typeof formTaxes.value !== "undefined"){
      if(isTaxMandatory || showTaxes){
        taxes = formTaxes.value.filter((tax)=>{
          return tax.entity_type == 'tax';
        });
      }
      if(isFeesMandatory || showTaxes){
        fees = formTaxes.value.filter((tax)=>{
          return tax.entity_type == 'fee';
        })
      };
    }
    // Changed due to V2M-29082
    let value = parseFloat(amount) * (isNegativeExpenseAllowed ? -1 : 1);
    // End
    let payload = {
      "taxes": taxes,
      "fees": fees,
      "amount": value,
      "expense_item_id": expense_item_id
    };
    return payload;
  }

  public getExpenseCalculation(payload): Observable<any> {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http.put(this.expenseUrl + `${currentProgramId}/expense-calculation`, payload).pipe(map((res:any) => res.data));
  }

  public hideTaxControl(control: UntypedFormControl | any, isTaxableApplicable: boolean, isFeeApplicable: boolean): boolean {
    const entityType = control?.entity_type ?? control?.get('entity_type')?.value;
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const curent_user_type=this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    const is_tax_hidden = currentProgram.config?.is_tax_hidden || false;
    const is_fees_hidden= currentProgram?.config?.hide_fees?.[curent_user_type] || false;
    return (entityType === 'tax' && (!isTaxableApplicable || (isTaxableApplicable && is_tax_hidden))) || 
           (entityType === 'fee' && (!isFeeApplicable || (isFeeApplicable && is_fees_hidden)));
  }

  public unsubscribe() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  getVerifyAccountCodePayload = (p, workerId): AccoutCodeValidationRequest => {
    let verificationPayload: AccoutCodeValidationRequest = new AccoutCodeValidationRequest()
    verificationPayload.params = new AccountCodeValidationParams();
    verificationPayload.params.worker_id = workerId;
    verificationPayload.params.module_name = 'expense';
    verificationPayload.params.action = 'validation';
    verificationPayload.params.unit_id = '';
    verificationPayload.payload = new AccountCodeValidationPayload();
    p?.payload?.fields?.forEach(foundational_data => {
      if (foundational_data) {
        verificationPayload.payload[foundational_data.key_slug] = foundational_data.value?.code ?? '';
      }
    });
    return verificationPayload;
  }
  
}
