import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { I18NextPipe } from 'angular-i18next';
import { UsersType } from 'src/app/shared/enums';

@Component({
  selector: 'app-candidate-job-profile',
  templateUrl: './candidate-job-profile.component.html',
  styleUrls: ['./candidate-job-profile.component.scss'],
})

export class CandidateJobProfileComponent implements OnInit {

  constructor(
    public JobDetailsService: JobDetailsService,
    public storageService: StorageService,
    public alert: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    private _loader: LoaderService,
    private candidateService: CandidateService,
    private jobDetailService: JobDetailsService,
    private userPermissionService: UserPermissionService,
    private s3UploadService: AwsS3FileUploadService,
    private sortHelperPipe: SortHelperPipe,
    private masterTalentProfileService: MasterTalentProfileService,
    private authorizationService: AuthorizationService,
    private confirmService: ConfirmationDialogService,
    private i18NextPipe: I18NextPipe
  ) { }
  @Input() mtpCandidate?: any;
  @Input() mtpProfileId?: string;
  @Input() isMtpCandicate?: boolean;
  @Output() getMasterTalent = new EventEmitter();
  linkTalentProfile:any;
  jobData: any;
  jobId: any;
  dataLoader: boolean = true
  isOptOutText: string = 'opt_in';
  isOptOut = true;
  mtpId:string;
  user_type: any;
  jobStatus;
  currentProgram: any = {}
  candidateData: any;
  CandidateId: any;
  public candidateSecondary;
  public showDOB = false;
  public showStateID = false;
  public param = '';
  public SecondaryAddressArr=[];
  hideEyeIcon:boolean = true;
  jobDetails;
  showSkelton: boolean = false;
  certificationsArr = [];
  credentialsArr = [];
  vaccinationsArr = [];
  skillsArr = [];
  educationArr = [];
  currentPage: number = 1;
  public itemPerPage = 10;
  currentProgramId: string;
  specialityArr = [];
  visibleIndices = new Set<number>();
  visibleCredentialIndices = new Set<number>();
  visibleSkillIndices = new Set<number>();
  visibleEducationIndices = new Set<number>();
  visibleVaccinationIndices = new Set<number>();
  visibleSpecialityIndices = new Set<number>();
  public qualificationData:boolean = false;
  public qualificationTypeName;
  public isLoading:boolean = true;
  logs: Log= undefined;
  currentOptStatus:boolean = false;
  showSubmitCandidate:boolean = true;
  accountDetails:any;
  detailedValue: string = "cBasicInfo" ;
  candidateWorkerDetails = null;
  masterProfilePermissions = MasterProfilePermissions;
  ngOnInit(): void {
    this.jobDetails = this.storageService.get('viewd_job');
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.route?.parent?.params.subscribe(params => {
      this.jobId = params['id'];
      this.CandidateId = params['candidateId'] || this.mtpCandidate?.candidate?.id;
    });
    if(!this.CandidateId){
      this.CandidateId = this.mtpCandidate?.candidate?.id;
    }
    // this.jobId = this.route.snapshot.params['id'];
    // this.CandidateId = this.route.snapshot.params['candidateId']; or this.route.parent.params._value.candidateId;
    // this.CandidateId = this.storageService.get('candidateId');
    this.init();
    this.accountDetails = this.storageService.get('account');
    this.user_type = this.storageService.get('user_type')?.toLowerCase();
    const user_permission = this.storageService.get('user_permission');
    if (user_permission?.includes('hide_pii_flag')) {
      this.hideEyeIcon = false;
    }
    if(this.jobId) {
        this.jobDetailService.loadJob(this.jobId).subscribe({
          next: (res: any) => {
          let jobdetails = res['job'];
          this.currentOptStatus = jobdetails?.opt_option === 'opt_in' ? true : false;
        },
        error: (error) => {
          this.showError(error);
          }
      });
    }
  }
  init() {
    if (this.CandidateId) {
    this.getCandidateDetails(this.CandidateId);
    }
    if(this.CandidateId && this.jobId){
      this.getSubmitCandidate();
    }
    if(this.isMtpCandicate) {
      this.getCandidateWorkerDetails(this.CandidateId);
      this.getMasterTalentProfiles({ programId: this.currentProgramId , limit:25})
    }
  }

