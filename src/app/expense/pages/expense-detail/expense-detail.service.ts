import { Injectable } from '@angular/core';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { Observable, of, Subject, throwError } from 'rxjs';
import { ExpenseStatusType, IExpenseType, IProgram } from '../../interfaces/expense.interfaces';
import { ExpenseModel } from '../../models/expense.model';
import { VMSConfig } from '../../../library/simple-table/simple-table/simple-table.model';
import { ExpenseStatusMessage, ExpenseType, NavigationPaths, UserType } from '../../enums/expense.enums';
import { Router } from '@angular/router';
import { ExpenseListItemModel, ExpenseListModel } from '../../models/expense-list-item.model';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { ExpenseDetailTableModel } from '../../pages/expense-detail/expense-detail-table-model';
import { HttpService } from '../../../core/services/http.service';
import { catchError, map, mergeMap, takeUntil } from 'rxjs/operators';
import { AlertService } from '../../../core/components/alert/alert.service';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog/confirmation-dialog.service';
import { UserPermissionService } from '../../services/user-permission.service';
import { ExpenseService } from '../../expense.service';
import { ExpenseSingleDetailModelData } from '../../models/expense-single-detail.model';
import { FormHelperService } from '../../services/form-helper/form-helper.service';
import { ExpenseDetailsModel } from '../../models/expense-details.model';
import { AssignmentDataModel, AssignmentDetails } from '../../models/assignment.model';
import { AssignmentService } from 'src/app/assignment/assignment.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { IExpenseConfigData } from '../../interfaces/expense-configuration.interface';
import { IExpenseResponse } from '../../interfaces/expense-data.interfaces';
import { ExpenseColumns } from '../../enums/expense-detail.enum';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AccessType } from 'src/app/shared/enums';
@Injectable({
  providedIn: 'root',
})
export class ExpenseDetailService {
  public getDataLoad = new Subject();
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public assignment: AssignmentDataModel;
  public currency: string;
  public roleId:any;
  public expenseConfiguration: IExpenseConfigData;
  public accessRemoved = false;
  private _expenseDetail: ExpenseModel;
  public _expenseDetailListItems: ExpenseListModel;
  private _extenseTypeColumnIndex = 0;
  private _expenseType: IExpenseType;
  private _currentProgram: IProgram;
  public isAssignmentLoaded: any = false;
  private readonly _expenseDetailsTableConfig: VMSConfig = {
    ...ExpenseDetailTableModel,
    columnList: [...ExpenseDetailTableModel.columnList],
  };

  constructor(
    public http: HttpService,
    private storageService: StorageService,
    private loader: LoaderService,
    private alertService: AlertService,
    private confirmationService: ConfirmationDialogService,
    private userPermissionService: UserPermissionService,
    private expenseService: ExpenseService,
    private formHelperService: FormHelperService,
    private router: Router,
    private assignmentService: AssignmentService,
    private localDatePipe: LocalDateFormatPipe,
    private eventStream: EventStreamService,
    private accessControlService: AccessControlService

  ) {}

  public init() {
    this.expenseService.init();
    this._currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.roleId = this.storageService.get(StorageKeys.CURRENT_ACCOUNT)?.role?.id;
  }
  public dataload(data: any) {
    this.getDataLoad.next(data);
  }
  public get expenseDetail() {
    return this._expenseDetail;
  }

  public set expenseDetail(expenseValue){
    this._expenseDetail = expenseValue;
  }

  public get expenseType() {
    return this._expenseType;
  }

