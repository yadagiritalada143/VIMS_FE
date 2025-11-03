import { Component, OnInit, Input, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { ExpenseType } from '../../enums/expense.enums';
import { AssignmentDetails } from '../../models/assignment.model';

@Component({
  selector: 'app-new-expense-header',
  templateUrl: './new-expense-header.component.html',
  styleUrls: ['./new-expense-header.component.scss']
})
export class NewExpenseHeaderComponent implements OnInit {
  @Input() data: AssignmentDetails;
  @Input() expenseType: { value: ExpenseType; name: string };

  @ViewChild('managerCount', { read: ElementRef, static: false }) managerCount: ElementRef;
  @ViewChild('managerNameDropdown', { read: ElementRef, static: false }) managerNameDropdown: ElementRef;

  public readonly ExpenseType = ExpenseType;

  showHideManagerList:boolean=false;
  constructor(
    private render: Renderer2
  ) { 
    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.managerCount && this.managerCount.nativeElement.contains(e.target) && !this.showHideManagerList) ||
        (this.managerNameDropdown && this.managerNameDropdown.nativeElement.contains(e.target)) 
      ){
        const buttonPosition = this.managerCount.nativeElement.getBoundingClientRect();
        this.showHideManagerList = true;
        this.managerNameDropdown.nativeElement.style.top = `${buttonPosition.top + buttonPosition.height}px`;
        this.managerNameDropdown.nativeElement.style.left = `${buttonPosition.left}px`;
        this.render.addClass(document.body, 'manager-dropdown-overflow');
      }
      
      else {
        this.showHideManagerList = false;
        this.render.removeClass(document.body, 'manager-dropdown-overflow');
      }
    });
  }

  ngOnInit(): void {
  }

 
}
