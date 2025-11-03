import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ExpenseService } from '../expense.service';
import { IExpenseType } from '../interfaces/expense.interfaces';
import { ExpenseDetailService } from '../pages/expense-detail/expense-detail.service';
import { ExpenseType } from '../enums/expense.enums';
import { ApprovalPayload, EntityStatus } from '../models/update-status.model';
import { IExpenseResponse } from '../interfaces/expense-data.interfaces';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseStatusService {
  public expenseType: IExpenseType;
  public destroy$: Subject<boolean> = new Subject<boolean>();

  private readonly approvalUrl = '/approval/programs/';

  constructor(
    private http: HttpService,
    private loader: LoaderService,
    private storageService: StorageService,
    private alertService: AlertService,
    private expenseDetailService: ExpenseDetailService,
    private expenseService: ExpenseService,
    private eventStream: EventStreamService
  ) {
  }

  public getExpenseType(): void {
    this.expenseService.expenseType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.expenseType = type;
      });
  }

  public getEntityStatus(entityId: string): Observable<IExpenseResponse<EntityStatus>> {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return <Observable<IExpenseResponse<EntityStatus>>> this.http.get(this.approvalUrl + `${currentProgramId}/${this.expenseType.value}/entity/${entityId}`, '', {
      get_obj: 'False'
    });
  }

  public updateApprovalStatus(expenseId: string, payload: ApprovalPayload): Observable<{ message: string; status: number; }> {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    const approvalStatusApi =
      // this.approvalUrl + `${currentProgramId}/${entity}/${expenseId}/approval-request`;
      `/expense/programs/${currentProgramId}/expense/${expenseId}/approval-request`;
    return <Observable<{ message: string; status: number; }>> this.http.put(
      approvalStatusApi,
      payload
    );
  }

  public updateMassApproval(type: IExpenseType, entity_ids: any[]) {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http.put(this.approvalUrl + `${currentProgramId}/${type.value+'s'}/mass-approval-request`, entity_ids)
      .pipe(takeUntil(this.destroy$));
  }

  bulkApproval(entity_ids: any) {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http.post('/expense/programs/'+ `${currentProgramId}/mass-approval`, entity_ids)
      .pipe(takeUntil(this.destroy$));
  }

  public discardExpense(expenseId: string) {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http.put(`/expense/programs/${currentProgramId}/expense/${expenseId}/discard-expense`);
  }
  public approveExpense(expenseId: string, approval_chain_id: any,is_forced_approval, currentMemberId) {
    this.loader.show();
    const  payload:any = {
        status: 'APPROVED',
        status_reason: '',
        status_note: '',
        approval_chain_id: approval_chain_id,
        is_forced_approval:is_forced_approval,
      }
      if(currentMemberId){
        payload.member_id = currentMemberId;
      }
    this.updateApprovalStatus(expenseId, payload).pipe(takeUntil(this.destroy$)).subscribe({next:(res:any) => {
      this.loader.hide();
      this.alertService.success(res?.message);
      this.eventStream.emit(
        new EmitEvent(Events.APPROVAL_ACTION, {
          value: true
        }),
      );
      this.expenseDetailService.getExpenseDetailsById(expenseId, true, {is_redirect: true});
    }, error: (err) => {
      this.loader.hide();
      this.showError(err);
    }});
  }
  public releaseExpense(expenseId: string, approval_chain_id: any,is_forced_approval:any,currentMemberId:any, is_reassigned_user?) {
    this.loader.show();
    const payload:any = {
      status: 'APPROVED',
      status_reason: '',
      status_note: '',
      approval_chain_id: approval_chain_id,
      is_forced_approval:is_forced_approval,
    };
    if(is_reassigned_user){
      payload.is_reassigned_user = is_reassigned_user;
    }
    if(currentMemberId){
      payload.member_id = currentMemberId;
    }
    this.updateApprovalStatus(expenseId, payload).pipe(takeUntil(this.destroy$)).subscribe({next:(res:any) => {
      this.loader.hide();
      this.alertService.success(res?.message);
      this.eventStream.emit(
        new EmitEvent(Events.APPROVAL_ACTION, {
          value: true
        }),
      );
      this.expenseDetailService.getExpenseDetailsById(expenseId, true , {is_redirect: true});
    },error: (err) => {
      this.loader.hide();
      this.showError(err);
    }});
  }

  public rejectExpense(expenseId: string, rejectionFormValue: { status_reason: string, status_note: string },approval_chain_id,currentMemberId:any) {
    this.loader.show();
    const payload:any = {
        status: 'REJECTED',
        ...rejectionFormValue,
        approval_chain_id: approval_chain_id,
      }
      if(currentMemberId){
        payload.member_id = currentMemberId;
      }
    this.updateApprovalStatus(expenseId, payload).pipe(takeUntil(this.destroy$)).subscribe({next:(res:any) => {
      this.loader.hide();
      this.alertService.success(res?.message);
      this.eventStream.emit(
        new EmitEvent(Events.APPROVAL_ACTION, {
          value: true
        }),
      );
      this.expenseDetailService.getExpenseDetailsById(expenseId, false, {is_redirect: true});
    },error: (err) => {
      this.loader.hide();
      this.showError(err);
    }});
  }

  public deleteExpense(expenseId: string, deleteFormValue: { delete_reason: string, delete_notes: string }) {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http.post(`/expense/programs/${currentProgramId}/delete-expense/${expenseId}`, deleteFormValue);
  }

  public getListOfApprovers(expenseId: string) {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    const entity = this.expenseType.value === ExpenseType.MiscExpense ? 'misc-expenses' : 'expenses';
    return this.http.get(`/approval/programs/${currentProgramId}/${entity}/${expenseId}/approval-instances?status=PENDING`)
      .pipe(takeUntil(this.destroy$));
  }

  public getExpenseLockStatus(expense_uuid:any){
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    // expense/programs/{{program_uuid}}/expense_lock_status?expense_uuid=6931baef-744c-49da-9597-47b21a272470
    return this.http.get(`/expense/programs/${currentProgramId}/expense_lock_status?expense_uuid=${expense_uuid}`)
      .pipe(takeUntil(this.destroy$));
  }

  public unsubscribe() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  showError(err) {
    window.scrollTo(0, 0);
    let logs:Log = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        logs.messages.push(msg?.message);
      }
    });
    this.eventStream.emit(new EmitEvent(Events.SHOW_ERROR_STATUS_EXPENSE_LOGS, logs));
  }
}
