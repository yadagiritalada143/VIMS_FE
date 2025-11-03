import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, forkJoin, of, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { TitleCasePipe } from '@angular/common';
import { CommonViewConfig, CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';

@Component({
  selector: 'app-tasks-detail',
  templateUrl: './tasks-detail.component.html',
  styleUrls: ['./tasks-detail.component.scss']
})
export class TasksDetailComponent implements OnInit, OnDestroy {

  private taskId: string = null;
  private detailMode: DetailMode = null;
  private subscriptions: Array <any> = [];

  public taskForm: UntypedFormGroup = null;
  public taskDetails: any = null;
  public namePattern: RegExp = /^[a-zA-Z0-9 ]{1,}$/gm;
  public activityOptions: Array <NameValuePair> = [
    { value: 'UPLOAD_CREDENTIAL', name: 'Upload Credentials' },
    { value: 'ATTACH_DOCUMENT', name: 'Attach Document' },
    { value: 'SIGN_DOCUMENT', name: 'Sign Document' },
    { value: 'ACKNOWLEDGEMENT', name: 'Acknowledge' },
    { value: 'BACKGROUND_CHECK', name: 'Background Check' }
  ];

  public datesValid: boolean = true;
  public viewDetails: Array <CommonViewDetail> = [];
  public startEventOptions: any = {
    OFFER_CREATION_DATE: 'Offer Creation Date',
    OFFER_ACCEPTANCE: 'Offer Acceptance Date',
    ASSIGNMENT_CREATION_DATE: 'Assignment Creation Date',
    ASSIGNMENT_START_DATE: 'Assignment Start Date',
    ASSIGNMENT_END_DATE: 'Assignment End Date',
    ASSIGNMENT_TERMINATION_DATE: 'Assignment Termination Date',
  };

  private roleScrollLock: boolean = false;
  private prevRoleQuery: TaskQuery = null;
  private totalRoles: number = Number.POSITIVE_INFINITY;
  private roleSubject: Subject<TaskQuery> = new Subject<TaskQuery>();

  private checklistLock: boolean = false;
  private prevChecklistQuery: TaskQuery = null;
  private totalChecklists: number = Number.POSITIVE_INFINITY;
  private checklistSubject: Subject<TaskQuery> = new Subject<TaskQuery>();

  public roleLoading: boolean = false;
  public checklistLoading: boolean = false;
  public rolesList: Array <NameValuePair> = [];
  public checkList: Array <NameValuePair> = [];
  public actorsList: Array <NameValuePair> = [
    { value: 'CLIENT', name: 'Client role' },
    { value: 'MSP', name: 'MSP role' },
    { value: 'VENDOR', name: 'Vendor role' },
    { value: 'CANDIDATE', name: 'Candidate' }
  ];

  public allowedFileTypes: Array <string> = [ 'pdf', 'doc', 'docx' ];
  public fileUploadErrorEncountered: boolean = false;

  constructor(
    private route: Router,
    private alert: AlertService,
    private activatedRoute: ActivatedRoute,
    private loader: LoaderService,
    private storage: StorageService,
    private programService: CandidateService,
    private router: SvmsRouterService,
    private uniquePipe: UniqueKeyPipe,
    private titleCase: TitleCasePipe,
    public commonViewService: CommonViewRuleFlowService
  ) { }

  ngOnInit(): void {

    // Initialize Form
    this.initializeForm();

    // Initialize Listeners
    this.initializeRoleSubject();
    this.initializeChecklistSubject();

    // Fetch URL parameters
    this.subscriptions.push(
      this.activatedRoute.params.subscribe((params: Params) => {

        this.taskId = params?.id;
        this.detailMode = params?.mode;

        if(!this.taskId) {
          this.detailMode = 'create';
        } else if(!this.taskDetails) {
          this.fetchTaskDetails();
        }
      })
    );
  }

  private initializeRoleSubject() {
    this.subscriptions.push(
      this.roleSubject.pipe(
        debounceTime(500),
        distinctUntilChanged((prev: TaskQuery, curr: TaskQuery) => {
          return (
            (prev?.page === curr?.page) &&
            (prev?.term === curr?.term) &&
            (prev?.category === curr?.category)
          );
        }),
        switchMap((query: TaskQuery) => {

          this.prevRoleQuery = query;
          const { term, page, category } = query;
          let url: string = `/configurator/programs/${this.programId}/roles?include_system_roles=true&limit=10`;
          url += `&page=${page}&org_category=${category}`;
          if(term) {
            url += `&k=${term}`;
          }

          this.roleLoading = true;
          return forkJoin([this.programService.get(url), of(query?.page)]);
        })
      ).subscribe({
        next: (res: any) => {
          this.roleLoading = false;
          if(Array.isArray(res)) {

            let result: any = res?.[0];
            let page: number = res?.[1];

            this.totalRoles = result?.total_records;
            let roles: Array <NameValuePair> = (result?.roles ?? []).map((entry: any) => {
              return {
                value: entry?.id,
                name: entry?.name
              }
            });

            if(page === 1) {
              this.rolesList = roles;
            } else {
              this.rolesList = this.uniquePipe.transform([...roles, ...this.rolesList], 'value');
            }

            this.roleScrollLock = false;
          }
        }, error: (err: Error | any) => {
          console.error(err);
          this.roleLoading = false;
          this.roleScrollLock = false;
          this.alert.error('Error encountered while fetching entries!');
        }
      })
    );
  }

  private initializeChecklistSubject() {
    this.subscriptions.push(
      this.checklistSubject.pipe(
        debounceTime(500),
        distinctUntilChanged((prev: TaskQuery, curr: TaskQuery) => {
          return (prev?.page === curr?.page) && (prev?.term === curr?.term);
        }),
        switchMap((query: TaskQuery) => {

          this.prevChecklistQuery = query;
          const { term, page } = query;
          let url: string = `/configurator/programs/${this.programId}/onboarding/checklists?limit=10&page=${page}`;
          if(term) {
            url += `&k=${term}`;
          }

          this.checklistLoading = true;
          return forkJoin([this.programService.get(url), of(query?.page)]);
        })
      ).subscribe({
        next: (res: any) => {
          this.checklistLoading = false;
          if(Array.isArray(res)) {

            let result: any = res?.[0];
            let page: number = res?.[1];

            this.totalChecklists = result?.total_records;
            let checklists: Array <NameValuePair> = (result?.checklists ?? []).map((entry: any) => {
              return {
                value: entry?.id,
                name: entry?.name
              }
            });

            if(page === 1) {
              this.checkList = checklists;
            } else {
              this.checkList = this.uniquePipe.transform([...checklists, ...this.checkList], 'value');
            }

            this.checklistLock = false;
          }
        }, error: (err: Error | any) => {
          console.error(err);
          this.checklistLock = false;
          this.checklistLoading = false;
          this.alert.error('Error encountered while fetching entries!');
        }
      })
    );
  }

  private initializeForm() {
    this.taskForm = new UntypedFormGroup({
      name: new UntypedFormControl('', [Validators.required]),
      status: new UntypedFormControl(true),
      type: new UntypedFormControl('ONBOARDING', [Validators.required]),
      activity: new UntypedFormControl(null, Validators.required),
      description: new UntypedFormControl(''),
      start_date: new UntypedFormGroup({
        day: new UntypedFormControl(0, [Validators.required]),
        action: new UntypedFormControl(null, [Validators.required]),
        event: new UntypedFormControl(null, [Validators.required]),
      }),
      due_date: new UntypedFormGroup({
        day: new UntypedFormControl(0, [Validators.required]),
        action: new UntypedFormControl(null, [Validators.required]),
        event: new UntypedFormControl(null, [Validators.required]),
      }),
      actor: new UntypedFormControl(null, [Validators.required]),
      role: new UntypedFormControl(null, [Validators.required]),
      files: new UntypedFormControl(null),
      checklists: new UntypedFormControl([])
    });
  }

  private fetchTaskDetails() {
    this.loader.show();
    let url: string = `/configurator/programs/${this.programId}/onboarding/tasks/${this.taskId}`;
    this.programService.get(url).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.taskDetails = res?.task;
        let actionUserData: any = (this.taskDetails?.modified_by || this.taskDetails?.created_by);
        if(actionUserData) {
          const { first_name, last_name } = actionUserData;
          this.taskDetails.username = [first_name,last_name].join(' ');
        }

        this.populateData();
      }, error: (err: Error | any) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }
    });
  }

  private populateData() {

    let {
      name,
      task_type: activity,
      description = '',
      config: {
        due_date: {
          date: due_event,
          days: due_day,
          schedule: due_action
        },
        start_date: {
          date: start_event,
          days: start_day,
          schedule: start_action
        }
      },
      files,
      is_enabled: status,
    } = this.taskDetails;

    this.taskForm.patchValue({
      name, status, description, activity,
      start_date: {
        day: start_day,
        action: start_action,
        event: start_event
      },
      due_date: {
        day: due_day,
        action: due_action,
        event: due_event
      },
      role: this.taskDetails?.roles?.length > 0 ? this.taskDetails?.roles?.map(role => role.id) : this.taskDetails?.role?.id,
      actor: this.taskDetails?.roles?.length > 0 ? this.taskDetails?.roles[0].organization_category : this.taskDetails?.role?.organization_category
    });

    if(Array.isArray(files) && files.length) {
      let { file_name, url, is_signed, id } = files[0];
      this.taskControl('files')?.setValue([{
        id, file_name, url, is_signed, raw: null
      }]);
    }

    if(Array.isArray(this.taskForm.get('role').value)){
      this.taskDetails.roles?.forEach(role => {
        this.rolesList.push({
          value: role?.id, name: role?.name
        });
      })

    }else{
      this.rolesList.push({
        value: this.taskDetails.role?.id, name: this.taskDetails.role?.name
      });
    }



    this.setViewDetails();
  }

  fetchUserRoles(evt?: any) {
    if(evt) {
      this.roleSubject.next({
        term: evt?.term ?? '',
        page: evt?.page ?? 1,
        category: this.category
      });
    } else if(this.loadMoreRoles) {
      // Scroll To End
      this.roleScrollLock = true;
      this.roleSubject.next({
        term: this.prevRoleQuery?.term ?? '',
        page: (this.prevRoleQuery?.page ?? 1) + 1,
        category: this.category
      })
    }
  }

  fetchChecklist(evt?: any) {
    if(evt) {
      this.checklistSubject.next({
        term: evt?.term ?? '',
        page: evt?.page ?? 1
      });
    } else if(this.loadMoreChecklists) {
      // Scroll To End
      this.checklistLock = true;
      this.checklistSubject.next({
        term: this.prevChecklistQuery?.term ?? '',
        page: (this.prevChecklistQuery?.page ?? 1) + 1,
      })
    }
  }

  backClicked() {
    this.router.navigate(['onboarding', 'task', 'list']);
  }

  onSave() {
    if(this.taskForm.valid && this.datesValid) {

      let payload: any = this.createPayload();
      let url: string = `/configurator/programs/${this.programId}/onboarding/tasks`;

      let apiObservable: Observable<any> = this.programService.post(url, payload);
      if(this.isEditMode) {
        apiObservable = this.programService.put(url + '/' + this.taskDetails?.id, payload);
      }

     this.loader.show();
      apiObservable.subscribe({
        next: (res: any) => {
          this.loader.hide();
          this.alert.success(`You have successfully ${!this.isEditMode?"created":"updated"} a task`);
          this.router.navigate(['onboarding', 'task', res?.id, 'mode', 'view']);
          this.fileUploadErrorEncountered = false;
          this.fetchTaskDetails();
        }, error: (err: Error | any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      });
    } else {
      this.alert.error('Please address all the validation errors!');
      this.taskForm.markAllAsTouched();
    }
  }

  createPayload(): any {

    let value: any = this.taskForm?.value ?? {};
    let payload: any = {
      name: value?.name,
      is_enabled: value?.status,
      // TODO: ONBOARDING/OFFBOARDING integration (Out of scope)
      task_type: value?.activity,
      config: {
        start_date: {
          days: value?.start_date?.day,
          schedule: value?.start_date?.action,
          date: value?.start_date?.event
        },
        due_date: {
          days: value?.due_date?.day,
          schedule: value?.due_date?.action,
          date: value?.due_date?.event
        }
      },
      description: value?.description ?? '',
    };


    if(value?.role && Array.isArray(value?.role)){
      payload.roles = value.role;
      payload.role_id = null;
    }
    else
        payload.role_id = value?.role;

    if(value?.checklists) {
      payload['checklist'] = value?.checklists;
    }

    if(value?.files?.[0]?.raw) {
      payload['files'] = value?.files;
    }

    return payload;
  }

  taskControl(key: string): AbstractControl {
    if(!this.taskForm) {
      return null;
    }

    return this.taskForm.get(key) ?? null;
  }

  switchToEditMode() {
    let url: string = this.route?.url?.replace('mode/view', 'mode/edit');
    let urlParams: Array <string> = url?.split('/')?.filter((path: string) => !(!path || (path === 'self-configuration')));
    this.router.navigate(urlParams);
  }

  selectFile(event?: any) {
    const target: any = event?.target?.files;
    const fileControl: AbstractControl = this.taskControl('files');
    if(target) {

      let file: File = target?.[0];
      if(file) {

        let file_name: string = file.name;
        let file_size: number = file.size;
        
        // File type check
        let file_type: string = file_name.split('.')?.[1];
        if(!this.allowedFileTypes.includes(file_type)) {
          this.fileUploadErrorEncountered = true;
          return;
        }
    
        // File size check
        if(file_size > (10 * 1024 * 1024)) {
          this.fileUploadErrorEncountered = true;
          return;
        }

        this.programService.encodeToBase64(file)
          .then((raw: any) => {
            fileControl?.setValue([{ file_name, raw }]);
            this.fileUploadErrorEncountered = false;
          })
          .catch((err: Error | any) => {
            console.error(err);
            this.alert.error('ERR: Failed to parse selected file');
          });
      }
    } else {
      fileControl?.setValue(null);
    }
  }

  datesValidation() {

    let startDate: Date = new Date();
    let dueDate: Date = new Date();

    let {
      action: startAction,
      day: startDay = 0
    } = this.taskControl('start_date')?.value;

    let {
      action: dueAction,
      day: dueDay = 0,
      event: dueEvent
    } = this.taskControl('due_date')?.value;

    if(![...Object.keys(this.dueEventOptions)].includes(dueEvent)) {
      this.taskControl('due_date').patchValue({ event: null });
    }

    // CASE: Same day action
    if(startDay === dueDay) {
      this.datesValid = !startAction || !dueAction || ((startAction === 'BEFORE') && (dueAction === 'AFTER'));
      // if(!this.datesValid) {
      //   this.taskControl('due_date')?.patchValue({
      //     day: 0,
      //     action: null
      //   });
      // }

      return;
    }

    if(dueAction === 'BEFORE') {
      dueDate.setDate(dueDate.getDate() - dueDay);
    } else {
      dueDate.setDate(dueDate.getDate() + dueDay);
    }

    if(startAction === 'BEFORE') {
      startDate.setDate(startDate.getDate() - startDay);
    } else {
      startDate.setDate(startDate.getDate() + startDay);
    }

    let difference: number = dueDate.getTime() - startDate.getTime();
    this.datesValid = (difference > 0);
    // if(!this.datesValid) {
    //   this.taskControl('due_date')?.patchValue({
    //     day: 0,
    //     action: null
    //   });
    // }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }

  get isCreateMode() {
    return (this.detailMode === 'create');
  }

  get isViewMode() {
    return (this.detailMode === 'view');
  }

  get isEditMode() {
    return (this.detailMode === 'edit');
  }

  get programId() {
    return this.storage.get(StorageKeys.PROGRAM_ID);
  }

  get category() {
    return this.taskControl('actor')?.value;
  }

  get loadMoreRoles() {
    return !this.roleScrollLock && (this.rolesList.length < this.totalRoles);
  }

  get loadMoreChecklists() {
    return !this.checklistLock && (this.checkList.length < this.totalChecklists);
  }

  get status() {
    return this.taskForm?.get('status')?.value;
  }

  set status(flag: boolean) {
    this.taskForm.get('status').setValue(flag);
  }

  get dueEventOptions() {

    if(!this.taskForm)
      return [];

    return (
      this.taskControl('due_date.action')?.value === 'AFTER') ? {
      OFFER_CREATION_DATE: 'Offer Creation Date',
      OFFER_ACCEPTANCE: 'Offer Acceptance Date',
      ASSIGNMENT_CREATION_DATE: 'Assignment Creation Date',
      ASSIGNMENT_START_DATE: 'Assignment Start Date',
      ASSIGNMENT_END_DATE: 'Assignment End Date',
      ASSIGNMENT_TERMINATION_DATE: 'Assignment Termination Date',
    } : {
      ASSIGNMENT_START_DATE: 'Assignment Start Date',
      ASSIGNMENT_END_DATE: 'Assignment End Date',
    };
  }

  get showTaskDurationRequired() {

    let startControl: AbstractControl = this.taskControl('start_date');
    let endControl: AbstractControl = this.taskControl('due_date');

    return (
      (startControl?.touched && startControl?.invalid) ||
      (endControl?.touched && endControl?.invalid)
    );
  }

  get fileName() {
    let value: any = this.taskControl('files')?.value;
    return value?.[0]?.file_name ?? null;
  }

  get pageTitle() {
    if(this.isCreateMode) {
      return 'Create New Task';
    }

    if(this.isEditMode) {
      return ('Edit ' + this.taskControl('name')?.value) ?? 'Edit Task';
    }

    return this.taskDetails?.name ?? 'View Task';
  }

  setViewDetails(): void {

    // Primary details
    let viewDetails: Array <CommonViewDetail> = [
      {
        label: 'Task Name',
        value: this.taskDetails?.name ?? '--',
        displayType: CommonViewConfig.TEXT
      }, {
        label: 'Status',
        value: this.taskDetails?.is_enabled ? 'Active' : 'Inactive',
        displayType: CommonViewConfig.STATUS,
        enabled: this.taskDetails?.is_enabled
      }
      , {
        label: 'Task Type',
        value: '<span style="background: #EDF2FE; padding: 8px; border-radius: 4px; color: #001A43">Onboarding<span>',
        displayType: CommonViewConfig.TEMPLATE,
      }, {
        label: 'Activity Type',
        value: this.activityOptions.find(({ value }) => this.taskDetails?.task_type === value)?.name || '--',
        displayType: CommonViewConfig.TEXT
      }, {
        label: 'Description',
        value: this.taskDetails?.description || '--',
        displayType: CommonViewConfig.DESCRIPTION,
      }, {
        label: 'Task Duration',
        value: 'task_duration',
        displayType: CommonViewConfig.HEADER
      }
    ];

    // Secondary Details
    const start_date: any = this.taskDetails?.config?.start_date;
    if(start_date) {
      let schedule: string = (start_date?.schedule || '--').toLowerCase();
      let action: string = replaceAll(this.titleCase.transform(start_date?.date ?? '--'), '_', ' ');
      viewDetails.push({
        label: 'Start Date',
        value: `${start_date?.days || 0} day(s) ${schedule} ${action}`,
        displayType: CommonViewConfig.TEXT
      });
    }

    const due_date: any = this.taskDetails?.config?.due_date;
    if(due_date) {
      let schedule: string = (due_date?.schedule || '--').toLowerCase();
      let action: string = replaceAll(this.titleCase.transform(due_date?.date ?? '--'), '_', ' ');
      viewDetails.push({
        label: 'Due Date',
        value: `${due_date?.days || 0} day(s) ${schedule} ${action}`,
        displayType: CommonViewConfig.TEXT
      });
    }

    const other_settings: any = this.taskDetails?.roles?.length > 0 ? this.taskDetails?.roles : (this.taskDetails?.role || {});
    let catorgoryName:string = null;
    let roleName:string = null;

    if(Array.isArray(other_settings)){
      catorgoryName = other_settings[0].organization_category;
      roleName = other_settings?.map(role => role.name)?.join(', ');
    }else{
      catorgoryName = other_settings.organization_category;
      roleName = other_settings.name;
    }

    if(roleName || catorgoryName) {
      viewDetails.push({
        label: 'Other Settings',
        value: 'other_settings',
        displayType: CommonViewConfig.HEADER
      });

      if(roleName) {
        viewDetails.push({
          label: 'Actor',
          value: this.actorsList.find(({ value }) => catorgoryName === value)?.name || '--',
          displayType: CommonViewConfig.TEXT
        });
      }

      if(catorgoryName) {
        viewDetails.push({
          label: 'User Roles',
          value: roleName || '--',
          displayType: CommonViewConfig.TEXT
        });
      }
    }

    const files: any = this.taskDetails?.files;
    if(Array.isArray(files) && files.length) {
      viewDetails.push({
        label: 'Attachments',
        value: `<a href="${files[0]?.url || '#'}" target='_self' download='${files[0]?.file_name || '--'}' style="background: #EDF2FE; padding: 8px; border-radius: 4px; color: #001A43">${files[0]?.file_name || '--'}</a>`,
        displayType: CommonViewConfig.TEMPLATE
      });
    }

    this.viewDetails = viewDetails;
  }
}

type DetailMode = ('create' | 'view' | 'edit');
type NameValuePair = { value: string, name: string };
type TaskQuery = { page: number, term: string, category?: string };

function replaceAll(data: string, delim: string, token: string) {
  while (data.includes(delim)) {
    data = data.replace(delim, token);
  }

  return data;
}
