import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ExpenseListItemModel } from '../../models/expense-list-item.model';
import { ActivatedRoute } from '@angular/router';
import { ExpenseSingleDetailModelData } from '../../models/expense-single-detail.model';
import { AttachmentByExtension, FormHelperService } from '../../services/form-helper/form-helper.service';
import { Subscription } from 'rxjs';
import { AddExpenseService } from '../../services/add-expense.service';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { AccuracyConfigTypes }  from '../../enums/accuracy-config.enum';
@Component({
  selector: 'app-expense-single-detail',
  templateUrl: './expense-single-detail.component.html',
  styleUrls: ['./expense-single-detail.component.scss'],
})
export class ExpenseSingleDetailComponent implements OnInit, OnDestroy {
  dynamicCustomFields: any;
  isCustomFieldsValid: any;
  selectedCustomData = {};
  @Input()
  public expenseId: string;
  @Input() currency: string;
  @Input() expenseConfiguration;
  @Input() is_tax_hidden: boolean;
  @Input() hierarchyIds: any;
  public expenseSingleDetails: ExpenseListItemModel;
  public singleDetailData: any;
  public showHideEditDelete = false;
  public sidebarVisibility = 'hidden';
  public isTypeTaxable = false;
  public isTypeMspApplicable = false;
  public isAllowedNegativeExpense = false;
  @Output() closeSingleDetails = new EventEmitter();
  public subscription: Subscription;
  showTaxes = false;
  showFeeTaxesRoleBased = false;
  showClientBillable = false;
  showVendorBillable = false;
  showMspBillable = false;
  show_only_codes = false;
  selectedModule: any;
  public accuracyConfig = AccuracyConfigTypes;
  roleId: any;
  constructor(
    private eventStream: EventStreamService,
    private activatedRoute: ActivatedRoute,
    private formHelperService: FormHelperService,
    private addExpenseService: AddExpenseService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.expenseId = this.activatedRoute.snapshot.paramMap.get('expenseId');
    this.roleId = this.storageService.get(StorageKeys.CURRENT_ACCOUNT)?.role?.id;
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.show_only_codes = programDetails?.config?.show_only_codes || false;
    this.showFeeTaxesRoleBased = !this.expenseConfiguration?.exp_amnt_based_on_role?.value?.includes(this.roleId);
    this.subscription = this.eventStream.on(Events.EXPENSE_DETAIL_VIEW).subscribe((data: ExpenseSingleDetailModelData) => {
      this.singleDetailData = { ...data, start_date: data?.item_start_date, end_date: data?.item_end_date };
      let removeFee = [];
      this.singleDetailData?.taxes?.forEach((element) => {
        if((element.entity_name.toLowerCase() + element.entity_type.toLowerCase() != 'vmsfee') &&
        (element.entity_name.toLowerCase() + element.entity_type.toLowerCase() != 'msp_partnerfee')){
          removeFee.push(element);
        }
      });
      this.selectedModule = this.singleDetailData?.expense_category === 'General Expense' ? 'EXPENSES': 'MISC_EXPENSES';
      this.selectedCustomData = this.singleDetailData?.custom;
      this.singleDetailData.taxes = removeFee;
      this.getExpenseItemDetails(this.singleDetailData.expense_type.id);
      this.sidebarVisibility = data ? 'visible' : 'hidden';
      this.showTaxes = this.expenseConfiguration?.expense_config?.is_taxable;
      this.getVisibleAmount();
    });
  }

  createExpensePayload(formTaxes, amount, isFeesMandatory, isTaxMandatory, showTaxes, expense_item_id?): any {
    var taxes = [];
    var fees = [];
    if (typeof formTaxes !== "undefined") {
      if (isTaxMandatory || showTaxes) {
        taxes = formTaxes.filter((tax) => {
          return tax.entity_type == 'tax';
        });
      }
      if (isFeesMandatory || showTaxes) {
        fees = formTaxes.filter((tax) => {
          return tax.entity_type == 'fee';
        })
      };
    }
    let payload = {
      "taxes": taxes,
      "fees": fees,
      "amount": amount,
      "expense_item_id": expense_item_id
    };
    return payload;
  }

  getExpenseCalculation(): any {
    let payload = this.createExpensePayload(this.singleDetailData?.taxes, this.singleDetailData?.calculation?.amount_without_tax, this.isTypeMspApplicable, this.isTypeTaxable, this.showTaxes, this.singleDetailData?.expense_type?.id);
    if (payload?.amount != null) {
      this.addExpenseService.getExpenseCalculation(payload).subscribe((res) => {
        res?.taxes?.forEach((calc) => {
          this.singleDetailData?.taxes?.forEach((val) => {
            if (calc?.entity_name == val?.entity_name) val.total_amount = calc?.total_amount;
          })
        })
      });
    }
  }

  showTooltip(data,accuracyConfigVal,currency) {
    return this.addExpenseService?.showTooltip(data,accuracyConfigVal,currency);
  }
  getVisibleAmount(){
    let data = this.addExpenseService.getVisibleAmount();
    this.showClientBillable = data.showClientBillable;
    this.showVendorBillable = data.showVendorBillable;
    this.showMspBillable = data.showMspBillable;
   }

  get showAmountDetails() {
    if(!this.isTypeTaxable || (this.isTypeTaxable && this.is_tax_hidden)) {
      return null;
    }
    return this.singleDetailData?.taxes?.filter(val => val?.entity_type === 'tax')?.length;
  }
  private getExpenseItemDetails(itemId: string) {
    this.addExpenseService.getDetailOfExpenseItem(itemId).subscribe((res:any) => {
      this.isTypeTaxable = res.is_taxable == '1';
      this.isTypeMspApplicable = res.msp_applicable == '1';
      this.isAllowedNegativeExpense = res.allow_negative_expense == '1';
    });
  }

  public attachmentPathByExtension(attachment): AttachmentByExtension {
    return this.formHelperService.attachmentPathByExtension(attachment);
  }


  sidebarClose() {
    this.singleDetailData = null;
    this.closeSingleDetails.emit();
    this.sidebarVisibility = 'hidden';
  }

  public hideTaxControl(control): boolean {
    return this.addExpenseService.hideTaxControl(control, this.isTypeTaxable, this.isTypeMspApplicable);
  }

  public roundTo(n) {
    return this.addExpenseService.roundTo(n);
  }

  setCustomFieldsFormValid(event) {
    this.isCustomFieldsValid = event;
    
  }
  customFieldUpdated(event) {
    this.dynamicCustomFields = event;    
  }


  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
