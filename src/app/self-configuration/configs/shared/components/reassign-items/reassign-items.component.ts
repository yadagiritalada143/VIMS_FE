import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';


@Component({
  selector: 'app-reassign-items',
  templateUrl: './reassign-items.component.html',
  styleUrls: ['./reassign-items.component.scss']
})
export class ReassignItemsComponent implements OnInit {
  @Input() userInfo: any
  @Output() modelclose: EventEmitter<any> = new EventEmitter<any>();
  jobList: any = []
  jobListCopy: any = []
  memberList : any = []
  memberListPreserve: any = []
  increment : number =0
  programId: any
  subTask: any = []
  isReassign: boolean = false;
  reassignCheckbox: boolean = false
  isItemReassigned: boolean = false

  reassignItems:boolean = false;
  statusUpdate: boolean = false;
  taskId: string = '';
  subTaskStatus: any; 
  retryTaskPayload =[]
  reassignHeader: string = 'Reassign Items'
  orgCategory: any;
  memberListForPendingAction: any = []
  memberListForPendingActionPreserve : any = []

  constructor(
    private programService: ProgramService,
    private localStorage: StorageService,
    private alert: AlertService,
    private _loader: LoaderService,
    private sortPipe: SortHelperPipe
  ) { }

  ngOnInit(): void {
    this.programId = this.localStorage.get(StorageKeys.PROGRAM_ID);
    this.reassignItems = true;
    this.orgCategory =  this.userInfo?.['org_category'];
    if(!this.userInfo?.['inProgress']){
    this.getAllTaskList(this.userInfo?.['memberId'])
    this.getAllMemberList('')
    }else{
      this.checkStatus()
    }
  }

  // Reassign Model close
  async reassignModalClose() {
    this.modelclose.emit(false)
 }

 // Get all task List
 getAllTaskList(id){
  this._loader.show()
  this.increment = 0
    const url = `/configurator/programs/${this.programId}/reassignment/tasks?member_id=${id}`;
      this.programService.get(url)
        .subscribe({
          next: (res: any) => {
            this._loader.hide()
            this.jobList = res?.reassign_sources;
            this.getMemberListForPendingAction(this.jobList,'');
             this.getAllCount(this.increment)
          },
          error: (err: any) => {
            this._loader.hide()
            this.alert.error(errorHandler(err));
          }
        }
      )
 }

getAllCount(increment){
  this.numberOftask(this.jobList[increment]?.full_count_fetch_url)  
}
 // Get the count against every task
 numberOftask(url: any){
  this._loader.show()
  this.programService.get(url)
        .subscribe({
          next: (res: any) => {
          this._loader.hide()
          const count = res?.data?.count ? res?.data?.count : res?.count
          const pending = res?.data?.pending ? res?.data?.pending : 0
          if(count && count!==0){
           this.jobList[this.increment]['count'] = count == 1 ? count + ' item' : count + ' items'
           this.jobList[this.increment]['pending_count']= pending
           if(this.jobList[this.increment]?.slug =='assignment_manager_on_active_assignments'){
            this.jobList[this.increment]['information']=`There are ${pending} assignments for which Approval is pending which can not be re-assigned until they are cleared from Pending Approval`
           }else if(this.jobList[this.increment]?.slug == 'timesheet_manager_on_active_assignments'){
            this.jobList[this.increment]['information'] = `There are ${pending} assignments for which Approval is pending which can not be re-assigned including the Timesheets associated to those Pending Approval Assignments until they are cleared from Pending Approval.`
           }else if(this.jobList[this.increment]?.slug == 'expense_manager_on_active_assignments'){
            this.jobList[this.increment]['information'] = `There are ${pending} assignments for which Approval is pending which can not be re-assigned including the Expenses associated to those Pending Approval Assignments until they are cleared from Pending Approval.`
           }
           this.jobListCopy.push(this.jobList[this.increment])
          this.increment++
          if(this.increment <= this.jobList.length -1){
            this.getAllCount(this.increment)
          }else {
            this.sortData()
          }

          }else {
            this.jobList[this.increment]['count'] =0
            this.increment++
          if(this.increment <= this.jobList.length -1){
            this.getAllCount(this.increment)
          }else{
            this.sortData()
          }
          }          
          },
          error: (err: any) => {
            this._loader.hide()
           this.jobList[this.increment]['count'] = 0
            this.increment++
            if(this.increment <= this.jobList.length -1){
              this.getAllCount(this.increment)
            }else {
            this.sortData()
            }
            this.alert.error(errorHandler(err));
          }
        }
      )
 }
 sortData(){
  this.sortPipe.transform(this.jobListCopy, 'order_sequence');
 }