  public get expenseDetailsTableConfig() {
    if (this._expenseDetail) {
      const status = this._expenseDetail.expense_status.toLowerCase() as ExpenseStatusType;
      const statusPermited =
      (this.userPermissionService.isExpenseStatusMessagePermited(status, this._expenseType?.value ?? ExpenseType.Expense) &&
      this._expenseDetail.is_archive == '0') ||
      (this._expenseDetail.is_modified_record &&
        this.userPermissionService.userCanModify(status, this._expenseType?.value ?? ExpenseType.Expense));
        this._expenseDetailsTableConfig.columnList[this._extenseTypeColumnIndex].isNoOption = this.isAssignmentLoaded ? (!statusPermited || this.accessRemoved) : true;
        this._expenseDetailsTableConfig.isCreate = this.isAssignmentLoaded ? (statusPermited && !this.accessRemoved) : false;
        this._expenseDetailsTableConfig.title = this._expenseType?.value === ExpenseType.MiscExpense ? 'Misc. Expenses' : 'General Expenses';

        var _expenseDetailsTableConfigData =  Object.assign({}, this._expenseDetailsTableConfig);
        var columnList = this._expenseDetailsTableConfig.columnList;
        const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
        const is_tax_hidden = currentProgram.config?.is_tax_hidden || false;
        const amountColumns = ['total_tax_amount', 'totalamount','vendor_amount_with_tax','total_client_billable_amount','msp_amount_with_tax','vendor_amount_without_tax'];
            if(this._expenseType?.value === ExpenseType.MiscExpense){
              _expenseDetailsTableConfigData.columnList = this.getMiscColumnData(columnList);

              const hybrid_fee_funded = this._expenseDetail?.expenseDetail?.length ? this._expenseDetail?.expenseDetail[0]['hybrid_fee_funded'] : false;
              if (hybrid_fee_funded) {
                let MSPTaxIndex = _expenseDetailsTableConfigData?.columnList?.findIndex(h => h?.name === 'totalamount');
                const vmsAmt = { title: 'Total VMS Amount', name: 'vms_amount_with_tax', isCurrency: true };
                const mspPartnerAmt = { title: 'Total MSP Partner Amount', name: 'msp_partner_amount_with_tax', isCurrency: true}
                _expenseDetailsTableConfigData?.columnList?.splice(MSPTaxIndex + 1, 0, vmsAmt );
                MSPTaxIndex++;
                _expenseDetailsTableConfigData?.columnList?.splice(MSPTaxIndex + 1, 0, mspPartnerAmt);
              }
              let isTaxHidden = false
              _expenseDetailsTableConfigData?.columnList?.forEach((element,index) => {
                if(element?.title?.toLowerCase() == 'expense type'){
                  _expenseDetailsTableConfigData.columnList[index].isVieworEdit = this.accessControlService.accessControl();
                  _expenseDetailsTableConfigData.columnList[index].isDelete= this.accessControlService.accessControl();
                }
                if(is_tax_hidden && element?.name?.toLowerCase() == 'total_tax_amount'){
                  _expenseDetailsTableConfigData?.columnList?.splice(index, 1);
                }
                if (amountColumns.find((type) => type === element?.name) && this.expenseConfiguration?.expense_config?.exp_amnt_based_on_role?.value?.includes(this.roleId)) {
                  isTaxHidden = true
                }
                if (element.title == 'Total Amount Without Tax' || element.title == 'Conversion Fee Amount' || element.name == 'expense_amount') {
                  _expenseDetailsTableConfigData.columnList[index].title = 'Misc. Expense Amount';
                }
                if (element.name == 'totalamount') {
                  _expenseDetailsTableConfigData.columnList[index].title = 'Total Misc. Expense Amount';
                }
              });           
              if(isTaxHidden) {
                _expenseDetailsTableConfigData.columnList = _expenseDetailsTableConfigData?.columnList.filter((value) => !amountColumns.includes(value.name));
              } 
            }else{
              let isTaxHidden = false;
              _expenseDetailsTableConfigData.columnList = this.getGeneralColumnData(columnList);
              _expenseDetailsTableConfigData.columnList.forEach((element,index) => {
                if(element?.title?.toLowerCase() == 'expense type'){
                  _expenseDetailsTableConfigData.columnList[index].isVieworEdit = this.accessControlService.accessControl();
                  _expenseDetailsTableConfigData.columnList[index].isDelete= this.accessControlService.accessControl();
                }
                if (amountColumns.find((type) => type === element.name) && this.expenseConfiguration?.expense_config?.exp_amnt_based_on_role?.value?.includes(this.roleId)) {
                  isTaxHidden = true;
                }
                if (element.title == 'Total Amount Without Tax' || element.title == 'Conversion Fee Amount' || element.name == 'expense_amount') {
                  _expenseDetailsTableConfigData.columnList[index].title = 'General Expense Amount';
                }
                if (element.name == 'totalamount') {
                  _expenseDetailsTableConfigData.columnList[index].title = 'Total General Expense Amount';
                }
              });   
              if(isTaxHidden) {
                _expenseDetailsTableConfigData.columnList = _expenseDetailsTableConfigData?.columnList.filter((value) => !amountColumns.includes(value.name));
              }  
            }
      return _expenseDetailsTableConfigData;
    }
  }
  getGeneralColumnData(columnList):any{
    var generalColumnList = [];
    columnList.forEach(element => {
      if(
        element.name == ExpenseColumns.ExpenseType ||
        element.name == ExpenseColumns.DateIncurred ||
        element.name == ExpenseColumns.Attachment ||
        element.name == ExpenseColumns.Notes ||
        element.name == ExpenseColumns.TotalAmount ||
        element.name == ExpenseColumns.TotalClientTaxAmount ||
        element.name == ExpenseColumns.TotalAmountWithoutTax ||
        element.title == 'Total General Expense Amount' ||
        element.title == 'Conversion Fee Amount'
      ){
        generalColumnList.push(element);
      }
    });
    return generalColumnList;
  }

