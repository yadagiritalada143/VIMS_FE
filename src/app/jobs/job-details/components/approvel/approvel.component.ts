import { Component, OnInit } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { JobDetailsService } from '../../job-details.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-approvel',
  templateUrl: './approvel.component.html',
  styleUrls: ['./approvel.component.scss']
})
export class ApprovelComponent implements OnInit {
  public approvalList: any = [];
  public user: any;
  public param = '';


  constructor(private eventStream: EventStreamService,
    private jobService: JobDetailsService,
    private alertService: AlertService,
    private route: ActivatedRoute,) { }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user'));
    let jobid = this.route.snapshot.params['id'];
    this.param = jobid;
    this.getJobDetails(jobid);
  }
  getJobDetails(jobid) {
    if (jobid) {
      this.jobService.getJobs(`${jobid}`).subscribe(data => {
        if (data.data) {
          this.approvalList = data.data[0];
          function compare(a, b) {
            const A = a.sequence_number;
            const B = b.sequence_number;
            let comparison = 0;
            if (A > B) {
              comparison = 1;
            } else if (A < B) {
              comparison = -1;
            }
            return comparison;
          }
          this.approvalList?.approverlist.sort(compare);
        }
      }, (err) => {
        this.alertService.error(errorHandler(err));
      });
    }
  }
}
