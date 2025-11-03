import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { VMSConfig } from 'src/app/library/simple-table/simple-table/simple-table.model';
import {ExpenseDetailService} from './expense-detail.service';
import {ExpenseModel} from '../../models/expense.model';
import {ExpenseListItemModel, ExpenseListModel} from '../../models/expense-list-item.model';
import {takeUntil} from 'rxjs/operators';
import {ExpenseStatusMessage, NavigationPaths} from '../../enums/expense.enums';
import { AttachmentByExtension } from '../../services/form-helper/form-helper.service';
import { AssignmentDataModel } from '../../models/assignment.model';
import { IExpensesItem, IExpensesVmsData } from '../expenses-list/expenses-list-interfaces';
import { RevisionHistoryTableModel } from './expense-detail-table-model';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ExpenseType } from '../../enums/expense.enums';
import { ExpenseStatus,UsersType} from 'src/app/shared/enums';
import { Location } from '@angular/common';


@Component({
  selector: 'app-expense-detail',
  templateUrl: './expense-detail.component.html',
  styleUrls: ['./expense-detail.component.scss'],
})
export class ExpenseDetailComponent implements OnInit, OnDestroy {
  public redirectToSow = false;
  public redirectExpenseFlyout :string;
  public assignmentID: any;
  project_id: any;
  sow_id: any;
  public expenseId: string;
  public isOpenEditing = false;
  public isOpenCreating = false;
  public isOpenDetails = false;
  public previewModalOpened = false;
  public fileDetails: AttachmentByExtension;
  public revisionTableConfig = RevisionHistoryTableModel;
  public revisionVmsData: IExpensesVmsData[];
  public totalRecords: number = 0;
  public limitRecords: number = 10;
  public is_tax_hidden = false;
  public hierarchyID: any;
  public isDataLoaded: boolean = false;
  logs: Log = undefined;
  expenseTab: string = 'expense';
  public multiApprovals:any;
  isShowMultiApproval: boolean;
  ExpenseStatus = ExpenseStatus;
  UsersType = UsersType;
  currentUserType: any;
  public ExpenseType = ExpenseType;
  current_expense_type: any;
  constructor(private eventStream: EventStreamService,
              private activatedRoute: ActivatedRoute,
              private expenseDetailService: ExpenseDetailService,
              private storageService: StorageService,
              private router: Router,
              private location: Location
  ) {
    this.activatedRoute.queryParamMap
    .subscribe((params:any) => {
      this.redirectExpenseFlyout = params['params']?.title;
      this.redirectToSow = params['params']?.redirectToSow;
      this.sow_id = params['params']?.sow_id;
      this.project_id = params['params']?.project_id;
    });
  }

  ngOnInit(): void {
    this.expenseDetailService.init();
    this.expenseId = this.activatedRoute.snapshot.paramMap.get('expenseId');
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.currentUserType = this.storageService.get(StorageKeys.USER_TYPE);
    if (currentProgram) {
      this.is_tax_hidden = currentProgram.config?.is_tax_hidden || false;
      // this.isShowMultiApproval = currentProgram.config?.multiple_approval_timesheet_expense;
    }
    this.getExpenseDetail();
    this.getRevisionHistory();
    this.expenseDetailService.getHierarchyID(this.expenseId, true, undefined).subscribe((res)=> {
      this.assignmentID = res?.data?.assignment?.id;
      this.getAssignment(res?.data?.assignment?.id);
    })

    if(this.expenseDetail){
      this.isDataLoaded = true;
    }
    this.eventStream.on(Events.SHOW_EXPENSE_LOGS).subscribe((data:any) => {
      this.logs = data
    });
    this.expenseDetailService.getDataLoad.subscribe((data:any) => {
      if(data){
        this.isDataLoaded = true;
      }
    })
  }

