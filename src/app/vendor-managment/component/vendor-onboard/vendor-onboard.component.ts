import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramSetupService } from 'src/app/program-setup/program-setup.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-vendor-onboard',
  templateUrl: './vendor-onboard.component.html',
  styleUrls: ['./vendor-onboard.component.scss']
})
export class VendorOnboardComponent implements OnInit {
  @Input() programDetail;
  @Output() onSubmit = new EventEmitter();
  acceptTermAndCondition = false;
  vendorId;
  programId;
  constructor(private route: ActivatedRoute,
    private programService: ProgramSetupService,
    private storageService: StorageService,
    private alertService: AlertService,
    private router: Router) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(param => {
      this.vendorId = param.get('org_id') || this.storageService.get('ORG_ID');
      this.programId = param.get('program_id') || this.storageService.get('PROGRAM_ID');
    })
  }

  submit() {
    // const onboardingHttp = this.programService.put(`/configurator/programs/${this.programId}/vendors/${this.vendorId}`, { "is_onboarded": true })
    const onboardingDoneHttp = this.programService.put(`/configurator/programs/${this.programId}/vendors/${this.vendorId}/sign-msa`, { "is_signed": true });
    forkJoin([onboardingDoneHttp])
      .subscribe({
        next: (res: any) => {
          this.alertService.success('Successfully done');
          this.onSubmit.emit(true);

        }, error: (err: Error | any) => {
          this.alertService.warn(errorHandler(err));
          this.onSubmit.emit(true);
          this.router.navigate(['dashboard']);
        }
      }
    )
  }
}
