import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {StorageService} from '../../../core/services/storage.service';
import {VendorService} from '../vendor.service';
import {AlertService} from '../../../core/components/alert/alert.service';
import {LoaderService} from '../../../core/components/loader/loader.service';
import {EmitEvent, Events, EventStreamService} from '../../../core/services/event-stream.service';
import {NgSelectComponent} from '@ng-select/ng-select';
import {ProgramConfig} from '../../../shared/enums';
import {errorHandler} from '../../../shared/util/error-handler';
import {Subscription} from 'rxjs';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';

@Component({
  selector: 'app-create-vendor-compliance-group',
  templateUrl: './create-vendor-compliance-group.component.html',
  styleUrls: ['./create-vendor-compliance-group.component.scss']
})
export class CreateVendorComplianceGroupComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() createManageVendorDocumentGroup = 'visible';
  @Input() editData;
  @Input() viewData;
  @Input() isViewClicked;
  @Output() onClose = new EventEmitter();


  @ViewChild('userSelect') ngSelectComponent: NgSelectComponent;

  public createVendorComplianceForm: UntypedFormGroup;
  public languages = {'en-US': 'English (United States)'};
  public isViewMode = false;
  public clientId: string;
  public programId: string;
  public isViewVendor;
  public isUpdateReq: any;
  public toUpdateItemId: any;
  public title = 'Add Vendor Compliance Document Group';
  public toggle = {
    title: 'active',
    value: true
  };
  public documentList: any = [];
  public isEditMode = false;

  isSaveLoader = false;
  clickOutside: boolean;
  selectedVendorComplianceGroup: any;

  constructor(private fb: UntypedFormBuilder,
              private storageService: StorageService,
              private localStorage: StorageService,
              private vendorService: VendorService,
              private alertService: AlertService,
              public router: SvmsRouterService,
              private loader: LoaderService,
              private eventStream: EventStreamService) {
  }

  ngOnInit(): void {
    let programDetails = this.localStorage.get(ProgramConfig[0]);
    programDetails = JSON.parse(programDetails);
    if (programDetails) {
      this.clientId = programDetails.clientId;
      this.programId = programDetails.program_req_id;
    }

    // const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    // this.programId = programDetails.program_req_id;

    this.createVendorComplianceForm = this.fb.group({
      name: [null, Validators.required],
      description: ['', []],
    });

    this.getRequiredDocuments();
    const c = this;

    this.subscriptions.push(this.eventStream.on(Events.CREATE_VENDOR_DOCUMENT_GROUP).subscribe((data:any) => {
      c.title = `Add Vendor Compliance Document Group`;
      if (data) {
        this.createManageVendorDocumentGroup = 'visible';
        c.title = `Add Vendor Compliance Document Group`;
      } else {
        this.createManageVendorDocumentGroup = 'hidden';
        c.title = `Add Vendor Compliance Document Group`;
      }
      this.clickOutside = false;
    }));

    this.subscriptions.push(this.eventStream.on(Events.VENDOR_VIEW_DOCUMENT_GROUP).subscribe((data: any) => {
      if (data.event) {
        this.toggle.title = data.data.is_enabled === true ? 'active' : 'inactive';
        this.toggle.value = data.data.is_enabled;
        this.title = `${data?.data?.name} document group view`;
        this.isViewMode = true;
        this.createVendorComplianceForm.patchValue(data?.data?.id);
        this.createVendorComplianceForm.patchValue({
          name: data?.data?.name,
          description: data?.data?.description,
        });
        this.toggle.value = data.data.is_enabled;
        this.toggle.title = data.data.is_enabled === true ? 'active' : 'inactive';
        this.documentList.forEach(item => {
          data?.data.required_documents.forEach(document => {
            if (item.id === document.id) {
              item.selected = true;
            }
          });
        });
        this.selectedVendorComplianceGroup = data?.data;
        this.isUpdateReq = false;
        this.createManageVendorDocumentGroup = 'visible';
      }
      this.clickOutside = true;
    }));
    this.subscriptions.push(this.eventStream.on(Events.EDIT_VENDOR_DOCUMENT_GROUP).subscribe((data:any) => {
      if (data.event) {
        this.title = `Edit (${data?.data?.name})`;
        this.toggle.value = data.data.is_enabled;
        this.toggle.title = data.data.is_enabled === true ? 'active' : 'inactive';
        this.createManageVendorDocumentGroup = 'visible';
        this.createVendorComplianceForm.patchValue(data?.data?.id);
        this.createVendorComplianceForm.patchValue({
          name: data?.data?.name,
          description: data?.data?.description,
        });
        this.selectedVendorComplianceGroup = data?.data;
        this.documentList.forEach(item => {
          data?.data.required_documents.forEach(document => {
            if (item.id === document.id) {
              item.selected = true;
            }
          });
        });
        this.isUpdateReq = true;
        this.isViewMode = false;
        this.toUpdateItemId = data.data.id;
      }
      this.clickOutside = true;
    }));
  }


  sidebarClose() {
    this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR_DOCUMENT_GROUP, false));
    this.onClose.emit(true);
    this.editData = [];
    this.createVendorComplianceForm.reset();
    this.documentList.forEach(item => {
      item.selected = false;
    });
    // this.tabIndex = 0;
    this.title = '';
    this.title = `Add Vendor Compliance Document Group`;
    this.isViewMode = false;
    this.isUpdateReq = false;
    this.createManageVendorDocumentGroup = 'hidden';
    // this.vendorListData = new Array();
    // this.selectedVendorCompliance = null;
    this.router.navigate(['vendor', 'vendor-document-group-list']);
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
  }

  addDocument() {
    const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
    const programId = programDetails[ProgramConfig[3]];
    const documentIds = [];
    this.documentList.forEach(item => {
      if (item.selected) {
        documentIds.push(item.id);
      }
    });
    console.log(this.createVendorComplianceForm.value.description);
    const payload = {
      name: this.createVendorComplianceForm.value.name,
      description: this.createVendorComplianceForm.value.description,
      documents: documentIds,
      is_enabled: this.toggle.value
    };

    if (payload.documents.length < 1) {
      this.alertService.error(`Please select documents.`);
      return;
    }
    if (this.createVendorComplianceForm.invalid) {
      this.alertService.error(`Please fill the required fields.`);
      return;
    }
    if (this.isUpdateReq) {
      this.subscriptions.push(this.vendorService.put(
        `/configurator/programs/${programId}/vendor-compliance/required-document-groups/${this.toUpdateItemId}`,
        payload)
        .subscribe(
          (data:any) => {
            if (data) {
              this.alertService.success(`You have updated Document group successfully.`);
              this.selectedVendorComplianceGroup = '';
              this.sidebarClose();
              this.loader.hide();
              this.isSaveLoader = false;

            }
          },
          (err) => {
            this.loader.hide();
            this.isSaveLoader = false;
            this.alertService.error(errorHandler(err));
          }));
    } else {
      this.subscriptions.push(this.vendorService.post(`/configurator/programs/${programId}/vendor-compliance/required-document-groups`, payload).subscribe(
        data => {
          if (data) {
            this.alertService.success(`You have added Document group successfully.`);
            this.createVendorComplianceForm.reset();
            this.sidebarClose();
            this.loader.hide();
            this.isSaveLoader = false;
          }
        },
        (err) => {
          this.loader.hide();
          this.isSaveLoader = false;
          this.alertService.error(errorHandler(err));
        }));
    }
  }

  getRequiredDocuments() {
    this.subscriptions.push(this.vendorService.get(`/configurator/programs/${this.programId}/vendor-compliance/required-documents`).subscribe((data:any) => {
      data?.required_documents.forEach(item => {
        if (item.is_enabled) {
          this.documentList.push(
            {
              id: item.id,
              name: item.name,
              selected: false
            },
          );
        }
      });
    }, error => {
      this.alertService.error(errorHandler(error));
    }));
  }

  SelectDocument(id) {
    if (!this.isViewMode) {
      this.documentList.forEach(item => {
        if (item.id === id) {
          item.selected = !item.selected;
        }
      });
    }
  }

  get documentSelected() {
    let valid = false;
    this.documentList.forEach(item => {
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
