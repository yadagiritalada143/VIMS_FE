import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AssignmentService } from '../../assignment.service';
import { BudgetLabels } from './budget.enums';
import { IBudget, IBudgetChartItem } from './budget.interfaces';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Observable } from 'rxjs-compat/Observable';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ColumnsColorScheme, DonutColorScheme, DetailsChartColors, ApprovalChartColors } from './charts.const';
import { Subscription } from 'rxjs';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AccuracyConfigEnum } from '../../enums/accuracy-config';
import { SourcingModel }from '../../enums/assignment-sourcing-models';
import {Location} from '@angular/common';
@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss']
})
export class BudgetComponent implements OnInit, OnChanges, OnDestroy {
  @Input() assignmentData;
  @Input() openBudgetPanel: boolean;
  @Input() hasPendingRequest: boolean;
  @Input() isLock:boolean = false;

  @Output() updateAssignment = new EventEmitter();
  @Output() updateLockStatus = new EventEmitter();
  isAddAdditionalBudget = 'hidden';
  budget: IBudget;
  programId: string;
  assignmentId: string;
  type: any;
  public isOpenTimesheetAwaiting = false;
  public isOpenExpenseAwaiting = false;

  public detailsChartData: IBudgetChartItem[];
  public awaitingApprovalChartData: IBudgetChartItem[];
  public approvedChartData: IBudgetChartItem[];
  public detailsChartColorScheme= DonutColorScheme;
  public awaitingApprovalChartColorScheme = ColumnsColorScheme;
  public hideApprovalChart = false;
  public hideApprovedChart = false;
  public additionalBudget$: Observable<any>;

  public readonly BudgetLabels = BudgetLabels;

  public isOpenAddBudget = false;
  public fullNotes = false;

