import {Component, OnInit, Output, EventEmitter, OnDestroy} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import {EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import {StorageService} from 'src/app/core/services/storage.service';
import {ProgramService} from 'src/app/programs/program.service';
import {LoaderService} from '../../../core/components/loader/loader.service';
import {AlertService} from '../../../core/components/alert/alert.service';
import {errorHandler} from '../../../shared/util/error-handler';
import {Subscription, Subject, Observable} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'app-edit-checklist',
  templateUrl: './edit-checklist.component.html',
  styleUrls: ['./edit-checklist.component.scss']
})
export class EditChecklistComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  @Output() onSaveChecklist = new EventEmitter();

  public createChecklists = 'hidden';
  public clickOutside = false;
  public tabIndex = 0;
  public templates: Array<any>;
  public checklistForm: UntypedFormGroup;
  public isBtnDisabled = true;
  public taskList: any;
  public tasks: any = {};
  public title: string;
  public selectedTasks: Array<any> = [];
  public isEditMode = false;
  public isViewMode = false;
  public checklist;
  public page = 1;
  public showMoreBtnVisible = true;

  public input$ = new Subject<string | null>();
  public selectedTaskIds: any = [];

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
    this.input$.pipe(debounceTime(1000))
    .subscribe((newTerm) => {
      if (newTerm) {
        this.getJobTemplates(newTerm);
      }
    });

    this.subscriptions.push(
      this.eventStream.on(Events.EDIT_CHECKLIST)
        .subscribe((data: any) => {
          if (data) {
            this.checklist = data.data;
            const { tasks } = this.checklist;
            this.selectedTaskIds = tasks.map(node => { return {id: node.task?.id, is_required: node?.is_required ?? false}});

            this.getJobTemplates();
            this.checklistForm.patchValue({
              name: data.data.name,
              is_enabled: data.data.is_enabled,
              description: data.data.description,
              job_templates: data.data.job_templates,
              dependencyStatus: data.data.dependencyStatus,
              dependency: data.data.dependency,
            });

            this.getTaskList().subscribe({
              next: (res: any) => {
                if (res) {
                  this.taskList = res?.tasks;
                  this.taskList.forEach(item => {
                    const selectedTask = this.selectedTaskIds.find(x => x.id === item.id);
                    this.selectedTasks.push({
                      selected: !!selectedTask?.id,
                      task_name: item.name,
                      task_id: item.id,
                      dependent_task_selected: false,
                      dependent_task: null,
                      is_required: !!selectedTask?.is_required
                    });
                  });
                  this.showMoreBtnVisible = res?.total_records - this.selectedTasks.length !== 0;
                }

                this.loader.hide();
                this.setSelectedTasksData(data)

              }, error: (err: Error | any) => {
                this.alert.error(errorHandler(err));
                this.loader.hide();
              }
            });

            this.isViewMode = false;
            this.isEditMode = true;
            this.createChecklists = 'visible';
          } else {
            this.createChecklists = 'hidden';
          }

          this.clickOutside = true;
        }
      )
    );
  }

  loadTemplateDetails(templateID) {
    const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
    return this.programService.get(`/job-manager/programs/${programId}/job-templates/${templateID}`);
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
    this.selectedTaskIds = [];
    this.tabIndex = 0;
    this.page = 1;
    this.selectedTasks.forEach(item => {
      this.checklistForm.removeControl(item.task_name + '_dependency');
      item.dependent_task_selected = false;
      item.selected = false;
    });
    this.selectedTasks = [];
    this.formValue.dependency.setValue('');
    this.formValue.dependencyStatus.setValue(false);
    this.isBtnDisabled = this.showMoreBtnVisible = true;
    this.initChecklistForm();
  }

  showMore() {
    this.page += 1;
    this.loader.show();
    const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
    this.subscriptions.push(this.programService.get(`/configurator/programs/${programId}/onboarding/tasks?page=${this.page}&k=true`)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.taskList.push(...data?.tasks);
            data?.tasks.forEach(item => {
              const selectedTask = this.selectedTaskIds.find(x => x.id === item.id);
              this.selectedTasks.push({
                selected: !!selectedTask?.id,
                task_name: item.name,
                task_id: item.id,
                dependent_task_selected: false,
                dependent_task: null,
                is_required: !!selectedTask?.is_required
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
    ));
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
      this.subscriptions.push(
        this.programService.put(`/configurator/programs/${programId}/onboarding/checklists/${this.checklist.id}`, payload)
          .subscribe({
            next: (data: any) => {
              this.alert.success('Checklist entry updated successfully');
              this.onSaveChecklist.emit(true);
              this.sidebarClose();
            }, error: (err: Error | any) => {
              this.alert.error(errorHandler(err));
            }
          }
        )
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

  public changeTaskStatus(taskId: any, mode?: string): void {
    if (!this.isViewMode) {
      this.selectedTasks.forEach(item => {
        if (item.task_id === taskId) {
          item.selected = !item.selected;
          item.is_required = true;
          if (!item.selected) {
            this.checklistForm.removeControl(this.dependencyName(item.task_name));
          }
          this.checklistForm.addControl(this.dependencyName(item.task_name), new UntypedFormControl([]));
        }
      });
    }
  }

  public changeDependencyStatus(task: any, mode?: string): void {
    if (this.formValue?.name?.value?.length && !this.isViewMode) {
      this.selectedTasks.forEach(item => {
        if (item.task_id === task.task_id) {
          item.dependent_task_selected = !item.dependent_task_selected;
        }
      });
    }
  }

  public selectDependency(task?, event?): void {
    this.selectedTasks.forEach(item => {
      if (item.dependent_task_selected && task.task_id === item.task_id) {
        item.dependent_task = event;
      }
    });
  }


  /**
   * Gets tasklist data
   * @returns Observable <any>
   */
  getTaskList(): Observable <any> {
    this.loader.show();
    const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
    return this.programService.get(`/configurator/programs/${programId}/onboarding/tasks?page=1&k=true`);
  }

  getJobTemplates(q = '') {
    this.loader.show();
    const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
    let url = `/job-manager/programs/${programId}/job-templates?limit=10`;
    if (q) {
      url += `&q=${q}`;
    }

    this.subscriptions.push(
      this.programService.get(url)
        .subscribe({
          next: (data: any) => {
            this.templates = data?.job_templates;
            if (this.checklist) {
              this.checklist?.job_templates?.forEach(element => {
                let indx = this.templates?.findIndex(templ => templ.id === element);
                if (indx === -1) {
                  this.loadTemplateDetails(element)
                    .subscribe((res: any) => {
                      this.templates.push(res.job_template);
                    }
                  );
                }
              });
            }
            this.loader.hide();
          }, error: (error: Error | any) => {
            this.alert.error(errorHandler(error));
          }
        }
      )
    );
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
          is_required: item.is_required ?? true,
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
      // job_templates: ['07fbc6db-87cb-45cb-95b2-0bd2fa4d08c4'],
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
              task.dependent_task = item.dependent_task.id;
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
      return this.tasksAreSelected && this.formValue?.name?.value ? false : true;
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

  private initChecklistForm() {
    this.checklistForm = this.fb.group({
      name: [''],
      is_enabled: [true],
      description: [''],
      tasks: this.fb.array([]),
      job_templates: [[]],
      dependencyStatus: [false],
      dependency: [[]]
    });
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
