import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {Events, EventStreamService} from 'src/app/core/services/event-stream.service';
import {ResumeUploadService} from 'src/app/shared/components/svms-tab-components/resume-upload/resume-upload.service';
import {LoaderService} from '../../../core/components/loader/loader.service';
import {ProgramService} from '../../../programs/program.service';
import {StorageService} from '../../../core/services/storage.service';
import {errorHandler} from '../../../shared/util/error-handler';
import {AlertService} from '../../../core/components/alert/alert.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-create-tasklist',
  templateUrl: './create-tasklist.component.html',
  styleUrls: ['./create-tasklist.component.scss']
})
export class CreateTasklistComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @ViewChild('fileInput') fileInput;

  @Output() onSaveTask = new EventEmitter();

  public createTasklists = 'hidden';
  public clickOutside = false;
  public tabIndex = 0;
  public taskForm: UntypedFormGroup;
  public startDate: any = new Date();
  public dueDate: any = new Date();
  public isViewMode: boolean;
  public isEditMode: boolean;
  public due_date_error: boolean = false;
  public clientId: string;
  public programId: string;
  public isUpdateReq: any;
  public toUpdateItemId: any;
  public title: any;
  public selectedRole: string;

  // public taskTypes: Array<object> = [
  //   {value: 'UPLOAD_CREDENTIAL', name: 'Upload Credentials'},
  //   {value: 'ATTACH_DOCUMENT', name: 'Attach Document'},
  //   {value: 'SIGN_DOCUMENT', name: 'Sign Document'},
  //   {value: 'ACKNOWLEDGEMENT', name: 'Acknowledge'},
  // ];
  public assignments: any = {
    OFFER_CREATION_DATE: 'Offer Creation Date',
    OFFER_ACCEPTANCE: 'Offer Acceptance Date',
    ASSIGNMENT_CREATION_DATE: 'Assignment Creation Date',
    ASSIGNMENT_START_DATE: 'Assignment Start Date',
    ASSIGNMENT_END_DATE: 'Assignment End Date',
    ASSIGNMENT_TERMINATION_DATE: 'Assignment Termination Date',
  };
  public due_assignments: any = [
    {
      OFFER_CREATION_DATE: 'Offer Creation Date',
      OFFER_ACCEPTANCE: 'Offer Acceptance Date',
      ASSIGNMENT_CREATION_DATE: 'Assignment Creation Date',
      ASSIGNMENT_START_DATE: 'Assignment Start Date',
      ASSIGNMENT_END_DATE: 'Assignment End Date',
      ASSIGNMENT_TERMINATION_DATE: 'Assignment Termination Date',
    },
    {
      ASSIGNMENT_START_DATE: 'Assignment Start Date',
      ASSIGNMENT_END_DATE: 'Assignment End Date',
    },

  ];
  public roles: Array<any> = [
    {query: 'CLIENT', name: 'Client role', roles: []},
    {query: 'MSP', name: 'MSP role', roles: []},
    {query: 'VENDOR', name: 'Vendor role', roles: []},
    {query: 'CANDIDATE', name: 'Candidate', roles: []},
  ];
  public checklists: Array<object> = [];
  public progressBar = false;
  public fileNotSupportAlert = false;
  public resumeFile: any = {
    name: null,
    time: 0,
    ext: null,
    raw: null
  };
  public isValidFileSize = true;
  public mbKbFileSize = '';
  public resumeFileSize: any;
  public viewMode = false;
  public currentTaskFileName;


  constructor(
    private fb: UntypedFormBuilder,
    private loader: LoaderService,
    private alert: AlertService,
    private programService: ProgramService,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private resumeUploadService: ResumeUploadService
  ) {
  }

  ngOnInit(): void {

    this.taskForm = this.fb.group({
      task_name: ['', Validators.required],
      is_enabled: [true],
      task_type: ['', Validators.required],
      description: [''],
      start_date: new UntypedFormGroup({
        start: new UntypedFormControl('', [Validators.required]),
        start_before: new UntypedFormControl('', [Validators.required]),
        start_assignment: new UntypedFormControl('', [Validators.required]),
      }),
      due_date: new UntypedFormGroup({
        due: new UntypedFormControl('', [Validators.required]),
        due_before: new UntypedFormControl('', [Validators.required]),
        due_assignment: new UntypedFormControl('', [Validators.required]),
      }),
      actor: [null, []],
      checklist: [],
      attachment: ['', []]
    });

    this.getRoles();
    this.getChecklists();

    this.subscriptions.push(
      this.eventStream.on(Events.CREATE_TASK)
        .subscribe((data: any) => {
          this.isViewMode = false;
          this.isEditMode = false;
          this.resumeFile = {};
          if (data) {
            this.title = 'Task Details';
            this.createTasklists = 'visible';
          } else {
            this.createTasklists = 'hidden';
          }
          this.clickOutside = true;
        }
      )
    );

    this.subscriptions.push(
      this.eventStream.on(Events.EDIT_TASK)
        .subscribe((data: any) => {
          if (data.event) {
            const files = data?.data?.files;
            this.currentTaskFileName = files[files.length - 1] ? files[files.length - 1].file_name : '';
            this.resumeFile = {
              name: files[files.length - 1] ? files[files.length - 1].file_name : '',
              time: 0,
              ext: null,
              raw: '',
            };
            this.title = `Edit (${data?.data?.name})`;
            this.createTasklists = 'visible';
            this.taskForm.patchValue(data?.data?.id);
            this.taskForm.patchValue({
              task_name: data?.data?.name,
              is_enabled: data?.data?.is_enabled,
              task_type: data?.data?.task_type,
              description: data?.data?.description,
              actor: data?.data?.roles?.length > 0 ? data?.data?.roles?.map(role => role.id) : data?.data?.role?.id,
              checklist: data?.data?.checklist,
              attachment: data?.data?.attachment,
            });

            this.taskForm.get('start_date').patchValue({
              start: data?.data?.config?.start_date?.days,
              start_before: data?.data?.config?.start_date?.schedule,
              start_assignment: data?.data?.config?.start_date?.date,
            });
            this.taskForm.get('due_date').patchValue({
              due: data?.data?.config?.due_date?.days,
              due_before: data?.data?.config?.due_date?.schedule,
              due_assignment: data?.data?.config?.due_date?.date,
            });
            this.setRoleInfo();
            this.setDueDate();
            this.setStartDate();
            this.createTasklists = 'visible';
            this.isUpdateReq = true;
            this.isViewMode = false;
            this.isEditMode = true;
            this.toUpdateItemId = data?.data?.id;
          } else {
            this.createTasklists = 'hidden';
          }
          this.clickOutside = true;
        }
      )
    );

    this.subscriptions.push(
      this.eventStream.on(Events.VIEW_TASK)
        .subscribe((data: any) => {
          if (data.event) {
            const files = data?.data?.files;
            this.resumeFile = {
              name: files[files.length - 1] ? files[files.length - 1].file_name : null,
              time: 0,
              ext: null,
              raw: '',
            };
            this.title = `View (${data?.data?.name})`;
            this.createTasklists = 'visible';
            this.taskForm.patchValue(data?.data?.id);
            this.taskForm.patchValue({
              task_name: data?.data?.name,
              is_enabled: data?.data?.is_enabled,
              task_type: data?.data?.task_type,
              description: data?.data?.description,
              actor: data?.data?.roles?.length > 0 ? data?.data?.roles?.map(role => role.id) : data?.data?.role?.id,
              checklist: data?.data?.checklist,
              attachment: data?.data?.attachment,
            });

            this.taskForm.controls['is_enabled'].disable();

            this.taskForm.get('start_date').patchValue({
              start: data?.data?.config?.start_date?.days,
              start_before: data?.data?.config?.start_date?.schedule,
              start_assignment: data?.data?.config?.start_date?.date,
            });
            this.taskForm.get('due_date').patchValue({
              due: data?.data?.config?.due_date?.days,
              due_before: data?.data?.config?.due_date?.schedule,
              due_assignment: data?.data?.config?.due_date?.date,
            });

            this.setRoleInfo();
            this.setDueDate();
            this.setStartDate();
            this.createTasklists = 'visible';
            this.isViewMode = true;
            this.isEditMode = false;
            this.toUpdateItemId = data?.data?.id;
          } else {
            this.createTasklists = 'hidden';
          }
          this.clickOutside = true;
        }
      )
    );
  }

  private setRoleInfo = () => {
    const roleId = this.formValue?.actor.value;
    if(Array.isArray(roleId)){
      this.roles.forEach(item => {
        item.roles.forEach(role => {
          if (roleId.indexOf(role.id) >= 0) {
            this.selectedRole = item.name;
          }
        });
      });
    }else {
      this.roles.forEach(item => {
        item.roles.forEach(role => {
          if (role.id === roleId) {
            this.selectedRole = item.name;
          }
        });
      });
    }

    if(this.selectedRole?.toLowerCase() === 'Vendor role'.toLowerCase()){
      let actorValue = this.formValue?.actor.value;
      if (!Array.isArray(actorValue)){
        this.formValue?.actor.patchValue([actorValue])
      }
    }
  }

  /**
   * Save data
   * @returns void
   */
  public onSave(): void {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails['program_req_id'];
    const payload: any = {
      name: this.taskForm.value.task_name,
      task_type: this.taskForm.value.task_type,
      description: this.taskForm.value.description,
      is_enabled: this.taskForm.value.is_enabled === true,
      config: {
        start_date: {
          days: this.taskForm.get('start_date').value.start,
          schedule: this.taskForm.get('start_date').value.start_before,
          date: this.taskForm.get('start_date').value.start_assignment
        },
        due_date: {
          days: this.taskForm.get('due_date').value.due,
          schedule: this.taskForm.get('due_date').value.due_before,
          date: this.taskForm.get('due_date').value.due_assignment
        }
      },
      checklist: this.taskForm.value.checklist,
    };

    if(this.taskForm.value.actor && Array.isArray(this.taskForm.value.actor)){
      payload.roles = this.taskForm.value.actor;
      payload.role_id = null;
    }
    else
        payload.role_id = this.taskForm.value.actor;

    if (this.resumeFile.name != this.currentTaskFileName) {
      payload.files = [
        {
          file_name: this.resumeFile.name,
          raw: this.resumeFile.raw
        }
      ];
    }
    this.loader.show();
    if (this.isUpdateReq) {
      this.subscriptions.push(
        this.programService.put(`/configurator/programs/${programId}/onboarding/tasks/${this.toUpdateItemId}`, payload)
          .subscribe({
            next: (data: any) => {
              if (data) {
                this.createTasklists = 'hidden';
                this.alert.success(`You have successfully updated a task`);
                this.loader.hide();
                this.sidebarClose();
                this.onSaveTask.emit(true);
                this.sidebarClose();
              }
            }, error: (error: Error | any) => {
              this.loader.hide();
              this.alert.error(errorHandler(error));
            }
          }
        )
      );
    } else {

      if (!this.taskForm.valid) {
        this.alert.info('Please enter all the required fields');
        this.loader.hide();
        return;
      }
      this.subscriptions.push(
        this.programService.post(`/configurator/programs/${programId}/onboarding/tasks`, payload)
          .subscribe({
            next: (data: any) => {
              if (data) {
                this.createTasklists = 'hidden';
                this.alert.success(`You have successfully created a task`);
                this.loader.hide();
                this.sidebarClose();
                this.onSaveTask.emit(true);
                this.sidebarClose();
              }
            }, error: (error: Error | any) => {
              this.loader.hide();
              this.alert.error(errorHandler(error));
            }
          }
        )
      );
    }
  }

  /**
   * @returns void
   */
  public sidebarClose(): void {
    this.createTasklists = 'hidden';
    this.selectedRole = '';
    this.taskForm.reset();
    this.taskForm.get('is_enabled').setValue(true);
    this.deleteResume();
    this.isViewMode = false;
    this.isEditMode = false;
    this.isUpdateReq = false;
    this.toUpdateItemId = null;
  }

  /**
   * @returns void
   */
  public selectTaskName(): void {
    if (this.tabIndex === 0 && this.formValue.task_name.value) {
      this.tabIndex += 1;
    }
  }

  /**
   * @returns void
   */
  public onIndexChange(event: any): void {
    this.tabIndex = event;
  }

  /**
   * File Uploading
   * @param event
   * @param flag
   * @returns void
   */
  public uploadResume(event: any, flag?: any): void {
    if (event) {
      this.progressBar = true;
      this.fileNotSupportAlert = false;
      const fileEvent = event.target?.files ? event.target.files : event.dataTransfer.files;
      const fileExtension = fileEvent[0].name.split('.').pop();
      const fileData = fileEvent[0];
      this.resumeFile['name'] = fileData.name;
      this.resumeFile['time'] = Date.now();
      this.resumeFile['ext'] = fileData.name.split('.').pop();
      if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
        const fsize = fileEvent[0].size;
        // check file in KB
        if (fsize < 1000000) {
          this.isValidFileSize = true;
          this.mbKbFileSize = 'KB';
          this.resumeFileSize = Math.floor(fsize / 1000);
          // file to base64
          this.resumeUploadService.encodeToBase64(fileData)
            .then((data) => {
              this.formValue.attachment.setValue(data);
              this.resumeFile['raw_without_base64'] = String(data).split(',')[1];
              this.resumeFile['raw'] = data;
              // this.onClickToggleAutofill();
              // this.resumeData.emit(this.resumeFile)
            }).catch((err) => {
            console.error('FileError', err);
          });
        } else {
          // check file in MB
          this.mbKbFileSize = 'MB';
          this.resumeFileSize = (fsize / (1024 * 1024)).toFixed(2);
          if (this.resumeFileSize <= 10) {
            this.isValidFileSize = true;
            // file to base64
            this.resumeUploadService.encodeToBase64(fileData)
              .then((data) => {
                this.formValue.attachment.setValue(data);
                this.resumeFile['raw_without_base64'] = String(data).split(',')[1];
                this.resumeFile['raw'] = data;
                // this.onClickToggleAutofill();
                // this.resumeData.emit(this.resumeFile)
              }).catch((err) => {
              console.error('FileError', err);
            });
          } else {
            this.isValidFileSize = false;
          }
        }
      } else {
        this.fileNotSupportAlert = true;
      }
    }
    this.progressBar = false;
  }

  /**
   * File droping
   * @param files
   * @returns void
   */
  public onFileDropped(files: Array<any>): void {
    this.uploadResume({
      target: {
        files: files
      }
    });
  }

  /**
   * File deleting
   * @returns void
   */
  public deleteResume(): void {
    this.resumeFileSize = '';
    this.isValidFileSize = true;
    // this.fileInput.nativeElement.value = '';
    this.resumeFile = {
      name: null,
      time: 0,
      ext: null,
      raw: null
    };
  }


  public get validForm() {
    let valid = true;
    if (!this.taskForm.get('task_name').valid) {
      this.alert.error('Task Name should not be empty');
      valid = false;
    } else if (!this.taskForm.get('task_type').valid) {
      this.alert.error('Task Type should not be empty');
      valid = false;
    } else if (!this.taskForm.get('attachment').valid) {
      this.alert.error('Attachment is missing ');
      valid = false;
    }
    return valid;
  }
  public get dueDateAssignments(){
    return this.formValue?.due_date.value.due_before === 'AFTER' ? this.due_assignments[0] : this.due_assignments[1];
  }
  // convenience getter for easy access to form fields
  public get formValue() {
    return this.taskForm.controls;
  }

  public setStartDate() {
    this.startDate = new Date();
    if (this.taskForm.get('start_date').value.start_before.toLowerCase() === 'after' || !this.taskForm.get('start_date').value.start_before) {
      this.startDate = this.startDate.setDate(this.startDate.getDate() + (+this.taskForm.get('start_date').value.start));
    } else {
      this.startDate = this.startDate.setDate(this.startDate.getDate() - (+this.taskForm.get('start_date').value.start));
    }
  }

  public setDueDate() {
    this.due_date_error = false;
    this.dueDate = new Date();
      if (this.taskForm.get('due_date').value.due_before.toLowerCase() === 'after' || !this.taskForm.get('due_date').value.due_before) {
        this.dueDate = this.dueDate.setDate(this.dueDate.getDate() + (+this.taskForm.get('due_date').value.due));
      } else {
        this.dueDate = this.dueDate.setDate(this.dueDate.getDate() - (+this.taskForm.get('due_date').value.due));
      }
     let diffInDays =  Math.round((new Date(this.dueDate).getTime() - new Date(this.startDate).getTime())  / (1000*3600*24))
     if(diffInDays <= 0){
      this.due_date_error = true;
        this.taskForm.get('due_date').patchValue({
        due: '',
        due_before: '',
        due_assignment: '',
      });
     }

  }

  getRoles() {
    const programDetails: any = JSON.parse(this.storageService.get('NewProgramData'));
    const programId: string = programDetails?.program_req_id;
    this.roles.forEach((item: any) => {
      this.subscriptions.push(
        this.programService.get(`/configurator/programs/${programId}/roles?org_category=${item.query}`)
          .subscribe((data: any) => {
            if (data) {
              item.roles = data.roles;
            }
          }
        )
      );
    });
  }

  selectRole(role) {
    this.selectedRole = role;
    this.taskForm.get('actor').setValue('');
  }

  getChecklists() {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    this.subscriptions.push(
      this.programService.get(`/configurator/programs/${programId}/onboarding/checklists`)
        .subscribe((data: any) => {
          if (data?.checklists) {
            this.checklists = data.checklists;
          }
        }
      )
    );
  }

  searchChecklists(event) {
    if (event.target.value) {
      this.loader.show();
      const programId = JSON.parse(this.storageService.get('NewProgramData')).program_req_id;
      this.subscriptions.push(
        this.programService.get(`/configurator/programs/${programId}/onboarding/checklists${event.target.value ? '?k=' + event.target.value : ''}`)
          .subscribe({
            next: (data: any) => {
              this.checklists = data?.checklists;
              this.loader.hide();
            }, error: (error: Error | any) => {
              this.alert.error(errorHandler(error));
            }
          }
        )
      );
    } else {
      this.getChecklists();
    }
  }

  roleSelected(name) {
    return this.selectedRole === name;
  }

  canUpload() {
    const taskTypes = ['ATTACH_DOCUMENT', 'SIGN_DOCUMENT', 'ACKNOWLEDGEMENT', 'UPLOAD_CREDENTIAL'];
    return taskTypes.includes(this.taskForm.controls.task_type.value);
  }

  handleClearClick(id: string) {
    let selected = this.taskForm.get('checklist').value;
    selected = selected.filter(task => task !== id);
    this.taskForm.get('checklist').setValue(selected);
  }

  changeStatus(evt: any) {
    this.taskForm.get('is_enabled')?.setValue(evt);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