  private subscrptions: Subscription[] = [];
  public dateformat: any;
  accuracyConfig = AccuracyConfigEnum;
  SourcingModel = SourcingModel;
  public _assignmentConfig: any;
  @Input('assignmentConfig') set assignmentConfig(value:any){
    this._assignmentConfig = value;
  }
  get assignmentConfig() {
    return this._assignmentConfig;
  }
  constructor(
    private AssignmentService: AssignmentService,
    private SessionStorage: StorageService,
    private route: ActivatedRoute,
    private _loader: LoaderService,
    private changeDetectorRef: ChangeDetectorRef,
    private eventStream: EventStreamService,
    private alertService: AlertService,
    private router: Router,
    public datePipe: LocalDateFormatPipe,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.ADD_ADDITIONAL_BUDGET).subscribe((value : boolean)=>{
      if(value){
        this.isOpenAddBudget=true;
      }
    }));

    if (this.openBudgetPanel) {
      setTimeout(() => {
        this.isOpenAddBudget = true;
        setTimeout(() => {
          this.eventStream.emit(new EmitEvent(Events.ADD_ADDITIONAL_BUDGET, true));
        });
      }, 100);
        // this.router.navigate([], {
        //   queryParams: {
        //     openPanel: null,
        //   },
        //   queryParamsHandling: 'merge'
        // });
    }
    if(String(this.route.snapshot.queryParams['openTimesheetListTab']) == "true") {
      this.openTimesheetApproval(this.route.snapshot.queryParams['status']);
    }
    if(String(this.route.snapshot.queryParams['openExpenseListTab']) == "true") {
      this.openExpenseApproval(this.route.snapshot.queryParams['status']);
    }
    let programID = this.SessionStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programID['id'];
    this.assignmentId = this.route.snapshot.params.id;  
    this.type = this.route.snapshot.params.type;
    this.dateformat = this.AssignmentService.getDefaultDateFormat();
    this.getBudjetDetails();
    this.getAdditionalBudget();
  }

  ngOnChanges() {
    this.route.queryParams
      .subscribe(params => {
        this.type = params?.type;
        if (params?.tab === 'budget') {
          if (this.type === 'timesheet') {
            this.openTimesheetApproval(params?.status);
          } else if (this.type === 'expense') {
            this.openExpenseApproval(params?.status);
          }
        }
      }
      );
  }

  getDateAssignmentDate(assignmentStartDate:any){
    return this.datePipe.transform(assignmentStartDate, this.dateformat , '' ,'', true);
  }

  getBudjetDetails() {
    this._loader.show()
    this.subscrptions.push(this.AssignmentService.getBudgetDetails(this.programId, this.assignmentId).subscribe({next:
      (data: any) => {
      this.budget = data.data.budget;
      this.detailsChartData = [
        { amount: this.budget.total_spend, label: BudgetLabels.SpendApproved },
        { amount: this.budget.left_budget, label: BudgetLabels.TotalRemaining },
        { amount: this.budget.total_pending_approval, label: BudgetLabels.AwaitingApproval },
      ].sort((a:any, b:any) => +b['amount'] - a['amount']);
      this.detailsChartColorScheme=[];
      this.detailsChartData.forEach(data =>{
        this.detailsChartColorScheme.push(this.findColor('details', data.label) );
      });
      if(this.detailsChartColorScheme?.length == 0){
        this.detailsChartColorScheme= DonutColorScheme;
      }
      this.awaitingApprovalChartData = [
        { amount: this.budget.expense_pending_approval, label: BudgetLabels.GeneralExpense },
        { amount: this.budget.timesheet_pending_approval, label: BudgetLabels.Timesheet }
      ];
      this.approvedChartData = [
        { amount: this.budget.total_spend_expenses, label: BudgetLabels.GeneralExpense },
        { amount: this.budget.total_spend_timesheet, label: BudgetLabels.Timesheet }
      ];
      this.hideApprovalChart = this.awaitingApprovalChartData.every(({ amount }) => amount == 0);
      this.hideApprovedChart = this.approvedChartData.every(({ amount }) => amount == 0);
      // if(this.isLock) {
      //   this.updateLockStatus.emit({ lockStatus: data?.data?.budget?.is_lock, message: data?.data?.budget?.alerts?.message});
      // }
      this._loader.hide();
      this.changeDetectorRef.detectChanges();
    }, error: (err) => {
      this._loader.hide();
    }}));
  };

  getAdditionalBudget() {
    this.additionalBudget$ = this.AssignmentService.getAdditionalBudgetList(this.programId, this.assignmentId);
  }

  public toggleIsOpenAddBudget() {
    this.isOpenAddBudget = !this.isOpenAddBudget;
  }

  public openAddAdditionalBudget() {
    if (!this.hasPendingRequest) {
      this.toggleIsOpenAddBudget();
      setTimeout(() => {
        this.eventStream.emit(new EmitEvent(Events.ADD_ADDITIONAL_BUDGET, true));
      });
    } else {
      this.alertService.warn('You already have additional budget.');
    }
  }

  public findColor(chartName: string, paramLabel: string) {
    const chartColors = chartName === 'details' ? DetailsChartColors : ApprovalChartColors;
    return chartColors && chartColors.find(({ label }) => label === paramLabel).color;
  }

  public toggleIsOpenTimesheetAwait() {
    this.isOpenTimesheetAwaiting = !this.isOpenTimesheetAwaiting;
    var url = this.router.createUrlTree([],{queryParams: {tab: 'budget'}}).toString();
    this.location.go(url);
  }

  public toggleIsOpenExpenseAwait() {
    this.isOpenExpenseAwaiting = !this.isOpenExpenseAwaiting;
    var url = this.router.createUrlTree([],{queryParams: {tab: 'budget'}}).toString();
    this.location.go(url);
  }

  public openExpenseApproval(status: string) {
    this.toggleIsOpenExpenseAwait();
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.EXPENSE_AWAITING_APPROVAL, status));
      var url = this.router.createUrlTree([], { queryParams: {type: 'expense', status: status},queryParamsHandling: 'merge'}).toString();
      this.location.go(url);
    });
  }

  public openTimesheetApproval(status: string) {
    this.toggleIsOpenTimesheetAwait();
    setTimeout( () => {
      this.eventStream.emit(new EmitEvent(Events.TIMESHEET_AWAITING_APPROVAL, status));
      var url = this.router.createUrlTree([], { queryParams: {type: 'timesheet', status: status},queryParamsHandling: 'merge' }).toString();
      this.location.go(url);
    });
  }

  public closeAddSidebar() {
    this.toggleIsOpenAddBudget();
    this.getBudjetDetails();
    this.getAdditionalBudget();
    this.updateAssignment.emit();
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
  showToolTip(amount : any, accuracyType = this.accuracyConfig.amount)
  {
    return this.AssignmentService?.showAmount(amount, this.assignmentData?.finance?.currency, accuracyType);
  }

  checkNullValue(value  : any)
  {
       if(!value){
        return "0.00";
       }
       return value;
  }
}
