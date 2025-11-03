import {Component, Input, Output, EventEmitter} from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import {IExpensesHistoryItemsListResponse} from '../../models/expense-history-items-model';

@Component({
  selector: 'app-timeline-history',
  templateUrl: './timeline-history.component.html',
  styleUrls: ['./timeline-history.component.scss'],
})
export class TimelineHistoryComponent {

  currentPage = 1;
  itemsPerPage = 10;
  @Input() data: IExpensesHistoryItemsListResponse;
  @Input() loading = false;
  @Output() changePage = new EventEmitter(true);
  @Output() changePerPage = new EventEmitter(true);
  public isOpenExpenseHistoryDetails = false;

  constructor(private eventStreamService: EventStreamService) {}

  onPaginationClick(event) {
    this.currentPage = event;
    this.changePage.emit(this.currentPage);
  }

  public get maxPages(): number {
    if (this.data && this.data.data && this.data.data.total_records) {
      return Math.ceil(this.data.data.total_records / this.itemsPerPage);
    }
  }

  public openExpenseHistoryDetail(itemId: string) {
    this.toggleOpenExpenseHistoryDetails();
    setTimeout(() => {
      this.eventStreamService.emit(new EmitEvent(Events.OPEN_EXPENSE_CONFIG_DETAIL, { itemId }));
    });
  }

  public toggleOpenExpenseHistoryDetails(): void {
    this.isOpenExpenseHistoryDetails = !this.isOpenExpenseHistoryDetails;
  }

  public convertToDate(value: number) {
    return new Date(value * 1000);
  }

  public onClickRecords(event) {
    this.currentPage = 1;
    this.itemsPerPage = event;
    this.changePerPage.emit(event);
  }
}