  submitedCandidateDetail: any;
  getSubmitCandidate() {
    this.submitedCandidateDetail = null;
    this.jobDetailService.getSubmissionDetails(this.currentProgram?.id, this.jobId, this.CandidateId).subscribe({
      next: (data: any) => {
      this.submitedCandidateDetail = data.candidate;
      this.showSubmitCandidate = true;
    },
    error: err => {
      this.showSubmitCandidate = false;
    }});
  }
  getCandidateWorkerDetails = (candidateId) => {
    this.JobDetailsService.getWorkerDetails(candidateId).subscribe((res: any) => {
      this.candidateWorkerDetails = res?.data?.worker;
    });
  }
  getMasterTalentProfiles = (masterTalentProfileListRequestParam) => {
    this.masterTalentProfileService.getMasterTalentProfiles(masterTalentProfileListRequestParam).subscribe({
      next: (result: any) => {
        this.linkTalentProfile = result.master_talent_profiles.filter((profile) => profile.id !== this.mtpProfileId);
      },
        error: () => {
          this.alert.error(this.i18NextPipe.transform('no_data_found'));
        },
      });
  }; 

  onSearchEvent(searchTerm){
    this.getMasterTalentProfiles({ programId: this.currentProgramId , limit:25 , talent_name:searchTerm})
  }

  emptySearch(event){
    if(event === ''){
      this.getMasterTalentProfiles({ programId: this.currentProgramId , limit:25});
    }
  }

  linkToAnotherMaster(mtp_id){
    let payload = { program_id: this.currentProgramId , mtp_id};
    this.confirmService.confirm('', this.i18NextPipe.transform("link_mtp_profile"),
    this.i18NextPipe.transform('yes'), this.i18NextPipe.transform('no'))
    .then((res)=>{
      if(res){
        this._loader.show();
        this.masterTalentProfileService.updateLinkMasterProfile(this.mtpCandidate?.candidate?.id,payload).subscribe((result:any)=>{
         this.getMasterTalent.emit();
         this.alert.success(this.i18NextPipe.transform('master_profile_link_success'))
         this._loader.hide();
        })
      }})}
  get address() {
    return this.candidateData?.addresses ? this.candidateData?.addresses.find(add => add.type === 'PRIMARY') : null;
  }
  showHideDetail(index): void {
    if (!this.visibleIndices.delete(index)) {
      this.visibleIndices.add(index);
    }
  }
  showHideSpeciality(index) {
    if (!this.visibleSpecialityIndices.delete(index)) {
      this.visibleSpecialityIndices.add(index);
    }
  }
  showHideCredentialDetail(index) {
    if (!this.visibleCredentialIndices.delete(index)) {
      this.visibleCredentialIndices.add(index);
    }
  }

  showHideVaccination(index) {
    if (!this.visibleVaccinationIndices.delete(index)) {
      this.visibleVaccinationIndices.add(index);
    }
  }

  showHideSkillDetail(index) {
    if (!this.visibleSkillIndices.delete(index)) {
      this.visibleSkillIndices.add(index);
    }
  }

  showHideEducation(index) {
    if (!this.visibleEducationIndices.delete(index)) {
      this.visibleEducationIndices.add(index);
    }
  }

  openFile(data) {
    if(data?.url){
      window.open(data?.url);
    }
  }
  checkValidFileType(file){
    return file.split('.').pop();
  }

  onSubmitedCandidate() {
    if (this.jobId && this.CandidateId) {
    this.router.navigate(['/candidates/submit-candidate'], {
      queryParams: { jobId: this.jobId, candidateId: this.CandidateId },
  });
    }
  }
  public isUserRole(role: UserType | string) {
    const currentUserRole = this.userPermissionService.currentUserRole();
    return currentUserRole === role;
  }

