import { Component, OnDestroy, OnInit } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-impacted-expenses-table',
  templateUrl: './impacted-expenses-table.component.html',
  styleUrls: ['./impacted-expenses-table.component.scss']
})
export class ImpactedExpensesTableComponent implements OnInit, OnDestroy {

  private subscriptions = [];
  showExpenses:boolean = false;
  expenseList:any= undefined;
  constructor(private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.SHOW_IMPACTED_EXPENSES).subscribe((data) => {
      if (data) {
        this.expenseList= data?.impactedExpenses;
        if(data?.showTable){
          this.showExpenses= true;
        }
        if(data?.showTable === false){
          this.showExpenses= false;
        }
      } 
    }));

  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
