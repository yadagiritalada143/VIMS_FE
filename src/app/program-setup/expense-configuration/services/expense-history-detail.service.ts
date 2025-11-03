import { Injectable } from '@angular/core';
import { ProgramSetupService } from '../../program-setup.service';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { map } from 'rxjs/internal/operators/map';

@Injectable({
  providedIn: 'root'
})
export class ExpenseHistoryDetailService {
  private programId: string;

  constructor(private programSetupService: ProgramSetupService, private storageService: StorageService) {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM).id;
  }

  public getExpenseHistoryDetails(historyLogId: string) {
    return this.programSetupService.get(`/expense/programs/${this.programId}/history/${historyLogId}`).pipe(map((res:any) => res.data));
  }
}