 //This menber list  Api is called when organization category is MSP or organization category is client and task list not having pending_action task.
 getAllMemberList(search: string){
    // this._loader.show()
    const url = `/configurator/programs/${this.programId}/members?org_category=${this.orgCategory}&k=${search}&exclude_user_ids=${this.userInfo?.['memberId']}`;
    this.programService.get(url)
    .subscribe({
      next: (res: any) => {
        // this._loader.hide()
        if(!search){
          this.memberListPreserve = res?.members
        }
      //  this.memberList = res?.members
      this.memberList = this.memberListPreserve
      },
      error: (err: any) => {
        this._loader.hide()
        this.alert.error(errorHandler(err));
      }
    }
  )
 }

 // Select members  from dropdown
 selectNewMember(index,data,event){
  if(!event){
    this.subTask.splice(index,1)
  }
  this.subTask?.forEach((ele,index) => {
  if(ele?.source_id == data?.id){
     this.subTask.splice(index,1)
   }
  })
  if(event){
  this.subTask.push({
    source_id : data?.id,
    new_user_id: event,
  })
}
  if(this.subTask.length > 0){
    this.isReassign = true
  }else{
    this.isReassign = false
    this.reassignCheckbox = false
  }

 }

 // To assign the task
 reassignTask(){
  this._loader.show()
  const payload = {
    old_user_id: this.userInfo['memberId'],
    "subtasks": this.subTask,
  }
  const url = `/configurator/programs/${this.programId}/reassignment/tasks`;
  this.programService.post(url,payload)
  .subscribe({
    next: (res: any) => {
      this._loader.hide()
     if(res?.reassgn_task) {
      this.jobListCopy = [];
      this.isItemReassigned = true
      this.taskId = res?.reassgn_task?.id
      this.checkStatus()
     }
    },
    error: (err: any) => {
      this._loader.hide()
      this.alert.error(errorHandler(err));
    }
  }
)
 }
// User dropdown seach
 onSearch(data,slug){
  slug == 'pending_actions' && this.orgCategory.toLowerCase() == 'client' ? this.getMemberListForPendingAction(this.jobList,data?.term) : this.getAllMemberList(data?.term)
 }

 // check status of task
 checkStatus(){
  this.reassignHeader = 'Status of Reassigned Items'
  this._loader.show()
  const url = `/configurator/programs/${this.programId}/reassignment/member/${this.userInfo['memberId']}?task_id=${this.taskId}`;
  this.programService.get(url)
  .subscribe({
    next: (res: any) => {
      this.statusUpdate =res?.is_completed
      if(!this.statusUpdate){
      this.subTaskStatus = res?.subtasks_data
      }
      this._loader.hide()
    },
    error: (err: any) => {
      this._loader.hide()
      this.alert.error(errorHandler(err));
    }
  }
)
 }

 // To select the checkbox for failed task
 selectFailedTask(event:any){
  const idExist = this.retryTaskPayload?.filter(n => n?.id == event?.id)
  if(idExist?.length == 0){
    this.retryTaskPayload.push(event)
  }else{
    this.retryTaskPayload = this.retryTaskPayload?.filter(n => n?.id !== event?.id)
  }
 }

 // To reassign the failed task to same user again
 reassignFailedTask(){
  this._loader.show()
  const url = `/configurator/programs/${this.programId}/reassignment/member/${this.userInfo['memberId']}/retry`;
  this.programService.put(url,this.retryTaskPayload)
  .subscribe({
    next: (res: any) => {
      this._loader.hide()
      if(res?.status.toLowerCase() == 'success'){
       this.reassignModalClose()
      }
    },
    error: (err: any) => {
      this._loader.hide()
      this.alert.error(errorHandler(err));
    }
  }
)
 }

// This menber list API is called when organization category  must be client and task list have a pending_action task.
 getMemberListForPendingAction(data:any,search:any){
  if(this.orgCategory.toLowerCase() == 'client' && data?.length >0){
    data?.forEach(slug => {
      if(slug?.slug == 'pending_actions'){
        const url = `/configurator/programs/${this.programId}/members?org_category=CLIENT,MSP&k=${search}&exclude_user_ids=${this.userInfo['memberId']}`;
    this.programService.get(url)
    .subscribe({
      next: (res: any) => {
        // this._loader.hide()
        if(!search){
          this.memberListForPendingActionPreserve = res?.members
        }
      //  this.memberListForPendingAction = res?.members
      this.memberListForPendingAction  = this.memberListForPendingActionPreserve
      },
      error: (err: any) => {
        // this._loader.hide()
        this.alert.error(errorHandler(err));
      }
    }
  )
      }
    })
  }
 }
}
