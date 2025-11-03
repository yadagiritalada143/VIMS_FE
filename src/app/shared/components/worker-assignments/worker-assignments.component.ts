import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DashboardService } from 'src/app/dashboard/dashboard.service';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-worker-assignments',
  templateUrl: './worker-assignments.component.html',
  styleUrls: ['./worker-assignments.component.scss']
})
export class WorkerAssignmentsComponent implements OnInit {
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
    private storageService: StorageService,
    private dashboardService: DashboardService,
    private eventStreamService: EventStreamService,
    private localStorage: StorageService,
    public router: Router,
  ) { 
    this.account = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
  }

  ngOnInit(): void {
    this.getWorkersList();
  }

  getWorkersList() {
    let program: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.dashboardService.getWorkersList(program?.id).subscribe({next:(data:any) => {
      let workers = data?.data?.worker;
      this.getAssignment(workers[0], program?.id);
    },error: err => {
      let logs=this.showError('Something went wrong with getting programs! Please try again later');
      this.emitLogs(logs)
    }});
  }

  getAssignment(worker, programId) {
    this.dashboardService.getAssignment(programId, worker.worker_id).subscribe({next:(data:any) => {
      if (data) {
        this.assignment = data?.data;
        this.originalAssignments = JSON.parse(JSON.stringify(data?.data));
      }
    },error: err => {
      let logs = this.showError('Something went wrong with getting assignment! Please try again later');
      this.emitLogs(logs)
    }});
  }

  navigateToDashboard(id) {
      this.eventStreamService.emit(new EmitEvent(Events.SELECTED_ASSIGNMENT,
        {
          assignment_uuid: id
        }));
        this.storageService.set('assignment_uuid', id , true);
        this.closeSidebar();
        this.router.navigateByUrl('/dashboard');
        this.searchValue = '';
        this.assignment = this.originalAssignments;   
  }

  closeSidebar() {
    this.eventStreamService.emit(new EmitEvent(Events.PROGRAM_SIDEBAR, false));
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

  selectedAssignment() {
    if(this.originalAssignments){
    const id = this.storageService.get('assignment_uuid');
    const data = this.originalAssignments.filter(a => {return a?.assignment_uuid === id});
    return data;
    }
  }

}
