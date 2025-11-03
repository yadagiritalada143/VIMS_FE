import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EventStreamService, Events, EmitEvent } from '../../../../../core/services/event-stream.service';
import {AddExpenseTypeService} from '../../../../../program-setup/expense-configuration/services/add-expense-type.service'

import {
  IExpenseTypeItem,
  IIconItem,
  IRadioOptionItem, IServerErrorItem,
  IToggleOptionItem
} from '../../../../../program-setup/expense-configuration/models/add-expense-type.model';
import { LoaderService } from '../../../../../core/components/loader/loader.service';
import { AlertService } from '../../../../../core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model'; 


@Component({
  selector: 'app-add-expense-type',
  templateUrl: './add-expense-type.component.html',
  styleUrls: ['./add-expense-type.component.scss']
})

export class AddExpenseTypeComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Output() closeAddExpenseTypeModal = new EventEmitter();
  @Input() configId: string;
  public validationsServerErrorArray: Array<IServerErrorItem>;
  public sidebarVisibility: string;
  public sidebarTitle = 'Add Expense Type';
  public needConfirmation: boolean;
  public isLoaded = false;
  public itemId: string;
  public formMode: string;
  public programId: string;
  logs: Log = undefined;


  constructor(private eventStreamService: EventStreamService,
              private loader: LoaderService,
              private alertService: AlertService,
              private storageService: StorageService,
              private addExpenseTypeService: AddExpenseTypeService
              ) {
    this.needConfirmation = false;
    this.sidebarVisibility = 'hidden';
  }

  ngOnInit() {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM).id;
    this.loader.show();
    this.subscriptions.push(this.addExpenseTypeService.init(this.programId).subscribe(() => {
      this.isLoaded = true;
      this.loader.hide();
    }, error => {
      this.loader.hide();
      this.showError(error);
      //this.alertService.error(errorHandler(error));
    }));
    this.subscriptions.push(this.eventStreamService.on(Events.ADD_EXPENSE_TYPE).subscribe( (data: { itemId?: string, mode: string }) => {
      this.formMode = data.mode;
      this.sidebarVisibility = data ? 'visible' : 'hidden';
      if (data.itemId) {
        this.itemId = data.itemId;
        this.addExpenseTypeService.fillFormWithData(data.itemId, this.programId);
        if (this.formMode) {
          this.sidebarTitle = `${this.formMode.charAt(0).toUpperCase() + this.formMode.slice(1)} Expense Type`;
        }
      }
    }));
  }

  public get addExpenseTypeForm(): UntypedFormGroup {
    return this.addExpenseTypeService.addExpenseTypeForm;
  }
  public get expenseType(): Array<IExpenseTypeItem> {
    return this.addExpenseTypeService.expenseType;
  }
  public get currencyConfig(): any {
    return this.addExpenseTypeService?.currencyConfig;
  }
  public get accuracyConfig(): any {
    return this.addExpenseTypeService?.accuracyConfig;
  }
  public get currency(): string {
    return this.addExpenseTypeService?.currency;
  }
  public get radioOptionItems(): Array<IRadioOptionItem> {
    return this.addExpenseTypeService.radioOptionItems;
  }
  public get toggleOptionItems(): Array<IToggleOptionItem> {
    return this.addExpenseTypeService.toggleOptionItems;
  }
  public get iconItems(): Array<IIconItem> {
    return this.addExpenseTypeService.iconItems;
  }
  public get categoryCode(): string {
    return this.addExpenseTypeService.getCategoryCode();
  }
  public onClickToggle(item): void {
    return this.addExpenseTypeService.onClickToggle(item);
  }
  public toggleUnitBaseConfig(): void {
    return this.addExpenseTypeService?.toggleUnitBaseConfig();
  }
  public get isBlocked(): boolean {
    return this.addExpenseTypeForm.invalid;
  }
  public get unitBasedEnabled(): boolean {
    return this.addExpenseTypeService?.unitBasedEnabled;
  }
  public get unitBaseConfig() {
    return this.addExpenseTypeService?.unitBaseConfig;
  }

  public submitAddExpenseType(): void {
    if (this.isBlocked) {
      this.addExpenseTypeService.showErrors(this.addExpenseTypeForm);
      return;
    }
    this.loader.show();
    if(this.addExpenseTypeForm.value.expense_type === 'expense'){
      this.addExpenseTypeForm.removeControl('allow_negative_expense');
    }
    this.addExpenseTypeService.submitAddExpenseType(this.configId, this.programId, this.itemId).subscribe((result:any) => {
      this.alertService.success('Expense Type ' + (this.itemId ? 'Edited' : 'Added') + ' Successfully');
      this.eventStreamService.emit(new EmitEvent(Events.FETCH_CONFIGURATION_LIST_EXPENSE_TYPE, result.data));
      this.loader.hide();
      this.sidebarClose();
    }, error => {
      if (error.error.error.errors) {
        this.validationsServerErrorArray = error.error.error.errors;
      }
      this.showError(error);
      //this.alertService.error(errorHandler(error));
      this.loader.hide();
    });
  }
  public sidebarClose(event?) {
    if (this.needConfirmation) {
      if (event) {
        this.sidebarVisibility = 'hidden';
        this.closeAddExpenseTypeModal.emit();
        this.addExpenseTypeService.clearToggleOptionItems();
      }
    } else {
      this.sidebarVisibility = 'hidden';
      this.addExpenseTypeService.clearToggleOptionItems();
      this.closeAddExpenseTypeModal.emit();
    }
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }
}

