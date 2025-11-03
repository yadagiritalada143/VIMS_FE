import { Component, OnInit, ViewChild, Input, OnChanges } from '@angular/core';
import { EventStreamService } from '../../../../core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/core/services/user.service';
import { SvmsUploadAvatarComponent } from 'src/app/shared/components/svms-upload-avatar/svms-upload-avatar.component';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramConfig } from 'src/app/shared/enums';
@Component({
  selector: 'app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss']
})
export class BasicInfoComponent implements OnInit, OnChanges {
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
  emailvalidation = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  @ViewChild(SvmsUploadAvatarComponent) logoComponent: SvmsUploadAvatarComponent;
  constructor(
    public eventStream: EventStreamService, 
    private fb: UntypedFormBuilder, 
    private _UserService: UserService, 
    private _storageService: StorageService, 
  ) { }

  ngOnInit(): void {
    let programData = this._storageService.get(ProgramConfig[0]);
    if (programData) {
      programData = JSON.parse(programData);
      this.clientId = programData?.clientId;
    }
    if (programData) {
      this.programId = programData.program_req_id;
    }
    if (this.simplifyUser) {
      this.getSimplifyRoles();
    }
    else {
      this.getRoles();
    }
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
      role_id: [null, Validators.required],
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
    this._UserService.get('/configurator/resources/roles').subscribe(
      (data: any) => {
        this.Roles = data.roles;
      }
    )
  }

  getRoles() {
    //a3338245-d015-4559-8d37-8567b669a482
    this._UserService.get(`/configurator/programs/${this.programId}/roles`).subscribe((data: any) => {
      this.Roles = data?.roles;
    })
  }

  getSupervisors(){
    this._UserService.get(`/configurator/organizations/${this.clientId}/members`).subscribe((data: any) =>{
      this.supervisorList = data?.members;
    })
  }

  removeSpecialChars() {
      this.userForm.controls.first_name.setValue(this.userForm.controls.first_name.value.replace(/[^a-zA-Z0-9 ]/g, ""));
  }

  getPrefixSuffixFlag(){
    return this._storageService.get('CurrentProgram')?.config?.hide_suffix_prefix;
  }
}