  getAssignment(id: any){
    this.expenseDetailService.getAssignmentData(id).subscribe((data)=> {
    this.hierarchyID = data?.assignment?.hierarchy?.id;
  })
}
  getExType(event:any){
    this.current_expense_type = event.value;
    const currentExpenseType = event.value == ExpenseType.MiscExpense ? 'misc-expenses':'expenses';
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if(currentProgram){
      const expenseType = currentExpenseType?.toUpperCase()?.replace("-", "_");
      this.isShowMultiApproval = (currentProgram?.config?.modules_using_flow_system || [])?.indexOf(expenseType) !== -1;
    }
    if (this.expenseDetail.expense_status == ExpenseStatus.pending_review) {
      this.multiApprovals = [
        { name: 'review', api_url: `/approval/programs/${currentProgram.id}/${currentExpenseType}/${this.expenseId}/approval-instances`, status: 'pending review', workflow_type: 'review', isReplaceMember: true },
      ];
    } else {
      this.multiApprovals = [
        { name: 'approval', api_url: `/approval/programs/${currentProgram.id}/${currentExpenseType}/${this.expenseId}/approval-instances`, status: 'pending approval', workflow_type: 'approval', isReplaceMember: true },
      ];
    }
  }

  public get expenseDetail(): ExpenseModel{
    return this.expenseDetailService.expenseDetail;
  }

  public get expenseList(): ExpenseListModel{
    return this.expenseDetailService._expenseDetailListItems;
  }

  public get assignment(): AssignmentDataModel {
    return this.expenseDetailService.assignment;
  }

  public get currency(): string {
    return this.expenseDetailService.currency;
  }

  public get expenseConfiguration() {
    return this.expenseDetailService.expenseConfiguration;
  }

  public get expenseType() {
    return this.expenseDetailService.expenseType;
  }

  private getExpenseDetail(params?: object) {    
    this.expenseDetailService.expenseDetail = undefined;
    this.expenseDetailService.getExpenseDetailsById(this.expenseId, true, params);
  }

  private getRevisionHistory(params?) {
    this.expenseDetailService.getRevisionHistory(this.expenseId, params).subscribe((res:any) => {
      if (res?.expenses) {
        this.revisionVmsData = res?.expenses.map((item: IExpensesItem) => {
          return {
            expense_id: item.expense_id,
            worker_name: item.worker.name,
            expense_code: item.expense_code,
            expense_status: item.expense_status,
            submitted_date: item.submitted_date || null,
            hierarchy_title: item.hierarchy.title,
            items: item.total_expense_items.toString(),
            expense_manager_name: item.expense_manager.name,
            total_billable_amount: { amount: +item.calculation.total_amount, currency: item.currency || '₹' },
            assignment_title: item.assignment.title + (item.assignment.code ? `(${item.assignment.code})` : ''),
            assignment_id: item.assignment.id
          } as IExpensesVmsData;
        });
      }
      this.totalRecords = res?.total_records;
    });
  }

  public deleteClicked(item: ExpenseListItemModel) {
    if(!this.expenseDetailService.expenseDetail.actions_allow['can_delete']){
      return;
    }
    this.expenseDetailService.deleteExpenseItem(item);
    
  }

  public onSortClick($event) {
    this.expenseDetailService.getExpenseList($event.name);
  }

  public onSearch($event) {
    const params = {
      search: $event
    };
    this.getExpenseDetail(params);
  }

  public onViewClick(item: ExpenseListItemModel) {
    if (item && item.expense_detail_id) {
      this.toggleIsOpenDetails();
      setTimeout(() => {
        this.eventStream.emit(new EmitEvent(Events.EXPENSE_DETAIL_VIEW, this.expenseDetailService.getExpenseSingleDetail(item.expense_detail_id)));
      });
    }
  }

  public navigateBackToList() {
    const userType = this.storageService.get(StorageKeys.USER_TYPE);
    if (this.redirectToSow) {
      let issow = this.activatedRoute?.snapshot?.queryParams['sow'];
      if (userType?.toLowerCase() === 'vendor') {
        if (issow) {
          this.router.navigate([`/vendor_sow/${this.sow_id}/invoicing`]);
        } else {
        this.router.navigate([`/vendor_sow/${this.sow_id}/vendor_milestones/${this.project_id}/invoicing`]);
        }
      } else {
        if (issow) {
          this.router.navigate([`/sow/${this.sow_id}/invoicing`]);
        } else {
        this.router.navigate([`/sow/${this.sow_id}/milestones/${this.project_id}/invoicing`]);
        }
      }
    } else if(!!this.redirectExpenseFlyout){
      let queryParams = { tab: 'budget', openExpenseListTab: true, status : this.redirectExpenseFlyout === 'Expense(s) Awaiting Approval' ? 'submitted' : 'approved' };
      this.router.navigate([`assignment/details/${this.assignmentID}/final`], { queryParams});
    }
    else {
      this.expenseDetailService.navigateBackToList();
    }
  }

