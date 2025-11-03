import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { EventStreamService } from '../../../core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ProgramService } from '../../../programs/program.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { SvmsUploadAvatarComponent } from '../../../shared/components/svms-upload-avatar/svms-upload-avatar.component';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-vendor-basic-info',
  templateUrl: './vendor-basic-info.component.html',
  styleUrls: ['./vendor-basic-info.component.scss']
})
export class VendorBasicInfoComponent implements OnInit {

  public vendorCreate: UntypedFormGroup;
  public status;
  @Input()editdata;
  @Input()isViewClicked;
  public toggle = {
    title: 'active',
    value: true
  };
  public vendorIndustries = [];
  isImagePresent: boolean = false;

  @ViewChild(SvmsUploadAvatarComponent) logoComponent:SvmsUploadAvatarComponent;
  public isNameValid = true;
  duplicateOrg = "Vendor name already in use.";
  constructor(public eventStream: EventStreamService, private _alert: AlertService, private fb: UntypedFormBuilder, private _programService: ProgramService, private sortHelper: SortHelperPipe) { }

  ngOnInit(): void {

    this.vendorCreate = this.fb.group({
      logo: ['', ''],
      org_name: ['', Validators.required],
      org_type: ['Vendor'],
      vendor_industry: [null, Validators.required],
      status: ['','']
    });
    this.getlaborCategories();
    this.vendorCreate.get('status').setValue(true);
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

    this.vendorCreate?.patchValue({
      logo: this.editdata[0]?.logo !== ''? this.editdata[0]?.logo:'',
      client_inactivereason: this.editdata[0]?.status !== ''? this.editdata[0]?.status:'',
      org_name: this.editdata[0]?.name !== ''? this.editdata[0]?.name:'',
      org_type: this.editdata[0]?.type !== ''? this.editdata[0]?.type:'Vendor',
      vendor_industry: this.editdata[0]?.vendor_industry ? (this.editdata[0]?.vendor_industry?.map((entry: any) => entry?.id) || []):[],
      status: this.editdata[0]?.status != ''? this.editdata[0]?.status:false
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
    this.vendorCreate?.reset();
    this.vendorCreate?.get('org_type').setValue('Vendor');
    this.vendorCreate?.get('status').setValue(true);
    this.toggle.value = true;
    this.toggle.title = 'active';
  }
}

  onClickToggle() {
    if (this.toggle.value) {
      if(this.editdata[0]?.total_program > 0) {
        this._alert.error("Vendor is associated with other programs. Deactivation can be possible only if vendor is not associated with any programs")
      } else {
        this.toggle.value = false;
        this.toggle.title = 'inactive';
        this.vendorCreate.get('status').setValue(false);
      }
    } else {
      this.toggle.value = true;
      this.vendorCreate.get('status').setValue(true);
      this.toggle.title = 'active';
    }
    this.status = this.toggle.value;
  }

  getlaborCategories() {
    this._programService.get('/configurator/resources/industries').subscribe(
      (data:any) => {
        this.vendorIndustries = this.sortHelper.transform(data.industries, 'name');
      }
    )
  }

}

