import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ExpenseService } from '../../expense.service';
import { Router } from '@angular/router';
import { ExpenseType, NavigationPaths, ExpenseRoutes, ExpenseNames } from '../../enums/expense.enums';
import { IExpenseResponse, IExpenseAssignmentData } from '../../interfaces/expense-data.interfaces';
import { Observable } from 'rxjs-compat/Observable';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { UserPermissionService } from '../../services/user-permission.service';
import { WorkerModel } from '../../models/woker.model';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-expense-assignment',
  templateUrl: './expense-assignment.component.html',
  styleUrls: ['./expense-assignment.component.scss']
})
export class ExpenseAssignmentComponent implements OnInit, OnDestroy {
  // public headerTitle = 'Enter Expense';
  public clickOutside: boolean;
  public addNewExpense = 'hidden';
  public assignmentForm: UntypedFormGroup;
  public assignments = [];
  public workers$: Observable<WorkerModel[]>;
  workerSearch$ = new Subject<string>();
  workersLoading = false;
  assignmentsLoading = false;
  workers= [];
  canSearchWorkers = true;
  public workerAssignments$: Observable<any>;
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public isWorker = false;
  public readonly AssignmentClosedStatus = 'in-active';
  public isExpenseEnabled:boolean=true;
  public assignmentId: string;
  private subscrptions: Subscription[] = [];
  public noDataFound: boolean = false;
  showDownArrow: boolean = false;
  logs: Log = undefined;
  public expenseType: string;
  public expenseOption = ExpenseRoutes?.General;
  page: number = 1;
  limit: number = 25;
  totalWorkers: number;
  expenseTypeValue:string;
  expenseName:string;
  // public isBillable:boolean
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private exspenseService: ExpenseService,
    private router: Router,
    private userPermissionService: UserPermissionService,
    private expenseService: ExpenseService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    const user = this.storageService.get(StorageKeys.CURRENT_USER);
    this.isWorker = user?.is_candidate;
    this.createAssignmentForm();    
    this.subscrptions.push(this.eventStream.on(Events.EXPENSE_ASSIGNMENT).subscribe((data) => {
      this.addNewExpense = data.visibility ? 'visible' : 'hidden';
      this.expenseType = data.expenseType;
      if(this.expenseType?.toLowerCase() == ExpenseRoutes?.General?.toLowerCase()){
        this.expenseTypeValue = ExpenseType?.Expense;
        this.expenseName =  ExpenseNames?.Expense;
      }else{
        this.expenseTypeValue = ExpenseType?.MiscExpense;
        this.expenseName = ExpenseNames?.MiscExpense;
      }
      this.loadAllWorkers();
      // this.expenseType = data.expenseType == 'General'? true : false;
      // this.isBillable = data.expenseType == 'General'? false : true;
      this.clickOutside = false;
    }));
    this.workerSearch$.pipe(
      tap(_ => {
        this.workersLoading = true;
      }),
      switchMap(searchTerm => {
          return this.exspenseService.getWorkersList(searchTerm,this.expenseTypeValue,this.page).pipe(
          map((res:any) => {
            this.totalWorkers = res?.data?.total_records
            return res
          }),
          map((res:any) => res?.data?.worker.filter((worker: WorkerModel) => (worker?.user?.name || worker?.candidate?.name)))
          );        
      })
    ).subscribe({next:(values:any) => {
      if(values){
        this.workers = [...this.workers, ...values];
      } else{
        this.workers = [...this.workers];
      }
      this.workersLoading = false;
    }, error: (err) => {
      this.workersLoading = false;
    },complete() {
      this.workersLoading = false;
    }
  })    
  }

  loadAllWorkers() {
    this.workersLoading = true;
    this.canSearchWorkers = false;
    this.exspenseService.getWorkersList('',this.expenseTypeValue).pipe(
      map((res: any) => {
        this.totalWorkers = res?.data?.total_records
        return res
      }),
      map((res:any) => res?.data?.worker.filter((worker: WorkerModel) => (worker?.user?.name || worker?.candidate?.name)))
    ).subscribe({next:(value:any) => {
      if(value){
        this.workers = [...this.workers, ...value];
      } else{
        this.workers = [...this.workers];
      }
      this.workersLoading = false;
      this.canSearchWorkers = true;
      if (this.isWorker) {
        this.getAssignments();
      }
    }, error: (err) => {
      this.workersLoading = false;
      this.canSearchWorkers = true;
    },complete() {
      this.workersLoading = false;
    }
  });
  }

  public sidebarClose(): void {
    this.addNewExpense = 'hidden';
    this.isExpenseEnabled= true;
    this.assignmentForm.reset();
    this.loadAllWorkers();
  }

  public selectAssignment(event: any): void {
    if (event) {
      this.assignmentId = event.uuid || event.assignment_uuid;
      const misc_expense = 'misc';
      if(this.expenseType?.toLowerCase() == misc_expense){
        this.isExpenseEnabled = true;
      }else{
        if(event?.finance){
          this.isExpenseEnabled= event?.finance?.is_expense_enabled;
        }else{
          this.isExpenseEnabled= event?.is_expense_enabled;
        }
      }
    }
  }

  public continue(): void {
    this.expenseService.expenseType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.router.navigateByUrl(type.value === ExpenseType.MiscExpense
          ? NavigationPaths.user.miscNewItemDetails(this.assignmentId)
          : NavigationPaths.user.generalNewItemDetails(this.assignmentId));
      });
  }

  public get currentUserRole(): string {
    return this.userPermissionService.currentUserRole();
  }

  public selectWorker(workerId: string) {
    this.assignmentsLoading = true;
    this.workerAssignments$ = this.exspenseService.getWorkerAssignment(workerId,this.expenseTypeValue).pipe(map((res: any) => {
      if(!res?.data ||res?.data && res?.data?.length === 0){
        this.noDataFound = true;
        this.assignmentsLoading = false;
      } else{
        this.noDataFound = false;
      }
      return res.data;
    }), tap(data => {
      if(data && data?.length === 1){
        this.showDownArrow = false;
        this.assignmentForm.get('assignment_select').setValue(data[0]);
        this.assignmentForm.get('assignment_select').updateValueAndValidity();
        this.assignmentId = data[0]?.assignment_uuid;
        const misc_expense = 'misc';
        if(this.expenseType?.toLowerCase() == misc_expense){
          this.isExpenseEnabled = true;
        }else{
          this.isExpenseEnabled= data[0]?.is_expense_enabled;
        }
      } else{
        this.showDownArrow = true;
        this.assignmentForm.get('assignment_select').reset();
      }
      this.setDefaultAssignment();
      this.assignmentsLoading = false;
    }));
  }

  public searchWorker(search: { term: string, items: Array<string>}) {
    this.page = 1;
    this.workers = [];
    this.workerSearch$.next(search.term);
  }
  loadMoreWorkerData(searchTerm) {
    searchTerm = !!searchTerm ? searchTerm : '';
    if((this.page *  this.limit)  < this.totalWorkers) {
      this.page = this.page + 1;
      this.workerSearch$.next(searchTerm);
    }
  }
  private createAssignmentForm(): void {
    if (!this.isWorker) {
      this.assignmentForm = this.fb.group({
        worker: [null, Validators.required],
        assignment_select: [null, Validators.required]
      });
    } else {
      this.assignmentForm = this.fb.group({
        assignment_select: [null, Validators.required]
      });
    }
  }

  private getAssignments(): void {
    if(!this.workers || this.workers.length == 0 || !this.workers[0]?.worker_id){
      return;
    }
    
    this.assignmentsLoading= true;
    
    this.subscrptions.push(this.expenseService.getWorkerAssignment(this.workers[0]?.worker_id, this.expenseTypeValue)
      .pipe(map((res: IExpenseResponse<{ assignment: Array<IExpenseAssignmentData> }>) => res.data), takeUntil(this.destroy$))
      .subscribe({next:(data:any) => {
        if (!data  && data?.length === 0) {
          this.noDataFound = true;
        } else {
          this.noDataFound = false;
        }
        this.assignments = data;
        if (this.assignments?.length === 1) {
          this.assignmentId = this.assignments[0].assignment_uuid;
          if(this.expenseType?.toLowerCase() == ExpenseRoutes?.Misc.toLowerCase()){
            this.isExpenseEnabled = true;
          }else{
            this.isExpenseEnabled = this.assignments[0]?.finance?.is_expense_enabled;
          }
          this.assignmentForm.get('assignment_select').setValue(this.assignments[0]);
          this.assignmentForm.get('assignment_select').updateValueAndValidity();
        }
        this.setDefaultAssignment();      
        
        this.assignmentsLoading= false;
        //}, err => this.alertService.error(errorHandler(err))));
      },error: err => {
        this.showError(err);
        this.assignmentsLoading= false;
      }}));
  }

  setDefaultAssignment(){
    const assignment_uuid = this.storageService.get(StorageKeys?.ASSIGNMENT_UUID);
        if(assignment_uuid && this.isWorker){
          this.assignments.forEach(assignment => {
            if(assignment?.assignment_uuid == assignment_uuid){
              if(this.expenseType?.toLowerCase() == ExpenseRoutes?.General?.toLowerCase()){
              this.isExpenseEnabled = assignment?.is_expense_enabled;
              }
              this.assignmentId = assignment?.assignment_uuid;
              this.assignmentForm.get('assignment_select').setValue(assignment);
            }          
          });
        }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.subscrptions?.forEach(sub => sub.unsubscribe());
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
}
