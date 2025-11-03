import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';

@Injectable({
  providedIn: 'any'
})
export class RateFactorService {

  constructor (
    private storage: StorageService,
    private programService: ProgramService
  ) { }

  public jobTemplateMap: Map <string, string> = new Map <string, string> ();
  public hierarchyMap: Map <string, string> = new Map <string, string> ();

  fetchJobTemplate(id: string): Observable <any> {
    if(!id)
      return;
    const programId = this.storage.get(StorageKeys.PROGRAM_ID);
    const url = `/job-manager/programs/${programId}/job-templates/${id}`;
    return this.programService.get(url);
  }

  getRateFactorDetails(id: string): Observable <any> {
    const programId = this.storage.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/rate-factors/${id}`;
    return this.programService.get(url);
  }

  getAllRateFactors(): Observable <any> {
    const programId = this.storage.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/rate-factors/order`;
    return this.programService.get(url);
  }

  reOrderRateFactor(payload: object): Observable <any> {
    const programId = this.storage.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/rate-factors/order`;
    return this.programService.put(url, payload);
  }

}
