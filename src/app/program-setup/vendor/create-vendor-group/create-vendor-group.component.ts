import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';

@Component({
  selector: 'app-create-vendor-group',
  templateUrl: './create-vendor-group.component.html',
  styleUrls: ['./create-vendor-group.component.scss']
})
export class CreateVendorGroupComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  private namePattern: string = "^[a-zA-Z0-9 ]+$";

  @Input() isCreateVendorGroup = 'hidden';
  @Output() onClose = new EventEmitter();
  @Output() onLoadGetVendorList = new EventEmitter()
  vendorSubject: Subject <string> = new Subject <string> ();
  vendorList: any;
  tabIndex = 0;
  vmsData: any;

  public createVendorGroupForm: UntypedFormGroup;
  public clientId: string;
  public isEditMode: boolean = false;
  public programId: string;
  public title: any = 'Add New Vendor Group';
  public toggle = {
    title: 'active',
    value: true
  }

  isViewMode: boolean = false;
  isUpdateReq: boolean = false;
  toUPdateIteamId: any;
  rendererData: any;
  vendorData: any;
  laborCategoryList: any = [];
  vendorLoading: boolean = false;
  vendorGroupName: boolean = false;

  constructor(private fb: UntypedFormBuilder,
    private localStorage: StorageService,
    private _vendorService: VendorService,
    private _storageService: StorageService,
    private eventStream: EventStreamService,
    private storageService: StorageService,
    private _alertService: AlertService,
    public router: SvmsRouterService,
    private loader: LoaderService,
    private activatedRoute: ActivatedRoute,
    private sortHelper: SortHelperPipe) { }

  ngOnInit(): void {
    let programid = this.localStorage.get(ProgramConfig[0]);
    programid = JSON.parse(programid);
    if (programid) {
      this.clientId = programid['clientId'];
      this.programId = programid['program_req_id'];
    }

    this.getVendors();
    this.getLaborCategoriesList();

    this.createVendorGroupForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(this.namePattern)]],
      description: [''],
      userId: ['', Validators.required],
      laborCategories: [[], ''],
    });
    // this.hierarchyList();

    this.subscriptions.push(this.eventStream.on(Events.CREATE_VENDOR_GROUP).subscribe((data: any) => {
      this.activatedRoute.queryParams.subscribe(param => {
        this.title = `Add New Vendor Group`;
      });
      if (data) {
        this.isCreateVendorGroup = 'visible';
        this.isEditMode = false;
      } else {
        this.isCreateVendorGroup = 'hidden';
      }
      this.isViewMode = false;
    }));
    this.subscriptions.push(this.eventStream.on(Events.EDIT_VENDOR_GROUP).subscribe( (data:any) => {
      if (data?.event) {
        this.title = `Edit (${data?.data?.name})`;
        this.toggle.value = data?.data?.is_enabled;
        this.toggle.title = data?.data?.is_enabled == true ? 'active' : 'inactive';
        this.isCreateVendorGroup = 'visible';
        this.createVendorGroupForm.patchValue(data?.data);
        let v = new Array();
        if (data?.data && data?.data?.vendors && data?.data?.vendors.length > 0) {
          data?.data?.vendors.map(vendor => {
            v.push(vendor.id);
          });
          this.createVendorGroupForm.patchValue({
            userId: v
          });
        }

        this.isUpdateReq = true;
        this.isEditMode = false;
        this.isViewMode = false;
        this.toUPdateIteamId = data?.data?.id;
        // this.addVendor();
        this.viewVendor(data?.data);
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.VENDOR_GROUP_VIEW).subscribe( (data: any) => {
      if (data?.event) {
        this.toggle.title = data?.data?.is_enabled ? 'active' : 'inactive';
        this.toggle.value = data?.data?.is_enabled;
        this.title = `${data?.data?.name} detail view`;
        this.isEditMode = true;
        this.isViewMode = true;
        this.createVendorGroupForm.patchValue(data?.data);
        let v = new Array();
        if (data?.data && data?.data?.vendors && data?.data?.vendors.length > 0) {
          data?.data?.vendors.map(vendor => {
            v.push(vendor.id);
          });
          this.createVendorGroupForm.patchValue({
            userId: v
          });
        }
        // this.addVendor();
        this.viewVendor(data?.data);
        this.isCreateVendorGroup = 'visible';
      } else {
        this.isCreateVendorGroup = 'hidden';
      }
    }));
    this.subscriptions.push(
      this.vendorSubject
        .asObservable()
        .pipe(
          map((v: any) => v.term),
          debounceTime(800),
        )
        .subscribe((res:any) => {
          this.getVendors(res);
        }),
    );
  }

  onIndexChange(event) {
    this.tabIndex = event;
  }

  goToNext() {
    this.onIndexChange(this.tabIndex + 1);
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

  getLaborCategoriesList() {
    const url =`/configurator/programs/${this.programId}/industries`;
    this.subscriptions.push(this._vendorService.get(url)
      .subscribe((res:any) => {
        const { industries } = res;
        this.laborCategoryList = industries;
      }
    ))
  }

  createVendorGroup() {
    if (this.createVendorGroupForm.invalid) {
      this._alertService.error(`Please fill the required fields.`);
      return;
    }
    this.loader.show();
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    const addQualificationItem = this.createVendorGroupForm.value;
    let vid = new Array();
    const v = this.vendorData.forEach(element => {
      if (element && element.vendor) {
        addQualificationItem.userId.forEach(id => {
          if (id === element.vendor.id) {
            vid.push(element.id);
          }
        });
      }
    });

    const payLoad = {
      name: addQualificationItem.name,
      industries: this.createVendorGroupForm.get('laborCategories').value,
      description: addQualificationItem.description ? addQualificationItem.description : '',
      is_enabled: this.toggle?.value === true,
      // hierarchy_units: this.rendererData?.id ? this.rendererData : [],
      vendors: [...new Set([...vid])],
    };
    if (this.isUpdateReq) {
      this.subscriptions.push(this._vendorService.put(`/configurator/programs/${programId}/vendor-groups/${this.toUPdateIteamId}`, payLoad).subscribe(
        data => {
          if (data) {
            this.isUpdateReq = false;
            this.isViewMode = false;
            this.sidebarClose();
            this._alertService.success(`You have updated vendor group  successfully.`);
            this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR_GROUP, false));
          }
          this.loader.hide();
        },
        (err) => {
          this.loader.hide();
          this._alertService.error(errorHandler(err));
        }
      ));
    } else {
      this.subscriptions.push(this._vendorService.post(`/configurator/programs/${programId}/vendor-groups`, payLoad).subscribe(
        (data:any) => {
          if (data) {
            this._alertService.success(`You have added vendor group successfully.`);
            this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR_GROUP, false));
            this.createVendorGroupForm.reset();
            this.sidebarClose();
            // this.router.navigate(['/vendor/vendor-group-list']);
            this.onLoadGetVendorList.emit();
          }
          this.loader.hide();
        },
        (err) => {
          this.loader.hide();
          this._alertService.error(errorHandler(err));
        })
      );
    }
  }

  sidebarClose() {
    this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR_GROUP, false));
    this.createVendorGroupForm.reset();
    this.toggle.value = true;
    this.tabIndex = 0;
    this.title = '';
    this.isViewMode = false;
    this.isUpdateReq = false;
    this.toggle.title = 'active';
    this.vendorList = new Array();
    this.isCreateVendorGroup = 'hidden';
    // this.createVendorGroupForm.get('is_enabled').setValue(this.toggle.value);
    this.onClose.emit(true);
  }

  hierarchyList() {
    let programDetails = JSON.parse(this._storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    this.subscriptions.push(this._vendorService.get(`/configurator/programs/${programId}/hierarchy`).subscribe(
      (data:any) => {
        if (data) {
          this.rendererData = data?.result[0].hierarchies;
        }
      }));
  }

  getVendors(term = '') {
    let url = `/configurator/programs/${this.programId}/vendors`;
    if (term) {
      this.vendorLoading = true;
      url += `?k=${term}`;
    } else {
      this.loader.show();
    }
    this._vendorService.get(url)
    .toPromise()
    .then((data:any) => {
      if (data?.program_vendors && data?.program_vendors.length > 0) {
        this.vmsData = [];
        this.vendorData = this.vendorData
          ? [...new Set([...this.vendorData, ...data?.program_vendors])]
          : [...new Set([...data?.program_vendors])];
        data?.program_vendors.forEach(programList => {
          if (programList && programList.vendor) {
            if (!this.vmsData) {
              this.vmsData = new Array();
            }
            this.vmsData.push(programList.vendor);
          }
        });
      }
      this.sortedVendors();
      this.vendorLoading = false;
      this.loader.hide();
    }, err => {
        this.vendorLoading = false;
        console.error(err);
        this.loader.hide();
    });
  }

  addVendor(event) {
    this.vendorList = event?.length ? event : [];
    if(this.vendorList.length > 0) {
      this.vendorGroupName = true;
    }
    else {
      this.vendorGroupName = false;
    }
  }

  viewVendor(data) {
    this.vendorList = new Array();
    const vId = new Array();
    data?.vendors.forEach(e => {
      vId.push(e?.vendor?.id);
      this.vendorList.push(e.vendor);
      const vIdInList = this.vendorData?.find(v => v?.id === e?.id);
      if (!vIdInList) {
        this.vendorData?.push(e);
      }
    });
    this.vendorData?.forEach(vendor => {
      if (vendor && vendor?.vendor) {
        if (!this.vmsData) {
          this.vmsData = new Array();
        }
        if (!this.vmsData?.find(vms => vms.id === vendor?.vendor?.id))
          this.vmsData.push(vendor?.vendor);
      }
    });
    this.vmsData = [...new Set(this.sortedVendors())];
    this.createVendorGroupForm.patchValue({
      userId: vId
    });
  }

  get isBasicValid() {
    return this.createVendorGroupForm.get('name').valid
  }

  get isVendorGroupValid() {
    return this.createVendorGroupForm.get('userId').valid
  }

  sortedVendors() {
    return this.sortHelper.transform(this.vmsData, 'name');
  }

  removeVendor(v, i) {
    this.createVendorGroupForm.controls.userId.value.forEach(e => {
      if (e === v) {
        this.createVendorGroupForm.controls.userId.value.splice(i, 1);
        this.vendorList.splice(i, 1);
      }
    });
    let vendorIds: any = [];
    this.vendorList.forEach(v => {
      vendorIds.push(v.id);
    });
    this.createVendorGroupForm.patchValue({
      userId: vendorIds,
    });

    if(this.vendorList.length > 0) {
      this.vendorGroupName = true;
    }
    else {
      this.vendorGroupName = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
