import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-job-detail-sidebar',
  templateUrl: './job-detail-sidebar.component.html',
  styleUrls: ['./job-detail-sidebar.component.scss']
})
export class JobDetailSidebarComponent implements OnInit {
  @Input() jobData;
  @Input() isSubmit;
  @Input() candidateInfo;
  @Input() jobStatus;
  constructor() { }

  ngOnInit(): void {
  }
}
