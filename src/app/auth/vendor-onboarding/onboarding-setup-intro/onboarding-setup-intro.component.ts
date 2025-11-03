import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-onboarding-setup-intro',
  templateUrl: './onboarding-setup-intro.component.html',
  styleUrls: ['./onboarding-setup-intro.component.scss']
})
export class OnboardingSetupIntroComponent implements OnInit {
  @Output() onNext = new EventEmitter<any>();
  setpassword = false;
  @Input() isValid;
  @Input() userBasicInformation;
  setPassword(event) {
    this.onNext.emit({userBasicInformation:event.userBasicInformation,nextStep:true});
    this.router.navigate(['auth/vendor-onboarding/invite'], { queryParams: { orgId: this.userBasicInformation.orgId, token: this.userBasicInformation.userToken } });
  }

  constructor(private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(
      params => {
        this.userBasicInformation.orgId = params['orgId'];
        this.userBasicInformation.userToken = params['token']
      }
    )
  }


}
