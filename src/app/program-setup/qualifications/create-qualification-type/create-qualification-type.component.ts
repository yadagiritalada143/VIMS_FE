import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { EventStreamService, EmitEvent, Events } from 'src/app/core/services/event-stream.service';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Observable, Subscription } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

@Component({
  selector: 'app-create-qualification-type',
  templateUrl: './create-qualification-type.component.html',
  styleUrls: ['./create-qualification-type.component.scss']
})
export class CreateQualificationTypeComponent implements OnInit {

  private subscriptions: Array<Subscription> = [];

  @Input() createQualificationType = 'hidden';
  @Output() onClose: EventEmitter<any> = new EventEmitter<any>();

  private editData: any = null;
  public title: string = "Add New Qualification Type";
  public tabIndex: number = 0;
  public toggle: any = {
    title: 'Active',
    value: true
  };

  public addQualificationTypeForm: UntypedFormGroup;
  public isUpdateReq: boolean = false;
  public isViewMode: boolean = false;
  public clickOutside: boolean = false;
  public btnTitle: string = 'Save';
  public codePattern: RegExp = /^[a-zA-Z0-9\-_]{0,}$/gm;

  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private programService: ProgramService,
    private storageService: StorageService,
    private alertService: AlertService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {

    // Initialize form
    this.addQualificationTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      is_enabled: [true, [Validators.required]],
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]]
    });

    //View Qualification Type
    this.subscriptions.push(
      this.eventStream.on(Events.QUALIFICATION_DATA_VIEW)
        .subscribe((data: any) => {
          if (data?.event) {
            this.title = `${data.data.name} detail view`;
            this.toggle.value = data?.data?.is_enabled;
            this.toggle.title = (data?.data?.is_enabled === true) ? 'Active' : 'Inactive';
            this.addQualificationTypeForm.patchValue(data?.data);
            this.isViewMode = true;
          }
        }
        )
    );

    // Edit Qualification Type
    this.subscriptions.push(
      this.eventStream.on(Events.QUALIFICATION_DATA_EDIT)
        .subscribe((data: any) => {
          if (data?.event) {
            this.editData = data?.data;
            this.title = `Edit ${data?.data?.name}`;
            this.toggle.value = data?.data?.is_enabled;
            this.toggle.title = (data?.data?.is_enabled === true) ? 'Active' : 'Inactive';
            this.addQualificationTypeForm.patchValue(data?.data);
            this.isViewMode = false;
            this.btnTitle = 'Update';
            this.isUpdateReq = true;
          }
        }
        )
    );
  }

  sidebarClose(refresh: boolean = false) {
    let obj: any = { "event": false, "data": {} };
    this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_DATA_VIEW, obj));
    this.addQualificationTypeForm.reset();
    this.isViewMode = false;
    this.isUpdateReq = false;
    this.toggle.value = true;
    this.tabIndex = 0;
    this.editData = null;
    this.btnTitle = 'Save';
    this.title = 'Add New Qualification Type';
    this.toggle.title = 'Active';
    this.addQualificationTypeForm?.get('is_enabled')?.setValue(this.toggle.value);
    this.onClose.emit(refresh);
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'Inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'Active';
    }
    this.addQualificationTypeForm?.get('is_enabled')?.setValue(this.toggle.value);
  }

  onSave() {

    this.addQualificationTypeForm.markAllAsTouched();
    if(this.addQualificationTypeForm.invalid) {
      this.alertService.error('Please address all the validation errors!');
      return;
    }

    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/qualification-types`;
    let payload: any = this.addQualificationTypeForm.value;

    this.loader.show();
    let urlMethod: Observable <any> = this.programService.post(url, payload);
    let alert: string = 'Qualification Type is successfully created';
    if(this.editData?.id) {
      url += ('/' + this.editData?.id);
      urlMethod = this.programService.put(url, payload);
      alert = 'Qualification Type is successfully updated';
    }

    urlMethod.subscribe({
      next: (data: any) => {
        if (data) {
          this.loader.hide();
          this.alertService.success(alert);
          this.sidebarClose(true);
        }
      }, error: (err: any) => {
        this.alertService.error(errorHandler(err));
        this.loader.hide();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach((sub: Subscription) => sub?.unsubscribe());
  }

  get isPredefined() {
    if(this.editData) {
      let value: string = this.editData?.type?.toLowerCase();
      return (value !== 'custom') && (value !== 'program');
    }

    return false;
  }
}
