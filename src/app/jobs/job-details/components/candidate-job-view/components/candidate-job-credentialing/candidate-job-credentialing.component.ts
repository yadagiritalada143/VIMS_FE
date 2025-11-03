import { Component, OnInit } from '@angular/core';
import { JobDetailsService } from '../../../../job-details.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ActivatedRoute, } from '@angular/router';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
@Component({
  selector: 'app-candidate-job-credentialing',
  templateUrl: './candidate-job-credentialing.component.html',
  styleUrls: ['./candidate-job-credentialing.component.scss']
})
export class CandidateJobCredentialingComponent implements OnInit {
  statusDropdwon = false;
  selectedIndex: any;
  public programId: any ;
  public jobId: any ;
  public candidate_Id: any;
  public dataLoading= false;
  public isExpand = false;
  tableLoaded = false;
  public selectedTab = 'background';
  public tableConfig: VMSConfig;
  public vmsData: any = [] ;
  public loadingData = true;
  public itemsPerPage = 10;
  public totalRecords = 0;
  baseUrl:any;
  constructor(private jobDetailService: JobDetailsService,    private _alert: AlertService,
    private _loader: LoaderService, public storageService: StorageService,  private route: ActivatedRoute) { }


  ngOnInit(): void {
    this.programId = this.storageService.get('PROGRAM_ID');
    this.baseUrl = '/submission-manager';
    this.route.parent?.params.subscribe(params => {
      this.jobId = params['id'];
      this.candidate_Id = params['candidateId'];
      // this.getCredentialinglist();
    });
  }
  onclickButton(i){
    this.statusDropdwon = true;
    this.selectedIndex = i;
  }
  showTab(tab) {
    this.selectedTab = tab;
  }
  getCredentialinglist(pageNo = 1) {
    this._loader.hide();
    this.dataLoading = true;
    let url = `${this.baseUrl}/programs/${this.programId}/jobs/${this.jobId}/candidates/${this.candidate_Id}/qualifications`
    // let url = `/configurator/programs/${this.programId}/jobs/${this.jobId}/candidates?is_inversed=true&limit=${this.limit}&page=${pageNo}`;
    this.jobDetailService.get(url)
    .subscribe({
     next: (data: any) => {
        if(data && data.qualifications && data.qualifications?.length > 0) {
          data.qualifications.forEach(element => {
             if(element?.is_verified === 'PENDING_APPROVAL') {
                 element.status = 'Pending Approval'
             }
             if(element && element.candidate_data && element.candidate_data?.length > 0) {
                  element.expiration_date = element.candidate_data[0].expiration_date
             }
           });
          this.vmsData = data?.qualifications;
        }
        this.tableLoaded = true;
        this.loadingData = false;
        this.totalRecords = data?.total_records;
        // this.itemsPerPage = data?.items_per_page;
        this._loader.hide();
      },
     error: (err) => {
        this.loadingData = false;
        this._loader.hide();
        this._alert.error(errorHandler(err));
      }
  });
  }
  updateQualification(credential,data) {
      const PayLoad: any = {
        'status': data
      }
      let url = `${this.baseUrl}/programs/${this.programId}/jobs/${this.jobId}/candidates/${this.candidate_Id}/qualifications/${credential?.id}`
      this.jobDetailService.put(url, PayLoad).subscribe({
       next: (data: any) => {
        this._alert.success('Status updated Successfully');
      },
      error: (error) => {
        this._alert.error(errorHandler(error), {});
      }});
  }


}
