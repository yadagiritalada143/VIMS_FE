import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';


@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  programID: any;
  payload: any = {};
  currentProgram: any;
  isOnboardingReview:any;

  constructor(
    private alert: AlertService,
    private httpService: HttpService,
    private storageService: StorageService,
  ) { }

 
    ngOnInit(): void {
      this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      this.programID = this.currentProgram.id;
      this.isOnboardingReview = this.currentProgram.config?.is_onboarding_review_required;
    }
  onboardingReview(event) {
    let dataPayload=[];
    dataPayload.push({is_onboarding_review_required: event});
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res:any) => {
      if (res) {
        this.currentProgram.config.is_onboarding_review_required = event;
        this.storageService.set("CurrentProgram", this.currentProgram, true);
        this.alert.success('Settings updated successfully.');
      }
    })

  }
}
