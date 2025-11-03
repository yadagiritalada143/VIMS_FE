import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Router,ActivatedRoute } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service' ;
import { AssignmentService } from 'src/app/assignment/assignment.service';
import { JobDetailsService } from '../../job-details.service';

@Component({
  selector: 'app-assignment',
  templateUrl: './assignment.component.html',
  styleUrls: ['./assignment.component.scss']
})
export class AssignmentComponent implements OnInit {

 
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  public limit= 10;
  tableLoaded = false;
  dataLoading = true;
  searchTerm: any;
  filter: any = {};
  showRecords = [20,40,60]
  itemsPerPage: any;
  jobId = '';
  currentProgram: any;
  candidate_id: any;
  defaultSortObj: any;
  sortObj: any;
  constructor(
    private candidateService:CandidateService,
    private _alert: AlertService,
    private _loader: LoaderService,
    private router:Router,
    private route:ActivatedRoute,
    private eventStream: EventStreamService,
    public storageService: StorageService,
    public assignmentService: AssignmentService,
    private jobDetailsService: JobDetailsService
  ) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.jobId = this.route.parent?.snapshot.params['id'];
    this.getAssignmentList();
    this.tableConfig = {
      title: 'Assignments',
      tableNoDataObj: {
        headTitle: 'No Assignments Found',
        subTitle: 'There are no Assignments created for this job',
        imageUrl: './assets/images/undraw_Resume_re_hkth.svg', 
      },
      columnList: [
        { name: 'worker.candidate.name', title: 'Worker', width: 21, isIcon: true, isImage: true, isContact: false, isNumberBadge: false,isVieworEdit: false,showPreviewIcon: true},
        { name: 'status', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'code', title: 'ID', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'assignment_title.name', title: 'Assignment Title', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'assignment_manager.name', title: 'Assignment Manager', width: 14, isIcon: true, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'work_location.name', title: 'Location', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'hierarchy.name', title: 'Hierarchy', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: true }
      ],
      isExpand: false,
      isFilter: false,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      hideResultCount: true,
      isCreate: false,
      isTopHeader: true,
      density: 'COMFORTABLE',
      advanceFilter: [
        { name: 'name', title: 'Job Title', filterType: 'TEXT' },
        { name: 'min', placeholder: 'Min',  placeholder_1 : 'Max', title: 'Preferred Pay Rate Range', filterType: 'RANGE' },
    
      ]
    };
  }

  getAssignmentList(page = 1) { 
    const programID =this.currentProgram?.id; 
    this.assignmentService.getAssignmentsByJobId(page, this.limit,  programID, this.jobId).subscribe({
      next: (data: any) => {
      if (data) {
        data?.data?.assignment?.forEach((element:any)=>{
          element.worker.candidate.name=this.jobDetailsService.toTitleCase(element?.worker?.candidate?.name);
        })
        this.vmsData = new Array();
        this.dataLoading=false;
        this.tableLoaded=false;
        this.vmsData=data.data.assignment;
        this.itemsPerPage = data?.data?.per_page; 
        
        this.totalRecords = data?.data?.total_records; 
      }
    }, 
    error: (err) => {
      this.vmsData = new Array();
      this.tableLoaded=false;
      this.dataLoading=false;
      // this.alert.error(errorHandler(err));
    }});
  }

  // Assignment Sidebar
  
    onClickView(event) {
      if (event) {
        this.router.navigate([`assignment/details/${event.assignment_uuid}/final?tab=assignment`]);
      } 
    }
    previewClicked(event){
      if (event) {
        this.eventStream.emit(
          new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, { 
            job_id:this.jobId,
            candidateId: event?.worker?.candidate?.id,
            selectedIndex:4,
            assignment_Id:event.assignment_uuid 
          })
        );
    }
  }
    onEditClick(data) {
      this.router.navigate(['/candidates/submit'],{ queryParams: { candidateSubmission: true, jobId: 1, type:'updateThensubmit', candidateId:data.id} });
    }
    cloneClicked(e) {

    }
    onExpandClick(e) { }

   
    onPaginationClick(e) {  
        this.getAssignmentList(e); 
    }
    onClickRecords(event) {
      this.limit = event;
      this.getAssignmentList(1);
    }
    onUpdateRecordClick(e) {
      if(e) {
        this.limit = e;
        // this.getAssignmentList(1);
      }
    }

    sortColMap = {
    }
    onSortClick(event) {
      if(!!event) {
        this.sortObj = event;
      } else {
        this.sortObj = this.defaultSortObj;
      }
      this.getAssignmentList(1);
    }

    onDeleteClick(role) {

    }

    disableClicked(role) {
    }

    onCreateClick(e) {

    }

    columnClicked(columnData) {

    }

    viewProfileClicked(event) {
      if (event) {
        this.eventStream.emit(new EmitEvent(Events.VIEW_CANDIDATE_PROFILE, { value: event }));
      }
    }
    onListFilter(event) {
      if (event) {
        if(event.min) {
          if(!this.filter.pay_rate) {
            this.filter.pay_rate= {} ;
          }
          this.filter.pay_rate= {min:event.min}
        }
        if(event.max) {
          if(!this.filter.pay_rate) {
            this.filter.pay_rate= {} ;
          }
          this.filter.pay_rate= {max:event.max}
        }
      
        this.getAvailableCandidateListFIlter(1);

      } else {
        this.getAssignmentList(1);
      }
    }
    getAvailableCandidateListFIlter(pageNo = 1) {
       let url ='configurator/candidates/advanced-filters'
      // let url ='https://qa-services.simplifysandbox.net/assignment/programs/e0ed0ed7-7423-4ae2-8439-ae71c54b5090/assignment?is_enabled=True&page=1&limit=10&search=Saurabh%20Raj';
      this.candidateService.post(url, this.filter).subscribe({
        next: (data: any) => {
        var cand_arr = [];
        data?.candidates.forEach(element => {
          let candidate_name1 = (element.middle_name) ? `${element.first_name} ${element.middle_name} ${element.last_name}` : `${element.first_name} ${element.last_name}`;
          let candidate_list_data = {
            "candidate_name": candidate_name1,
            "prefRate":'$' + element?.preferences.rate.amount,
            "id": element.id,
            "availability": element?.preferences?.availability_date,
            "est_hours":element?.preferences?.estimated_hours,
            "est_pay":'10',
            "match":'10'
          }
         cand_arr.push(candidate_list_data);
        });
        this.vmsData = {'candidate':cand_arr};
        this.dataLoading = false;
        this.totalRecords = data?.total_records;
        this.itemsPerPage = data?.items_per_page;
        this.tableLoaded = true;
        this._loader.hide();
      }, 
      error: (err) => {
        this.dataLoading = false;
        this._alert.error(errorHandler(err));
      }});
    }
    onWithdrawProfileClick(event) {
      this.router.navigate(['/candidates/submit'],{ queryParams: { candidateSubmission: true, jobId: 1, type:'submit', candidateId:event.id} });
    }
    onSubmitedCandidate(data) {
      let program  = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      let job = this.storageService.get('viewd_job');

      let url = `/configurator/programs/${program?.id}/jobs/${job?.uid}/candidates/submit`
      this.candidateService.post(url, data).subscribe({
        next: (data) => {
        this._loader.hide();
        this._alert.success('Candidate submittted successfully');
      }, 
      error: (err) => {
        this.dataLoading = false;
        this._alert.error(errorHandler(err));
      }});
    }

    assignmentSearch(searchKey,pageNo = 1,itemPerPage=10) {
        const programID = this.currentProgram?.id;
        if(programID && searchKey){
          this.assignmentService.assignmentSearchList(programID,searchKey,pageNo,itemPerPage).subscribe({
            next: (data: any) => {
            if (data) {
              this.vmsData = new Array();
              this.dataLoading=false;
              this.tableLoaded=false;
              this.vmsData=data.data.assignment;
              this.itemsPerPage = data?.data?.per_page; 
              
              this.totalRecords = data?.data?.total_records; 
            }
          }, 
          error: (err) => {
            this.tableLoaded=false;
            this.dataLoading=false;
            // this.alert.error(errorHandler(err));
          }});
        }
      
      
    }

    onSearch(event) {
      if(event) {
        this.searchTerm = event;
        this.assignmentSearch(event,1,this.limit);
      } else {
        this.assignmentSearch(event,1,this.limit);
      }
    }
  }