  convertCustomFieldToArray() {
    /** Commenting as part of BugFix V2M-6533 */
    // if (this.candidateData && this.candidateData.custom_fields) {
    //   const customFields = Object.entries(this.candidateData.custom_fields)?.map((e:any) => {
    //     return {
    //       slug: this.convertCustomFieldName(e[0]),
    //       value: e[1] && e[1] !== '' ? e[1] : '-',
    //     }
    //  });
    //   this.candidateData.custom_fields = customFields;
    // }

    /** Adding as part of BugFix V2M-6533 */
    if (!this.candidateData?.custom_fields) return;
    // if (this.isCustomFieldOnLoad) return;
    // this.isCustomFieldOnLoad = !this.isCustomFieldOnLoad;
    const customFieldHttp = this.candidateService?.get(`/configurator/programs/${this.currentProgram?.id}/custom-fields?entity_ref=CANDIDATES&active=1&order_by=asc&key=ref_order`);
    customFieldHttp?.subscribe((res: any) => {
      const customFields = [];
      if (res?.custom_fields?.length) {
        res?.custom_fields?.forEach((cf,i) => {
          if (Object.keys(this.candidateData?.custom_fields)?.includes(cf?.slug)) {
            if (typeof this.candidateData?.custom_fields?.[cf?.slug].value === 'object' && Object.keys(this.candidateData?.custom_fields?.[cf?.slug].value).length === 0) return;
            const custom_data = {
              slug: this.convertCustomFieldName(cf?.label),
              value: cf?.type == "TOGGLE" || cf?.type == 'NUMBERS' ? this.candidateData?.custom_fields?.[cf?.slug]?.toString() : (this.candidateData?.custom_fields?.[cf?.slug] || '-'),
              type: cf?.type?.toUpperCase()
            };
            if(cf?.meta_data?.currency) {
              custom_data['currency'] = cf?.meta_data?.currency;
            }
            if(Array.isArray(custom_data?.value) && custom_data?.type == 'DROPDOWN' && cf?.meta_data?.datasource?.is_multi_select) {
              const val = [];
              custom_data?.value?.forEach((res,i)=>{
                cf?.meta_data?.datasource?.options?.forEach(custom_field_data => {
                   if(res == custom_field_data?.value) {
                    val.push(custom_field_data?.label);
                   }
                })
              });
              custom_data.value = val;
            }
            if(cf?.type == 'SOURCE' && this.candidateData?.custom_fields?.[cf?.slug]) {
              let url = cf.api_url
              const index = customFields?.length;
              url = url.includes('?') ? url += `&user_ids=${this.candidateData?.custom_fields?.[cf?.slug]}` : url += `&user_ids=${this.candidateData?.custom_fields?.[cf?.slug]}`
              this._loader.show();
              this.candidateService.get(url).subscribe({
                next: (data: any) => {
                  customFields[index]['value'] = data?.members[0]?.full_name
                  this._loader.hide();
                }, error: () => {
                  this._loader.hide();
                },
              });
            }
            if(cf?.type == 'NUMBERS') {
              if (cf?.meta_data?.show_in_thousands) {
                custom_data.value = custom_data?.value?.toLocaleString('en-US', {minimumFractionDigits: cf?.meta_data?.decimal});
              } else if (!cf?.meta_data?.show_in_thousands && cf?.meta_data?.decimal) {
                custom_data.value = custom_data?.value?.toFixed(cf?.meta_data?.decimal)
              }
            }
            customFields?.push(custom_data);
          }
        });
        this.candidateData.custom_fields = customFields;
      }
    });
  }

  convertCustomFieldName(slugName: string) {
    let value: string;
    if(slugName){
      let arrayOfData = slugName.split('_');
      if (arrayOfData.length > 0) {
        value = arrayOfData.map(x => this.capitalizeFirstLetter(x)).join(' ');
      } else {
        value = this.capitalizeFirstLetter(arrayOfData[0]);
      }
    }
    return value;
  }

