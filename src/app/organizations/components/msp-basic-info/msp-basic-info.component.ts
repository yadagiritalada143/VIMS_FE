import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { EventStreamService } from '../../../core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ProgramService } from '../../../programs/program.service';
import { SvmsUploadAvatarComponent } from '../../../shared/components/svms-upload-avatar/svms-upload-avatar.component';
@Component({
  selector: 'app-msp-basic-info',
  templateUrl: './msp-basic-info.component.html',
  styleUrls: ['./msp-basic-info.component.scss']
})
export class MspBasicInfoComponent implements OnInit {
  public orgCreate: UntypedFormGroup;
  public status;
  isImagePresent: boolean = false;

  @Input() editdata;
  @Input() isViewClicked;
  public toggle = {
    title: 'active',
    value: true
  }
  isNameValid = true;
  duplicateOrg = "MSP Name already in Use.";
  @ViewChild(SvmsUploadAvatarComponent) logoComponent: SvmsUploadAvatarComponent;
  public userToken: any;
  public vendor_industries = [];
  constructor(public eventStream: EventStreamService, private fb: UntypedFormBuilder, private _programService: ProgramService) { }

  ngOnInit(): void {
    this.orgCreate = this.fb.group({
      logo: ['', ''],
      org_name: ['', Validators.required],
      org_type: ['MSP', Validators.required],
      vendor_industry: [null],
      status: ['', '']
    })
    this.orgCreate.get('status').setValue(true);
    this.getLaborCategories();
  }
  getCropImage(e) {
    if (e) {
      this.isImagePresent = true;
    } else {
      this.isImagePresent = false;
    }
  }

  ngOnChanges() {
    this.loadData();
  }

  loadData() {
    let vendor_industry = [];
    if (this.editdata && this.editdata?.length > 0) {
      this.editdata[0]?.vendor_industry?.map(data => {
        vendor_industry.push(data?.id);
      })
      this.orgCreate?.patchValue({
        logo: this.editdata[0]?.logo !== '' ? this.editdata[0]?.logo : '',
        client_inactivereason: this.editdata[0]?.status !== '' ? this.editdata[0]?.status : '',
        org_name: this.editdata[0]?.name !== '' ? this.editdata[0]?.name : '',
        org_type: this.editdata[0]?.type !== '' ? this.editdata[0]?.type : 'MSP',
        vendor_industry: vendor_industry ? vendor_industry : '',
        status: this.editdata[0]?.status != '' ? this.editdata[0]?.status : false
      });
      let toggle = this.editdata[0]?.status;
      if (toggle) {
        this.toggle.value = true;
        this.toggle.title = 'active';
      }
      else {
        this.toggle.value = false;
        this.toggle.title = 'inactive';
      }
    }
    else {
      this.orgCreate?.reset();
      this.orgCreate?.get('org_type').setValue('MSP');
      this.orgCreate?.get('status').setValue(true);
    }
  }

  getLaborCategories() {
    this._programService.get('/configurator/resources/industries').subscribe(
      (data:any) => {
        this.vendor_industries = data.industries;
      }
    )
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
      this.orgCreate.get('status').setValue(false);
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
      this.orgCreate?.get('status').setValue(true);
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    this.status = this.toggle.value;
  }
}

