import { Component, ElementRef, Input, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { tap } from 'rxjs/operators';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { JobStatus } from 'src/app/shared/enums';
import { CalculateDurationService } from 'src/app/core/services/calculate-duration.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-candidate-job-view-interview-details',
  templateUrl: './candidate-job-view-interview-details.component.html',
  styleUrls: ['./candidate-job-view-interview-details.component.scss'],
})
export class CandidateJobViewInterviewDetailsComponent implements OnInit {
  viewInterviewDetails = 'hidden';
  candidateId: '';
  interviewId;
  isopen: boolean = false;
  jobId: '';
  currentProgram: any;
  candidateInfo: any;
  intDetails: any;
  phoneLocation: any;
  locationLabel = 'Interview Location';
  interviewer = [];
  interviewerList: any = [];
  additionalAttendees: any = [];
  additionalAttendeesList: any = [];
  public showadditionalemail:boolean;
  isAcceptInterviewFlyout: boolean = false;
  public showInterviewer:boolean;
  public jobStatus: any = JobStatus;
  public customFields: any = [];
  attendeeNames: any = '';
  hideEdit: boolean = true;
  detailsLoaded = false;
  date_Pipe:any;
  workLocationType:any;
  recommendedDates = [
    {
      day: null,
      slots: null,
      slotOptions: [],
    },
  ];
  private subscriptions: Subscription[] = [];
  popoverActive = false;
  interviewActive = false;
  logs: Log= undefined;
  detailsPage: any;
  showDropdownOffer: boolean = false;
  @ViewChild('optionButton', { read: ElementRef, static: false })
  optionButton: ElementRef;
  @ViewChild('rowDropDownBox', { read: ElementRef, static: false })
  rowDropDownBox: ElementRef;
  userType: any;
  isPendingInterviewReview: any;
  programDetails: any;
  user: any;
  isVendorNeutral: any;
  showOption = false;
  submitedCandidateDetails:any=undefined;
  isInterviewCompleted: boolean = false;
  rating: number = 2;
  @Input() interview: any[] = [];
  // @Input() set submitedCandidateDetail(submitedCandidateDetails){
  //   this.submitedCandidateDetails=submitedCandidateDetails;
  // };
  detailedValue: string = "basicinfo" ;
  dateTimePickerModal: boolean = false;
  editSlotValue: boolean;
  editDuration: any = 0;
  dateAndTimeDetails: any = [];
  editDateTime: any;
  readonly Tabs: any={
    SCHEDULED_DATE:'SCHEDULED_DATE',
    PROPOSE_NEW_TIME:'PROPOSE_NEW_TIME'
  }
  openProposeTimeTab: any;
  constructor(
    private userPermissionService: UserPermissionService,
    private eventStream: EventStreamService,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private jobService: JobDetailsService,
    private candidateService: CandidateService,
    private alert: AlertService,
    private router: Router,
    private datePipe: LocalDateFormatPipe,
    private loader: LoaderService,
    private calculate: CalculateDurationService,
    private s3UploadService: AwsS3FileUploadService,
    private sortPipe: SortHelperPipe,
    private render: Renderer2
  ) {
    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.optionButton && this.optionButton?.nativeElement?.contains(e.target) && !this.showDropdownOffer)) {
        this.showDropdownOffer = true;
      } else if(this.showDropdownOffer === true){
        this.showDropdownOffer = false;
      }
    });
  }

  enableAccpetOrRejectActions = false;
  candidateDetails;
  user_type;
  jobDetailsData:any;
  notes: string = null;
  ngOnInit(): void {
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.isVendorNeutral = this.programDetails.config?.is_vendor_neutral;
    this.isPendingInterviewReview = this.programDetails.config?.interview?.pending_interview_review;
    this.route?.parent?.parent.params.subscribe((params) => {
      this.candidateId = params['candidateId'];
      this.candidateService.getCandidateDetail(this.candidateId).subscribe((data: any) => {
        this.candidateDetails = data.candidate;
      });
      
      this.interviewId = this.route.snapshot.queryParamMap.get('id');
      this.openProposeTimeTab = this.route.snapshot.queryParamMap.get('proposeTime');
      this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      this.userType = this.storageService.get('user_type');
      this.user = this.storageService.get('user');
      this.jobId = params['id'];
      if (this.interviewId) {
        this.interviewDetails(
          this.currentProgram?.id,
          this.jobId,
          this.interviewId
        );
      } else {
        this.loadFirstInterviewFromInterviewsList();
      }
    });
    this.getJobDetails();
    this.user_type =  this.storageService.get('user_type')?.toLowerCase();
    this.getSubmitCandidate();
    this.eventStream.on(Events.PROPOSE_NEW_TIME).subscribe((value)=>{
      if(value){
        this.currentTab = this.Tabs.PROPOSE_NEW_TIME; 
        setTimeout(()=>document.getElementById("proposeNewTime").scrollIntoView({ behavior: 'smooth'}));
      }
    })
    
  }

  detailCollapse(value){
    this.detailedValue = value;
  }

  isEmptyObject(value) {
    return value && Object.keys(value).length === 0 && value.constructor === Object;
  }

  getSubmitCandidate() {
    this.submitedCandidateDetails = null;
    this.jobService
      .getSubmissionDetails(
        this.currentProgram?.id,
        this.jobId,
        this.candidateId
      )
      .subscribe({
        next: (data: any) => {
          this.submitedCandidateDetails = data?.candidate;
        },
        error: (err) => {}
  });
  }

  convertCustomFieldToArray() {
    const customFields = Object.entries(this.intDetails.custom_fields)?.map(e => ({ slug: e[0], value: e[1] }));
    this.intDetails.custom_fields = customFields;
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const hierarchyIds = this.jobDetailsData?.hierarchy?.map(h => h.id)?.join(',');
    let url = `/configurator/programs/${currentProgram?.id}/custom-fields?entity_ref=INTERVIEWS&active=1&order_by=asc&key=ref_order${
      hierarchyIds ? `&hierarchy_ids=${hierarchyIds}` : ``
    }`;
    this.candidateService.get(url).subscribe({
      next: (data: any) => {
        if (data && data.custom_fields.length > 0) {
          this.customFields = data.custom_fields;
          this.updateCustomFieldName();
        }
      },
      error: error => {},
    });
  }
  updateCustomFieldName() {
    if (this.customFields && this.customFields.length > 0 && this.intDetails?.custom_fields && this.intDetails?.custom_fields?.length > 0) {
      this.customFields?.forEach(c => {
        this.intDetails?.custom_fields.forEach(jc => {
          if (typeof jc.value === 'object' && Object.keys(jc.value).length === 0) return;
          if (c?.slug === jc?.slug) {
            if(c?.meta_data?.currency) {
              jc.currency = c?.meta_data?.currency;
            }
            if(c?.type == "TOGGLE" || c?.type == 'NUMBERS') {
              jc.value = jc?.value?.toString();
            }
            jc.name = c?.name;
            jc.type = c?.type;
            jc.label = c?.label;
            if(Array.isArray(jc?.value) && jc?.type == 'DROPDOWN' && c?.meta_data?.datasource?.is_multi_select) {
              const val = [];
              jc?.value?.forEach((res,i)=>{
                c?.meta_data?.datasource?.options?.forEach(custom_field_data => {
                  if(res == custom_field_data?.value) {
                    val.push(custom_field_data?.label);
                  }
                })
              });
              jc.value = val;
            }
            if(c?.type == 'SOURCE' && jc.value) {
              this.loader.show();
              let url = c.api_url
              url = url.includes('?') ? url += `&user_ids=${jc.value}` : url += `&user_ids=${jc.value}`
              this.jobService.get(url).subscribe({
                next: (data: any) => {
                  jc.value = data?.members[0]?.full_name
                  this.loader.hide();
                }, error: (error) => {
                  this.loader.hide();
                },
              });
            }
            if(c?.type == 'NUMBERS') {
              if (c?.meta_data?.show_in_thousands) {
                jc.value = jc?.value?.toLocaleString('en-US', {minimumFractionDigits: c?.meta_data?.decimal});
              } else if (!c?.meta_data?.show_in_thousands && c?.meta_data?.decimal) {
                jc.value = jc?.value?.toFixed(c?.meta_data?.decimal)
              }
            }
          }
        });
      });
    }
  }

  getStatusChange(status: any) {
    if (status?.toLowerCase() === this.jobStatus?.PENDING_INTERVIEW_REVIEW?.toLowerCase()) {
      if ((this.userType === 'MSP' || this.userType === 'CLIENT') && this.isPendingInterviewReview) {
        status = 'Pending review';
      } else {
        status = 'PENDING ACCEPTANCE';
      }
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_ACCEPTANCE?.toLowerCase()) {
      status = 'PENDING ACCEPTANCE';
    } else if (status?.toLowerCase() === this.jobStatus?.CANCELLED?.toLowerCase()) {
      status = 'CANCELLED';
    } else if (status?.toLowerCase() === this.jobStatus?.REJECTED?.toLowerCase()) {
      status = 'REJECTED';
    } else if (status?.toLowerCase() === this.jobStatus?.ACCEPTED?.toLowerCase()) {
      status = 'ACCEPTED';
    } else if (status?.toLowerCase() === this.jobStatus?.COMPLETED?.toLowerCase()) {
      status = 'COMPLETED';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_CONFIRMATION?.toLowerCase()) {
      status = 'PENDING CONFIRMATION'
    }
    return status?.toLowerCase();
  }

  
  
   

  clickToCancelInterview (e) { 
    e.interviewId = this.interviewId
    if (e) {
      this.eventStream.emit(new EmitEvent(Events.CANCEL_INTERVIEW, { value: e }));
    }
  }

  get hasAdminAccess() {
    return this.isUserRole(UserType.Client) || this.isUserRole(UserType.MSP) || this.isUserRole(UserType.Super_org);
  }

  get CurrentInterview() {
    // Need to check with BA, which interview to be onsidered for card display if there are more thanone
    // Righnow picking the first one
    this.interview.forEach(element => {
      if(element.status == 'PENDING_ACCEPTANCE') {
        this.isInterviewCompleted = true;
      }
    })
    return this.interviews && this.interviews[0];
  }
  get InterviewCompleted() {
    return (
      this.CurrentInterview && this.CurrentInterview.status === 'COMPLETED'
    );
  }


  goToAction(event) {
    switch (event) {
      case 're-schedule-interview':
        this.router.navigateByUrl(
          `/jobs/details/job-details/${this.jobId}/candidate/${this.candidateId}/interviews/re-schedule/${this.interviewId}`,
          {
            state: { isReschedule: true },
          }
        );
      break;
      case 'cancel-interview':
        this.eventStream.emit(
          new EmitEvent(Events.CANCEL_INTERVIEW, {
            value: {
              value: true,
              candidateid: this.candidateId,
              jobid: this.jobId,
              interviewId: this.interviewId,
            },
          })
        );
      break;
      case 'schedule-interview':
        this.router.navigateByUrl(
          `/jobs/details/job-details/${this.jobId}/candidate/${this.candidateId}/interviews/create`
        );
      break;
    }
  }

  clickToEditInterview () {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.jobId}/candidate/${this.candidateId}/interviews/edit/${this.interviewId}`
    );
  } 


  clickToApproveInterviewReview () {
    const payload = {
      status: 'PENDING_ACCEPTANCE',
    };
    this.subscriptions.push(this.jobService.updateInterviewReview(this.jobId, this.interviewId, payload).subscribe({
      next: (data) => {
        this.interviewDetails(this.currentProgram.id, this.jobId, this.interviewId);
        this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
        this.alert.success('Interview reviewed successfully');
      },
      error: (err) => {
        this.showError(err);
      }
  }));
  }

  getJobDetails(){
    this.jobService.loadJob(this.jobId).subscribe((res) => {
      let jobdetails = res['job'] || { job_manager: {} };
      this.jobDetailsData = jobdetails;
    });
  }

  getDate(d) {
    return this.datePipe.transform(
      d,
      DATE_FORMAT.FORMATMDY,
      null,
      null,
      true,
      this.jobDetailsData?.hierarchy[0]?.preferred_date_format || this.currentProgram?.defaultDateFormat,
    );
  }

  onScheduleSelected(i) {
    this.intDetails.schedules.forEach(s => {
      s.is_prefered = false;
    });
    this.intDetails.schedules[i].is_prefered = true;
  }

  public isUserRole(role: string): boolean {
    return this.userPermissionService.isUserRole(role as UserType);
  }

  actionSuccess(event) {
    this.interviewDetails(
      this.currentProgram?.id,
      this.jobId,
      this.intDetails.id
    );

  }

  showAccetpInterviewSidePanel = false;
  AcceptInterView() {
    this.showAccetpInterviewSidePanel = true;
  }

  onInterviewAccpeted(event) {
    this.logs=undefined;
    if(!event.schedule) {
      // this.alert.error('Please select one schedule, then accept interview');
      this.showError('Please select one schedule, then accept interview');
      return;
    }
    this.loader.show();
    let request : any = {
      "action": "CONFIRMATION",
      "schedule_id": event.schedule.id
    }
    if(this.intDetails?.status === 'PENDING_ACCEPTANCE'){
      request={
        ...request,
       'action':"ACCEPT", 
      'phone_number': String(event?.phone), 'status_note': event?.notes, 
      'phone_isdcode' : event?.phone_isdcode,
      'iso_code': event?.iso_code,
      'vendor_notes': event?.vendor_notes,
      'candidate_email': event?.candidate_email
      }
    }
    this.jobService.candidateAction(request, this.jobId, this.intDetails.id, this.candidateId).subscribe({
      next: (data)=> {
      this.loader.hide();
      this.alert.success('Interview accepted successfully');
      this.showAccetpInterviewSidePanel = false;
      //
      this.currentTab = this.Tabs.SCHEDULED_DATE;
      setTimeout(() => this.interviewDetails(this.currentProgram.id, this.jobId, this.interviewId), 200);
      this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
    },
   error: (err) => {
      this.loader.hide();
  }})

  }

  onClose(event: boolean){
    this.hideEdit = event;
  }
 
  onUpdateDetails(event: any){
    this.loader.show();
    const request={
    'is_editable': true,
    "phone_number": {
      "number": String(event?.phone),
      "iso_code": event?.iso_code,
      "phone_isdcode": event?.phone_isdcode
    },
    "candidate_email": event?.candidate_email
    }
    this.candidateService.put(`/submission-manager/programs/${this.programDetails?.id}/jobs/${this.jobId}/interviews/${this.interviewId}`, request).
    subscribe({
      next: (res)=> {
        this.alert.success('Candidate details updated successfully');
        this.onClose(true);
        this.jobService.getInterviewDetails(this.programDetails?.id, this.jobId, this.interviewId).subscribe({
          next: (res: any)=> {
            this.intDetails = res?.interview;
          },
          complete: () => {
            this.loader.hide();
          }
        })
      },
    error: (err)=> {
      this.showError(err);
      this.loader.hide()
    }})
  }

  RejectInterview() {
    this.currentTab = this.Tabs.SCHEDULED_DATE;
    this.eventStream.emit(
      new EmitEvent(Events.REJECT_INTERVIEW, {
        value : {
          candidateId: this.candidateId,
          jobId: this.jobId,
          interviewId: this.intDetails.id,
          title: (this.intDetails?.status==='PENDING_CONFIRMATION' ? 'Reject Proposed Interview' : 'Rejection Reason')
        }
      })
    );
  }
  checkadditonal(id){
    let a=id;
    if(a.includes('-'))
    {
      return true;
    }
    else
    {
      return false;
    }

  }

  public toggleDescription = false;
  maxContentLength = 255;
  interviewDetails(programId, jobId, interviewId) {
    this.interviewerList = [];
    this.additionalAttendeesList = [];
    this.interviewer = [];
    this.detailsLoaded = true;
    this.intDetails = null;
    this.jobService
      .getInterviewDetails(programId, jobId, interviewId)
      .subscribe({
        next: (data: any) => {
          if (data && data.interview) {
            this.detailsLoaded = false;
            this.intDetails = data.interview;
            if(this.openProposeTimeTab && 
              ((this.intDetails?.status === 'PENDING_ACCEPTANCE' && (this.userType?.toUpperCase()!==UserType.Client && this.userType?.toUpperCase()!==UserType.MSP))|| 
            (this.intDetails?.status ==='PENDING_CONFIRMATION' && this.userType?.toLowerCase()!=UserType.Vendor.toLowerCase()))){
              //marking this as false as this should run only once(on init when propose time was clicked)
              this.openProposeTimeTab = false;
              this.eventStream.emit(new EmitEvent(Events.PROPOSE_NEW_TIME,true));
            }
            this.rating = this.intDetails?.interview_rating;
            if (this.isEmptyObject(this.intDetails?.custom_fields)){
              this.intDetails.custom_fields = [];
            }
            if (this.intDetails && !this.isEmptyObject(this.intDetails?.custom_fields)) {
              this.convertCustomFieldToArray();
            }
            this.intDetails.schedules.forEach(schedule => {
              schedule.duration = this.calculate.calculateDuration(schedule.start_time, schedule.end_time);
            })
            this.intDetails.name = this.jobService.toTitleCase(this.intDetails.name)
            this.workLocationType = this.intDetails.location_refcode.split('_').join(' ');
            this.phoneLocation = `${this.intDetails?.location_refcode} ${this.intDetails?.location}`;
            this.intDetails.shortId = this.intDetails.unique_id;
            if (this.intDetails?.interview_type === 'F2F') {
              this.locationLabel = 'Interview Location';
            } else if (this.intDetails?.interview_type === 'PHONE') {
              this.locationLabel = 'Contact Details';
            } else if (this.intDetails?.interview_type === 'VIRTUAL') {
              this.locationLabel = 'Interview Joining Link';
            } else {
              this.locationLabel = 'Interview Location';
            }

              this.jobService.getSubmissionDetails(this.currentProgram.id, this.jobId, this.candidateId).subscribe(data => {
                this.detailsPage = data;
                this.enableAccpetOrRejectActions =
                this.detailsPage &&
                this.detailsPage.candidate.status !== 'REJECTED'
                && this.detailsPage.candidate.status !== 'WITHDRAWN'
                && ((this.intDetails.status === 'PENDING_ACCEPTANCE' && 
                (this.userType.toUpperCase()!==UserType.Client && this.userType.toUpperCase()!==UserType.MSP))|| 
                (this.intDetails.status ==='PENDING_CONFIRMATION' && this.userType.toLowerCase()!=UserType.Vendor.toLowerCase()))
              })
              
            const interviewersObservables: Array<Observable<any>> = [];
            const additionalAttendeesObservables: Array<Observable<any>> = [];
            this.additionalAttendees = [];
            data?.interview?.interviewers.forEach((element: any) => {
              if (element?.member_type == 'INTERVIEWER') {
                this.showInterviewer =true;
                interviewersObservables.push(this.candidateService
                  .getuser(element.user_id)
                  .pipe(
                    tap((data: any) => {
                      this.interviewer.push(data?.user);
                      this.interviewerList.push(data?.user);
                    })
                  )
                  );
              } else if (element?.member_type == 'ADDITIONAL_ATTENDEES') {
                if (this.checkadditonal(element?.user_id)) {
                  this.showadditionalemail = false;
                  additionalAttendeesObservables.push(
                    this.candidateService.getuser(element.user_id).pipe(
                      tap((data: any) => {
                        this.additionalAttendees.push(data?.user);
                        this.additionalAttendeesList.push(data?.user);
                      }),
                    ),
                  );
                  this.sortPipe.transform(this.additionalAttendeesList, 'full_name');
                } else {
                  this.showadditionalemail = true;
                  additionalAttendeesObservables.push(this.additionalAttendees.push(element.user_id));
                  this.sortPipe.transform(this.additionalAttendees);
                }
              }
            });

            if(interviewersObservables.length > 0) {
              forkJoin(interviewersObservables).subscribe(res => {
                // var userFirst = this.interviewer.find(user => user.full_name == this.user.full_name)
                // this.interviewer.sort(function(x,y){ return x == userFirst ? -1 : y == userFirst ? 1 : 0; });
                this.interviewerList = this.sortPipe.transform(this.interviewerList, 'full_name');
                this.interviewer = this.sortPipe.transform(this.interviewer, 'full_name');
                this.displayInterviewers = this.interviewer.splice(0, 1);
                
                this.displayInterviewersNames =
                  this.displayInterviewers && this.displayInterviewers.length > 0
                    ? this.displayInterviewers.map((u) => u.full_name).join(',')
                    : '';
                this.AddDisplayInterviewrs = this.interviewer;
              });
            }
            if(additionalAttendeesObservables.length > 0) {
              forkJoin(additionalAttendeesObservables).subscribe(_ => {
                this.additionalAttendees = this.sortPipe.transform(this.additionalAttendees, 'full_name');
                this.displayAddAttendees = this.additionalAttendees.splice(0, 1);
                this.displayAddAttendeesNames =
                  this.displayAddAttendees && this.displayAddAttendees.length > 0
                    ? this.displayAddAttendees.map((u) => u.full_name).join(',')
                    : '';

                this.AddDisplayAddAttendees = this.additionalAttendees;
              });
            }
          } else {
            this.intDetails = null;
          }
        },
        error: (error) => {
          this.detailsLoaded = false;
          this.intDetails = null;
        }
  });
  }

  interviews;
  loadFirstInterviewFromInterviewsList() {
    this.jobService
      .getInterviewList(this.jobId, null, this.candidateId)
      .subscribe((data: any) => {
        this.interviews = data.interviews;
        if (this.interviews) {
          this.interviewDetails(
            this.currentProgram.id,
            this.jobId,
            this.interviews[0].id
          );
        } else {
          this.detailsLoaded = false;
          this.intDetails = null;
        }
      });
  }

  displayInterviewers;
  displayInterviewersNames;
  AddDisplayInterviewrs;

  displayAddAttendees;
  displayAddAttendeesNames;
  AddDisplayAddAttendees;

  downloadResume() {
    if (this.candidateInfo.resume_url) {
      const linkSource = this.candidateInfo.resume_url;
      const downloadLink = document.createElement('a');
      const fileName = this.candidateInfo.resume;
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    } else {
      // this.alert.error(`No resume found for this candidate.`);
      this.showError('No resume found for this candidate.');
    }
  }

  isacceptInterview(value){
    this.isAcceptInterviewFlyout = value;
  }

  checkIfArray(arr){
    if (Array.isArray(arr)) {
      return true;
    }
    else{
      return false;
    }
  }
  createOffer() {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.jobId}/candidate/${this.candidateId}/offers?createOffer=true&isfromInterview=true`
    );
  }

  addSlot() {
    this.recommendedDates.push({ day: null, slots: null, slotOptions: [] });
  }

  deleteSlot(i,j) {
    this.dateAndTimeDetails[i].slotAndDuration.splice(j, 1);
    if(this.dateAndTimeDetails[i].slotAndDuration.length <= 0) {
      this.dateAndTimeDetails.splice(i, 1);
    }
  }

  showPopover() {
    this.popoverActive = !this.popoverActive;
  }

  hidePopOver() {
    this.popoverActive = false;
  }

  showPopoverInt() {
    this.interviewActive =  !this.interviewActive;
  }

  hidePopOverInt() {
    this.interviewActive = false;
  }

  typeOf(value) {
    return typeof value;
  }

  downloadS3Attachment(file: any) {
    if (file && file.name && file.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
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
  currentTab: string = this.Tabs.SCHEDULED_DATE;

  tabClick(tabName: string) {
    this.currentTab = tabName;
  }

  showDateTimeModal() {
    this.dateTimePickerModal = true;
  }

  closeDateTimePicker() {
    this.dateTimePickerModal = false;
  }

  addNewSlot() {
    this.editSlotValue = false;
    this.showDateTimeModal();
  }

  editSlot(dateIndex, slotIndex){
    this.editSlotValue = true;
    let editSlotInfo:any = {};
    editSlotInfo.date = this.dateAndTimeDetails[dateIndex].date;
    editSlotInfo.startTime = this.dateAndTimeDetails[dateIndex].slotAndDuration[slotIndex].startTime;
    editSlotInfo.endTime = this.dateAndTimeDetails[dateIndex].slotAndDuration[slotIndex].endTime;
    editSlotInfo.duration = this.dateAndTimeDetails[dateIndex].slotAndDuration[slotIndex].duration;
    editSlotInfo.i = dateIndex;
    editSlotInfo.j = slotIndex;
    this.editDateTime = editSlotInfo;
    this.showDateTimeModal();
  }


  onSaveDetails(value: any) {
    this.formatSlotDurationList(value);
  }
  formatSlotDurationList(slotValue: any) {
    let sTime = slotValue.startTime || slotValue.start_time;
    let eTime = slotValue.endTime || slotValue.end_time;
    let slotDetails = 
      {
        date: slotValue.date,
        slotAndDuration: [
          {
          startTime: sTime,
          endTime: eTime,
          duration: slotValue.duration
          }
        ]
      }
      const isAlreadyExist = this.dateAndTimeDetails?.findIndex(entity => entity.date === slotDetails.date);
      
        if(isAlreadyExist == -1){
          this.dateAndTimeDetails.push(slotDetails);
          this.dateAndTimeDetails[slotValue.i]?.slotAndDuration.splice(slotValue.j, 1);
          if (this.dateAndTimeDetails[slotValue.i]?.slotAndDuration.length == 0){
            this.dateAndTimeDetails.splice([slotValue.i], 1);
          }
        } 
        else {
          if((slotValue.i && slotValue.j) != undefined) {
            this.dateAndTimeDetails[isAlreadyExist].slotAndDuration.push({
              startTime: slotValue.startTime,
              endTime: slotValue.endTime,
              duration: slotValue.duration
            })
            this.dateAndTimeDetails[slotValue.i]?.slotAndDuration.splice(slotValue.j, 1);
            if (this.dateAndTimeDetails[slotValue.i]?.slotAndDuration.length == 0){
            this.dateAndTimeDetails.splice([slotValue.i], 1);
            }
          } 
          else {
            const isAlreadyExistSlot = this.dateAndTimeDetails[isAlreadyExist].slotAndDuration.findIndex(value => {
              return ((this.calculate.parseFromAmPmToTwentyFour(value.startTime) == this.calculate.parseFromAmPmToTwentyFour(sTime)) && (this.calculate.parseFromAmPmToTwentyFour(value.endTime) == this.calculate.parseFromAmPmToTwentyFour(eTime)))
            })
            if (isAlreadyExistSlot == -1) {
              this.dateAndTimeDetails[isAlreadyExist].slotAndDuration.push({
              startTime: sTime,
              endTime: eTime,
              duration: slotValue.duration
              })
            }
          }
        }

        return this.dateAndTimeDetails;
  }

  cancelProposeTime(){
    this.dateAndTimeDetails=[];
  }

  proposeNewTime(){
    const interviewId = this.interviewId ?? this.intDetails?.id;
    const schedules = [];
    this.dateAndTimeDetails.forEach(dateTimeSlot => {
      let date = dateTimeSlot.date;
      dateTimeSlot.slotAndDuration.forEach(slot => {
        schedules.push({
          "date": date,
          "start_time": slot.startTime,
          "end_time": slot.endTime,
          "is_prefered": false
        })
      })
    });
    if (schedules.length === 0) {
      this.showError('Please select atleast one slot');
      return;
    }
    let request:any ={
      schedules,
      time_zone_id : this.intDetails?.time_zone_id
    }
    if(this.userType.toLowerCase()===UserType.Vendor.toLowerCase()){
      request.vendor_notes = this.notes ?? null;
    }
    else{
      request.instructions = this.notes ?? null;
    }
    this.loader.show();
    this.jobService.put(`/submission-manager/programs/${this.currentProgram?.id}/jobs/${this.jobId}/interviews/${interviewId}/propose-newtime`,request)
      .subscribe({
        next:()=>{
          this.loader.hide();
          this.currentTab = this.Tabs.SCHEDULED_DATE;
          this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL,true));
          this.interviewDetails(this.currentProgram.id, this.jobId, interviewId)
        },
        error:()=>{
          this.loader.hide();
        }
      })
  }

  updateInterview(){
    this.hideEdit = false;
  }
}
