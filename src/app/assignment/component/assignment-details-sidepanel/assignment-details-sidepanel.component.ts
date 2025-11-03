import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ApprovalStatus, StatusMessageTypes } from 'src/app/shared/enums';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AssignmentService } from '../../assignment.service';
import { PendingItemTypes } from '../../enums/pending-item-types';
import { BudgetLabels } from '../budget/budget.enums';
import { IBudgetChartItem } from '../budget/budget.interfaces';
import { DetailsChartColors, DonutColorScheme } from '../budget/charts.const';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { AccuracyConfigEnum } from '../../enums/accuracy-config';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { SourcingModel } from '../../enums/assignment-sourcing-models';

@Component({
  selector: 'app-assignment-details-sidepanel',
  templateUrl: './assignment-details-sidepanel.component.html',
  styleUrls: ['./assignment-details-sidepanel.component.scss']
})
export class AssignmentDetailsSidepanelComponent implements OnInit, OnDestroy {
  @Input() public set hasPendingRequest(value : any) {
    if (value) {
      this.additionalBudget$.subscribe(res => {
        this.additionalBudget = res[0];
        this.updateTotalOnChart(this.additionalBudget.total_budget_amount);
      });
    }
  }
  @Input() budget;
  @Input() public set assignmentData(value : any) {
    if(value) {
      this.assignment = value;
      this.getApproversList();
    }
  }
  @Input() programId: string;
  @Input() currency: string;
  @Input() additionalBudget$;
  @Input() actionAllow : any ;
  @Input() sowData: any ;
  @Input() assignmentConfig: any ; 
  @Output() closeAddBudget = new EventEmitter();

  public assignmentDetail = 'hidden';
  public assignment : any;
  public subscription= new Subscription();
  public newTotalBudget = 0;
  public title: string;
  public addingReasons$: Observable<any>;
  public addBudgetForm: UntypedFormGroup;
  public chartData: IBudgetChartItem[];
  public chartLoading = false;
  public additionalBudget;
  public approversList$: Observable<any>;
  public entityId: string;
  public timezone: any;
  public approveId: string;
  public approveDetails;
  public disableSubmit:boolean= false;
  public readonly BudgetLabels = BudgetLabels;
  public readonly DonutColorScheme = DonutColorScheme;
  public readonly StatusMessageTypes = StatusMessageTypes;

  private reasonCodeAction: string;
  public additionalBugdetReason: any = [] ;

  public transition_type_option : any;

  subscrptions: Subscription[] = [];
  logs:Log= undefined;
  accuracyConfig = AccuracyConfigEnum;
  SourcingModel = SourcingModel;
  constructor(
    private eventStream: EventStreamService,
    private assignmentService: AssignmentService,
    private fb: UntypedFormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private alertService: AlertService,
    private reasonCodesService: ReasonCodesService,
    private accuracyPipe: AccuracyPipe
  ) { }

  ngOnInit(): void {
   this.subscrptions.push(this.eventStream.on(Events.ADD_ADDITIONAL_BUDGET).subscribe( (data: boolean) => {
      if (data) {
        this.assignmentDetail = 'visible';
      } else {
        this.closeAddBudget.emit();
        this.assignmentDetail = 'hidden';
      }
    }));
    this.transition_type_option = [{"key" : "Add(+)" , "value" : "credit" , "is_enabled" : this.actionAllow?.can_add_budget},
    {"key" : "Reduce(-)" , "value" : "debit" , "is_enabled" : this.actionAllow?.can_add_budget}];
    this.transition_type_option = this.transition_type_option?.filter(res => res?.is_enabled);
    this.createForm();
    this.newTotalBudget = this.budget?.total_allocated_budget;
    this.title = this.assignment
      ? `Assignment : ${this.assignment?.assignment_manager?.first_name} ${this.assignment?.assignment_manager?.last_name} (A-ID : ${this.assignment?.code})`
      : 'Assignment';
    this.getAddingReasons();
    this.subscrptions.push(this.getValue().valueChanges.subscribe(value => {
      let newTotalBudget = this.addBudgetForm?.get('transaction_type')?.value === 'credit' ? Number(this.budget.total_allocated_budget) + Number(value) : Number(this.budget.total_allocated_budget) - Number(value);
      this.newTotalBudget = +(newTotalBudget?.toFixed(8));
      this.updateTotalOnChart(this.newTotalBudget);
    }));
    this.chartData = [
      { amount: this.accuracyPipe.transform(this.budget?.total_spend , this.accuracyConfig.amount , {isEdit : true}), label: BudgetLabels.SpendApproved },
      { amount: this.accuracyPipe.transform(this.newTotalBudget , this.accuracyConfig.amount, {isEdit : true}), label: BudgetLabels.TotalRemaining },
      { amount: this.accuracyPipe.transform(this.budget?.total_pending_approval , this.accuracyConfig.amount, {isEdit : true}), label: BudgetLabels.AwaitingApproval },
    ];
  }

