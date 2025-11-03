import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JobDetailsService } from '../../job-details.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { JobStatus } from 'src/app/shared/enums';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
  jobId: any;
  jobHistory: any = [];
  usersList: any = [];
  createTag: boolean = false;
  viewHistoryDetails: boolean = false;
  viewHistoryPanel: string = 'hidden';
  historyData: any = {};
  isNewWorkflow:boolean = false;
  customFields:any;

  constructor(
    private jobService: JobDetailsService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private loader: LoaderService,
    private localDateFormatPipe: LocalDateFormatPipe,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.loader.show('Loading Job History details, please wait');
    this.getCustomFields();
    this.jobId = this.route.parent?.snapshot.params['id'];
    this.isNewWorkflow = this.storageService.get(StorageKeys?.CURRENT_PROGRAM)?.config?.modules_using_flow_system?.includes('JOBS');
    this.getJobHistoryDetails(this.jobId);
  }

  getJobHistoryDetails(jobId): void {
    if (jobId) {
      this.jobService.getJobHistory(jobId).subscribe({
        next: (data: any) => {
          if (data?.response?.audit_logs?.auditLog?.length == 0) {
            this.loader.hide();
            return;
          }
          const userIds = [];
          data?.response?.audit_logs?.auditLog?.sort((a, b) => (a.data?.key?.modified_on < b.data?.key?.modified_on ? -1 : 1));
          data?.response?.audit_logs?.auditLog?.forEach(el => {
            // if (
            //   this.jobHistory?.findIndex(e => e.activity.startsWith('Job Distributed')) === -1 ||
            //   (el.action !== 'MANUAL_DISTRIBUTION' && el.action !== 'AUTO_DISTRIBUTION')
            // )
            this.jobHistory?.push({
              activity: this.displayActivity(el?.action, el?.data?.key),
              action_taken_by: el?.actor_id,
              action_taken_by_name: el?.data?.key?.actor_name,
              date_time: el?.data?.key?.modified_on,
              modified_date: this.localDateFormatPipe.transform(el?.data?.key?.modified_on ?? el?.modified_on),
              modified_time: this.localDateFormatPipe.transform(el?.data?.key?.modified_on ?? el?.modified_on, 'hh:mm:ss a z'),
              reason: el?.data?.key?.status_reason ?? el?.data?.key?.reason ?? null,
              reason_notes: el?.data?.key?.reason_notes ?? el?.data?.key?.status_note,
              currency: el?.data?.key?.currency,
              review_notes: el?.data?.key?.review_notes,
              is_view: el?.data?.key?.new_data && el?.data?.key?.old_data,
              new_data: el?.data?.key?.new_data,
              old_data: el?.data?.key?.old_data,
              impersonated_by: el?.data?.key?.impersonation?.impersonated_by?.id,
              impersonated_to: el?.data?.key?.impersonation?.impersonated_to?.id,
              hideUpdateBy: el?.data?.key?.hideUpdateBy || false
            });
            if (el?.data?.key?.impersonation?.impersonated_by?.id) userIds.push(el?.data?.key?.impersonation?.impersonated_by?.id);
            if (el?.data?.key?.impersonation?.impersonated_to?.id) userIds.push(el?.data?.key?.impersonation?.impersonated_to?.id);
            userIds.push(el?.actor_id);
          });
          this.jobHistory?.sort((a, b) => (a.date_time > b.date_time ? -1 : 1));
          if (userIds?.length) this.getUsersList(userIds);
        },
        error: err => {
          this.loader.hide();
          if (err.status === 504) this.alert.error('Timeout error! Please try after some time.');
          else this.alert.error('Failed to load the job history.');
        },
      });
    }
  }

  getUsersList(uIds: any): void {
    this.loader.show("Loading Users' details, please wait");
    this.jobService.getListOfUsersByIds(uIds, true).subscribe({
      next: (data: any) => {
        this.usersList = data?.members;
        this.loader.hide();
      },
      error: err => {
        this.alert.error('Failed to load list of users and their details related to job history.');
        this.loader.hide();
      },
    });
  }

  displayActivity(activity: any, dataKey: any) {
    const label = 'Job ';
    switch (activity.toUpperCase()) {
      case 'CREATE':
        this.createTag = dataKey?.submit_type !== 'DRAFT';
        return label + (dataKey?.submit_type === 'DRAFT' ? 'Draft' : 'Create');
      case 'UPDATE':
        let labelPart2 = '';
        if (dataKey?.submit_type) {
          labelPart2 = dataKey?.submit_type === 'DRAFT' ? 'Draft Update' : this.createTag ? 'Update' : 'Create';
          if (labelPart2 === 'Create') this.createTag = true;
        } else if (dataKey?.positions && dataKey?.status?.toUpperCase() == 'FILLED') {
          labelPart2 = this.getStatus(dataKey?.status, dataKey);
        } else if (dataKey?.positions) {
          labelPart2 = 'Edit';
        } else if (dataKey?.status) {
          labelPart2 = this.getStatus(dataKey?.status, dataKey);
        }
        return label + labelPart2;
      case 'APPROVED':
        return label + 'Approved';
      case 'REVIEWED':
        return 'Reviewed';
      case 'MANUAL_DISTRIBUTION':
        return label + 'Distributed - Manual';
      case 'AUTO_DISTRIBUTION':
        return label + 'Distributed - Automatic';
      case 'REPLACE_APPROVER':
        return label + 'Approver Replaced';
      case 'AUTOMATIC_TIERED_DISTRIBUTION':
        return label + 'Distributed - Automatic (Tiered)';
      case 'MANUAL_TIERED_DISTRIBUTION':
        return label + 'Distributed - Manual (Tiered)';
      case 'REPLACE_REVIEWER':
        return label + 'Reviewer Replaced'
      case 'JOBMANAGERREASSIGN':
        return label + 'Reassigned'
      case 'JOBAPPROVERREASSIGN':
        return label + 'Approver Reassigned'
      case 'JOBREVIEWERREASSIGN':
        return label + 'Reviewer Reassigned'
      case 'JOB REVIEW REJECTED':
        return label + 'Review Rejected'
      case 'JOB APPROVAL REJECTED':
        return label + 'Approval Rejected'
      case 'JOB APPROVAL SOURCING REJECTED':
        return label + 'Approval Sourcing Rejected'
      case 'JOBAPPROVALREASSIGN':
        return label + 'Approver Reassigned'
      case 'JOBREVIEWREASSIGN':
        return label + 'Reviewer Reassigned'
      case 'FILLED_POSITIONS_UPDATED':
        return 'Job Position Filled'
    }
    return 'Job Activity';
  }

  getStatus(status: string, dataKey: any) {
    const prevStatus = dataKey?.old_data?.status;
    switch (status?.toUpperCase()) {
      case 'CLOSED':
        return 'Closed';
      case 'FILLED':
        return 'Filled';
      case 'HALTED':
        return 'Halt';
      case 'HOLD':
        return 'Hold';
      case 'REJECTED':
        return 'Rejected';
      case 'RELEASE':
        return 'Released';
      case 'SOURCING':
      case 'OPEN':
        if(this.isNewWorkflow) {
          dataKey.hideUpdateBy = true;
          if(prevStatus?.toLowerCase() === JobStatus?.PENDING_REVIEW?.toLowerCase()) {
            return 'Reviewed';
          }
          return 'Approved';
        }
        return 'Update'
      case 'PENDING_APPROVAL':
      case 'PENDING_APPROVAL_SOURCING':
        if(this.isNewWorkflow) {
          dataKey.hideUpdateBy = true;
        }
        return 'Reviewed';
    }
    return;
  }

  displayUserName(userId: any, jobHistory?: any, impersonatedBy?: boolean) {
    if (jobHistory?.action_taken_by_name) return jobHistory?.action_taken_by_name;
    const user = this.usersList?.find(e => e.id === userId);
    if (user && !impersonatedBy) {
      if (user?.full_name) return user?.full_name;
      else if (user?.first_name && user?.last_name) return user?.first_name + ' ' + user?.last_name;
      else if (user?.email) return user?.email;
    }
    if (user && impersonatedBy) {
      let name = '';
      if (user?.full_name) name = user?.full_name;
      else if (user?.first_name && user?.last_name) name = user?.first_name + ' ' + user?.last_name;
      else if (user?.email) name = user?.email;

      if (user?.role?.name && user?.organization?.name) return `${name} - ${user?.role?.name} (${user?.organization?.name})`;
      else if (user?.role?.name) return `${name} - ${user?.organization?.name}`;
      else if (user?.role?.name) return `${name} (${user?.organization?.name})`;
      else return name;
    }
    return 'Unnamed';
  }

  getInitials(userId: any, jobHistory: any) {
    if (jobHistory?.action_taken_by_name) return jobHistory?.action_taken_by_name?.slice(0, 1);
    const user = this.usersList?.find(e => e.id === userId);
    if (user?.first_name && user?.last_name) return (user?.first_name?.slice(0, 1) + user?.last_name?.slice(0, 1))?.toUpperCase();
    return '';
  }

  viewHistory(jobHistory): void {
    this.viewHistoryDetails = true;
    this.viewHistoryPanel = 'visible';
    this.historyData = {
      modified_date_time: `${jobHistory?.modified_date} ${jobHistory?.modified_time}`,
      modified_by_initials: this.getInitials(jobHistory?.action_taken_by, jobHistory),
      modified_by: this.displayUserName(jobHistory?.action_taken_by, jobHistory),
      impersonated_by: jobHistory?.impersonated_by ? this.displayUserName(jobHistory?.impersonated_by, jobHistory) : jobHistory?.impersonated_by,
      reason: jobHistory?.reason,
      reason_notes: jobHistory?.reason_notes,
      currency: jobHistory?.currency,
      new_data: jobHistory?.new_data,
      old_data: jobHistory?.old_data,
      review_notes: jobHistory?.review_notes,
      activity: jobHistory?.activity
    };
  }

  sidebarClose() {
    this.viewHistoryDetails = false;
    this.viewHistoryPanel = 'hidden';
    this.historyData = {};
  }
  
  getCustomFields() {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const hierarchyIds = this.storageService.get(StorageKeys.VIEWD_JOB)?.hierarchy?.map(h => h?.id).join(',');
    const url = `/configurator/programs/${currentProgram?.id}/custom-fields?entity_ref=JOBS&active=1&order_by=asc&key=ref_order${hierarchyIds ? `&hierarchy_ids=${hierarchyIds}` : ``
      }`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data && data?.custom_fields?.length > 0) {
          this.customFields = data?.custom_fields;
        }
      },
      error: error => { },
    });
  }
}