  public get expenseDetailsTableConfig(): VMSConfig {
    return this.expenseDetailService.expenseDetailsTableConfig;
  }


  public editClick(item: ExpenseListItemModel) {
    this.toggleIsOpenEditing();
    setTimeout( () => {
      this.eventStream.emit(new EmitEvent(Events.EDI_EXPENSE, item.expense_detail_id));

      // this.eventStream.emit(new EmitEvent(Events.EDI_EXPENSE, item.expense_detail_id));
    });
  }
  public toggleIsOpenEditing() {
    if(!this.expenseDetailService?.expenseDetail?.actions_allow['can_submit']){
      this.isOpenEditing = false;
    }else{
      this.isOpenEditing = !this.isOpenEditing;
    }
  }

  public toggleIsOpenCreating() {
    this.isOpenCreating = !this.isOpenCreating;
  }
  public toggleIsOpenDetails() {
    this.isOpenDetails = !this.isOpenDetails;
  }

  public onCreateClick($event) {
    this.logs = undefined;
    if ($event) {
      if (this.expenseDetail.expense_status.toLowerCase() === ExpenseStatusMessage.withdrawn && this.expenseDetail.is_archive === '1') {
        this.expenseDetailService.modifyExpense(this.expenseDetail.expense_id)
            .pipe(takeUntil(this.expenseDetailService.destroy$))
            .subscribe({next:(res:any) => {
              const newExpenseId = res.data?.expense_uuid;
              this.router.navigateByUrl(NavigationPaths.user.generalListItemDetails(newExpenseId));
              this.expenseDetailService.getExpenseDetailsById(newExpenseId, false);
              this.toggleIsOpenCreating();
              setTimeout(() => {
                this.eventStream.emit(new EmitEvent(Events.ADD_EXPENSE, true));
              });
            },error:
            err => {
              this.showError(err);
            } });
      } else {
        this.toggleIsOpenCreating();
        setTimeout(() => {
          this.eventStream.emit(new EmitEvent(Events.ADD_EXPENSE, true));
        });
      }
    }
  }

  public openPreviewModal(event: AttachmentByExtension) {
    this.previewModalOpened = true;
    this.fileDetails = event;
  }

  public downloadFile() {
    window.location.href = this.fileDetails.downloadPath;
  }

  public onChangeRecords(records: number) {
    this.limitRecords = records || 10;
    const params = { page: 1, limit: this.limitRecords };
    this.getRevisionHistory(params);
  }

  public onHistorySearch(searchText: string) {
    const params = { search: searchText, page: 1, limit: this.limitRecords };
    this.getRevisionHistory(params);
  }

  public onPaginationClick(pageNo: number) {
    const params = { page: pageNo, limit: this.limitRecords };
    this.getRevisionHistory(params);
  }

  public onClickView(item: IExpensesVmsData) { 
    // this.router.navigateByUrl(NavigationPaths.user.generalListItemDetails(item.expense_id));
    this.router.navigate([`${NavigationPaths.user.generalListItemDetails(item.expense_id)}`], {queryParams: {redirectToSow: this.redirectToSow,sow_id: this.sow_id,project_id: this.project_id}});
    this.expenseId = item.expense_id;
    this.getExpenseDetail();
    this.getRevisionHistory();
  }

  public ngOnDestroy() {
   this.expenseDetailService.unsubscribe();
  }
  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  showExpenseTab(value) {
    this.expenseTab = value;
  }

  getModuleName() {
    return this.expenseType?.value === ExpenseType?.MiscExpense ? 'misc-expenses':'expenses';
  }
}
