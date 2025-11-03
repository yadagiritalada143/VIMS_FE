import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { DashboardService } from 'src/app/dashboard/dashboard.service';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-worker-landing-dashboard',
  templateUrl: './worker-landing-dashboard.component.html',
  styleUrls: ['./worker-landing-dashboard.component.scss']
})
export class WorkerLandingDashboardComponent implements OnInit {
  private programSearchSub: Subject<string> = new Subject<string>();
  logs:any  = undefined;
  searchValue: any;
  clearIcon: boolean = false;
  dataLoader = true;
  orgDetails: any;
  assignment: any;
  account: any;
  originalAssignments: any;
  constructor(
    private loader: LoaderService,
    private userService: UserService,
    private storageService: StorageService,
    private dashboardService: DashboardService,
    private eventStreamService: EventStreamService,
    private localStorage: StorageService,
    public router: Router
  ) { 
    this.account = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
  }

  ngOnInit(): void {
    this.loader.show();
    this.getWorkersList();
  }

  getWorkersList() {
    let program: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.dashboardService.getWorkersList(program?.id).subscribe({next:(data:any) => {
      let workers = data?.data?.worker;
      this.getAssignment(workers[0], program?.id);
    },error: err => {
      this.loader.hide();
      let logs=this.showError('Something went wrong with getting programs! Please try again later');
      this.emitLogs(logs)
    }});
  }

  getAssignment(worker, programId) {
    this.dashboardService.getAssignment(programId, worker.worker_id).subscribe({next:(data:any) => {
      if (data) {
        this.assignment = data?.data;
        if(this.assignment?.length === 1){
          this.storageService.set('assignment_uuid', this.assignment[0]?.assignment_uuid, true);
          this.router.navigateByUrl('/dashboard');
        }
        this.loader.hide();
        this.originalAssignments = JSON.parse(JSON.stringify(data?.data));
      }
    },error: err => {
      this.loader.hide();
      let logs = this.showError('Something went wrong with getting assignment! Please try again later');
      this.emitLogs(logs)
    }});
  }

  navigateToDashboard(id) {
    this.eventStreamService.emit(new EmitEvent(Events.SELECTED_ASSIGNMENT,
      {
        assignment_uuid: id
      }));
      this.storageService.set('assignment_uuid', id, true);
      this.router.navigateByUrl('/dashboard');
      this.searchValue = '';
      this.assignment = this.originalAssignments;   
  }

  emitLogs(logs){
    this.eventStreamService.emit(new EmitEvent(Events.SHOW_DASHBOARD_LOGS, logs));
  }

  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
      return this.logs;
  }
  
  getorganizationDetails(org_id: any) {
    if (org_id) {
      this.loader.show();
      this.userService.get(`/configurator/organizations/${org_id}`)
        .subscribe({
          next: (data: any) => {
            this.orgDetails = data;
            this.loader.hide();
          },
          error: error => {
            console.error(error);
            this.loader.hide();
          }
        });
    }
  }

  searchProgram() {
    this.assignment = this.originalAssignments;
    if (this.searchValue) {
      this.clearIcon = true;
    } else {
      this.clearIcon = false;
    }
    this.programSearchSub.next(this.searchValue);
     this.assignment = this.assignment?.filter(res => {
      return(JSON.stringify(res)?.toLocaleLowerCase()).match(this.searchValue?.toLocaleLowerCase());
    });
  }

  clearSearch() {
    this.searchValue = '';
    this.clearIcon = false;
    this.searchProgram();
    this.assignment = this.originalAssignments;    
  }
}
