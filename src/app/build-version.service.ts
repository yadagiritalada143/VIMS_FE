import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, timer, Subscription } from 'rxjs';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { StorageKeys, StorageService } from './core/services/storage.service';

@Injectable({ providedIn: 'root' })
export class BuildVersionService {
  private buildIsUpToDateSubject = new BehaviorSubject<boolean>(true);
  versionCheckSubs$: Subscription;

  constructor(private httpClient: HttpClient, private storageService: StorageService) {
    if (this.versionCheckSubs$) {
      this.versionCheckSubs$.unsubscribe();
    }
    this.pollForBuildNumber();
  }

  public get buildIsUpToDate(): Observable<boolean> {
    return this.buildIsUpToDateSubject;
  }

  checkAndUpdateClientVersion = (): void => {
    const httpOptions = {
      headers: new HttpHeaders({
        'Cache-Control': 'no-cache',
      }),
    };
    this.httpClient.get<any>('appsetting.json', httpOptions).subscribe(response => {
      const version = this.storageService.getSession(StorageKeys.VERISON);
      this.storageService.setSession(StorageKeys.VERISON, response?.version, true);
      if (version && version !== response?.version) {
        window.location.reload();
      }
    });
  };

  private pollForBuildNumber() {
    // 1 hour polling to check version update
    const pollHourInterval = 60 * 60 * 1000;
    this.versionCheckSubs$ = timer(pollHourInterval, pollHourInterval).subscribe(() => {
      this.checkAndUpdateClientVersion();
    });
  }
}
