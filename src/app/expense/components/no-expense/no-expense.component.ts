import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ExpenseType } from '../../enums/expense.enums';

@Component({
  selector: 'app-no-expense',
  templateUrl: './no-expense.component.html',
  styleUrls: ['./no-expense.component.scss']
})
export class NoExpenseComponent implements OnInit {
  @Output() openCreationSidebar = new EventEmitter();
  @Input() accessRemoved: boolean;
  @Input() expenseType: { value: ExpenseType; name: string };
  @Input() isDataLoaded: boolean;

  public readonly ExpenseType = ExpenseType;

  constructor() { }

  ngOnInit(): void {
  }

  public addExpense(event): void {
    this.openCreationSidebar.emit(event);
  }
}
