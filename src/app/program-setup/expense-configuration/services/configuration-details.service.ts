import { Injectable } from '@angular/core';
import { ProgramSetupService } from '../../program-setup.service';
import { map } from 'rxjs/internal/operators/map';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationDetailsService {

  constructor(
    private programSetupService: ProgramSetupService,
  ) {
  }

  public getDetailExpenseConfig(configId: string, programId: string) {
    return this.programSetupService.get(`/expense/programs/${programId}/config-expense` + (configId ? `/${configId}` : ''))
      .pipe(map((res:any) => configId ? res.data : res.data.configuration[0] ));
  }
}
