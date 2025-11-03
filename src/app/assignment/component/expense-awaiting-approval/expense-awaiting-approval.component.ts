import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AssignmentService } from '../../assignment.service';
import { AccuracyConfigEnum } from '../../enums/accuracy-config';
import { IExpenseSpending } from './expense-spending.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expense-awaiting-approval',
  templateUrl: './expense-awaiting-approval.component.html',
  styleUrls: ['./expense-awaiting-approval.component.scss']
})
export class ExpenseAwaitingApprovalComponent implements OnInit, OnDestroy {
  @Input() programId: string;
  @Input() assignmentId: string;
  @Input() currency: string;
  @Output() closeExpenseAwait = new EventEmitter();
  title = 'Expense(s) Awaiting Approval';


  public expenseAwaiting = 'hidden';
  public subscription: Subscription;
  public expensesData: IExpenseSpending[];
  public filteredExpensesData: IExpenseSpending[];
  public typeFilter = null;
  public expenseTypes = [ 'Misc Expense', 'Expense' ];
  accuracyConfig = AccuracyConfigEnum;

  private subscrptions: Subscription[] = [];
  constructor(private eventStream: EventStreamService, private assignmentService: AssignmentService, private router: Router) { }

  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.EXPENSE_AWAITING_APPROVAL).subscribe((status: string) => {
      if (status) {
        this.title = status === 'approved' ? 'Expense(s) Approved' : 'Expense(s) Awaiting Approval';
        this.assignmentService.getExpenseAwaitingApproval(this.programId, this.assignmentId, status).subscribe((res: any) => {
          this.expensesData = res;
          this.filteredExpensesData = this.expensesData;
        });
        this.expenseAwaiting = 'visible';
      } else {
        this.closeExpenseAwait.emit();
        this.expenseAwaiting = 'hidden';
      }
    }));
  }

  public sidebarClose(event: boolean): void {
    this.closeExpenseAwait.emit();
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.EXPENSE_AWAITING_APPROVAL, false));
    }
  }

  public activateFilter() {
    this.filteredExpensesData = this.expensesData.filter(({ expense_type }) => expense_type === this.typeFilter);
  }

  public selectFilter(filter: string) {
    this.typeFilter = filter;
  }

  public clearFilter() {
    this.filteredExpensesData = this.expensesData;
    this.typeFilter = null;
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
  
  showToolTip(amount : any, accuracyType = this.accuracyConfig.amount)
  {
    return this.assignmentService?.showAmount(amount, this.currency, accuracyType);
  }  

  viewExpense(id:string){
    // this.router.navigate([`expense/${id}`]);
    this.router.navigate([`expense/${id}`], {
      queryParams:{
        title: this.title,
      }
    });
  }
}
