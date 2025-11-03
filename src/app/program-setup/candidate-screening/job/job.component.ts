import { Component } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss']
})
export class JobComponent {

  constructor(
    private storage: StorageService,
    private httpService: HttpService,
    private alert: AlertService
  ) { }

  toggleJobReview(flag: boolean) {

    const url: string = `/configurator/programs/${this.programId}/update_config`;
    let payLoad: any = [{
      'pending_job_review': flag
    }];

    this.httpService.put(url, payLoad).subscribe({
      next: (res: any) => {
        if (res) {
          this.alert.success('Settings updated successfully.');
          let program: any = this.storage.get(StorageKeys.CURRENT_PROGRAM);
          program.config.pending_job_review = flag;
          this.storage.set(StorageKeys.CURRENT_PROGRAM, program, true);
        }
      }, error: (err: Error | any) => {
        this.alert.error(errorHandler(err));
      }
    });
  }

  get jobReview() {
    return this.storage.get(StorageKeys.CURRENT_PROGRAM)?.config?.pending_job_review ?? false;
  }

  get programId() {
    return this.storage.get(StorageKeys.PROGRAM_ID);
  }
}
