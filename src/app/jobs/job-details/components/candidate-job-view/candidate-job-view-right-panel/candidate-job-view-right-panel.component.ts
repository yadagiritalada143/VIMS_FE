import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { JobDetailsService } from '../../../job-details.service';
import { StorageKeys, StorageService } from '../../../../../../app/core/services/storage.service';
import { AlertService } from '../../../../../core/components/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { Events, EventStreamService, } from 'src/app/core/services/event-stream.service';
import { DOCUMENT } from '@angular/common';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { I18NextPipe } from 'angular-i18next';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
import { UsersType } from 'src/app/shared/enums';
@Component({
  selector: 'app-candidate-job-view-right-panel',
  templateUrl: './candidate-job-view-right-panel.component.html',
  styleUrls: ['./candidate-job-view-right-panel.component.scss'],
})
export class CandidateJobViewRightPanelComponent implements OnInit, OnDestroy {
  jobData: any = {};
  dataLoader: boolean = true;
  jobId: any;
  isOptOutText: string = 'opt_in';
  isOptOut = true;
  user_type: any;
  mtpMatches:any;
  jobStatus;
  selectedMasterProfileID: string;
  currentProgram: any = {};
  candidateData: any;
  CandidateId: any;
  public param = '';
  accountDetails:any;
  profileId:string;
  public mtpDetails: any = null;
  hideEyeIcon:boolean = true;
  public work_location = {
    address: null,
    address_line_1: null,
    address_line_2: null,
    city_state_zipcode: null,
    country_name: null
  }
  showMtpDetailsPermission:boolean = false;
  showProfileLinkingPermission:boolean = false;
  @Input() submitedCandidateDetail: any;
  viewAddress: string;
  showMTPLinking: boolean = false;
  @Input() set jobDetails(data) {
    if (data) {
      this.jobData = data || {};
            const location_data = this.jobData?.location;
            const city_name = location_data?.city?.name?.length > 0 ? location_data?.city?.name : location_data?.city_name;
            const state_name = location_data?.state?.name?.length > 0 ? location_data?.state?.name : location_data?.state_name;
            this.work_location.address_line_1 = location_data?.address_line_1?.length > 0 ? location_data?.address_line_1 : location_data?.address,
            this.work_location.address_line_2 = location_data?.address_line_2,
            this.work_location.city_state_zipcode = `${city_name ? city_name+", " : ""}${state_name ? state_name+" " : ""}${location_data?.zipcode ? location_data?.zipcode : ""}`
            this.work_location.country_name = location_data?.country?.name?.length > 0 ? location_data?.country?.name : location_data?.country_name

            // const city_name = location_data?.city_name ?? location_data?.city?.name;
            // const state_name = location_data?.state_name ?? location_data?.state?.name;
            // this.work_location.address_line_1 = location_data?.address_line_1,
            // this.work_location.address_line_2 = location_data?.address_line_2,
            // this.work_location.city_state_zipcode = `${city_name ? city_name+", " : ""}${state_name ? state_name+" " : ""}${location_data?.zipcode ? location_data?.zipcode : ""}`
            // this.work_location.country_name = location_data?.country_name ?? location_data?.country?.name
      this.jobHierarchy = this.jobData?.hierarchy?.[0];
      if (this.jobData?.opt_option) {
        this.isOptOutText = this.jobData?.opt_option;
      }
      if (this.user_type === 'VENDOR') {
        this.jobStatus = this.getVendorStatus(this.jobData?.status);
      } else {
        if (this.jobData?.status == 'pending_approval') {
          this.jobStatus = 'Pending Approval';
        } else {
          this.jobStatus = this.jobData?.status;
        }
        this.dataLoader = false;
      }
      this.dataLoader = false;
    }
  };
  private subscriptions = [];
  @Output() isDsaasVendor = new EventEmitter<boolean>();
  @Output() showMessage: EventEmitter<any> = new EventEmitter();
  checkDsaasVendor;
  detailedValue;
  constructor(
    @Inject(DOCUMENT) private _document: Document,
    private userPermissionService: UserPermissionService,
    public JobDetailsService: JobDetailsService,
    public storageService: StorageService,
    public alert: AlertService,
    private route: ActivatedRoute,
    public router: Router,
    private _loader: LoaderService,
    private datePipe: LocalDateFormatPipe,
    private candidateService: CandidateService,
    private eventStream: EventStreamService,
    private cryptoService: CryptoService,
    private i18NextPipe: I18NextPipe,
    private masterTalentProfileService:MasterTalentProfileService
  ) { }