  capitalizeFirstLetter(name: string) {
    if (name) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return '';
  }

  getCandidateDetails(id) {
    this._loader.show();
    this.candidateService.getCandidateDetail(id,true).subscribe({
      next: (data: any) => {
        if (data) {
            this.candidateData = data.candidate;
            this.candidateSecondary = this.candidateData?.addresses ? this.candidateData?.addresses?.find(add => add?.type === 'SECONDARY') : null;
            this.candidateData.full_name = this.candidateData?.middle_name ? `${this.candidateData.first_name} ${this.candidateData.middle_name} ${this.candidateData.last_name}`
            : `${this.candidateData.first_name} ${this.candidateData.last_name}`;
            this.candidateData.full_name = this.jobDetailService.toTitleCase(this.candidateData?.full_name);
            if(this.candidateSecondary){
            for (const property in this.candidateSecondary) {
              let secondObj={};
              if(this.candidateSecondary[property]!==null){
                secondObj[property]=this.candidateSecondary[property];
                this.SecondaryAddressArr.push(secondObj);
              }
            }
          }
            if (data.candidate?.qualifications?.length) {
              data.candidate.qualifications.filter((can) => {
                if (can.qualification_type) {
                  this.getTypeName(can);
                  if(this.skillsArr?.length>0) {
                    this.skillsArr = this.sortHelperPipe.transform(this.skillsArr, 'qualification_name');
                  }
                }
              });
            }
            this.convertCustomFieldToArray();
            this.isLoading = false;
            this._loader.hide();
          }
        },
      error: (error) => {
        // this.alert.error(error);
        this.showError(error);
        this._loader.hide();
      }});
    }
  resetEducationArr(){
    this.educationArr = [];
  }
  getTypeName(can) {
      this.qualificationTypeName = can.qualification_name;
      if (can?.qualification_type?.code == 'CERTIFICATION') {
        can['certification_name'] = this.qualificationTypeName;
        this.qualificationData=true;

        this.certificationsArr.push(can);
      } else if (can?.qualification_type?.code == 'VACCINATION') {
        can['vaccine_name'] = this.qualificationTypeName;
        this.qualificationData=true;
        this.vaccinationsArr.push(can);
      } else if (can?.qualification_type?.code == 'CREDENTIAL') {
        can['credential_name'] = this.qualificationTypeName;
        this.qualificationData=true;
        this.credentialsArr.push(can);
      } else if (can?.qualification_type?.code == 'SPECIALITY') {
        can['speciality_name'] = this.qualificationTypeName;
        this.qualificationData=true;
        this.specialityArr.push(can);
      } else if (can?.qualification_type?.code == 'EDUCATION') {
        can['education_name'] = this.qualificationTypeName;
        this.qualificationData=true;
        this.educationArr.push(can);
      } else if (can?.qualification_type?.code == 'SKILL') {
        can['skill_name'] = this.qualificationTypeName;
        this.qualificationData=true;
        this.skillsArr.push(can);
      }
  }

  downloadAttachment(data) {
    var link = document.createElement('a');
    if (data) {
      link.href = data;
    }
    else {
      this.showError('Resume Not Found.');
    }
    link.dispatchEvent(new MouseEvent('click'));
  }
  get profileImageHide(){
    return (this.user_type?.toUpperCase() === UsersType.CLIENT && this.currentProgram?.config?.is_candidate_image_hidden);
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  checkIfArray(arr){
    if (Array.isArray(arr)) {
      return true;
    }
    else{
      return false;
    }
  }

  downloadS3Attachment(file: any) {
    if (file && file.name && file.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  isObjectArray(obj : any) {
    return Array.isArray(obj)
  }
  detailCollapse(value){
    this.detailedValue = value;
  }

  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }
}
