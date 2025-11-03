import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray } from "@angular/forms";
import { ShortlistingService } from '../shortlisting.service';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { HttpService } from 'src/app/core/services/http.service';
import {ProgramService} from '../../../programs/program.service';

@Component({
  selector: 'app-shortlisting',
  templateUrl: './shortlisting.component.html',
  styleUrls: ['./shortlisting.component.scss']
})
export class ShortlistingComponent implements OnInit {
  public isSubmitted = false;
  public shortlistingForm: UntypedFormGroup;
  shorlistNewForm : UntypedFormGroup;
  public isShortlisting: any;
  public loading = false;
  private subscriptions: Subscription[] = [];
  currentProgram: any;
  showTooltip: boolean;
  programID:any;
  payload: any = {};
  selectedroles: any[];

  public roles: Array<any> = [
    {query: 'MSP', isChecked:false, name: 'MSP', roles: []},
    {query: 'CLIENT', isChecked:false, name: 'CLIENT', roles: []}
  ];

  public selectedRole: string;
  showRoleInfo:boolean;
  submissionDisabled: boolean = true;
  isHmShortlistReview:boolean;
  constructor(public fb: UntypedFormBuilder,
    public shortlistService: ShortlistingService,
    public alertService : AlertService,
    private storageService: StorageService,
    private httpService: HttpService,
    private programService : ProgramService) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programID = this.currentProgram?.id;
    this.isShortlisting = this.currentProgram?.config?.submission?.is_shortlisting_enabled;
    this.showRoleInfo = this.isShortlisting ? true : false;
    this.shortlistingForm = this.fb.group({
      candidate: [''],
      isShortlist : [],
      shortlist_details : this.fb.array([])
    })
    this.getRoles();
  }

  addRoleActor(value: any = null) {
    (this.shortlistingForm.get('shortlist_details') as UntypedFormArray).push(
      this.fb.group({
        short_actor: [value ? value.short_actor : null,],
        short_role_id: [value? value.short_role_id : null],
      })
    );
  }

  get isInvalidForm() {
    const selectedRoles = this.roles.filter(x => x.isChecked);
    const formData = this.shortlistingForm.controls['shortlist_details'].value;
    if (selectedRoles.length > 0 && formData.length > 0) {
      for(let i = 0; i < this.roles.length; i++) {
        if (this.roles[i].isChecked) {
          if (!formData[i].short_role_id || formData[i].short_role_id.length === 0) {
            return true;
          }
        }
      }
    } else {
      return true;
    }

    return false;
  }

  changeValue(event) {

    this.showRoleInfo = !this.showRoleInfo;
    if(!event){
      let dataPayload = [];
      let payload = {};
      let shortlist = {};
      if (!Object.keys(shortlist).length) {
        Object.assign(shortlist, { is_shortlisting_enabled: event });
      }
      shortlist['hm_shortlist_review'] = event;
      shortlist['shortlist_org_actor'] = null;
      shortlist['shortlist_role_id'] = null;
      payload = {'submission': shortlist};
      dataPayload.push(payload);
      this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res:any) => {
        if(res) {
          this.currentProgram.config.submission.is_shortlisting_enabled = event;
          this.currentProgram.config.submission.shortlist_org_actor = null;
          this.currentProgram.config.submission.shortlist_role_id = null;
          this.currentProgram.config.submission.hm_shortlist_review = event;
          this.storageService.set("CurrentProgram", this.currentProgram, true);
        }
        this.alertService.success('Settings updated successfully.');
      })
    }
    if(event){
      this.selectedRole = '';
      let formArray = this.shortlistingForm.get('shortlist_details') as UntypedFormArray;
      formArray.reset();
      this.roles.filter(item => item.isChecked = false);
    }

  }

  getRoles() {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    //let orgActor = this.currentProgram.config.submission.shortlist_org_actor;
    //this.selectedRole = orgActor;
    let currentConfig = this.currentProgram?.config?.submission?.shortlist_details;
    if (currentConfig) {
      this.roles?.forEach(role => {
        const shortlist = currentConfig?.find(x => x.short_actor === role.name);
        if (shortlist) {
          role.isChecked = true;
        } else {
          role.isChecked = false;
        }
      });
    }
      // this.shortlistingForm.patchValue({
      //   roleName: orgActor,
      //   actor : roleId
      // })
    this.roles?.forEach(item => {
      const shortlist = currentConfig?.find(x => x.short_actor === item.name);
      this.addRoleActor(shortlist);
      this.subscriptions.push(this.programService.get(`/configurator/programs/${programId}/roles?org_category=${item.query}`).subscribe((data:any) => {
        if (data) {
          item.roles = data.roles;
        }
      }));
    });
  }
  selectedItemsList:any[] = [];
  selectRole(index) {
    this.roles[index].isChecked = !this.roles[index].isChecked;
    this.shortlistingForm
      .get('shortlist_details')
      ['controls'][index].get('short_actor')
      .setValue(this.roles[index].name);
  }

  roleSelected(name) {
    return this.selectedRole === name;
  }


