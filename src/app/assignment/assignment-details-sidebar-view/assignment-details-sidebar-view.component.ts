import { Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService , StorageKeys} from 'src/app/core/services/storage.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Log } from 'src/app/library/logs/logs.model';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { VendorType } from '../enums/vendor-type';

@Component({
  selector: 'assignment-details-sidebar-view',
  templateUrl: './assignment-details-sidebar-view.component.html'
})
export class AssignmentDetailsSidebarViewComponent implements OnInit, OnDestroy {
  public isSidebarVisible = 'hidden';
  public profilevisible = true;
  public showSkelton = true;
  public selectedIndex: number;
  public clickOutside: boolean;
  @Output() closeSideBar = new EventEmitter();
  interviewId: any;
  candidateData: any;
  jobData: any;
  showOnlyCandidateProfile = true;
  subscriptions = [];
  candidateId: any;
  assignmentData: any = {};
  job_id: any;
  isEditDetails:boolean = false;
  isClear:boolean = false;
  assignmentid: any;
  programDetails: any;
  programId: any;
  candidateAddress:any;
  workerData:any;
  assignmentDetails : any;
  userName :any;
  logs:Log= undefined;
  isdaas: boolean = false;
  user_type: string;
  vendorDetails: any;
  hide_section = {
    edit_worker : false,
    profile: false
  };
  constructor(private eventStream: EventStreamService,
    private candidateService: CandidateService,
    private _loader: LoaderService,
    public storageService: StorageService,
    public alert: AlertService,
    public activatedRoute: ActivatedRoute,
    private vendorService: VendorService,
    private loaderService: LoaderService,

  ) { }

  ngOnInit(): void {
    this.isdaas = false;
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.subscriptions.push(
      this.eventStream.on(Events.ASSIGNMENT_SIDEBAR_VIEW).subscribe( (data) => {
        this.isdaas = false;
        if (data) {
          this.isSidebarVisible = 'visible';
          this.showSkelton = true;
          this.candidateId = data?.candidateId;
         
        } else {
          this.isSidebarVisible = 'hidden';
        }
        if (data['selectedIndex']) {
          this.selectedIndex = data['selectedIndex'];
        }
        if (data?.value) {
          this.candidateData = data.value.worker?.candidate;
          if(this.candidateData?.name){
            this.userName =`${this.candidateData?.name_prefix ? this.candidateData?.name_prefix : ''}  ${this.toTitleCase(this.candidateData?.name)}  ${this.candidateData?.name_suffix ? this.candidateData?.name_suffix : ''}`;  
            }
          this.assignmentData.template_name = data?.value?.assignment?.assignment_title?.name;
          this.assignmentData.job_id = data?.value?.assignment?.code;
          this.assignmentData.name = this.candidateData?.name;
          this.assignmentDetails = data?.value?.assignment;
          this.isdaas = data?.value?.assignment?.is_dsaas ? data?.value?.assignment?.is_dsaas && this.user_type?.toLowerCase() === UserType.Vendor?.toLowerCase(): false
          this.showSkelton = false;
          this.candidateId = this.candidateData?.user?.id || this.candidateData?.id;
          this.updateDsaasValue();
        } else {
          if (this.candidateId) {
            this.init();
          }
        }
      }));
      this.assignmentid = this.activatedRoute.snapshot.params.id;
      this.programDetails = this.storageService.get('CurrentProgram');
      this.programId = this.programDetails['id'];
      if(this.user_type?.toLowerCase() === UserType.Vendor.toLowerCase()) {
        this.getVendorDetails();
      }

  }
  toTitleCase(str) {
    if (!str) {
      return;
    }
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt?.charAt(0)?.toUpperCase() + txt?.substr(1)?.toLowerCase();
      }
    );
  }

  init() {
    if (this.assignmentid && this.programId) {
      this.getAssignmentDetails();
    }
    this.getCandidateDetails(this.candidateId)
  }

  cancelWorkerDetail(event) {
    if (event == true) {
      this.isEditDetails = !event;
    }
  }

  editWorkerDetails(){
    this.isEditDetails = true;
  }

  getCandidateDetails(id) {
    this.candidateService.getCandidateDetail(id).subscribe(
      {next: (data: any) => {
        if (data) {
          this.candidateData = data.candidate;
          if(!this.candidateData?.name){
          this.userName =this.candidateData?.first_name.concat('  '+ this.candidateData?.last_name);
          }
          this.showSkelton = false;
        }
      },
      error: (error) => {
        this.alert.error(error);
        this._loader.hide();
      }
    });
  }
  getVendorDetails() {
    let ORGANIZATION_ID = this.storageService.get(StorageKeys.ORGANIZATION_ID);
    let url =  `/configurator/programs/${this.programId}/vendors/${ORGANIZATION_ID}`;
    this.candidateService.get(url).subscribe(
      {next: (data: any) => {
        if (data) {
           this.vendorDetails = data?.program_vendor
           this.updateDsaasValue();

        }
      },
      error: (error) => {
        // this.alert.error(error);
        // this._loader.hide();
      }
    });
  }
updateDsaasValue() {
  if(this.vendorDetails && this.vendorDetails?.vendor_type?.toLowerCase() === VendorType.DirectSourcing && this.assignmentDetails?.is_dsaas) {
    this.isdaas = false;
    this.hide_section.edit_worker = true;
    this.hide_section.profile = false;
   }else {
    this.hide_section.edit_worker = false;
    this.hide_section.profile = true;

   }
}
  getAssignmentDetails() {
    this.loaderService.show();
    let url = `/assignment/programs/${this.programId}/assignment/${this.assignmentid}`;
    this.vendorService.get(url).subscribe(
      (data: any) => {
        if (data?.data) {
          data.data.assignments.worker['worker_original_start_date'] = data?.data?.assignments?.worker?.original_start_date
          this.assignmentDetails = data?.data?.assignments;
          this.workerData = data?.data?.assignments?.worker;
          this.assignmentData.template_name =  this.assignmentDetails?.assignment?.assignment_title?.name;
          this.assignmentData.job_id =  this.assignmentDetails?.assignment?.code ||  this.assignmentDetails?.assignment?.job_id ;
          this.assignmentData.name = this.workerData?.candidateData?.name;
        }
        this.loaderService.hide();
      },
      (err) => {
        this.loaderService.hide();
      });
  }

  sidebarClose() {
    this.isClear= true;
    this.isSidebarVisible = 'hidden';
    this.interviewId = null;
    this.isEditDetails = false;
    this.closeSideBar.emit(true);
  }

  handleTabChangeEvent($event) {

  }

  handleSubTabChange($event) {

  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
