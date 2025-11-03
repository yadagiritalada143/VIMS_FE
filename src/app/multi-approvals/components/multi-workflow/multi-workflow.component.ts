import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { multiWorkflow } from '../../../shared/interfaces';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { ApprovalsService } from '../../service/approvals.service';

export enum statusEnum {
  approved = 'APPROVED',
  pending = 'PENDING',
  rejected = 'REJECTED',
  cancelled = 'CANCELLED',
  notstarted = 'NOTSTARTED',
  reviewed = 'REVIEWED',
  pending_approval = 'PENDING APPROVAL',
  pending_review = 'PENDING_REVIEW',
  approval = 'APPROVAL',
  default = 'DEFAULT',
  review = 'REVIEW',
  closed = 'CLOSED',
  not_needed= "NOT NEEDED",
  countered_pending_review= 'COUNTERED_PENDING_REVIEW',
  pending_offer_review= 'PENDING_OFFER_REVIEW',
  bypassed = 'BYPASSED'
}

@Component({
  selector: 'app-multi-workflow',
  templateUrl: './multi-workflow.component.html',
  styleUrls: ['./multi-workflow.component.scss']
})

export class MultiWorkflowComponent implements OnInit {
  @ViewChild('approverList')approverList: ElementRef;
  @ViewChild('previousApproverList')previousApproverList: ElementRef;
  isHideApproversClicked: boolean = false;
  tabs:multiWorkflow[] = [];
  current_workflow_type;
  @Input() moduleStatus;
  approval_version:number= 0;
  approverModal;
  @Input() set version(value) {
    this.programId = this.storageS.get(StorageKeys.CURRENT_PROGRAM)?.id;
    if (value !== undefined && this.programId) {
      this.approval_version= value;
      let URL = `/approval/programs/${this.programId}/${this.moduleName?.toUpperCase()}/${this.moduleId}/previous-workflows`;
      if(this.moduleStatus?.toLowerCase() == "pending" || this.moduleStatus?.toLowerCase() == "pending_approval" || this.moduleStatus?.toLowerCase() == "pending_approval_sourcing"||
      this.moduleStatus?.toLowerCase()==='pending_offer_review' || this.moduleStatus?.toLowerCase()==='countered_pending_review' || 
      this.moduleStatus?.toLowerCase()==='countered_pending_approval'){
        if(value > 0){
          URL = `${URL}?exclude_workflows=REVIEW-V-${value},APPROVAL-V-${value}`
        }else{
          URL = `${URL}?exclude_workflows=REVIEW,APPROVAL`
        }
      }
      this.getPreviousWorkflows(URL);
    }
  };
  @Input() moduleName;
  @Input() moduleId;
  @Input() set multiApprovals(value) {
    this.isActiveTabFound = false;
    const addDefaultKeys = (res) => { 
      res.loaded = false;
      res.data = undefined; 
      res.workflow_type = res?.workflow_type ?? 'APPROVAL';
    }
    this.tabs = [...value];
    this.tabs?.forEach(addDefaultKeys);
    this.tabs?.forEach((res,i)=>{
      if(this.isActiveTabFound) {
        res.isDisabled = true;
      }
      if(res?.status?.toUpperCase() == this.moduleStatus?.toUpperCase() || this.moduleStatus?.toUpperCase() == 'REJECTED' && !this.isActiveTabFound) {
        this.isActiveTabFound = true;
        this.activeTabInd = i;
        this.current_workflow_type = res?.workflow_type;
      }
      this.changeTab(res, i, false, false);
    });
    if(!this.isActiveTabFound) { 
      this.activeTabInd = this.tabs.length - 1;
      this.current_workflow_type = this.tabs[this.activeTabInd]?.workflow_type;
    } 
  }; 
  activeTabInd = 0;
  selectedIndex;
  public StatusEnum = statusEnum;
  managerListDropdown : boolean = false;
  previousWorkflow: any;
  isActiveTabFound:boolean = false;
  selectedPreviousIndex: any;
  @Input() showPreviousWorkflow: boolean = false;
  previousWorkflowTabIndex: any;
  groupedWorkflowsArray: any;
  replace_role;
  profile;
  showReplaceScreen;
  programId;
  usersList=[];
  replaceUsersList;
  replaceLevelChainId;
  previousWorkflowContent: any;
  showNoWorkflow:boolean= false;
constructor(
  private jobService: JobDetailsService,
  private loaderService: LoaderService,
  private eventStream: EventStreamService,
  private storageS: StorageService,
  private alertS: AlertService,
  private userPermissionService: UserPermissionService,
  private authorizationService: AuthorizationService,
  private approvalService: ApprovalsService
) { 
  this.programId = this.storageS.get(StorageKeys.CURRENT_PROGRAM)?.id;
}

ngOnInit(): void { 
}

getPreviousWorkflows(URL){
  this.loaderService.show();
  this.jobService.get(URL).subscribe({
    next: (res: any)=> {
      this.loaderService.hide();
      this.previousWorkflow = res;
      this.reducePreviousWorkflow();
    },
    error: (error)=> {
      this.loaderService.hide();
    }
  })
}

reducePreviousWorkflow(){
  const groupedWorkflows = this.previousWorkflow?.previous_workflows?.reduce((result, workflow) => {
    const version = workflow?.version;
  
    if (!result[version]) {
      result[version] = [];
    }
  
    result[version].push(workflow);
    return result;
  }, {});
  
   this.groupedWorkflowsArray = Object.values(groupedWorkflows)?.reverse();
}

setPreviousWorkflowActiveInd(index){
  this.previousWorkflowTabIndex = (this.groupedWorkflowsArray[index]?.length - 1) ?? 0;
}

changeTab(tabData, index, changeActiveIdx?, changeWorkflowType?) {
  if(tabData?.isDisabled) {
    return;
  }
  this.selectedIndex = undefined;
  if (tabData.data != undefined) {
    if(changeActiveIdx) {
      this.activeTabInd = index;
    }
    if(changeWorkflowType) {
      this.current_workflow_type = tabData?.workflow_type;
    }
    this.openPendingAccordian(tabData?.data?.approvers);
  } else {
    this.loaderService.show();
    this.jobService.get(tabData?.api_url).subscribe({
      next: (res:any)=>{
        this.loaderService.hide();
        tabData.data = res;        
        this.checkStatus();
        const memberIds = [];
        res?.approvers?.forEach((approvalL)=>{
          approvalL?.members?.forEach((member)=>{
            memberIds.push(member?.id);

            if(member?.user_reassigned_by?.reassigned_from?.id) {
              memberIds.push(member?.user_reassigned_by?.reassigned_from?.id)
            }

            if(member?.approver_replaced_by?.replaced_from?.id) {
              memberIds.push(member?.approver_replaced_by?.replaced_from?.id)
            }
            if(member?.delegated_to?.length > 0) {
              member?.delegated_to?.forEach((delegatedUser) => {
                memberIds.push(delegatedUser?.id);
              })
            }
          })
        });
        if(changeWorkflowType) {
          this.current_workflow_type = tabData?.workflow_type;
        }
        
        this.getUsersList([...new Set(memberIds)]);
        if(changeActiveIdx) {
          this.activeTabInd = index;
        }
        this.openPendingAccordian(tabData?.data?.approvers);
      },
      error: (error) => {
        this.loaderService.hide();
        tabData.data = undefined;
        if(changeActiveIdx) {
          this.activeTabInd = index;
        }     
      } 
    }
    );
  }
}

