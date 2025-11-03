import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ExpenseDetailService } from '../../pages/expense-detail/expense-detail.service';
import { ExpenseListModel } from '../../models/expense-list-item.model';
import { ExpenseService } from '../../expense.service';
import { ExpenseRoutes, ExpenseType, NavigationPaths } from '../../enums/expense.enums';
import { AssignmentDetails } from '../../models/assignment.model';
import { Observable } from 'rxjs';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { tap } from 'rxjs/operators';
import { StatusMessageTypes } from 'src/app/shared/enums';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { IExpenseConfigData } from '../../interfaces/expense-configuration.interface';

@Component({
  selector: 'app-new-expense-details',
  templateUrl: './new-expense-details.component.html',
  styleUrls: ['./new-expense-details.component.scss'],
})
export class NewExpenseDetailsComponent implements OnInit {
  public expenseList: ExpenseListModel;
  public expenseDetail$: Observable<AssignmentDetails>;
  public expenseDetail: AssignmentDetails;
  public isOpenCreating = false;
  public accessRemoved = false;
  public expenseConfigInactive = false;
  public expenseModuleDisabled = false;
  public expenseInactiveMessage = '';
  public expenseType: { value: ExpenseType; name: string };
  public programId: string;
  public is_tax_hidden: boolean;
  public isDataLoaded: boolean = false;
  public expenseData:any = undefined;
  public readonly StatusMessageTypes = StatusMessageTypes;

  constructor(
    private activatedRoute: ActivatedRoute,
    private expenseDetailService: ExpenseDetailService,
    private exspenseService: ExpenseService,
    private eventStream: EventStreamService,
    private router: Router,
    private alertService: AlertService,
    private storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.is_tax_hidden = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.is_tax_hidden || false;
    this.expenseDetailService.init();
    const assignmentId = this.activatedRoute.snapshot.paramMap.get('assignmentId');
    if (assignmentId) {
      this.expenseType = this.router.url.includes(ExpenseRoutes.Misc)
        ? { value: ExpenseType.MiscExpense, name: 'Miscellaneous Expense' }
        : { value: ExpenseType.Expense, name: 'General Expense' };
      this.exspenseService.setExpenseType(this.expenseType);
      this.getAssignmentData(assignmentId);
    } else {
      this.router.navigate([NavigationPaths.user.generalList()]);
    }    
  }

  public navigateBackToList() {
    this.router.navigate([
      this.expenseType.value === ExpenseType.MiscExpense ? NavigationPaths.user.miscList() : NavigationPaths.user.generalList(),
    ]);
  }

  public toggleIsOpenCreating() {
    this.isOpenCreating = !this.isOpenCreating;
  }

  public createExpense() {
    this.toggleIsOpenCreating();
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.ADD_EXPENSE, true));
    });
  }

  private getAssignmentData(assignmentId: string) {
    this.expenseDetail$ = this.exspenseService.getAssignmentDetails(this.programId, assignmentId).pipe(
      tap(details => {
        this.expenseDetail = details;
        this.expenseData = {};
        this.expenseData = {
          "hierarchy" : { "id" : this.expenseDetail.assignment?.hierarchy?.id },
          "assignment" : { "id" : this.expenseDetail.assignment?.assignment_uuid },
          "expense_id" : null,
        }
        if (!this.expenseDetail) {
          this.alertService.error('No assignment data');
        }else if(this.expenseDetail){
          this.isDataLoaded = true;
        }
        if (this.expenseDetail?.assignment?.hierarchy?.id) {
          this.expenseDetailService.getDefaultConfig(this.expenseDetail.assignment.hierarchy.id).subscribe((res: IExpenseConfigData) => {
            const { expenseConfigInactive, expenseModuleDisabled, expenseInactiveMessage, accessRemoved } =
              this.expenseDetailService.checkExpenseActive(res, this.expenseDetail.assignment.end_date, this.expenseType);
            this.expenseConfigInactive = expenseConfigInactive;
            this.isDataLoaded = true;
            this.expenseModuleDisabled = expenseModuleDisabled;
            this.expenseInactiveMessage = expenseInactiveMessage;
            this.accessRemoved = accessRemoved;
          });
        }
      }),
    );
  }
}
