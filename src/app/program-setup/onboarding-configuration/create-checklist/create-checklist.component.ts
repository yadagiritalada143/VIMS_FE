import {Component, OnInit, Output, EventEmitter, OnDestroy} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {EventStreamService, Events} from 'src/app/core/services/event-stream.service';
import {StorageService} from 'src/app/core/services/storage.service';
import {ProgramService} from 'src/app/programs/program.service';
import {LoaderService} from '../../../core/components/loader/loader.service';
import {AlertService} from '../../../core/components/alert/alert.service';
import {errorHandler} from '../../../shared/util/error-handler';
import {Subscription, Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'app-create-checklist',
  templateUrl: './create-checklist.component.html',
  styleUrls: ['./create-checklist.component.scss']
})
export class CreateChecklistComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  @Output() onSaveChecklist = new EventEmitter();

  public createChecklists: string = 'hidden';
  public clickOutside: boolean = false;
  public tabIndex: number = 0;
  public templates: Array<any>;
  public checklistForm: UntypedFormGroup;
  public isBtnDisabled: boolean = true;
  public taskList: any = [];
  public tasks: any = {};
  public title: string;
  public selectedTasks: Array<any> = [];
  public isEditMode = false;
  public isViewMode = false;
  public checklistId = '';
  public page = 0;
  public showMoreBtnVisible = true;
  public input$ = new Subject<string | null>();

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
    this.checklistForm = this.fb.group({
      name: ['', [Validators.required]],
      is_enabled: [true],
      description: [''],
      tasks: this.fb.array([]),
      job_templates: ['', [Validators.required]],
      dependencyStatus: [false],
      dependency: [[]]
    });

    this.input$.pipe(debounceTime(1000))
    .subscribe((newTerm: any) => {
      if (newTerm) {
        this.getJobTemplates(newTerm);
      }
    });

    this.subscriptions.push(this.eventStream.on(Events.CREATE_CHECKLIST)
    .subscribe((data) => {
      this.isEditMode = false;
      this.isViewMode = false;
      if (data) {
        this.createChecklists = 'visible';
      } else {
        this.createChecklists = 'hidden';
      }
      this.getTaskList();
      this.getJobTemplates();
      this.clickOutside = true;
    }));
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
    this.tabIndex = this.page = 0;
    this.showMoreBtnVisible = true;
    this.selectedTasks.forEach(item => {
      this.checklistForm.removeControl(item.task_name + '_dependency');
      item.dependent_task_selected = false;
      item.selected = false;
    });
    this.selectedTasks = this.taskList = [];
    this.formValue.dependency.setValue('');
    this.formValue.dependencyStatus.setValue(false);
    this.isBtnDisabled = true;
    this.checklistForm.reset();

  }

  /**
   * Continue or Submit button functionality
   * @returns void
   */
  public onContinue(): void {
    if (this.tabIndex === 0) {
      this.tabIndex = 1 + this.tabIndex;
      if (!this.formValue.dependencyStatus.value && this.formValue.name.value.length) {
        this.isBtnDisabled = false;
      }
    } else {
      const payload = this.createPayload();
      delete this.checklistForm.value.dependencyStatus;
      delete this.checklistForm.value.dependency;
      const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
      const url: string = `/configurator/programs/${programId}/onboarding/checklists`;
      this.programService.post(url, payload)
        .subscribe({
          next: (data: any) => {
            this.alert.success('Checklist entry created successfully');
              this.onSaveChecklist.emit(true);
            this.sidebarClose();
          }, error: (err: Error | any) => {
            this.alert.error(errorHandler(err));
          }
        }
      );
    }
  }

  changeListNameStatus(event) {
    this.checklistForm.get('is_enabled')?.setValue(event);
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
   * Changes task status
   * @param taskId
   * @param mode
   */
  public changeTaskStatus(taskId: any, mode?: string): void {
    if (!this.isViewMode) {
      this.selectedTasks.forEach(item => {
        if (item.task_id === taskId) {
          item.selected = !item.selected;
          item.is_required = true;
          this.checklistForm.addControl(this.dependencyName(item.task_name), new UntypedFormControl([]));
        }
      });
    }
  }

  /**
   * Changes dependencyStatus
   * @param task
   * @param mode?
   * @returns void
   */
  public changeDependencyStatus(task: any, mode?: string): void {
    if (this.formValue?.name?.value?.length && !this.isViewMode) {
      this.selectedTasks.forEach(item => {
        if (item.task_id === task.task_id) {
          item.dependent_task_selected = !item.dependent_task_selected;
        }
      });
    }
  }

  /**
   * Selects dependency
   * @returns void
   * @param task
   * @param event
   */
  public selectDependency(task?, event?): void {
    this.selectedTasks.forEach(item => {
      if (item.dependent_task_selected && task.task_id === item.task_id) {
        item.dependent_task = event;
        console.log(item.dependent_task, event);
      }
    });
  }


  /**
   * Gets tasklist data
   * @returns Promise
   */
  public getTaskList() {
    this.page += 1;
    this.loader.show();
    const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
    this.subscriptions.push(
      this.programService.get(`/configurator/programs/${programId}/onboarding/tasks?page=${this.page}&k=true`)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.taskList = [...data?.tasks];
              this.taskList.forEach(item => {
                this.selectedTasks.push({
                  selected: false,
                  task_name: item.name,
                  task_id: item.id,
                  dependent_task_selected: false,
                  dependent_task: null,
                  is_required: true
                });
              });
              this.showMoreBtnVisible = data?.total_records - this.selectedTasks.length !== 0;
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

  getJobTemplates(q = '') {
    this.loader.show();
    const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
    let url = `/job-manager/programs/${programId}/job-templates?limit=10&key=template_name&order_by=asc`;
    if (q) {
      url += `&q=${q}`;
    }

    this.subscriptions.push(this.programService.get(url)
      .subscribe({
        next: (data: any) => {
          this.templates = data?.job_templates;
          this.loader.hide();
        }, error: (error: Error | any) => {
          this.alert.error(errorHandler(error));
        }
      }
    ));
  }

  searchJobTemplates(event) {
    if (event.target.value) {
      this.loader.show();
      const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
      this.subscriptions.push(
        this.programService.get(`/job-manager/programs/${programId}/job-templates${event.target.value ? '?q=' + event.target.value : ''}`)
          .subscribe({
            next: (data: any) => {
              this.templates = data?.data;
              this.loader.hide();
            }, error: (error: Error | any) => {
              this.alert.error(errorHandler(error));
            }
          }
        )
      );
    } else {
      this.getJobTemplates();
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
          is_required: item.is_required
        };
        if (item.dependent_task_selected && item.dependent_task) {
          task.dependent_task_id = item.dependent_task;
        }
        order++;
        tasks.push(task);
      }
    });
    return {
      name: this.formValue.name.value,
      description: this.formValue.description.value,
      job_templates: this.formValue.job_templates.value,
      tasks,
      is_enabled: this.formValue.is_enabled.value
    };
  }


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

  // convenience getter for easy access to form fields
  get formValue() {
    return this.checklistForm.controls;
  }

  dependencyName(taskName) {
    return taskName.replace(/\s/g, '') + '_dependency';
  }

  getDependencyTasks(taskId) {
    return this.selectedTasks.filter(item => {
        return item.task_id !== taskId && item.dependent_task !== taskId;
    });
  }

  isDisabled() {
    if (this.tabIndex) {
      this.onIndexChange(1);
      return this.isBtnDisabled || !this.tasksAreSelected;
    } else {
      return this.tasksAreSelected && this.formValue?.name?.value && this.formValue?.job_templates?.value.length ? false : true;
    }
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

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
