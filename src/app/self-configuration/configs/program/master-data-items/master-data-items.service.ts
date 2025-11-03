import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subscription, tap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ExpiryMap } from 'src/app/shared/util/expiry-map';

@Injectable({
  providedIn: 'root'
})
export class MasterDataItemsService implements OnDestroy {

  private routeSub: Subscription;
  private dependedFieldNameMap: Map <string, string> = new ExpiryMap <string, string>(12000);
  private customFieldNameMap: Map <string, string> = new ExpiryMap <string, string>(12000);

  constructor(
    private storage: StorageService,
    private alert: AlertService,
    private programService: ProgramService,
  ) { }

  public getDependedFieldName(id: string) {
    if(!this.dependedFieldNameMap.has(id)) {
      this.dependedFieldNameMap.set(id, null);
      this.masterFieldDetail(id).subscribe({ error: (err) => this.errorTriggered(err) });
      return null;
    }

    return this.dependedFieldNameMap.get(id);
  }

  public getCustomFieldName(id: string) {
    if(!this.customFieldNameMap.has(id)) {
      this.customFieldNameMap.set(id, null);
      this.customFieldDetail(id).subscribe({ error: (err) => this.errorTriggered(err) });
      return null;
    }

    return this.customFieldNameMap.get(id);
  }

  public masterFieldDetail(id: string): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/foundational-data-types/${id}`;
    return this.programService.get(url).pipe(
      tap((res: any) => {
        if('foundational_data_type' in res) {
          res = res?.foundational_data_type;
        }

        this.dependedFieldNameMap.set(id, res?.name || '--');
      })
    );
  }

  public customFieldDetail(id: string): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/custom-fields/${id}`;
    return this.programService.get(url).pipe(
      tap((res: any) => {
        if('custom_field' in res) {
          res = res?.custom_field;
        }

        this.customFieldNameMap.set(id, res?.name || '--');
      })
    );
  }

  private errorTriggered(err: any) {
    console.error(err);
    this.alert.error(errorHandler(err));
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  get programId(): string {
    return this.storage.get(StorageKeys.PROGRAM_ID);
  }
}

