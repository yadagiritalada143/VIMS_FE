import { Injectable } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { concatMap, map, shareReplay } from 'rxjs/operators';
import { HttpService } from 'src/app/core/services/http.service';

@Injectable({
  providedIn: 'root'
})
export class ReasonCodesService {

  currentProgramId;
  masterListObservable$;
  resoncodesObservablesMap = new Map();
  constructor(private httpClient: HttpService, public storageService: StorageService) {    
    this.currentProgramId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
  }


  codesObservables;
  getResoncodesFor(reasonCode: string, ordering = 'name') {    
    this.currentProgramId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
    if (!this.masterListObservable$) {
      this.masterListObservable$ = this.httpClient.get(`/configurator/programs/${this.currentProgramId}/pages/reason-code-actions?page=1&limit=100`).pipe(
        shareReplay(1)
      );
    }
      const codeSObservable = this.masterListObservable$.pipe(
        concatMap((res: any) => {
          const action_id = res.reason_code_actions.find(a => a.code.toLowerCase() === reasonCode.toLowerCase())?.id;
          return this.httpClient.get(`/configurator/programs/${this.currentProgramId}/pages/reason-code-actions/${action_id}/reason-codes?ordering=${ordering}`)
          .pipe(
            map((res:any) => ({...res, "resonCodeID" : action_id})))
        }),
      ).pipe(
        shareReplay(1)
      );
      this.resoncodesObservablesMap.set(reasonCode, codeSObservable);
      return codeSObservable;
    }
  }
