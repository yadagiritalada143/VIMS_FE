import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-candidate-screening',
  templateUrl: './candidate-screening.component.html',
  styleUrls: ['./candidate-screening.component.scss']
})
export class CandidateScreeningComponent implements OnInit {
  
  public tab: any;
  constructor (
    private Router: Router,
    private accessControlService: AccessControlService
  ) { }

  ngOnInit(): void {
    this.tab = 0;
  }

  backToSetting() {
    this.Router.navigate([`/settings`])
  }

  showTab(id) {
    if(id >= 0) {
      this.tab = id;
    }
  }

  get isSelfConfiguration() {
    return this.Router.url?.split('/')?.includes('self-configuration');
  }

  get disableDiv() {
    return this.accessControlService.accessControl();
  }

}
