import { Injectable } from '@angular/core';
import {UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {forkJoin, Observable, Subject} from 'rxjs';
import {map, takeUntil, tap} from 'rxjs/operators';
import {HttpService} from '../../../core/services/http.service';
import {
  IExpenseTypeItem,
  IIconItem,
  IRadioOptionItem,
  IToggleOptionItem
} from '../models/add-expense-type.model';
import { ExpenseCodes } from '../enums/expense-codes.enums';
import { IExpensesItem } from '../models/expense-items-model';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigTypes, CurrencyConfig } from 'src/app/expense/enums/accuracy-config.enum';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';


@Injectable({
  providedIn: 'root'
})
export class AddExpenseTypeService {

  public expenseType: Array<IExpenseTypeItem>;
  public iconItems: Array<IIconItem>;
  public accuracyConfig = AccuracyConfigTypes;
  public currencyConfig = CurrencyConfig;
  public currency: string = 'USD';

  public radioOptionItems: IRadioOptionItem[] = [
    { label: 'Optional', value: false },
    { label: 'Mandatory', value: true }
  ];
  public toggleOptionItems: IToggleOptionItem[] = [
    { id: 'is_taxable', label: 'Taxable', value: false },
    { id: 'msp_applicable', label: 'MSP Fee Applied', value: false },
    { id: 'status', label: 'Status', value: false },
    { id: 'allow_negative_expense', label: 'Allow Negative Expense', value: false }
  ];
  public toggleOptionItemsData: IToggleOptionItem[] = [
    { id: 'is_taxable', label: 'Taxable', value: false },
    { id: 'msp_applicable', label: 'MSP Fee Applied', value: false },
    { id: 'status', label: 'Status', value: false },
    { id: 'allow_negative_expense', label: 'Allow Negative Expense', value: false }
  ];
  public addExpenseTypeForm: UntypedFormGroup;
  public destroy$: Subject<boolean> = new Subject<boolean>();
  private readonly expenseUrl = '/expense/programs/';
  private readonly configuratorUrl = '/configurator/programs/';

  public get unitBasedEnabled(): boolean {
    return !!this.toggleOptionItems?.find(obj => obj?.id === 'unit_based' && obj?.value === true);
  }

  constructor(public http: HttpService,
              public storageService: StorageService,
              private formBuilder: UntypedFormBuilder,
              private accuracyPipe: AccuracyPipe
  ) { }
  init(programId: string){
    this.currency = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultCurrency || this.currency;
    this.initForm();
    return forkJoin([this.getExpenseTypes(programId), this.getExpenseIcons(programId)]);
  }
  private initForm() {
    this.addExpenseTypeForm = this.formBuilder.group({
      expense_type: new UntypedFormControl('expense', Validators.required),
      expense_code: new UntypedFormControl('', Validators.required),
      expense_name: new UntypedFormControl('', Validators.required),
      expense_icon: new UntypedFormControl(''),
      attachment_mandatory: new UntypedFormControl('', Validators.required),
      notes_mandatory: new UntypedFormControl('', Validators.required),
      is_taxable: new UntypedFormControl(false),
      msp_applicable: new UntypedFormControl(false),
      allow_negative_expense: new UntypedFormControl(false),
      status: new UntypedFormControl(false),
      unit_base_config: new UntypedFormGroup({
        unit_base: new UntypedFormControl(false),
        unit_label: new UntypedFormControl(''),
        amount_per_unit: new UntypedFormControl(this.accuracyPipe?.transform(0, this.accuracyConfig.AMOUNT, { isEdit: true }))
      }),
    });

    this.addExpenseTypeForm.get('unit_base_config')?.get('unit_base')?.valueChanges.subscribe(res => {
      if (res) {
        this.addExpenseTypeForm.get('unit_base_config')?.get('unit_label')?.addValidators(Validators.required);
        this.addExpenseTypeForm.get('unit_base_config')?.get('amount_per_unit')?.addValidators(Validators.required);
      } else {
        this.addExpenseTypeForm.get('unit_base_config')?.get('unit_label')?.removeValidators(Validators.required);
        this.addExpenseTypeForm.get('unit_base_config')?.get('amount_per_unit')?.removeValidators(Validators.required);
      }
      this.addExpenseTypeForm.get('unit_base_config')?.get('unit_label')?.updateValueAndValidity();
      this.addExpenseTypeForm.get('unit_base_config')?.get('amount_per_unit')?.updateValueAndValidity();
    });
  }

