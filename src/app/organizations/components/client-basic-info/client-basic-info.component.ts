import { Component, OnInit,ViewChild,Input,OnChanges } from '@angular/core';
import { EventStreamService} from '../../../core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ProgramService } from '../../../programs/program.service';
import {SvmsUploadAvatarComponent} from '../../../shared/components/svms-upload-avatar/svms-upload-avatar.component';

@Component({
  selector: 'app-client-basic-info',
  templateUrl: './client-basic-info.component.html',
  styleUrls: ['./client-basic-info.component.scss']
})
export class ClientBasicInfoComponent implements OnInit,OnChanges {
  public clientCreate: UntypedFormGroup;
  public status: boolean;
  isImagePresent: boolean = false;

  // @Input()editdata: { vendor_industry: { id: any; }; }[];
  @Input()editdata: any[];
  @Input()isViewClicked: any;
  public toggle = {
    title: 'active',
    value: true
  };
  public vendor_industries = [];
  @ViewChild(SvmsUploadAvatarComponent) logoComponent :SvmsUploadAvatarComponent;
  public isNameValid = true;
  duplicateOrg = "Client name already in use.";
  public nameValidation: RegExp = /^[A-Za-z0-9 _\-\\\/.’#@&*']+$/;
  constructor(public eventStream: EventStreamService, private fb: UntypedFormBuilder, private _programService: ProgramService) { }


  ngOnInit(): void {
      this.clientCreate = this.fb.group({
      logo: ['', ''],
      org_name: ['', [Validators.pattern(this.nameValidation)]],
      org_type: ['Client'],
      vendor_industry: [null],
      status: ['','']
    });
    this.getLaborCategories();
    this.clientCreate.get('status').setValue(true);
  }
  getCropImage(e) {
     if (e) {
      this.isImagePresent = true;
     } else {
      this.isImagePresent = false;
     }
  }
  ngOnChanges(){
    this.loadData();
  }

loadData(){
    let vendor_industry= [];
    if(this.editdata && this.editdata?.length>0){
    this.editdata[0]?.vendor_industry?.map(data => {
      vendor_industry.push(data?.id);
    })

    this.clientCreate?.patchValue({
      logo: this.editdata[0]?.logo !== ''? this.editdata[0]?.logo:'',
      org_name: this.editdata[0]?.name !== ''? this.editdata[0]?.name:'Client',
      org_type: this.editdata[0]?.type !== ''? this.editdata[0]?.type:'',
      vendor_industry: this.editdata[0]?.vendor_industry ? (this.editdata[0]?.vendor_industry?.map((entry: any) => entry?.id) || []) : [],
      status: this.editdata[0]?.status ? this.editdata[0]?.status : false
    });
    let toggle = this.editdata[0]?.status;
    if(toggle){
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    else {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    }
    }
    else {
      this.clientCreate?.reset();
      this.clientCreate?.get('org_type')?.setValue('Client');
      this.clientCreate?.get('status').setValue(true);
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
}

onChangestatus() {}

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
      this.clientCreate.get('status').setValue(false);
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
      this.clientCreate.get('status').setValue(true);
    }
    this.status = this.toggle.value;
  }
}