hmShortlistReview(event){
  let dataPayload = [];
  let payload = {};
  if (!Object.keys(payload).length) {
    Object.assign(payload, { hm_shortlist_review: event });
  }
  payload = {'submission': payload};
  dataPayload.push(payload);
  if(!event){
    this.shortListReviewApi(dataPayload,event)
  }
  if(event){
    this.shortListReviewApi(dataPayload,event)
  }

}

shortListReviewApi(payload,eve){
  this.httpService.put(`/configurator/programs/${this.programID}/update_config`, payload).subscribe((res:any) => {
    if(res) {
      this.currentProgram.config.submission.hm_shortlist_review = eve;
      this.storageService.set("CurrentProgram", this.currentProgram, true);
      this.alertService.success('Settings updated successfully.');
    }
  })
}

  changeCandidate(e) {
    if(this.isShortlisting){
      if(e.target.value == 'onlyShortlisted'){
       this.showTooltip = true;
      } else{
        this.showTooltip = false;
      }
      this.onSubmit();
    }
  }
  roleSubmit(){

    let dataPayload = [];
    let payload = {};
    let shortlist = {};
    let arr = [];
    let formData = this.shortlistingForm.controls['shortlist_details'].value;
    if (!Object.keys(shortlist).length) {
      Object.assign(shortlist, { is_shortlisting_enabled: this.showRoleInfo });
    }
    this.roles?.forEach(item =>{
      if(item.isChecked){
        formData?.forEach(data =>{
          if(item.name === data.short_actor){
            arr.push(data);
          }
        })
      }
    })
    shortlist['shortlist_details'] = arr;
    payload = {'submission': shortlist}
    dataPayload.push(payload);
     this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res:any) => {
      if(res) {
        this.currentProgram.config.submission.is_shortlisting_enabled = this.showRoleInfo;
        this.currentProgram.config.submission.shortlist_details = arr;
        this.storageService.set("CurrentProgram", this.currentProgram, true);
        this.alertService.success('Settings updated successfully.');
      }
    },
    (err) => {
      this.alertService.error(errorHandler(err));
    }
    )
  }

  onSubmit() {
    this.shortlistingForm.value.isShortlist = this.isShortlisting;
    this.isSubmitted = true;
    if(!this.shortlistingForm.valid) {
      return false;
    } else {
      console.log(this.shortlistingForm.value)
      return
        const url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires'; // dummy URL Add Candidate shortlist url
        this.subscriptions.push(this.shortlistService.post(url, this.shortlistingForm.value).subscribe(
          (data) => {
            this.loading = false;
            this.isSubmitted = false;
            this.alertService.success('created successfully.');
          },
          (err) => {
            this.loading = false;
            this.alertService.error(errorHandler(err));
          }
        ));
      }
  }
}