  public get unitBaseConfig() {
    return this.addExpenseTypeForm.get('unit_base_config') as UntypedFormGroup;
  }

  private getExpenseTypes(programId: string): Observable<any> {
   return this.http.get(this.expenseUrl + `${programId}/expense-types`)
      .pipe(
        tap((result:any) => {
          if (result.status === 200){
            this.expenseType = Object.keys(result.data).map(key => ({value: key, label: result.data[key]}));
          }
        })
      );
  }
  private getExpenseIcons(programId: string): Observable<any> {
    return this.http.get(this.configuratorUrl + `${programId}/config?entity_code=expense_icon`)
      .pipe(
        tap((result:any) => {
          this.iconItems = result.config;
        })
      );
  }
  public getCategoryCode(): string {
    const expenseType = this.addExpenseTypeForm.get('expense_type').value;
    return ExpenseCodes[expenseType] ?? null;
  }
  public onClickToggle(item: any): void {
    item.value = !item.value;
    this.addExpenseTypeForm.get(item.id).setValue(item.value);
  }
  public toggleUnitBaseConfig(): void {
    const currentValue = this.unitBaseConfig?.get('unit_base')?.value;
    return this.unitBaseConfig?.get('unit_base')?.setValue(!currentValue);
  }

  public submitAddExpenseType(configId: string, programId: string, expenseItemId?: string): Observable<any> {
    const expensePayload = this.addExpenseTypeForm.value;
    expensePayload.expense_code = this.getCategoryCode() + '-' + expensePayload.expense_code;
    expensePayload.config_uuid = configId;
    return this.addOrEditExpenseType(expensePayload, programId, expenseItemId);
  }

  public addOrEditExpenseType(expensePayload, programId: string, expenseItemId?: string) {
    return expenseItemId
      ? this.http.put(this.expenseUrl + `${programId}/expense-item/${expenseItemId}`, expensePayload)
        .pipe(takeUntil(this.destroy$))
      : this.http.post(this.expenseUrl + `${programId}/expense-item`, expensePayload).pipe(takeUntil(this.destroy$));
  }

  public showErrors(form: UntypedFormGroup) {
    Object
      .keys(form.controls)
      .forEach(field => {
        form
          .get(field)
          .markAsTouched({onlySelf: true});
      });
  }

  public getExpenseTypeDetail(expenseItemId: string, programId: string): Observable<IExpensesItem> {
    return this.http.get(`/expense/programs/${programId}/expense-item/${expenseItemId}`).pipe(
      map((res:any) => res.data),
      takeUntil(this.destroy$)
    );
  }

  public fillFormWithData(expenseItemId: string, programId: string): void {
    this.getExpenseTypeDetail(expenseItemId, programId).subscribe((data:any) => {
      this.addExpenseTypeForm.patchValue({
        expense_type: data.expense_type === 'Expense'
          ? this.expenseType.find(({ value }) => value === 'expense').value
          : this.expenseType.find(({ value }) => value === 'misc_expense').value,
        expense_code: data.expense_code.split('-')[1]
          ? data.expense_code.split('-')[1] : data.expense_code.split(':')[1]
            ? data.expense_code.split(':')[1] : data.expense_code, // it should be only one template for items
        expense_name: data.expense_name,
        expense_icon: data.expense_icon,
        entry_permission: [], // should be removed
        attachment_mandatory: data.attachment_mandatory == '1',
        notes_mandatory: data.notes_mandatory == '1',
        is_taxable: data.is_taxable == '1',
        msp_applicable: data.msp_applicable == '1',
        allow_negative_expense: data.allow_negative_expense == '1',
        status: data.status === 'active',
        unit_base_config: {
          unit_base: data.unit_base_config?.unit_base === true,
          unit_label: data.unit_base_config?.unit_label,
          amount_per_unit: this.accuracyPipe?.transform(data.unit_base_config?.amount_per_unit, this.accuracyConfig.AMOUNT, { isEdit: true })
        }
      });
      this.toggleOptionItems = this.toggleOptionItems.map(({ id, label }) =>
        ({ id, label, value: data[id] == '1' || data[id] === 'active' }));
    });
  }

  public clearToggleOptionItems(){
    this.toggleOptionItems.forEach(item => {
      item.value = false;
    });
  }

  public unsubscribe() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
