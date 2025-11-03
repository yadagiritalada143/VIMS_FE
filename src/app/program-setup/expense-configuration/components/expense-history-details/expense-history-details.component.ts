import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import {
  Events,
  EventStreamService,
} from 'src/app/core/services/event-stream.service';
import { ExpenseHistoryDetailService } from '../../services/expense-history-detail.service';
import { HistoryDetailConfig, HistoryTypeConfig } from './history-details-config';
import { compare, checkNoChanges } from './history-changes.utils';
import { ExpenseModification } from '../../enums/expense-config-history.enums';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-expense-history-details',
  templateUrl: './expense-history-details.component.html',
  styleUrls: ['./expense-history-details.component.scss'],
})
export class ExpenseHistoryDetailsComponent implements OnInit, OnDestroy {
  @Output() closeExpenseHistoryDetailModal = new EventEmitter();

  public sidebarTitle = 'Expense Configuration History';
  public sidebarVisibility: string;
  public historyDetails$;
  public historyDetailConfig = HistoryDetailConfig;
  public isNoChanges = false;
  public readonly ExpenseModification = ExpenseModification;

  private subscriptions: Subscription[] = [];

  constructor(
    private historyDetalService: ExpenseHistoryDetailService,
    private eventStreamService: EventStreamService
  ) {
    this.sidebarVisibility = 'hidden';
  }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStreamService.on(
      Events.OPEN_EXPENSE_CONFIG_DETAIL).subscribe(
      (data: { itemId: string }) => {
        this.sidebarVisibility = data ? 'visible' : 'hidden';
        this.historyDetails$ = this.historyDetalService.getExpenseHistoryDetails(data.itemId).pipe(tap((res:any) => {
          this.checkChanges(res);
          if (res.history_message.includes('Expense Item')) {
              this.historyDetailConfig = HistoryTypeConfig;
            }
          }));
      }
    ));
  }

  public sidebarClose(event) {
    this.sidebarVisibility = 'hidden';
    this.closeExpenseHistoryDetailModal.emit();
  }

  public hasChanges(details, config) {
    return details.log_name === ExpenseModification.Created || (
      !config.is_period &&
      details.old.hasOwnProperty(config.key) &&
      (config.nested_key
        ? details.old[config.key][config.nested_key] !==
          details.new[config.key][config.nested_key]
        : details.old[config.key] !== details.new[config.key])
    );
  }

  public periodHasChanges(details, config) {
    return (
      config.is_period && details.old.hasOwnProperty(config.key) &&
      (details.old[config.key][config.nested_key]?.value !== details.new[config.key][config.nested_key]?.value ||
       details.old[config.key][config.nested_key]?.type !== details.new[config.key][config.nested_key]?.type)
    );
  }

  public isAccessKey(config) {
    return (
      config.nested_key === 'remove_vendor_access_general' ||
      config.nested_key === 'remove_worker_access_general' ||
      config.nested_key === 'remove_vendor_access_misc' ||
      config.nested_key === 'remove_msp_access_general' ||
      config.nested_key === 'remove_msp_access_misc'
    );
  }
  private checkChanges(details): void {
    this.isNoChanges = checkNoChanges(compare(details.old, details.new));
  }

  public convertToDate(value: number) {
    return new Date(value * 1000);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
