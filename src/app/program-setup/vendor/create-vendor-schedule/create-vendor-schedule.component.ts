import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import {  Validators, UntypedFormGroup, UntypedFormBuilder, AbstractControl, UntypedFormArray } from '@angular/forms';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, forkJoin, switchMap } from 'rxjs';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ProgramService } from 'src/app/programs/program.service';

@Component({
  selector: 'app-create-vendor-schedule',
  templateUrl: './create-vendor-schedule.component.html',
  styleUrls: ['./create-vendor-schedule.component.scss']
})
export class CreateVendorScheduleComponent implements OnInit, OnDestroy {

  private entityMap: Map <string, ('VENDOR' | 'GROUP')> = new Map <string, ('VENDOR' | 'GROUP')> ();
  private subscriptions: Array <Subscription> = [];
  public distributionScheduleForm: UntypedFormGroup;

  @Input() isCreateVendorSchedule: ('visible' | 'hidden') = 'hidden';
  @Output() onClose: EventEmitter <boolean> = new EventEmitter <boolean> ();
  public toggle: any = {
    title: 'active',
    value: true
  };

  public scheduleId: string = null;
  public tabIndex: number = 0;

  public title: string = 'Add New Vendor Distribution Schedule';
  private mode: ('create' | 'view' | 'edit') = 'create';
  public duration: Array <any> = [
    { name: 'Hour(s)', value: 'H' }, 
    { name: 'Day(s) ', value: 'D' }, 
    { name: 'Week(s)', value: 'W' }
  ];

  public vendorList: Array <any> = [];
  public vendorGroupList: Array <any> = [];
  public vendorOrGroupLoading: boolean = false;
  private vendorSearch: Subject <string> = new Subject <string> ();
  public editMode: boolean = false;
  constructor(
    private fb: UntypedFormBuilder,
    private vendorService: ProgramService,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    public router: SvmsRouterService,
    private alertService: AlertService,
    private loader: LoaderService
    ) { }

  ngOnInit(): void {

    this.initializeForm();
    this.initalizeVendorOrGroupSearch();
    this.vendorSearch.next('');

    // Create Mode
    this.subscriptions.push(
      this.eventStream.on(Events.CREATE_VENDOR_SCHEDULE)
        .subscribe((data: any) => {
          this.mode = 'create';
          this.title = `Add New Vendor Distribution Schedule`;
        }
      )
    );

    // Edit Mode
    this.subscriptions.push(
      this.eventStream.on(Events.EDIT_VENDOR_SCHEDULE)
        .subscribe((data: any) => {
          const result: any = data?.data;
          this.editMode = true;
          if(result) {
            this.mode = 'edit';
            this.title = `Edit (${result?.name || 'Vendor Distribution Schedule'})`;
            this.assignValues(result);
          }
        }
      )
    );

    // View Mode
    this.subscriptions.push(
      this.eventStream.on(Events.VENDOR_VIEW_SCHEDULE)
        .subscribe((data: any) => {
          const result: any = data?.data;
          if(result) {
            this.mode = 'view';
            this.title = `${result?.name || 'Vendor Distribution Schedule'} detail view`;
            this.assignValues(result);
          }
        }
      )
    );
  }

  private assignValues(data: any) {
    
    let {
      id, 
      name, 
      description, 
      is_enabled, 
      schedules = []
    } = data;

    const form: AbstractControl = this.distributionScheduleForm;
    this.toggleStatus(is_enabled);
    this.scheduleId = id;
    form.patchValue({
      name, description
    });

    if(Array.isArray(schedules)) {

      // Immediate
      let immediateSchedule: any = schedules.find((entry: any) => (entry?.schedule_unit === 'IMMEDIATE'));
      form.get('immediate').setValue(this.idParser(immediateSchedule));

      // Others
      const formArray: UntypedFormArray = (form.get('schedules') as UntypedFormArray);
      schedules = schedules.filter((entry: any) => (entry?.schedule_unit !== 'IMMEDIATE'));
      formArray?.clear();
      schedules.forEach((entry: any) => {
        const { schedule_unit, schedule_value } = entry;
        let formGroup: UntypedFormGroup = this.createScheduleFormGroup();
        formGroup.patchValue({
          schedule_unit: schedule_unit?.[0], schedule_value,
          value: this.idParser(entry)
        });

        formArray.push(formGroup);
      })
    }
  }

