import { Injectable } from '@angular/core';
import { Subject, map } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';

@Injectable({
  providedIn: 'root',
})
export class TaxAdjustmentService {
  programId: any;
  moduleId: any;
  eventId: any;
  eventSlug: any;
  subject = new Subject();
  ruleApiPayload: any;

  constructor(private userService: UserService, private storageService: StorageService) {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  getModuleId() {
    const url = `/rule-engine/programs/${this.programId}/modules`;
    this.userService.get(url).subscribe(res => {
      if (res) {
        this.moduleId = res['modules']?.filter(grps => grps?.name?.trim().toLowerCase() === 'configurator')?.[0]?.moduleId;
        this.getDefaultTax();
      }
    });
  }

  getDefaultTax() {
    const payload ={
      "eventSlug": "CONFIGURATOR_TAX",
      "programId": this.programId,
      "moduleId":  this.moduleId,
      "payload": JSON.stringify(this.ruleApiPayload)
    }
    const url = `/rule-engine/rule-consumption-api`;
    this.userService.post(url, payload).subscribe(res => {
      if (res) {
        let data = res;
        this.subject.next(typeof data === 'object' && Object.keys(data).length > 0 ? data : null);
      }
    });
  }

  getRulesEngineTaxData(payload) {
    this.ruleApiPayload = payload;
    this.getModuleId();
  }

  getTaxDataPicklist() {
    let url = `/configurator/programs/${this.programId}/pick-lists/exact?picklist_name=Tax Type&defined_by=PREDEFINED`;

    return this.userService.get(url).pipe(
      map(res => {
        if (res) {
          let data = res['picklist_item'];
          return Array.isArray(data) && data.length > 0 ? data : null;
        }
      }),
    );
  }
}
