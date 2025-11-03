import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-submitted-candidate-sidebar',
  templateUrl: './submitted-candidate-sidebar.component.html',
  styleUrls: ['./submitted-candidate-sidebar.component.scss']
})
export class SubmittedCandidateSidebarComponent implements OnInit {
  @Input() submissionData;
  @Input() jobData;
  constructor() { }

  ngOnInit(): void {
  }

}