  changePreviousWorkflowTab(index){
    this.previousWorkflowTabIndex = index; 
  }

  openPreviousWorkflow(index: number) {
    if (this.isHideApproversClicked) {
    } else { 
      if (this.selectedPreviousIndex === index) {
        this.selectedPreviousIndex = undefined;
      } else {
        this.selectedPreviousIndex = index;
      }
    }
  }

  checkStatus(){
    this.showNoWorkflow = !this.tabs?.some(tab => {
      return tab?.data && tab?.data?.status?.toUpperCase() == "PENDING"
    })
  }

  openDetailApproval(index: number) {
    if (this.isHideApproversClicked) {
    } else { 
      if (this.selectedIndex === index) {
        this.selectedIndex = undefined;
      } else {
        this.selectedIndex = index;
      }
    }
  }

  hideApproversClick(workflow) {
    this.isHideApproversClicked = true;
    workflow.hideApprovers = !workflow.hideApprovers;
  }

  isNotNeededStatus(data) {
    return data?.some(member => member?.status?.toUpperCase() === this.StatusEnum?.not_needed?.toUpperCase());
  }

openPendingAccordian = (list) => {
  list?.every((res, i) => {
    if (res?.status?.toUpperCase() == this.StatusEnum.pending) {
      this.selectedIndex = i;
      return false;
    }
    return true;
  });
}

openReplaceScreen(member, replace_role, workflow) {
  this.profile = member;
  // this.profile.role = this.getUserDetails(member);
  this.replace_role = replace_role;
  this.replaceLevelChainId = workflow?.approval_chain_id;
  this.showReplaceScreen = true;
  const replaceWithSupervisor = false;
  if(replaceWithSupervisor) {
    const supervisor = this.usersList?.find((res)=>res?.id==this.profile?.id)?.supervisor;
    if(supervisor) {
      this.replaceUsersList = [supervisor];
    } else {
      this.replaceUsersList = [];
    }
  } else if(this.tabs?.[this.activeTabInd]?.isOnlyReplaceUsersFromWorkflow) {
    this.replaceUsersList = this.usersList?.filter((res)=>res?.id!=this.profile?.id);
  } else {
    this.replaceUsersList = [];
  }
  setTimeout(()=>{
    this.eventStream.emit(
      new EmitEvent(Events.REPLACE_APPROVER, {
        value: true
      }),
    );
  },100)
}

showMoreName() {
  this.managerListDropdown = true;
}

hideMoreName() {
  this.managerListDropdown = false;
}

replaceApprover(value) {
  this.loaderService.show();
  let workflow_action:string = this.moduleStatus?.toUpperCase() == statusEnum.pending_review ? statusEnum.review : statusEnum.approval;
  if (this.moduleStatus?.toUpperCase() == statusEnum.pending_approval || this.moduleStatus?.toUpperCase() == statusEnum.pending) {
    workflow_action = statusEnum.default;
  }
  if(this.moduleName?.toLowerCase() === "jobs" || this.moduleName?.toLowerCase() === "offers"){
    if(this.moduleStatus?.toUpperCase() == statusEnum.pending_review || 
       this.moduleStatus?.toUpperCase() == statusEnum.countered_pending_review ||
       this.moduleStatus?.toUpperCase() == statusEnum.pending_offer_review){
      workflow_action= this.approval_version > 0 ? statusEnum.review +"-V-"+this.approval_version : statusEnum.review;
    }else {
      workflow_action= this.approval_version > 0 ? statusEnum.approval +"-V-"+this.approval_version : statusEnum.approval;
    }
  }
  this.approvalService.updateApprover(this.programId, this.moduleName, this.moduleId, value.selectedApprover.id, value.existingUserId, null, value.notes, workflow_action,this.replaceLevelChainId).subscribe({
    next: (res: any) => {
    if (res && 'member_id' in res) {
      this.alertS.success(this.current_workflow_type == 'review' ? 'Reviewer replaced successfully' : 'Approver replaced successfully');
      window.location.reload();
    }
  },
  error: (err) => {
    this.alertS.error(err);
    this.loaderService.hide();
  }});
}

get hasReplaceApprovalPermission() {
  let canReplaceMember = false;
  if (this.userPermissionService.isUserSuperAdmin()) {
    canReplaceMember = true;
  } else {
    if (!this.profile?.is_delegated) {
      canReplaceMember = this.authorizationService.authorize('replace_approver');
    }
  }
  return canReplaceMember;
}

closeSidebar() {
  this.profile = undefined;
  this.replace_role = undefined;
  this.replaceLevelChainId = undefined;
}

getUsersList(uIds: any): void {
  this.loaderService.show("Loading Users' details, please wait");
  this.approvalService.getListOfUsersByIds(uIds, true)?.subscribe({
    next: (data: any) => {
      this.usersList = [...this.usersList,...data?.members]; 
      this.loaderService?.hide();
    },
    error: err => {
      this.alertS.error('Failed to load list of users.');
      this.loaderService?.hide();
    },
    complete() {
      this.loaderService?.hide();
    },
  });
}

getUserDetails(member) {
  return this.usersList?.find(user => user?.id == member?.id)?.role?.name ?? '';
}

previousWorkflowAccordion(value) {
  if(value === this.previousWorkflowContent){
    this.previousWorkflowContent = null;
  }else{
    this.previousWorkflowContent = value;
    this.setPreviousWorkflowActiveInd(value)
  }
}
  toggleOptions(j) {
    this.approverModal = j;
  }

  onCloseModal() {
    this.approverModal = null;
  }

  showMoreBtn(member){
    return member?.is_reassigned_user ||
      ((member?.is_replaced_approver || (member?.delegated_to && member?.delegated_to?.length > 0 && member?.status)||
      member?.is_impersonated) && member?.status===this.StatusEnum.pending)  
  }
}
