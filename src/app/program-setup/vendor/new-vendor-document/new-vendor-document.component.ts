import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {AlertService} from '../../../core/components/alert/alert.service';
import {LoaderService} from '../../../core/components/loader/loader.service';
import {StorageKeys, StorageService} from '../../../core/services/storage.service';
import {errorHandler} from '../../../shared/util/error-handler';
import {VendorService} from '../vendor.service';
import {Events, EventStreamService} from '../../../core/services/event-stream.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-new-vendor-document',
  templateUrl: './new-vendor-document.component.html',
  styleUrls: ['./new-vendor-document.component.scss']
})
export class NewVendorDocumentComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];

  @Input() newDocumentVisibility: ('visible' | 'hidden') = 'hidden';

  @Output() onClose = new EventEmitter();
  @Output() onVendorDocumentCreated = new EventEmitter();

  public label = 'Add Vendor Compliance Document';
  public newDocumentForm: UntypedFormGroup;
  public toggles: any = {
    documentTitleActive: {
      value: false
    },
    actOnboarding: {
      value: false
    }
  };

  public frequencies: any = [
    {value: 'MONTHLY', name: 'Monthly'},
    {value: 'QUARTERLY', name: 'Quarterly'},
    {value: 'HALF-YEARLY', name: 'Half Yearly'},
    {value: 'ANNUALLY', name: 'Annually'},
  ];

  public locations: any = [];
  public programId: string;
  public closePanel: EventEmitter<boolean> = new EventEmitter();
  public work_locations: any = [];
  // public vendors: any = [];
  public editMode = false;
  public viewMode = false;
  public documentId: string;

  constructor(
    private _alert: AlertService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private vendorService: VendorService,
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.subscriptions.push(
      this.vendorService.get(`/configurator/programs/${this.programId}/work-locations`).subscribe((data:any) => {
      data.work_locations.map(work_location => {
        this.locations.push(work_location);
      });
    }, error => {
      this._alert.error(errorHandler(error));
    }));

    // this.getVendors();
    this.initializeForm();

    this.subscriptions.push(this.eventStream.on(Events.CREATE_VENDOR_COMPLIANCE).subscribe( (data) => {
      this.label = `Add Vendor Compliance Document`;
      this.editMode = false;
      this.viewMode = false;
    }));

    this.subscriptions.push(this.eventStream.on(Events.VENDOR_VIEW_COMPLIANCE).subscribe((data:any) => {
      if (data.event) {
        this.label = `View (${data?.data?.name})`;
        this.viewMode = true;
        this.documentId = data.data.id;
        const obj = data.data;
        for (let prop in obj) {
          if (this.newDocumentForm.get(prop)) {
            if (prop === 'work_locations') {
              obj[prop].map(data => {
                this.work_locations.push(data.id);
              });
            }
            this.newDocumentForm.get(prop).patchValue(obj[prop]);
          }
        }
        this.newDocumentForm.get('work_locations').patchValue(this.work_locations);
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.EDIT_VENDOR_COMPLIANCE).subscribe((data:any) => {
      if (data.event) {
        console.log(data);
        this.label = `Edit (${data?.data?.name})`;
        this.editMode = true;
        this.documentId = data.data.id;
        this.newDocumentForm.patchValue(data?.data?.id);
        this.newDocumentForm.patchValue({
          name: data?.data?.name,
          is_enabled: data?.data?.is_enabled,
          act: data?.data?.act,
          is_required_for_onboarding: data?.data?.is_required_for_onboarding,
          description: data?.data?.description,
          frequency: data?.data?.frequency,
          document_number: data?.data?.document_number,
          days_to_upload: data?.data?.days_to_upload,
          days_to_regain_compliance: data?.data?.days_to_regain_compliance,
          work_locations: data?.data?.work_locations.map(item => {
            return item.id;
          }),
          files: data?.data?.files,
        });
        if (data?.data?.vendors) {
          this.newDocumentForm.patchValue({
            vendors: data?.data?.vendors.map(item => {
              return item.id;
            }),
          });
        }
      }
    }));
  }

  onNewDocumentClose() {
    this.initializeForm();
    this.onClose.emit(true);
    this.closePanel.emit(true);
    this.editMode = false;
    this.viewMode = false;
  }

  onClickToggle(event) {
    if (!this.viewMode) {
      const toggleItem = event.target.id;
      this.newDocumentForm.get(toggleItem).patchValue(!this.newDocumentForm.get(toggleItem)?.value);
    }
  }

  uploadFiles(event) {
    this.newDocumentForm.patchValue({
      files: event
    });
  }

  onSave() {
    this._loader.show();
    if (this.editMode) {
      this.subscriptions.push(this.vendorService.put(`/configurator/programs/${this.programId}/vendor-compliance/required-documents/${this.documentId}`, this.newDocumentForm.value).subscribe(data => {
        if (data) {
          this.newDocumentForm.reset();
          this._loader.hide();
          this.editMode = false;
          this.documentId = '';
          this.onNewDocumentClose();
          this._alert.success('vendor document edited successfully');
          this.onVendorDocumentCreated.emit(data);
        }
      }, error => {
        this._loader.hide();
        this._alert.error(errorHandler(error));
      }));
    } else {
      this.subscriptions.push(this.vendorService.post(`/configurator/programs/${this.programId}/vendor-compliance/required-documents`, this.newDocumentForm.value).subscribe(data => {
        if (data) {
          this.newDocumentForm.reset();
          this._loader.hide();
          this.onNewDocumentClose();
          this._alert.success('vendor document created successfully');
          this.onVendorDocumentCreated.emit(data);
        }
      }, error => {
        this._loader.hide();
        this._alert.error(errorHandler(error));
      }));
    }
  }

  // getVendors() {
  //   this._loader.show();
  //   this.subscriptions.push(this.vendorService.get(`/configurator/programs/${this.programId}/vendors`).subscribe((data:any) => {
  //     if (data) {
  //       this.vendors = data.program_vendors;
  //       this._loader.hide();
  //     }
  //   }, error => {
  //     this._loader.hide();
  //     this._alert.error(errorHandler(error));
  //   }));
  // }

  initializeForm() {
    this.newDocumentForm = this.fb.group({
      name: [null, Validators.required],
      is_enabled: [false, Validators.required],
      act: [null],
      is_required_for_onboarding: [false, []],
      description: [null],
      frequency: [null, Validators.required],
      document_number: [null, [Validators.required, Validators.minLength(3)]],
      days_to_upload: [null, Validators.required],
      days_to_regain_compliance: [null, Validators.required],
      work_locations: [null, Validators.required],
      vendors: [[]],
      files: [null],
    });
  }

  public get formValue() {
    return this.newDocumentForm.controls;
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
