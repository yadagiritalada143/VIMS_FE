import { Component, OnDestroy, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-interviews',
  templateUrl: './interviews.component.html',
  styleUrls: ['./interviews.component.scss'],
  providers:[DatePipe],
})
export class InterviewsComponent implements OnInit, OnDestroy {

  private subscriptions = [];

  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  gridContentType = 'interview';
  tableLoaded = false;
  dataLoading = true;
  public viewGrid: boolean = true;
  public gridVewJson: any = {};
  itemsPerPage: any;
  searchTerm: any;
  jobId = '';
  filterDataPage: number;
  isAdvanceSearch = false;
  filterpayLoad: any;
  candidateId: '';
  todaysInterviews: any[];
  toDaysDate: any;
  constructor(
    private _eventStrem: EventStreamService,
    private jobService : JobDetailsService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    private datefilter:DatePipe
    ) { }
  ngOnInit(): void {
    this.jobId = this.route.snapshot.params['jobid'];
    this.candidateId= this.route.snapshot.params['candidateId']
    this.tableConfig = {
      title: 'Interviews',
      columnList: [
        // { name: 'candidate', title: 'Candidate', width: 20, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        // { name: 'date', title: 'Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        // { name: 'time', title: 'Time', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'duration', title: 'Duration', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        // { name: 'type', title: 'Type', width: 10, isIcon: false, isIconList: true, isImage: false, isContact: false, isNumberBadge: false},
       
        { name: 'name', title: 'Candidate', width: 20, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        { name: 'date', title: 'Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'time', title: 'Time', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'duration', title: 'Duration', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'type', title: 'Type', width: 5, isIcon: false, isImage: false, isContact: false,  isIconList: true, isNumberBadge: false, isInterview: true,isNoOption:false},
        // { name: 'status', title: 'Status', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isCandidateStatus: false },
        // { name: 'created_on', title: 'Created On', width: 10, isIcon: false, isImage: false, isContact: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isViewProfile: false,  isNumberBadge: false, isInterview: true},
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: false,
      isTopPagination: false,
      hideResultCount: true,
      isCreate: false,
      density: 'COMFORTABLE',
      isTheme: true
    };

    this.getInterviews();
    this.viewGrid = true;

    this.subscriptions.push(this._eventStrem.on(Events.SHOW_GRID_LAYOUT).subscribe((data) => {
      // this.viewGrid = false;
      if(data){
        this.viewGrid = false;
      }else{
        this.viewGrid = true;
      }
    }));
  }
  
  getInterviews() {
    this.subscriptions.push(this.jobService.getInterviewList(this.jobId,this.candidateId).subscribe({
      next: (data: any) => {
      if (data) {
        let interviews =[];
        data.interviews.forEach(item => {
          let date;
          let time;
          let dasyDifference;
          let type=  {};
          if(item.interview_type === 'F2F'){
            type = {"face_to_face":true};
          }else if(item.interview_type === 'VIRTUAL'){
            type = {"video":true};
          }else if(item.interview_type === 'PHONE'){
            type = {"audio":true};
          }
          let candidate_name1 = (item.candidate?.middle_name) ? `${item.candidate?.first_name} ${item.candidate?.middle_name} ${item.candidate?.last_name}` : `${item.candidate?.first_name} ${item.candidate?.last_name}`;
          item.schedules?.forEach(element => {
            if(element.is_prefered === true){
              date = element?.date;
              time = element?.start_time;
              var date1 = new Date(item.created_on); 
              var date2 = new Date(date); 
              var Difference_In_Time = date2.getTime() - date1.getTime();  
              var Difference_In_Days =  Math.round(Difference_In_Time / (1000 * 3600 * 24)); 
              dasyDifference = Difference_In_Days;
            }
          });
        let interview = {
         "id": item.id,
      // "id": '13',
        "name":item.name,
        "candidateName": candidate_name1,
        "candidateId":item.candidate?.id,
        "interview_type": item.interview_type,
        "type":type,
        "location": item.location,
        "instructions": item.instructions,
        "time_zone": item.time_zone,
        "duration": item.duration,
        "status": item.status,
         "date":date,
         "time": time,
         "interviewers": item.interviewers,
         "schedules" : item.schedules,
          "created_on" :item.created_on,
          "interviewTitle":item.name,
          "dasyDifference":dasyDifference,
          }
          interviews.push(interview);
        });
          this.vmsData ={ 'interview': interviews };
          this.todaysInterviews = interviews.filter(interview=>{
            let date = new Date();
            this.toDaysDate =this.datefilter.transform(date, 'MM/dd/yyyy');
            //return interview.date === '12/15/2020';
            return interview.date === this.toDaysDate;
          })
          this.tableLoaded = true;
          this.dataLoading = false;
          this.totalRecords = data?.total_records;
          this.itemsPerPage = data?.items_per_page;
          this.gridVewJson = this.vmsData;
      }
    },
    error: (err) => {
      this._alert.error(errorHandler(err));
  }}));
    // this.vmsData = {
    //   "interview": [
    //     {
    //       "candidate": "James Butt",
    //       "id": 12,
    //       "date": "09/24/2020",
    //       "time": "09:30 AM",
    //       "duration": "30 Min",
    //       "type": {
    //         "face_to_face": true,
    //         "audio": false,
    //         "video": false
    //       },
    //       "status": "Completed",
    //       "created":"09/24/2020"
    //     },
    //     {
    //       "candidate": "Josephine Darakjy",
    //       "id": 12,
    //       "date": "09/24/2020",
    //       "time": "09:30 AM",
    //       "duration": "30 Min",
    //       "type": {
    //         "face_to_face": false,
    //         "audio": true,
    //         "video": false
    //       },         
    //       "status": "Scheduled",
    //       "created":"09/24/2020"
    //     },
    //     {
    //       "candidate": "Art Venere",
    //       "id": 12,
    //       "date": "09/24/2020",
    //       "time": "09:30 AM",
    //       "duration": "30 Min",
    //       "type": {
    //         "face_to_face": false,
    //         "audio": false,
    //         "video": true
    //       },         
    //       "status": "Cancelled",
    //       "created":"09/24/2020"
    //     }
    //   ]
    // }
    // this.tableLoaded = true;
    // this.dataLoading = false;
    // this.itemsPerPage = 10;
    // this.totalRecords = 3;
    // this.gridVewJson = this.vmsData;
  }

  onClickView(event) {
    if (event) {
      this._eventStrem.emit(new EmitEvent(Events.VIEW_INTERVIEW_DETAILS, { value: event }));
    }
  }

  onEditClick(e) {}

  selectAllClicked(e) {}
  selectClicked(e) {}
  onSearch(e){}
  onListFilter(e) {}
  rescheduleInterview(e){}

  cancelInterview(event){
  // if (event) {
  //     this._eventStrem.emit(new EmitEvent(Events.WITHDRAW_CANDIDATE,true));
  //   }
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
