import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { tap } from 'rxjs/internal/operators/tap';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Hierarchy } from 'src/app/library/hierarchy/hierarchy.model';
import { ExpenseToggle, ExpenseToggleEvent } from '../../models/expense-toggle.model';
import { ConfigurationActionsService } from '../../services/configuration-actions.service';
import { ConfigurationDetailsService } from '../../services/configuration-details.service';
import { ConfigurationMode } from '../../enums/configuration-mode.enums';
import { IExpensesConfigurationListItem } from '../../pages/expense-configuration-list/expense-configuration-list-interface';
import { takeUntil } from 'rxjs/operators';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import {  DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

@Component({
  selector: 'app-expense-configuration-form',
  templateUrl: './expense-configuration-form.component.html',
  styleUrls: ['./expense-configuration-form.component.scss']
})
export class ExpenseConfigurationFormComponent implements OnInit, OnDestroy {
  @Input() configId: string;
  @Input() viewStatus: ConfigurationMode;

  public readonly configurationMode = ConfigurationMode;
  public isOpenAddExpenseType = false;
  public isOpenSelectHierarchy = false;

  public configurationForm: UntypedFormGroup;
  public configurationData: IExpensesConfigurationListItem;
  public validationError = '';
  public userAssociatedHierarchyID: string[] = [];
  public hierarchyData: Hierarchy[];
  public selectedHierarchyIds: string[];
  public isLoading = false;

  private programDetails;
  private programId: string;
  public secondProjectsDropdown:any=[];
  public projectTypes:any=[];
  public options: any = {};
  public allOptions: any = [];
  workerCode: any = [{id:'workercode1', value: "account_code", name: "Account Code",
  program: "AmFam MSP",
  slug: "account_code",
    type: "worker_code"
  }];
  logs: Log = undefined;
  dateFormat:string = DATE_FORMAT.FORMATDDMMYY;
  weekEndDays = [
    { name: 'Sunday', value: 1 },
    { name: 'Monday', value: 2 },
    { name: 'Tuesday', value: 3 },
    { name: 'Wednesday', value: 4 },
    { name: 'Thursday', value: 5 },
    { name: 'Friday', value: 6 },
    { name: 'Saturday', value: 7 },
  ]
  constructor(
    private eventStreamService: EventStreamService,
    private actionService: ConfigurationActionsService,
    private configurationDetailsService: ConfigurationDetailsService,
    private datePipe: LocalDateFormatPipe,
    private storageService: StorageService,
  ) {}

  public get incurredSubmissionFrom(): UntypedFormGroup {
    return this.configurationForm.get('incurredSubmissionFrom') as UntypedFormGroup;
  }


  public get removeWorkerAccessFrom(): UntypedFormGroup {
    return this.configurationForm.get('removeWorkerAccessFrom') as UntypedFormGroup;
  }

  public get removeVendorAccessFrom(): UntypedFormGroup {
    return this.configurationForm.get('removeVendorAccessFrom') as UntypedFormGroup;
  }

  public get removeVendorMiscFrom(): UntypedFormGroup {
    return this.configurationForm.get('removeVendorMiscFrom') as UntypedFormGroup;
  }

  public get removeMspAccessFrom(): UntypedFormGroup {
    return this.configurationForm.get('removeMspAccessFrom') as UntypedFormGroup;
  }

  public get removeMspAccessMiscFrom(): UntypedFormGroup {
    return this.configurationForm.get('removeMspAccessMiscFrom') as UntypedFormGroup;
  }

  public get customFieldToggle(): ExpenseToggle {
    return this.actionService.customFieldToggle;
  }

  ngOnInit(): void {
    this.programDetails = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    this.programId = this.programDetails?.id;
    this.dateFormat = this.programDetails?.defaultDateFormat.toUpperCase();
    let startDate = this.datePipe.transform(this.programDetails?.start_date, this.dateFormat ,null ,null , true, DATE_FORMAT?.FORMATYMD)
    this.configurationForm = this.actionService.createForm(startDate);
    // this.configurationForm = this.actionService.createForm(this.programDetails.start_date);
    this.actionService
      .getHierarchy(this.programId)
      .pipe(
        tap((data:any) => {
          data.forEach((h) => {
            this.userAssociatedHierarchyID.push(h?.id);
          });
          this.hierarchyData = data;
          this.configurationForm.get('hierarchy_uuid').setValue(data[0]?.name);
          this.configurationForm.get('hierarchy_uuid').updateValueAndValidity();
        }),
        takeUntil(this.actionService.destroy$)
      )
      .subscribe();
    this.isLoading = true;
    this.configurationDetailsService
      .getDetailExpenseConfig(this.configId, this.programId)
      .subscribe({next:
        (data:any) => {
          if (data) {
            this.configurationData = data;
            this.selectedHierarchyIds = this.configurationData?.hierarchy?.map(val =>val?.id);
            if (this.configId) {
              this.actionService.fillFormWithConfigData(
                this.configurationForm,
                this.configurationData
              );
            }
            this.getCustomFields();
            this.getFoundationalTypes();
          }
          this.isLoading = false;
        },error:
        (err) => {
         // this.alertService.error(errorHandler(err));
          this.showError(err);
          this.isLoading = false;
        }
  });
    if (!this.viewStatus) {
      this.viewStatus = ConfigurationMode.Edit;
    }
    this.options = this.actionService.getTimesheetDropdownOptions();
    this.eventStreamService.on(Events.SHOW_EXPENSE_LOGS).subscribe((data:any) => {
      this.logs = data
    });
  }

  private getHirerachyById(hierarchy, id) {
    for (const datum of hierarchy) {
      if (datum.id == id) return datum;
      if (datum.hierarchies) {
        let result = this.getHirerachyById(datum.hierarchies, id);
        if (result) return result;
      }
    }
  }

  public onSubmit() {
    if (this.configurationForm.valid) {
      let present = this.allOptions?.some(e => e.id == this.workerCode[0]?.id);
      if (!present) {
        this.allOptions = [...this.allOptions, ...this.workerCode];
      }
        this.configurationForm.value.custom_fields.fields = this.allOptions.filter(m => this.projectOptions.includes(m.id)).map(m=> {return {id: m.id, slug: m.slug, name: m.name, type: m.type}});
        delete this.configurationForm.value.project_name;
        delete this.configurationForm.value.option_name;
        this.configurationForm.value.expense_start_date = this.datePipe.transform(this.configurationForm.value.expense_start_date, DATE_FORMAT?.FORMATYMD ,null ,null , true, this.dateFormat);
        this.actionService.addExpenseConfig(
          this.configurationForm,
          this.selectedHierarchyIds[0],
          this.programId,
          this.customFieldToggle,
          this.configId,
        );
    } else {
      this.validationError = 'Form is not valid';
    }
  }

  public updateToggleValue(event: ExpenseToggleEvent) {
    this.configurationForm.get(`config.${event.controlName}`).setValue(event.value);
  }

  public updateProjectToggleValue(event: ExpenseToggleEvent) {
    this.configurationForm.get(`custom_fields.${event.controlName}`).setValue(event.value);
    if(!event.value){
      this.projectOptions = [];
      this.configurationForm.get('project_name').setValue(null)
    }
  }

  public addExpenseType() {
    this.toggleOpenAddExpenseType();
    setTimeout(() => {
      this.eventStreamService.emit(new EmitEvent(Events.ADD_EXPENSE_TYPE, true));
    });
  }

  public openSelectHierarchy() {
    this.toggleOpenSelectHierarchy();
    setTimeout(() => {
      this.eventStreamService.emit(new EmitEvent(Events.CREATE_HIERARCHY, true));
    });
  }

  public toggleOpenAddExpenseType(): void {
    this.isOpenAddExpenseType = !this.isOpenAddExpenseType;
  }

  public toggleOpenSelectHierarchy(): void {
    this.isOpenSelectHierarchy = !this.isOpenSelectHierarchy;
  }

  public setEditMode() {
    this.viewStatus = ConfigurationMode.Edit;
  }

  public onClickHirerachy() {
    if (this.viewStatus === ConfigurationMode.Edit) {
      this.openSelectHierarchy();
    }
  }

  public selectHierarchyIds(event: string[]) {
    this.selectedHierarchyIds = event;
    if (event?.length > 0) {
      const callHierarchyData = this.getHirerachyById(this.hierarchyData, event[0]);
      if (callHierarchyData?.id === event[0]) {
        this.configurationForm.get('hierarchy_uuid').setValue(callHierarchyData?.name);
      } else {
        this.configurationForm.get('hierarchy_uuid').setValue('');
      }
    } else {
      this.configurationForm.get('hierarchy_uuid').setValue('');
    }
  }

  ngOnDestroy() {
    this.actionService.unsubscribe();
  }
  currentprogram: any;
  public customFields:any=[];
  public foundationalFields:any=[];
  public customProjects:any=[];
  public projectOptions: any = [];

  async getFoundationalTypes() {
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.actionService.get(`/configurator/programs/${this.currentprogram?.id}/foundational-data-types?active=true&limit=50`).subscribe((data:any) => {
      const { foundational_data_types } = data;
      this.foundationalFields = foundational_data_types.filter(fd => {
        return fd?.configuration && fd?.configuration?.module_jobs !== 'OFF';
      }).map(fd => {
        fd.code = this.snakeCase(fd.name);
        fd.type= 'foundational';
        return fd;
      });
      this.allOptions = [...this.allOptions, ...this.foundationalFields];
      if(this.configurationData?.expense_config?.custom_fields?.fields?.length >= 1 && this.configId){
        this.secondProjectsDropdown = [...this.foundationalFields, ...this.secondProjectsDropdown];
        let ids = this.foundationalFields?.length !== 0 ? this.foundationalFields.map(m => m.id) : [];
        this.projectOptions = this.configurationData?.expense_config?.custom_fields?.fields.map(e =>ids.includes(e.id) ? e.id : null)
        this.getWorkerCodeData();
      }
    });
  }

  snakeCase = string => {
    string = string.toLowerCase();
    return string.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

  async getCustomFields() {
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/configurator/programs/${this.currentprogram?.id}/custom-fields?entity_ref=expense&limit=50`;
    this.actionService.get(url).subscribe((data:any) => {
     if(data && data.custom_fields.length > 0) {
      this.customFields = data.custom_fields.map(cd => {
        cd.parent_type= 'custom';
        // cd.value= cd.value;
        return cd;
      });
      this.allOptions = [...this.allOptions, ...this.customFields];
      if(this.configurationData?.expense_config?.custom_fields?.fields?.length >= 1 && this.configId){
        this.secondProjectsDropdown = [...this.secondProjectsDropdown, ...this.customFields];
        let ids = this.secondProjectsDropdown?.length !== 0 ? this.secondProjectsDropdown.map(m => m.id) : [];
        this.projectOptions = this.configurationData?.expense_config?.custom_fields?.fields.filter(e =>ids.includes(e.id));
      }
     }
    },
    error => {});
  }
  getWorkerCodeData(){
    if(this.configurationData?.expense_config?.custom_fields?.fields?.length >= 1 && this.configId){
      this.secondProjectsDropdown = [...this.secondProjectsDropdown, ...this.workerCode];
      let ids = this.secondProjectsDropdown?.length !== 0 ? this.secondProjectsDropdown.map(m => m.id) : [];
      this.projectOptions = this.configurationData?.expense_config?.custom_fields?.fields.map(e =>ids.includes(e.id) ? e.id : null)
    }
  }

  onProjectTypeSelection(selectedProjectTypes){
    this.secondProjectsDropdown= [];
    if(selectedProjectTypes?.length > 0){
      if(selectedProjectTypes.includes("foundational")){
        this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.foundationalFields];
      }
      if(selectedProjectTypes.includes("custom")){
        this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.customFields];
      }
      if(selectedProjectTypes.includes("worker_code")){
        this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.workerCode];
      }
    }
    this.projectOptions = [];
  }
  onSelectionDays(event){
  }

  onOptionSelection(option) {

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