  getMiscColumnData(columnList):any{
    var miscColumnList = [];
    let userRole = this.storageService.get('account').role.organization_category.toLowerCase();
            switch (userRole.toUpperCase()) {
              case UserType.Super_org: 
              columnList.forEach(element => {
                if(
                  element.name == ExpenseColumns.ExpenseType ||
                  element.name == ExpenseColumns.DateIncurred ||
                  element.name == ExpenseColumns.Attachment ||
                  element.name == ExpenseColumns.Notes ||
                  element.name == ExpenseColumns.TotalAmount ||
                  element.name == ExpenseColumns.TotalMspAmount ||
                  element.name == ExpenseColumns.VendorAmount ||
                  element.name == ExpenseColumns.TotalClientTaxAmount ||
                  element.name == ExpenseColumns.TotalVendorAmount ||
                  element.name == ExpenseColumns.TotalClientBillableAmount ||
                  element.name == ExpenseColumns.TotalAmountWithoutTax ||
                  element.title == 'Conversion Fee Amount'
                ){
                  miscColumnList.push(element);
                }
              });              
                break;
              case UserType.Client:
              columnList.forEach(element => {
                  if(
                    element.name == ExpenseColumns.ExpenseType ||
                    element.name == ExpenseColumns.DateIncurred ||
                    element.name == ExpenseColumns.Attachment ||
                    element.name == ExpenseColumns.Notes ||
                    element.name == ExpenseColumns.TotalAmount ||
                    element.name == ExpenseColumns.TotalClientTaxAmount ||
                    element.name == ExpenseColumns.TotalClientBillableAmount ||
                    element.name == ExpenseColumns.TotalAmountWithoutTax ||
                    element.title == 'Conversion Fee Amount'
                  ){
                    miscColumnList.push(element);
                  }
              });               
                break;  
              case UserType.Vendor: 
              columnList.forEach(element => {
                if(
                  element.name == ExpenseColumns.ExpenseType ||
                  element.name == ExpenseColumns.DateIncurred ||
                  element.name == ExpenseColumns.Attachment ||
                  element.name == ExpenseColumns.Notes ||
                  element.name == ExpenseColumns.TotalAmount ||
                  element.name == ExpenseColumns.VendorAmount ||
                  element.name == ExpenseColumns.TotalClientTaxAmount ||
                  element.name == ExpenseColumns.TotalVendorAmount ||
                  element.name == ExpenseColumns.TotalAmountWithoutTax ||
                  element.title == 'Conversion Fee Amount'
                ){
                  miscColumnList.push(element);
                }
              });                
                break;
              case UserType.MSP: 
              columnList.forEach(element => {
                if(
                  element.name == ExpenseColumns.ExpenseType ||
                  element.name == ExpenseColumns.DateIncurred ||
                  element.name == ExpenseColumns.Attachment ||
                  element.name == ExpenseColumns.Notes ||
                  element.name == ExpenseColumns.TotalAmount ||
                  element.name == ExpenseColumns.TotalMspAmount ||
                  element.name == ExpenseColumns.VendorAmount ||
                  element.name == ExpenseColumns.TotalClientTaxAmount ||
                  element.name == ExpenseColumns.TotalVendorAmount ||
                  element.name == ExpenseColumns.TotalClientBillableAmount ||
                  element.name == ExpenseColumns.TotalAmountWithoutTax ||
                  element.title == 'Conversion Fee Amount'
                ){
                  miscColumnList.push(element);
                }
              });               
                break;
              case UserType.Worker:
                columnList.forEach(element => {
                  if(
                    element.name == ExpenseColumns.ExpenseType ||
                  element.name == ExpenseColumns.DateIncurred ||
                  element.name == ExpenseColumns.Attachment ||
                  element.name == ExpenseColumns.Notes ||
                  element.name == ExpenseColumns.TotalAmount ||
                  element.name == ExpenseColumns.TotalAmountWithoutTax ||
                  element.title == 'Conversion Fee Amount'
                  ){
                    miscColumnList.push(element);
                  }
                });              
                break;
              default: columnList.forEach(element => {
                if(
                  element.name == ExpenseColumns.ExpenseType ||
                  element.name == ExpenseColumns.DateIncurred ||
                  element.name == ExpenseColumns.Attachment ||
                  element.name == ExpenseColumns.Notes ||
                  element.name == ExpenseColumns.TotalAmount ||
                  element.name == ExpenseColumns.TotalAmountWithoutTax ||
                  element.title == 'Conversion Fee Amount'                 
                ){
                  miscColumnList.push(element);
                }
              });
                break;
            }
    
    return miscColumnList;
  }

