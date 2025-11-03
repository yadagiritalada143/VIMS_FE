import { Injectable } from '@angular/core';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of} from 'rxjs';
import { StorageService , StorageKeys } from '../core/services/storage.service';
import { LoaderService } from '../core/components/loader/loader.service';
import { catchError , tap } from 'rxjs/operators';
import { JobDetailsService } from './job-details/job-details.service';

@Injectable({
  providedIn: 'root'
})
export class JobDataResolver implements Resolve<any> {
  constructor(private jobDetailService: JobDetailsService, private storageService: StorageService, private loaderS: LoaderService) {}
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const jobId = route?.params?.id;
    const programId = this.storageService?.get(StorageKeys.CURRENT_PROGRAM)?.id;
    if (jobId && programId) {
      this.loaderS.show();
      return this.jobDetailService.loadJob(jobId).pipe(
        tap(() => {
          this.loaderS.hide();
        }),
        catchError(error => {
          this.loaderS.hide();
          return of({
            error,
            is_error: true
          });
        })
      );
    }
  }
}
