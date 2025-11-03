import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ExpenseToggle, ExpenseToggleEvent } from '../../models/expense-toggle.model';

@Component({
  selector: 'app-expense-toggle',
  templateUrl: './expense-toggle.component.html',
  styleUrls: ['./expense-toggle.component.scss'],
})
export class ExpenseToggleComponent implements OnInit {
  @Input() nestedControlName: string;
  @Input() label: string;
  @Input() value: boolean;

  @Output() toggleChange = new EventEmitter<ExpenseToggleEvent>();

  public expenseToggle: ExpenseToggle;

  constructor() {
  }

  ngOnInit(): void {
    this.expenseToggle = {
      title: this.label,
      value: this.value
    };
  }

  public onClickExpenseToggle() {
    this.expenseToggle.value = !this.expenseToggle.value;
    this.toggleChange.emit({ controlName: this.nestedControlName, value: this.expenseToggle.value });
  }
}
