import { Component, OnInit, ViewChild, Input, OnChanges } from '@angular/core';
import { EventStreamService } from '../../../../core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/core/services/user.service';
import { SvmsUploadAvatarComponent } from 'src/app/shared/components/svms-upload-avatar/svms-upload-avatar.component';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
@Component({
  selector: 'app-vendor-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss']
})
export class VendorBasicInfoComponent implements OnInit, OnChanges {
  public userForm: UntypedFormGroup;
  public logoSize: any;
  public status;
  public programId: any;
  public isViewClicked1: any;
  public supervisorList: any;
  public clientId: string;
  @Input() simplifyUser = false;
  isImagePresent: boolean = false;
  public toggle = {
    title: 'active',
    value: true
  };
  @Input()editData;
  @Input()viewData;
  @Input()isViewClicked;
  public Roles: any;
  @ViewChild(SvmsUploadAvatarComponent) logoComponent: SvmsUploadAvatarComponent;
  constructor(
    public eventStream: EventStreamService, 
    private fb: UntypedFormBuilder, 
    private _UserService: UserService, 
    private _storageService: StorageService, 
  ) { }

  ngOnInit(): void {  
    let programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.clientId =  this._storageService.get("ORG_ID");
    this.getRoles();
    
    this.getSupervisors();
    this.userForm = this.fb.group({
      avatar:  [],
      first_name: [null, Validators.required],
      middle_name: [null, ''],
      last_name: [null, Validators.required],
      title: [null, ''],
      name_prefix: [null, ''],
      supervisor_id: [null, ''],
      contact_person: ['', ''],
      status: ['', ''],
      name_suffix: [null, ''],
      role_id: ['', Validators.required],
      phone: ['', ''],
      email: ['', Validators.required],
      phoneFomat: ['', ''],
    })
  } 
  getCropImage(e) { 
     if (e) {
      this.isImagePresent = true; 
     } else {
      this.isImagePresent = false; 
     } 
  }

  ngOnChanges(){  
    if(this.editData){
      this.loadData();
      this.isViewClicked1 = this.isViewClicked;
    }
  }

  loadData() {
    if(this.editData){
    this.userForm?.patchValue({
      avatar: this.editData?.avatar,
      first_name: this.editData?.first_name,
      middle_name: this.editData?.middle_name,
      last_name: this.editData?.last_name,
      title: this.editData?.title,
      name_prefix: this.editData?.name_prefix,
      supervisor_id: this.editData?.supervisor?.id,
      contact_person: '',
      name_suffix: this.editData?.name_suffix,
      role_id: this.editData?.role?.id,
      status: this.editData?.is_enabled,
      phone: '',
      email: this.editData?.email,
      phoneFomat: ''
    })
    if (this.editData?.is_enabled == false) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    this.status = this.editData?.is_enabled;
    this.userForm?.get('status')?.setValue(this.status);
    if(!this.editData?.first_name){
      this.Roles?.forEach(role => {
        if(role?.name?.toLowerCase() == "administrator"){
          this.userForm?.patchValue({role_id: role.id});
        }
      });
    }
  }
  else {
    this.userForm?.reset();
  }
}

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    this.status = this.toggle.value;
    this.userForm.get('status')?.setValue(this.status);
  }

  getSimplifyRoles() {
    this._UserService.get('/configurator/resources/roles')
    .subscribe((data: any) => {
        this.Roles = data?.roles;
      }
    )
  }

  getRoles() {
    this._UserService.get(`/configurator/organizations/${this.clientId}/roles?org_category=VENDOR`)
    .subscribe((data: any) => {
      this.Roles = data?.roles;
      if(!this.editData?.first_name){
        this.Roles?.forEach(role => {
          if(role?.name?.toLowerCase() == "administrator"){
            this.userForm?.patchValue({role_id: role?.id});
          }
        });
      }
    })
  }

  getSupervisors() {
    this._UserService.get(`/configurator/organizations/${this.clientId}/members`)
      .subscribe((data: any) => {
        this.supervisorList = data?.members;
      });
  }

  getPrefixSuffixFlag(){
    return this._storageService.get('CurrentProgram')?.config?.hide_suffix_prefix;
  }
}