  private idParser(entry: any): Array <string> {
    let result: Array <string> = [];
    const { vendors = [], vendor_groups = [] } = entry;
    console.log(entry);

    if(Array.isArray(vendors)) {
      vendors.forEach((entry: any) => {
        if(entry?.vendor?.id) {
          result.push(entry?.vendor?.id);
          const isPresent: any = this.vendorOrGroupList.find((etry: any) => etry?.id === entry?.vendor?.id);
          if(!isPresent) {
            this.entityMap.set(entry?.vendor?.id, 'VENDOR');
            this.vendorList.push({
              ...(entry?.vendor || {}), 
              name: entry?.vendor?.name + ' - Vendor',
            });
          } 
        }
      });
    }

    if(Array.isArray(vendor_groups)) {
      vendor_groups.forEach((entry: any) => {
        if(entry?.id) {
          result.push(entry?.id);
          const isPresent: any = this.vendorOrGroupList.find((etry: any) => etry?.id === entry?.id);
          if(!isPresent) {
            this.entityMap.set(entry?.id, 'GROUP');
            this.vendorGroupList.push({
              ...(entry || {}), 
              name: entry?.name + ' - Vendor Group',
            });
          }
        }
      });
    }

    return result;
  }

  initializeForm(): void {
    this.distributionScheduleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      immediate: [null, Validators.required],
      schedules: this.fb.array([
        this.createScheduleFormGroup()
      ], Validators.required),
    });
  }

  private createScheduleFormGroup(): UntypedFormGroup {
    return this.fb.group({
      schedule_value: ['', [Validators.required, Validators.min(0.01)] ],
      schedule_unit: [ null, [Validators.required]],
      value: [null, Validators.required],
    });
  }

  toggleStatus(flag: boolean) {
    if (!flag) {
      this.toggle.value = false;
      this.toggle.title = 'Inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'Active';
    }
  }

  private createPayload(): any {

    let value: any = this.distributionScheduleForm.value;
    let result: any = {
      name: value?.name,
      description: value?.description,
      is_enabled: this.toggle?.value,
      schedules: [{
        schedule: 'IMMEDIATE',
        vendors: value?.immediate?.filter((id: string) => (this.entityMap.get(id) === 'VENDOR')),
        vendor_groups: value?.immediate?.filter((id: string) => (this.entityMap.get(id) === 'GROUP'))
      }]
    };

    let schedules: Array <any> = (value?.schedules || []).map((entry: any) => {
      const { schedule_unit, schedule_value, value = [] } = entry;
      return {
        schedule: '' + Number.parseFloat(schedule_value).toFixed(2) + '' + schedule_unit,
        vendors: value?.filter((id: string) => (this.entityMap.get(id) === 'VENDOR')),
        vendor_groups: value?.filter((id: string) => (this.entityMap.get(id) === 'GROUP'))
      }
    });

    result['schedules'].push(...schedules);
    result['schedules'].forEach((entry: any) => {
      if(!entry?.vendors?.length) {
        delete entry['vendors'];
      }
      if(!entry?.vendor_groups?.length) {
        delete entry['vendor_groups'];
      }
    });

    return result;
  }

  createVendorDistribution() {
    const form: AbstractControl = this.distributionScheduleForm;
    if(form?.valid && this.scheduleValidator()) {

      this.loader.show();
      let url: string = `/configurator/programs/${this.programId}/vendors/distribution-schedules`;
      let payload: any = this.createPayload();
      this.vendorService.post(url, payload).subscribe({
        next: (data: any) => {
          this.loader.hide();
          this.alertService.success(`Vendor distribution schedule created successfully`);
          this.sidebarClose();
          this.editMode = false;
        }, error: (err: any) => {
          console.error(err);
          this.loader.hide();
          this.alertService.error(errorHandler(err));
        }
      });
    }
  }

  editVendorDistribution() {
    const form: AbstractControl = this.distributionScheduleForm;
    if(form?.valid && this.scheduleValidator()) {

      this.loader.show();
      let url: string = `/configurator/programs/${this.programId}/vendors/distribution-schedules/${this.scheduleId}`;
      let payload: any = this.createPayload();
      this.vendorService.put(url, payload).subscribe({
        next: (data: any) => {
          this.loader.hide();
          this.alertService.success(`Vendor distribution schedule updated successfully`);
          this.sidebarClose();
        }, error: (err: any) => {
          console.error(err);
          this.loader.hide();
          this.alertService.error(errorHandler(err));
        }
      });
    }
  }

  addScheduleRow() {
    if(this.scheduleValidator()) {
      const form: UntypedFormArray = (this.distributionScheduleForm.get('schedules') as UntypedFormArray);
      form.push(this.createScheduleFormGroup());
    }
  }

  private initalizeVendorOrGroupSearch() {
    this.subscriptions.push(
      this.vendorSearch.asObservable()
      .pipe(
        debounceTime(600),
        distinctUntilChanged((prev: string, curr: string) => (prev === curr)),
        switchMap((term: string) => {
          this.vendorOrGroupLoading = true;
          return forkJoin([ this.vendorSearchObservable(term), this.vendorGroupObservable(term) ]);
        })
      ).subscribe({
        next: (data: any) => {

          this.vendorList = [];
          this.vendorGroupList = [];
          this.vendorOrGroupLoading = false;

          let vendors: any = data?.[0]?.program_vendors;
          let vendorGroups: Array <any> = data?.[1]?.vendor_groups;          

          if(Array.isArray(vendors)) {
            this.vendorList = vendors.map((programVendor: any) => {
              this.entityMap.set(programVendor?.vendor?.id, 'VENDOR');
              return {
                ...(programVendor?.vendor),
                name: (programVendor?.vendor?.name || 'Undefined') + ' - Vendor'
              }
            })
          }

          if(Array.isArray(vendorGroups)) {
            this.vendorGroupList = vendorGroups.map((entry) => {
              this.entityMap.set(entry?.id, 'GROUP');
              return {
                ...entry,
                name: (entry?.name || 'Undefined') + ' - Vendor Group'
              };
            });
          }
        }, error: (err: Error | any) => {
          console.error(err);
          this.vendorOrGroupLoading = false;
          this.alertService.error('Error encountered while fetching entries!');
        }
      })
    );
  }

  private vendorSearchObservable(term: string = ''): Observable <any> {
    const payLoad = {
      filters: { 
        is_enabled: true,
        name: term
      }
    };
    return this.vendorService.post(`/configurator/programs/${this.programId}/vendors/advanced-filters`, payLoad);
  }

  private vendorGroupObservable(term: string = ''): Observable <any> {
    const payLoad = {
      filters: {
        is_enabled: true,
        name: term
      }
    };

    return this.vendorService.post(`/configurator/programs/${this.programId}/vendor-groups/advanced-filters`, payLoad);
  }

  searchVendorOrGroup({ term }) {
    this.vendorSearch.next(term);
  }

  sidebarClose() {
    this.editMode = false;
    this.mode = 'create';
    this.initializeForm();
    this.onClose.emit(!this.isViewMode);
    this.scheduleId = null;
    this.tabIndex = 0;
  }

  ngOnDestroy(): void {
    this.entityMap.clear();
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }

  removeVendorSchedule(it: number) {
    const scheduleForm: any = this.distributionScheduleForm.get('schedules');
    scheduleForm.removeAt(it);
  }

  private scheduleValidator() {
    const form: UntypedFormArray = (this.distributionScheduleForm.get('schedules') as UntypedFormArray);
    let schedules: Array <any> = form.value;
    if(Array.isArray(schedules)) {

      let isValid: boolean = true;
      schedules.forEach((schedule: any) => {
        const { schedule_unit, schedule_value, value } = schedule;
        if(!(schedule_unit && schedule_value && value?.length)) {
          isValid = false;
        }
      });

      if(isValid) {
        return true;
      } else {
        form.markAllAsTouched();
        this.alertService.error("Please fill all the required fields!");
        return false;
      }
    }

    return false;
  }

  setEditMode() {
    // this.editMode = false;
    this.mode = 'edit';
    this.editVendorDistribution();
  }

  isSelected(id: string) {
    const form: AbstractControl = this.distributionScheduleForm;
    let immediates: Array <string> = form.get('immediate').value ?? [];
    let others: Array <string> = ((form.get('schedules') as UntypedFormArray).value || []) ?? [];
    others = others.reduce((acc: Array <any>, curr: any) => [ ...acc, ...(curr?.value ?? []) ], []);
    return [...immediates, ...others].includes(id);
  }

  get isCreateMode(): boolean {
    return (this.mode === 'create');
  }

  get isViewMode(): boolean {
    return (this.mode === 'view');
  }

  get isEditMode(): boolean {
    return (this.mode === 'edit');
  }

  get programId(): string {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  get vendorOrGroupList(): Array <any> {
    return [
      ...this.vendorList,
      ...this.vendorGroupList
    ]
  }
}