  ngOnInit(): void {
    this.showMtpDetailsPermission = this.masterTalentProfileService.hasPermission(MasterProfilePermissions.VIEW_MTP_SCREEN);
    this.showProfileLinkingPermission = this.masterTalentProfileService.hasPermission(MasterProfilePermissions.MANAGE_MASTER_TALENT_PROFILE);
    this.jobId = this.route.snapshot.params['id'];
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.user_type = this.storageService.get('user_type');
    this.CandidateId = this.route.snapshot.params['candidateId'];
    const user_permission = this.storageService.get('user_permission');
    if (user_permission?.includes('hide_pii_flag')) {
      this.hideEyeIcon = false;
    }
    this.init();
    this.subscriptions.push(this.eventStream.on(Events.RELOAD_OFFERS).subscribe((data) => {
      if (data) {
        this.loadOffers();
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.RELOAD_CANDIDATE_DETAIL).subscribe((data) => {
      if (data) {
        this.init();
      }
    }));
    this.accountDetails = this.storageService.get('account');
  }

  init() {
    //this.getJobDetails();
    if (this.CandidateId) {
      this.getCandidateDetails(this.CandidateId);
    }
    if(this.jobId && this.CandidateId) {
      this.loadInterviews();
      this.loadOffers();
      // this.loadAssignMents();
      if(this.showProfileLinkingPermission){
        this.getCandidateDetailsWithMtpMatches(this.CandidateId)
      }
    }
  }


  onActionSuccess(data) {
    this._document.defaultView.location.reload();
  }
  interviews = [];
  loadInterviews() {
    this.JobDetailsService?.getInterviewList(
      this.jobId,
      null,
      this.CandidateId
    ).subscribe({
      next:(data: any) => {
        this.interviews = data.interviews;
      },
      error: (err) => { }
  });
  }

  offers = [];
  loadOffers() {
    this.subscriptions.push(this.JobDetailsService.fetchOfferForCandidate(
      this.currentProgram?.id,
      this.CandidateId,
      this.jobId
    ).subscribe({
      next: (res: any) => {
        this.offers = [...res.offers];
      },
      error: (err) => { }
    }));
  }

  onViewInterview() {
    this.router.navigate([`jobs/details/job-details/${this.jobId}/interviews`]);
  }
  onSubmitedCandidate() {
    this.router.navigateByUrl(
      `/jobs/details/job-details/${this.jobId}/available`
    );
  }

  jobDetail() {
    this.router.navigate(['/jobs/details/job-details/'+ this.jobData?.id])
  }

  masterTalentProfileDetail() {
    if(this.candidateData?.mtp_id && this.showMtpDetailsPermission){
      this.mtpDetails = true;
      this.profileId = this.candidateData?.mtp_id;
    }
  }

  closemtpModal(){
    this.mtpDetails = false;
  }

  onCloseModal = (event?) => {
    if(event){
      this.getCandidateDetails(this.CandidateId);
      this.showMessage.emit(null);
    }
    this.selectedMasterProfileID = '';
    this.showMTPLinking = false;
  }

  masterTalentProfileLinking = () => {
  this.showMTPLinking = true;
  }

  showMasterTalentProfileLinkingMessage() {
    this.showMessage.emit({
      status: 'action',
      icon_src: 'assets/images/master-profiles.svg',
      reason: this.i18NextPipe.transform('master_talent_profile_matches_message_title'),
      notes: this.i18NextPipe.transform('master_talent_profile_matches_message_content'),
      action: this.masterTalentProfileLinking
    })
  }

  copyToClipboard() {
    const work_location_str = `${this.work_location?.address_line_1 ? this.work_location?.address_line_1 + "\n" : ""}${this.work_location?.address_line_2 ? this.work_location?.address_line_2 + "\n" : ""}${this.work_location?.city_state_zipcode ? this.work_location?.city_state_zipcode + "\n" : ""}${this.work_location?.country_name ? this.work_location?.country_name + "\n" : ""}`
    document.addEventListener('copy', (e: ClipboardEvent) => {
      e.clipboardData.setData('text/plain', (work_location_str));
      e.preventDefault();
      document.removeEventListener('copy', null);
    });
    document.execCommand('copy');
  }

  getVendorStatus(status) {
    const jobStatus = [
      { name: 'Pending Approval', value: 'pending_approval' },
      {
        name: 'Pending Approval - Sourcing',
        value: 'Pending Approval - Sourcing',
      },
      { name: 'Open', value: 'Open (Approved)' },
      { name: 'Sourcing', value: 'Sourcing' },
      { name: 'Filled', value: 'Filled' },
      { name: 'Closed', value: 'Closed' },
      { name: 'Hold', value: 'Hold' },
    ];
    const isPresent = jobStatus.some(
      (s) => s?.value.toLocaleLowerCase() === status?.toLowerCase()
    );
    if (isPresent) {
      let job_status = jobStatus.find((s) => s?.value === status);
      if (job_status) {
        return job_status?.name;
      } else {
        return '-';
      }
    } else {
      return '-';
    }
  }
  jobHierarchy:any;
  getJobDetails(burstCache?) {
    this.subscriptions.push(this.JobDetailsService.getJobs(`${this.jobId}`, burstCache).subscribe({
      next: (data: any) => {
        if (data?.job) {
          this.jobData = data.job || {};
          this.jobHierarchy = this.jobData?.hierarchy[0];
          if (this.jobData?.opt_option) {
            this.isOptOutText = this.jobData?.opt_option;
          }
          this.storageService.set('viewd_job', this.jobData, true);

          if (this.user_type === 'VENDOR') {
            this.jobStatus = this.getVendorStatus(this.jobData?.status);
          } else {
            if (this.jobData?.status == 'pending_approval') {
              this.jobStatus = 'Pending Approval';
            } else {
              this.jobStatus = this.jobData?.status;
            }
            this.dataLoader = false;
          }
          this.dataLoader = false;
        }
      },
      error: (err) => {
        this.alert.error(err);
      }
  }));
  }


  getFormattedDate(date?) {
    if (date) {
      if (date?.indexOf('T') !== -1) {
        date = date?.split('T');
        let onlyDate = date[0] || '';
        return this.datePipe.transform(onlyDate, DATE_FORMAT.FORMATMDY, null, null, true, DATE_FORMAT.FORMATYMD);
      } else {
        return this.datePipe.transform(date, DATE_FORMAT.FORMATMDY, null, null, true, DATE_FORMAT.FORMATYMD);
      }
    }
  }

  removedUnwanted(name) {
    return name?.replace(
      /Mr |Mrs |Miss |Dr |Prof |MX |IND |Misc | SR$| Jr$| Sr$| III$| IV$| V$/gi,
      ''
    );
  }

  //heavy call 
  getCandidateDetailsWithMtpMatches(id) {
    this.subscriptions.push(this.candidateService.getCandidateDetailWthMtpMatches(id).subscribe({
      next: (data: any) => {
        if (data) {
          this.mtpMatches = data.master_profile_matches;
          if (!data.candidate.mtp_id
              && data?.master_profile_matches?.length>0
              && this.showProfileLinkingPermission ) {
            this.showMasterTalentProfileLinkingMessage()
          }
        }
      },
      error: (error) => {
        this.alert.error(error);
      }
    }));
  }

  getCandidateDetails(id) {
    this._loader.show();
    this.subscriptions.push(this.candidateService.getCandidateDetail(id).subscribe({
      next: (data: any) => {
        if (data) {
          // this.mtpMatches = data.master_profile_matches;
          this.candidateData = data.candidate;
          let displayName = this.candidateData.first_name;
          if (this.candidateData.middle_name) {
            displayName += ' ' + this.candidateData.middle_name;
          }
          if (this.candidateData.last_name) {
            displayName += ' ' + this.candidateData.last_name;
          }
          this.candidateData.displayName = displayName;
          this._loader.hide();
          this.checkDsaasVendor = this.candidateData?.vendor_type?.toLowerCase() === 'direct_sourcing' ? true : false;
          this.isDsaasVendor.emit(this.checkDsaasVendor)

        }
      },
      error: (error) => {
        this.alert.error(error);
        this._loader.hide();
      }
  }));
  }
  downloadAttachment(data) {
    data = this.cryptoService?.decrypt(data);
    var link = document.createElement('a');
    if (data) {
      link.href = data;
    } else {
      this.alert.error('Resume Not Found.', {});
    }
    link.dispatchEvent(new MouseEvent('click'));
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
  get profileImageHide() {
    return (
      ((this.user_type)?.toUpperCase() === UsersType.CLIENT) && this.currentProgram?.config?.is_candidate_image_hidden
    );
  }
  public isUserRole(role: string) {
    const currentUserRole = this.userPermissionService.currentUserRole();
    return currentUserRole === role;
  }

  detailCollapse(value){
    console.log(value)
    this.detailedValue = value;
  }
}
