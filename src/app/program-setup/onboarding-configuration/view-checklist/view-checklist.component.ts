import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { errorHandler } from '../../../shared/util/error-handler';

@Component({
  selector: 'app-view-checklist',
  templateUrl: './view-checklist.component.html',
  styleUrls: ['./view-checklist.component.scss']
})
export class ViewChecklistComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Output() onSaveChecklist = new EventEmitter();

  public createChecklists: string = 'hidden';
  public clickOutside: boolean = false;
  public tabIndex: number = 0;
  public templates: any = [];
  public checklistForm: UntypedFormGroup;
  public isBtnDisabled: boolean = true;
  public taskList: any;
  public tasks: any = {};
  public title: string;
  public selectedTasks: Array<any> = [];
  public isEditMode = false;
  public isViewMode = false;
  public checklistId = '';

  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private programService: ProgramService,
    private storageService: StorageService,
    private loader: LoaderService,
    private alert: AlertService,
  ) {
  }

  ngOnInit(): void {

    this.initChecklistForm();
    this.getTaskList();

    this.subscriptions.push(
      this.eventStream.on(Events.VIEW_CHECKLIST)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.checklistId = data.data.id;
              this.checklistForm.patchValue({
                name: data.data.name,
                is_enabled: data.data.is_enabled,
                description: data.data.description,
                job_templates: data.data.job_templates,
              });
              this.setSelectedTasksData(data);
              this.getJobTemplates();
              this.isViewMode = true;
              this.isEditMode = false;
              this.createChecklists = 'visible';
            } else {
              this.createChecklists = 'hidden';
            }
            this.clickOutside = true;
          }
        }
      )
    );
  }

  test() {
    console.log(this.isViewMode, this.checklistForm.value.is_enabled);
  }

  /**
   * Tab changing function
   * @params event
   * @returns void
   */
  public onIndexChange(event: any): void {
    this.tabIndex = event;
    if (this.tabIndex === 0) {
      !this.formValue?.name?.value?.length ? this.isBtnDisabled = true : this.isBtnDisabled = false;
    } else {
      if (this.formValue?.name?.value?.length) {
        if (this.formValue?.dependencyStatus?.value) {
          this.formValue?.dependency?.value?.length ? this.isBtnDisabled = false : this.isBtnDisabled = true;
        } else {
          this.isBtnDisabled = false;
        }
      }
    }
  }

  /**
   * Sidebar closing function
   * @returns void
   */
  public sidebarClose(): void {
    this.createChecklists = 'hidden';
    this.tabIndex = 0;
    this.selectedTasks.forEach(item => {
      this.checklistForm.removeControl(item.task_name + '_dependency');
      item.dependent_task_selected = false;
      item.selected = false;
    });
    this.formValue.dependency.setValue('');
    this.formValue.dependencyStatus.setValue(false);
    this.isBtnDisabled = true;
    this.initChecklistForm();
  }

  /**
   * Gets Checklist name's value
   * @returns void
   */
  public getListNameValue(): void {
    if (this.tabIndex === 0) {
      !this.formValue.name.value.length ? this.isBtnDisabled = true : this.isBtnDisabled = false;
    }
  }

  /**
   * Gets tasklist data
   * @returns Promise
   */
  public getTaskList() {
    this.loader.show();
    const programId = JSON.parse(this.storageService.get('NewProgramData'))?.program_req_id;
    this.subscriptions.push(
      this.programService.get(`/configurator/programs/${programId}/onboarding/tasks?k=true&limit=100`)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.taskList = data?.tasks;
              this.taskList.forEach(item => {
                this.selectedTasks.push({
                  selected: false,
                  task_name: item.name,
                  task_id: item.id,
                  dependent_task_selected: false,
                  dependent_task: null,
                });
              });
            }
            this.loader.hide();
          }, error: (err: Error | any) => {
            this.alert.error(errorHandler(err));
            this.loader.hide();
          }
        }
      )
    );
  }

  getJobTemplates() {
    this.loader.show();
    const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
    if (this.checklistForm.get('job_templates').value?.length) {
      this.checklistForm.get('job_templates').value?.forEach(templateID => {
        this.subscriptions.push(
          this.programService.get(`/job-manager/programs/${programId}/job-templates/${templateID}`).subscribe({
            next: (res: any) => {
              this.templates.push(res.job_template);
              this.loader.hide();
            },
            error: (error: Error | any) => {
              this.alert.error(errorHandler(error));
            },
          }),
        );
      });
    }
  }

  public createPayload() {
    let order = 1;
    const tasks = [];
    let task: any;
    this.selectedTasks.map(item => {
      if (item.selected) {
        task = {
          order,
          task_id: item.task_id,
        };
        if (item.dependent_task_selected && item.dependent_task) {
          task.dependent_task_id = item.dependent_task.id;
        }
        order++;
        tasks.push(task);
      }
    });
    return {
      name: this.formValue.name.value,
      description: this.formValue.description.value,
      // job_templates: this.formValue.job_templates.value,
      tasks,
      job_templates: ['95fc4a14-1aaf-440b-becc-7f7235a456dd'],
      is_enabled: this.formValue.is_enabled.value
    };
  }

  /**
   * Sets single chekclist data to formGroup
   * @param data
   * @returns Promise<any>
   */
  public setChecklistData(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.checklistForm.reset();
      this.formValue.name.setValue(data?.data?.name);
      this.formValue.is_enabled.setValue(data?.data?.is_enabled);
      this.formValue.description.setValue(data?.data?.description);
      // TODO remove after removing hardcoded job_templates
      this.formValue.job_templates.setValue([]);
      this.formValue.job_templates.setValue(data?.data?.job_templates);
      resolve(this.formValue);
    });
  }

  public setSelectedTasksData(data: any) {
    if (data.data.tasks) {
      data.data?.tasks.forEach(item => {
        this.selectedTasks.forEach(task => {
          if (item.task.id === task.task_id) {
            if (!this.formValue?.name?.value?.length) {
              this.isBtnDisabled = false;
            }
            task.selected = true;
            task.is_required = item?.is_required ?? true;
            this.checklistForm.addControl(this.dependencyName(task.task_name), new UntypedFormControl(item.dependent_task?.id));
            if (item.dependent_task) {
              task.dependent_task_selected = true;
              task.dependent_task = item.dependent_task;
            }
          }
        });
      });
    }
  }

  initChecklistForm() {
    this.checklistForm = this.fb.group({
      name: [''],
      is_enabled: [{value: true, disabled: true}],
      description: [''],
      tasks: this.fb.array([]),
      job_templates: [[]],
      dependencyStatus: [false],
      dependency: [[]]
    });
  }

  // convenience getter for easy access to form fields
  get formValue() {
    return this.checklistForm.controls;
  }

  dependencyName(taskName) {
    return taskName.replace(/\s/g, '') + '_dependency';
  }

  getDependencyTasks(taskId) {
    return this.selectedTasks.filter(item => {
      return item.task_id !== taskId;
    });
  }

  get tasksAreSelected() {
    let valid = false;
    this.selectedTasks.forEach(item => {
      if (item.selected) {
        valid = true;
      }
    });
    return valid;
  }

  onContinue(): void {
    this.tabIndex = this.tabIndex ? 0 : 1;
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