  public getCustomFieldUpdatedData(assignmentId: string, hierarchyId: string): Observable<any> {
    return this.http
      .get(`/expense/programs/${this._currentProgram.id}/config/${hierarchyId}/assignment/${assignmentId}/projects`)
      .pipe(map((res: any) => res.data));
  }

  public getExpenseSingleDetail(id: string): ExpenseSingleDetailModelData {
    const expenseDetailIndex = this._expenseDetail.expenseDetail?.map(item => item.expense_detail_id).indexOf(id);
    const expenseSingleDetail: any = expenseDetailIndex !== -1 ? this.expenseDetail.expenseDetail[expenseDetailIndex] : null;
    if(typeof this._expenseType !== "undefined" ) expenseSingleDetail.expense_category = this._expenseType.name;
    expenseSingleDetail.taxes = this._expenseDetail?.taxes;
    return expenseSingleDetail;
  } 

  public getExpenseDetailsById(expenseId: string, showLoader: boolean, params?: object) {
    if (showLoader) {
      this.loader.show();
    }
    this.http
      .get(`/expense/programs/${this._currentProgram.id}/expense/${expenseId}`, null, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({next:
        (result:any) => {
          if (result.status === 200 && result.data) {
            this._expenseDetail = result.data;
            const roleAccess = this.storageService.get('account')?.role?.access;
            if((roleAccess === AccessType?.OWN) && this._expenseDetail?.is_own_access){
              const _url = this._expenseDetail.expense_type === 'Misc Expense' ? 'misc' : 'general';
              this.router.navigate([`/expense/${_url}/all`]);
            }
            this.getExpenseList();
            this._expenseType =
              this._expenseDetail.expense_type === 'Misc Expense'
                ? { value: ExpenseType.MiscExpense, name: 'Miscellaneous Expense' }
                : { value: ExpenseType.Expense, name: 'General Expense' };
            this.expenseService.setExpenseType(this._expenseType);
            this.getAssignmentData(this._expenseDetail.assignment.id).subscribe({next:
              (res: AssignmentDetails) => {
                this.assignment = res.assignment;
                this._expenseDetail.assignment_manager = this.assignment?.assignment_manager;
                this.currency = res.finance.currency;
                this.getDefaultConfig(this._expenseDetail.hierarchy.id).subscribe((config:any) => {
                  this.expenseConfiguration = config;
                  const { accessRemoved } = this.checkExpenseActive(
                    config,
                    this.assignment.end_date,
                    this._expenseType,
                  );
                  this.isAssignmentLoaded = true;
                  this.accessRemoved = accessRemoved;
                });
                this.getExpenseList();
              },error:
              // tslint:disable-next-line: quotemark
              () => this.showError("Can't get assignment data"),
          });
            if (showLoader) {
              this.loader.hide();
            }
          }
        },error:
        error => {
          this.showError(error);
          this.navigateBackToList();
          this.loader.hide();
          return throwError(error);
        },
  });
  }
  public getHierarchyID(expenseId: string, showLoader: boolean, params?: object) {
    if (showLoader) {
      this.loader.show();
    }
    return this.http.get(`/expense/programs/${this._currentProgram.id}/expense/${expenseId}`, null, params).pipe(
      catchError(res => {
        if (res?.error?.error?.message) {
          this.showError(res.error.error.message);
        }
        return of(res);
      }))

    }

  public navigateBackToList() {
    this.router.navigate([
      this._expenseDetail?.expense_type === 'Misc Expense' ? NavigationPaths.user.miscList() : NavigationPaths.user.generalList(),
    ]);
  }

  public submitExpenseForApprovalById(expenseId: string, type: string) {
    this.loader.show();
    this.http
      .post(`/expense/programs/${this._currentProgram.id}/submit-expense/${expenseId}`, { submit: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({next:
        () => {
          this.getExpenseDetailsById(expenseId, false);
          this.loader.hide();
          this.alertService.success((type?.toLowerCase() === 'misc expense' ? 'Miscellaneous Expense' : 'General Expense') + ' submitted successfully');
          let url = type?.toLowerCase() === 'misc expense' ? '/expense/misc/submitted':  '/expense/general/submitted';
          this.router.navigateByUrl(url);
        },error:
        error => {
          this.loader.hide();
          this.showError(error);
        },
  });
  }

  public getExpenseList(sortBy?: string) {
    let expenseList = this._expenseDetail.expenseDetail.map(item => {
      return {
        expense_id: item.expense_id,
        expense_detail_id: item.expense_detail_id,
        expense_category: this._expenseDetail.expense_type,
        expensetype: {
          title: item.expense_type.title,
          icon: item.expense_type.icon,
        },
        dateincurred:
          item.item_start_date || item.item_end_date
            ? `${this.localDatePipe.transform(item.item_start_date,'','','',true)} to ${this.localDatePipe.transform(item.item_end_date,'','','',true )}`
            : null,
        attachment: item.attachment.length
          ? item.attachment.map(attachment => this.formHelperService.attachmentPathByExtension(attachment))
          : null,
        notes: item?.expense_item_notes && item?.expense_item_notes !== 'null' ? item?.expense_item_notes : null,
        totalamount: { amount: (item?.calculation?.total_amount ? +item?.calculation?.total_amount : null), currency: this.currency ?? ' ' },
        expense_amount: { amount: (item?.calculation?.expense_amount ? +item?.calculation?.expense_amount : null), currency: this.currency ?? ' ' },
        msp_amount_with_tax: { amount: (item?.calculation?.msp_amount_with_tax ? +item?.calculation?.msp_amount_with_tax : null), currency: this.currency ?? ' ' },
        // msp_tax_amount: { amount: +item.calculation.msp_tax_amount || null, currency: this.currency ?? ' ' },
        vendor_amount_without_tax: { amount: (item?.calculation?.vendor_amount_without_tax ? +item?.calculation?.vendor_amount_without_tax : null), currency: this.currency ?? ' ' },
        total_tax_amount: { amount: (item?.calculation?.total_tax_amount ? +item?.calculation?.total_tax_amount : null), currency: this.currency ?? ' ' },
        vendor_amount_with_tax: { amount: (item?.calculation?.vendor_amount_with_tax ? +item?.calculation?.vendor_amount_with_tax : null), currency: this.currency ?? ' ' },
        total_client_billable_amount: { amount: (item?.calculation?.total_amount ? +item?.calculation?.total_amount : null), currency: this.currency ?? ' ' },
        vms_amount_with_tax: { amount: (item?.calculation?.vms_amount_with_tax ? +item?.calculation?.vms_amount_with_tax : null), currency: this.currency ?? ' ' },
        msp_partner_amount_with_tax: { amount: (item?.calculation?.msp_partner_amount_with_tax ? +item?.calculation?.msp_partner_amount_with_tax : null), currency: this.currency ?? ' ' },
        
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
        custom_data : this.getExpenseSingleDetail(item.expense_detail_id) || null
      };
    });

    if (sortBy) {
      expenseList = expenseList.sort((a, b) => new Date(b[sortBy + '_at']).getTime() - new Date(a[sortBy + '_at']).getTime());
    }
    var totalUserAmount;
    if(this._expenseDetail.expense_type.toLocaleLowerCase() == 'expense'){
      totalUserAmount = expenseList.reduce((n, { total_client_billable_amount }) => n + total_client_billable_amount.amount, 0)
    }else{
      const userRole: string = this.userPermissionService.currentUserRole();
      switch (userRole) {
        case UserType.Vendor: totalUserAmount = expenseList.reduce((n, { vendor_amount_with_tax }) => n + vendor_amount_with_tax.amount, 0)       
          break;
        case UserType.MSP: totalUserAmount = expenseList.reduce((n, { total_client_billable_amount }) => n + total_client_billable_amount.amount, 0)       
          break;
        case UserType.Client: totalUserAmount = expenseList.reduce((n, { total_client_billable_amount }) => n + total_client_billable_amount.amount, 0)        
          break;    
        default: totalUserAmount = expenseList.reduce((n, { total_client_billable_amount }) => n + total_client_billable_amount.amount, 0)
          break;
      }
    }
    this._expenseDetailListItems = {
      expense: expenseList,
      totalAmount: { 
        amount: !isNaN(totalUserAmount) ? totalUserAmount?.toFixed(8) : totalUserAmount, 
        currency: this.currency ?? ' ' 
      },
    };
  }

  public modifyExpense(expenseId: string) {
    if (expenseId) {
      return this.http.post(`/expense/programs/${this._currentProgram.id}/modify-expense/${expenseId}`, {}).pipe(
        catchError(res => {
          if (res?.error?.error?.message) {
            this.showError(res.error.error.message);
          }
          return of(res);
        }),
      );
    }
  }

  private sendDelete(expenseItem: ExpenseListItemModel) {
    this.loader.show();
    const data = { expense_detail_uuid: expenseItem.expense_detail_id };
    this.http
      .delete(`/expense/programs/${this._currentProgram.id}/expense-detail/${expenseItem.expense_id}`, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({next:
        (result: IExpenseResponse<{ message: string }>) => {
          if (result.status === 200 && result.data) {
            this._expenseDetail.expenseDetail.splice(
              this._expenseDetail.expenseDetail.findIndex(x => x.expense_detail_id === expenseItem.expense_detail_id),
              1,
            );
            this.router.navigateByUrl(NavigationPaths.user.generalListItemDetails(expenseItem.expense_id));
            this.getExpenseList();
            this.alertService.success(result.data.message);
            this.loader.hide();
          }
        },error:
        error => {
          this.showError(error);
          this.loader.hide();
          return throwError(error);
        }},
      );
  }

  public deleteExpenseItem(expenseItem: ExpenseListItemModel) {
    this.confirmationService.confirm('', 'Are you sure you want to delete current expense?', 'Delete', 'Cancel').then(confirmed => {
      if (confirmed) {
        const expenseItemIdx = this.expenseDetail.expenseDetail.findIndex(
          (item: ExpenseDetailsModel) => item.expense_detail_id === expenseItem.expense_detail_id,
        );
        if (
          this._expenseDetail.expense_status.toLowerCase() === ExpenseStatusMessage.withdrawn ||
          this._expenseDetail.expense_status.toLowerCase() === ExpenseStatusMessage.rejected
        ) {
          this.modifyExpense(this._expenseDetail.expense_id)
            .pipe(
              mergeMap(res => {
                if (res.status === 201) {
                  return this.http.get(`/expense/programs/${this._currentProgram.id}/expense/${res.data.expense_uuid}`);
                }
              }),
              takeUntil(this.destroy$),
            )
            .subscribe((res:any) => {
              this._expenseDetail = res.data;
              const deletedItem = res.data.expenseDetail[expenseItemIdx];
              this.sendDelete(deletedItem);
            });
        } else {
          this.sendDelete(expenseItem);
        }
      }
    });
  }

  public getAssignmentData(assignmentId: string): Observable<any> {
    return this.expenseService.getAssignmentDetails(this._currentProgram.id, assignmentId).pipe(takeUntil(this.destroy$));
  }

  public getAssignmentBudget(assignmentId: string) {
    return this.assignmentService.getBudgetDetails(this._currentProgram.id, assignmentId).pipe(map((data: any) => data.data.budget));
  }

  public getDefaultConfig(hierarchyId: string): Observable<IExpenseConfigData> {
    return this.http.get(`/expense/programs/${this._currentProgram.id}/default-config/${hierarchyId}`).pipe(
      map((res:any) => res.data),
      takeUntil(this.destroy$),
    );
  }

  public getRevisionHistory(expenseId: string, searchParams = { page: 1, limit: 10 }): Observable<any> {
    return this.http.get(`/expense/programs/${this._currentProgram.id}/expense/${expenseId}/revisions`, '', searchParams).pipe(
      map((res:any) => res.data),
      takeUntil(this.destroy$),
    );
  }

  public changeDateByConfigValue(initialDate: string, value: number, type: string) {
    const date = new Date(initialDate);
    if (type.toLowerCase() === 'month') {
      date.setMonth(date.getMonth() + Number(value));
    } else {
      value = type.toLowerCase() === 'weeks' ? value * 7 : value;
      date.setDate(date.getDate() + Number(value));
    }
    return date;
  }

  public checkExpenseActive(res: IExpenseConfigData, endDate: string, expenseType: IExpenseType) {
    const expenseConfigInactive = res.status === 'inactive';
    const expenseModuleDisabled = res?.status === 'inactive';
    let expenseInactiveMessage = '';
    if (expenseConfigInactive) {
      expenseInactiveMessage =
        'Expense Configuration is made Inactive for your Hierarchy. For Additional details please contact the Admin.';
    } else if (expenseModuleDisabled) {
      expenseInactiveMessage = 'Expense module is disabled for your Hierarchy. For Additional details please contact the Admin.';
    }
    const assignmentEndDate = new Date(endDate).toISOString().slice(0, 10);
    let expiredDate = new Date(endDate);
    if (!res.expense_config.remove_worker_access_general.value) {
      res.expense_config.remove_worker_access_general = {
        value: res.expense_config.remove_worker_access_general,
        type: 'Days',
      };
    }
    if (!res.expense_config.remove_vendor_access_general.value) {
      res.expense_config.remove_vendor_access_general = {
        value: res.expense_config.remove_vendor_access_general,
        type: 'Days',
      };
    }
    if (!res.expense_config.remove_vendor_access_misc.value) {
      res.expense_config.remove_vendor_access_misc = {
        value: res.expense_config.remove_vendor_access_misc,
        type: 'Days',
      };
    }
    const userRole: string = this.userPermissionService.currentUserRole();
    const user = this.storageService.get('user');
    const isWorker = user?.is_candidate;
    if (isWorker && expenseType.value === ExpenseType.Expense && res.expense_config.remove_worker_access_general.value !== 0) {
      expiredDate = this.changeDateByConfigValue(
        assignmentEndDate,
        res.expense_config.remove_worker_access_general.value,
        res.expense_config.remove_worker_access_general.type,
      );
    } else if (
      UserType.Vendor === userRole &&
      (res.expense_config.remove_vendor_access_misc.value !== 0 || res.expense_config.remove_vendor_access_general.value !== 0)
    ) {
      const removeAccessValue =
        expenseType.value === ExpenseType.MiscExpense
          ? res.expense_config.remove_vendor_access_misc
          : res.expense_config.remove_vendor_access_general;
      expiredDate = this.changeDateByConfigValue(assignmentEndDate, removeAccessValue.value, removeAccessValue.type);
    } else if (
      UserType.MSP === userRole &&
      (res.expense_config.remove_msp_access_general.value !== 0 || res.expense_config.remove_msp_access_misc.value !== 0)
    ) {
      const removeMspAccess =
        expenseType.value === ExpenseType.MiscExpense
          ? res.expense_config.remove_msp_access_misc
          : res.expense_config.remove_msp_access_general;
      expiredDate = this.changeDateByConfigValue(assignmentEndDate, removeMspAccess.value, removeMspAccess.type);
    }
    const accessRemoved = expiredDate < new Date();
    return { expenseConfigInactive, expenseModuleDisabled, expenseInactiveMessage, accessRemoved };
  }

  public unsubscribe() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  showError(err) {
    window.scrollTo(0, 0);
    let logs: Log = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        logs?.messages?.push(msg?.message);
      }
    });
    this.eventStream.emit(new EmitEvent(Events.SHOW_EXPENSE_LOGS, logs));
  }
}
