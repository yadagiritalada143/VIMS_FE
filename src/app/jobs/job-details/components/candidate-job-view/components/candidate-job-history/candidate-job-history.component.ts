import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-candidate-job-history',
  templateUrl: './candidate-job-history.component.html',
  styleUrls: ['./candidate-job-history.component.scss']
})
export class CandidateJobHistoryComponent implements OnInit {

  jobId: any;
  candidateHistory: any = [];
  usersList: any = [];
  createTag: boolean = false;
  viewHistoryDetails: boolean = false;
  viewHistoryPanel: string = 'hidden';
  historyData: any = {};
  candidateId:any;
  limit = 20;
  currentProgram;
  user_type;
  reference_entity;
  isLoading:boolean = true;
  logs:any;
  @Input() offerHistory:boolean=false;
  constructor(
    private jobService: JobDetailsService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private loader: LoaderService,
    private localDateFormatPipe: LocalDateFormatPipe,
    private storageService: StorageService

  ) {}

  ngOnInit(): void {
    //this.loader.show('Loading Candidate History details, please wait');
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.route.parent?.params.subscribe(params => {
      this.jobId = params['id'];
      this.candidateId = params['candidateId'];
      this.getcandidateHistoryDetails(this.limit, this.candidateId, this.jobId,);
    })
  }

  getcandidateHistoryDetails(limit,candidateId,jobId): void {
    this.isLoading = true;
    if (jobId) {
      let limit = 20;
      this.jobService.getCandidateHistory(limit,candidateId,jobId).subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if(!data?.response?.audit_logs?.auditLog.length){
            this.showError('No candidate history transactions are available.')
          }
          data?.response?.audit_logs?.auditLog?.sort((a, b) => (a.data?.modified_on < b.data?.modified_on ? -1 : 1));
          //show only offer history under history tab in offer details.
          if(this.offerHistory){
            data.response.audit_logs.auditLog = data?.response?.audit_logs?.auditLog?.filter(his=>{
              return his?.action?.toLowerCase()?.includes('offer');
            })
          }
          data?.response?.audit_logs?.auditLog?.forEach((el, index) => {
              this.candidateHistory?.push({
                activity: el?.action,
                action_taken_by: el?.actor_id,
                actor_type:  el?.data?.actor_details?.actor_type.toLowerCase() || null,
                actor_fullname: el?.data?.actor_details?.full_name || null,
                modified_date: this.localDateFormatPipe.transform(el?.modified_on),
                modified_time: this.localDateFormatPipe.transform(el?.modified_on, 'hh:mm:ss a z'),
                modified_on: el?.modified_on,
                reason: el?.data?.backend_data?.new_data?.status_reason || null,
                reason_notes: el?.data?.backend_data?.new_data?.status_note || 'N/A',
                api_data : el?.data,
                reference: el?.entity_ref.toLowerCase(),
                jobID: this.jobId,
                candidateId: this.candidateId
              });
              if(el?.data?.impersonated_by) {
                this.candidateHistory[index].impersonated_by = `${el?.data?.impersonated_by?.full_name} (${el?.data?.impersonated_by?.actor_type})`
              } 
              //userIds.push(el?.actor_id);
          });
          this.candidateHistory?.sort((a, b) => (a.date_time > b.date_time ? -1 : 1));
          //if (userIds?.length) this.getUsersList(userIds);
        },
        error: (err) => {
          this.loader.hide();
          if (err.status === 504) this.alert.error('Timeout error! Please try after some time.');
          else this.alert.error('Failed to load the Candidate history.');

          this.isLoading = false;
        },
    });
    }
  }

  showViewButton(status){
    status = status.toLowerCase();
    if(status == 'candidate created' || status == 'candidate edited' || status == 'candidate submitted' ||
    status == 'candidate re-submitted' || status == 'offer created' || status == 'offer rejected' || status =='offer edited' || status =='offer countered' || status.includes('reassigned'))
    return true;
  }

  showReasons(status){
    status = status.toLowerCase();
    if( status == 'offer rejected' || status =='interview rejected' || status =='interview cancelled' ||
    status == 'candidate rejected' || status == 'candidate withdrawn' || status == 'rehire rejected' ||
    status == 'interview completed' || status == 'offer withdrawn' || status == 'shortlist review rejected')
    return true;
  }
  getInitials(userId: any) {
    const user = this.usersList?.find(e => e.id === userId);
    if (user?.first_name && user?.last_name) return (user?.first_name?.slice(0, 1) + user?.last_name?.slice(0, 1))?.toUpperCase();
    return '';
  }

  viewHistory(candidateHistory): void {
    this.viewHistoryDetails = true;
    this.viewHistoryPanel = 'visible';
    this.historyData = candidateHistory;
  }

  sidebarClose() {
    this.viewHistoryDetails = false;
    this.viewHistoryPanel = 'hidden';
    this.historyData = {};
  }

  showError(err){
    window.scrollTo(0,0);
    let hideReportButton = err?.error?.error?.do_not_report ? true : false;
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400) && !hideReportButton, additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }

}
