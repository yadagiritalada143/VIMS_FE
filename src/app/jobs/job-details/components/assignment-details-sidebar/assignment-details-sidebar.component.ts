import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AssignmentService } from 'src/app/assignment/assignment.service'; 
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-assignment-details-sidebar',
  templateUrl: './assignment-details-sidebar.component.html',
  styleUrls: ['./assignment-details-sidebar.component.scss']
})
export class AssignmentDetailsSidebarComponent implements OnInit {

  @Input() public set data(data: any) {
    if (data) { 
      this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      this.jobId = this.activatedRoute.snapshot.params['id']; 
      this.assignmentId = data?.assignment_Id;
      this.candidate_id = data?.candidate?.id; 

      this.isSidebarVisible = "visible";
      this.selectedMenu = data['selectedMenu'];
      this.sideBarReferenceData = data?.['details']; 
        this.getAssignmentDetails();  
    }
    else {
      this.isSidebarVisible = "hidden";
    }
  }
  constructor(
    public storageService: StorageService,
    public assignmentService: AssignmentService,
    private activatedRoute: ActivatedRoute, 
    private changeDetectorRef: ChangeDetectorRef,



  ) { }
  assignmentData: any;
  viewProfile: any;
  isSidebarVisible: any
  selectedMenu: any
  sideBarReferenceData: any
  currentProgram: any;
  assignmentId: any;
  assignmentViewData: any;
  candidate_id: any;
  jobId: any;
  dataLoading: boolean = false;
  currencyField = 'INR';
  

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.jobId = this.activatedRoute.snapshot.params['id']; 
    this.assignmentService.getCurrency().subscribe(data => {
      if (data) {
        this.currencyField = data
        this.changeDetectorRef.detectChanges()
      }
    })
  }
  getAssignmentDetails() {
    this.dataLoading = true;
    const programID = this.currentProgram?.id;
    if (programID && this.assignmentId) {
      this.assignmentService.getAssignmentDetails(programID, this.assignmentId).subscribe({
        next: (data: any) => {
        if (data) { 
          this.assignmentViewData = data?.data?.assignments;
          this.dataLoading = false;
        }
        this.dataLoading = false;
      },
      error: (err) => {
        this.dataLoading = false;  
      }});
    } else { 
      let page=1;   
      this.assignmentService.getAssignmentsByJobAndCandidate(page, programID, this.jobId, this.candidate_id).subscribe({
        next: (data: any) => {
        if (data?.data?.assignment) { 
          this.assignmentViewData = data?.data?.assignment[0]; 
          this.dataLoading = false;
        } else{
          this.assignmentViewData = '';
          this.dataLoading = false; 
        }
      },
      error: (err) => {
        // this.tableLoaded=false;
        this.dataLoading=false;
        // this.alert.error(errorHandler(err));
      }});
    }

  }
}