  public getApproversList() {
    this.approversList$ = this.assignmentService.getApproversList(
      this.programId,
      this.assignment?.assignment_uuid,
      PendingItemTypes.AdditionalBudget
    ).pipe(
      tap(approversList => {
        if (
          approversList.status.toLowerCase() === ApprovalStatus.approved ||
          approversList.status.toLowerCase() === ApprovalStatus.rejected
        ) {
          this.approveDetails = {
            status: approversList.status,
            updated_by: null,
            date: ''
          };
        }
      })
    );
  }

  public getValue(): UntypedFormControl {
    return this.addBudgetForm?.get('value') as UntypedFormControl;
  }

  public getRequestReason(): UntypedFormControl {
    return this.addBudgetForm?.get('request_reason') as UntypedFormControl;
  }

  public getRequestNotes(): UntypedFormControl {
    return this.addBudgetForm?.get('request_notes') as UntypedFormControl;
  }

  updatedValue() {
    let newBugdet = this.addBudgetForm?.get('transaction_type').value === 'credit' ? Number(this.budget.total_allocated_budget) + Number(this.addBudgetForm?.get('value').value) : Number(this.budget.total_allocated_budget) - Number(this.addBudgetForm?.get('value').value);
    this.newTotalBudget = +(newBugdet?.toFixed(8));
    this.updateTotalOnChart(this.newTotalBudget);
  }

  updateControlValue(formControlName , type , showSymbol = false) {
    this.addBudgetForm.controls[formControlName]?.setValue(this.accuracyPipe.transform(this.addBudgetForm.get(formControlName)?.value , this.accuracyConfig[type] , {isEdit : showSymbol}));
  }

  private getAddingReasons() {
    this.reasonCodesService.getResoncodesFor('REQUEST_ADDITIONAL_BUDGET').subscribe((res: any) => {
      this.additionalBugdetReason = res?.reason_codes;  
    });
  }

  private createForm() {
    this.addBudgetForm = this.fb.group({
      value: [this.accuracyPipe.transform(0, this.accuracyConfig?.amount , {isEdit : true}), [Validators.required, Validators.min(0)]],
      request_reason: [null, [Validators.required]],
      request_notes: [null, [Validators.required]],
      transaction_type : [this.transition_type_option[0]?.value , this.transition_type_option ? [Validators.required] : []]
    });
  }

  private updateTotalOnChart(newTotalBudget: number) {
    this.changeDetectorRef.detectChanges();
    this.chartData = this.chartData.map((item) => item.label === BudgetLabels.TotalRemaining
      ? { ...item, amount: this.accuracyPipe.transform(newTotalBudget , this.accuracyConfig?.amount , {isEdit : true}) } : item);
  }

  public sidebarClose(event: boolean): void {
    this.closeAddBudget.emit();
    this.eventStream.emit(new EmitEvent(Events.ADD_ADDITIONAL_BUDGET, false));
  }

  public addAdditionalBudget() {
    const payload = { ...this.addBudgetForm.value, reason_code_action: this.reasonCodeAction };
    this.disableSubmit= true;
    this.subscrptions.push(this.assignmentService.addBudgetForAssignment(this.programId, this.assignment.assignment_uuid, payload)
    .subscribe({next:(res: any) => {
      this.alertService.success(res.message);
      this.disableSubmit= false;
      this.sidebarClose(false);
    }, error: (err) => {
      this.disableSubmit= false;
      this.logs= { type: LOG_TYPE.ERROR, heading: errorHandler(err), messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      // this.alertService.error(err.error.message || 'Error while adding budget');
    }})
  );
  }

  showErrorMessges(err){
    let messages= [];
    err?.error?.error?.errors?.forEach(msg => {      
      if (msg?.message) {      
       messages.push(msg?.message);
      }
    });
    return messages;
  }
  
  public findColor(paramLabel: string) {
    return DetailsChartColors && DetailsChartColors.find(({ label }) => label === paramLabel)?.color;
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
  showToolTip(amount : any, accuracyType = this.accuracyConfig.amount)
  {
    return this.assignmentService?.showAmount(amount, this.currency, accuracyType);
  }
}
