import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AssignmentService } from '../assignment.service';
import { Tax } from '../assignment.model'
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/core/services/http.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Subscription } from 'rxjs';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from '../enums/accuracy-config';


@Component({
  selector: 'app-create-assignment',
  templateUrl: './create-assignment.component.html',
  styleUrls: ['./create-assignment.component.scss']
})
export class CreateAssignmentComponent implements OnInit {
  public timeSheet;
  public status;
  public toggleDisable = {
    value: true
  };
  public toggle = {
    title: 'OT Exempt',
    value: true
  };
  programDetails: any;
  programId: string;
  formData: any = {};
  configLink: any;
  config: any;
  candidateData: any;
  vendorData: any;

  workInformExpand = false;
  expenseExpand = false;
  billableExpand = false;
  feeExapand = false;

  isCreateCandidate = 'hidden';
  is_approval_workflow = false;
  is_account_required = true;

  openSuccessModal = false
  openPublishModal = false
  temp: any;
  newAssignmentId: string;
  notes_for_approver = ''
  candidateId: string;
  createAssignmentSubscription: Subscription;
  isSaveLoader: boolean;
  accuracyConfig = AccuracyConfigEnum;
  @ViewChild('publishModal', { read: ElementRef, static: false }) publishModal: ElementRef;

  constructor(private _assignmentService: AssignmentService,
    private storageService: StorageService,
    private httpService: HttpService,
    private router: Router,
    private _alert: AlertService,
    private accuracyPipe: AccuracyPipe,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.programDetails['id'];
    this.configLink = `/assignment/programs/${this.programId}/config`
    this.getRateFactor();
    this._assignmentService.getConfigJson(this.configLink).subscribe((data: any) => {
      if (data) {
        this.config = data.data.form_config
      }
    })
  }
  onClickToggleDisable() {
    if (this.toggleDisable.value) {
      this.toggleDisable.value = false;
    } else {
      this.toggleDisable.value = true;
    }
  }
  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
    } else {
      this.toggle.value = true;
    }
  }

  onClickCreateBtn(event) {
    this.isCreateCandidate = 'visible';
  }

  onReviewClick(event) {
    this.changeDetectorRef.detectChanges()
  }

  deepSearchItems(object, key, predicate) {
    let ret = [];
    if (object.hasOwnProperty(key) && predicate(key, object[key]) === true) {
      ret = [...ret, object];
    }
    if (Object.keys(object).length) {
      for (let i = 0; i < Object.keys(object).length; i++) {
        let value = object[Object.keys(object)[i]];
        if (typeof value === "object" && value != null) {
          let o = this.deepSearchItems(object[Object.keys(object)[i]], key, predicate);
          if (o != null && o instanceof Array) {
            ret = [...ret, ...o];
          }
        }
      }
    }
    return ret;
  }

  rateFactor: any[] = ['st'];
  rateFactorAbbrivation: Map<string, string> = new Map([["st", "st"]]);
  getRateFactor() {
    // this.candidateData.vendor?.id
    let url = `/configurator/programs/${this.programId}/rate-factors?is_enabled=True`;

    this.httpService.get(url)
      .subscribe((res: any) => {
        const { rate_factors } = res;
        if (rate_factors) {
          rate_factors.forEach(element => {
            const name = element?.name?.toLowerCase();
            const abbreviation = element?.abbreviation?.toLowerCase();
            this.rateFactor.push(element?.name?.toLowerCase());
            this.rateFactorAbbrivation.set(name, abbreviation);
          });
        }
      })

  }

  onSubmit(event) {
    if (event['hierarchy_id']) {
      event['hierarchy_id'] = event['hierarchy_id'][0];
    }
    const customObject = this.deepSearchItems(this.config, 'source', (k, v) => v === 'CUSTOM');
    let foundational = [];
    let customData = [];
    if (customObject?.length > 0) {
      customObject?.forEach(custom => {
        if (custom?.slug) {
          let object = { key: custom.slug, value: event[custom?.slug] };
          if (custom?.source_type === 'foundational') {
            foundational.push(object);
          } else {
            customData.push(object);
          }
        }
      });
    }
    this.temp = {
      ...event,
      "foundational": foundational,
      "custom": customData,
      "assignment_title": this.getFieldValue('assignment_title_uuid', event['assignment_title_uuid']),
      "tax": this.getDataById('taxes', event),
      "fee": this.getDataById('fees', event),
      "tax_type": "adjustment",
      "is_approval_workflow": this.is_approval_workflow,
      "notes_for_approver": this.notes_for_approver
    }
    let rates = []
    for (let index = 0; index < this.rateFactor.length; index++) {
      let element = this.rateFactor[index];
      const rateFactorObj = {
        rate_factor: this.rateFactorAbbrivation.get(element)
      };
      if (element !== 'st') {
        if (this.temp.hasOwnProperty(`${element}_billrate`)) {
          rateFactorObj['billrate'] = this.accuracyPipe.transform(this.temp[`${element}_billrate`], this.accuracyConfig.rate, { isEdit: true});
          rateFactorObj['payrate'] =  this.accuracyPipe.transform(this.temp[`${element}_payrate`], this.accuracyConfig.rate, { isEdit: true});
          rateFactorObj['vendor_rate'] = this.accuracyPipe.transform(this.temp[`${element}_vendor_rate`], this.accuracyConfig.rate, { isEdit: true});
          rates.push(rateFactorObj);
        }
      } else if (element === 'st') {
        rateFactorObj['billrate'] = this.accuracyPipe.transform(this.temp['regular_billrate'], this.accuracyConfig.rate, { isEdit: true});
        rateFactorObj['payrate'] = this.accuracyPipe.transform(this.temp['regular_payrate'], this.accuracyConfig.rate, { isEdit: true});
        rateFactorObj['vendor_rate'] = this.accuracyPipe.transform(this.temp['regular_vendor_rate'], this.accuracyConfig.rate, { isEdit: true});
        rates.push(rateFactorObj);
      }

    }

    this.temp['rate'] =[ { rates }];
    this.onSave()
  }

  getDataById(id: string, data) {
    for (let tab of this.config?.config?.nav_tabs) {
      for (let group of tab.field_groups) {
        for (let field of group.fields) {
          if (field.group_type) {
            if ((field.group_type === "TABLE") || (field.group_type === "DISPLAY_TABLE")) {
              if (group?.id === id) {
                let temp: Tax[] = [];
                for (let { index } of field?.row.map((row, index) => ({ index, row }))) {
                  let tempData: Tax = {}
                  for (let col of field?.fields[index]) {
                    if (col?.id === 'types') {
                      tempData.amount_type = this.getValuekey(col?.slug, data)
                    } else if (col?.id === 'value') {
                      tempData.amount_value = this.getValuekey(col?.slug, data);
                      tempData.entity_name = col?.slug;
                    } else if (col?.id === 'applicable_on') {
                      tempData.applicable_on = this.getValuekey(col?.slug, data)
                    }
                  }
                  temp.push(tempData)
                }
                return temp;
              }
            }
          } else {
          }
        }
      }
    }
  }

  onSave() {
    this.isSaveLoader = true;
    if (this.createAssignmentSubscription) {
      this.createAssignmentSubscription.unsubscribe()
    }
    this.createAssignmentSubscription = this._assignmentService.createAssignment(this.programId, this.temp).subscribe({
      next: data => {
        if (data?.code === 200) {
          this.isSaveLoader = false;
          this.newAssignmentId = data.data.assignment_id
          this._alert.success('Assignment has been created successfully.')
          this.goToAssgnmentList()
        }
      },
      error: err => {
        this.isSaveLoader = false;
        this._alert.error(errorHandler(err), { type: { INTERVAL_TIME: 5000 } })
      }
    })
  }

  getFieldValue(slug, value) {
    for (let i = 0; i < this.storageService.get(slug).length; i++) {
      let data = this.storageService.get(slug)[i];
      if (data?.id === value) {
        return data?.template_name
      }
    }
  }

  goToAssgnmentList() {
    this.router.navigate([`/assignment/details/${this.newAssignmentId}/final`], { queryParams: { tab: 'assignment' } });
  }

  onBackClick(event) {
    if (event) {
      this.router.navigateByUrl('/assignment/list');
    }
  }

  getFieldData(slug, value) {
    for (let i = 0; i < this.config?.config?.nav_tabs.length; i++) {
      let tab = this.config?.config?.nav_tabs[i]
      for (let j = 0; j < tab?.field_groups?.length; j++) {
        let card = tab?.field_groups[j]
        for (let l = 0; l < card?.fields?.length; l++) {
          let element = card?.fields[l]
          if (element.group_type) {
            if (element.group_type === "ARRAY" || element.group_type === 'FOOTER_ARRAY') {
              for (let k = 0; k < element?.fields?.length; k++) {
                let arrayField = element?.fields[k]
                if (arrayField?.slug === slug) {
                  if ((arrayField?.type === 'DROPDOWN') || (arrayField?.type === 'MULTIDROPDOWN') || (arrayField?.type === 'PERSON_DROPDOWN') || (arrayField?.type === 'CANDIDATE_DROPDOWN') || (arrayField?.type === 'PERSON_MULTIDROPDOWN') || (arrayField?.type === 'VENDOR_DROPDOWN')) {
                    if (arrayField?.datasource?.type === 'url') {
                      const apiData = this.storageService.get(arrayField?.slug)
                      for (let p = 0; p < apiData?.length; p++) {
                        let a = apiData[p]
                        if (a[arrayField?.bind_value] === value) {
                          return this.getValuekey(arrayField?.bind_label, a)
                        }
                      }
                    } else if (arrayField?.datasource?.type === 'picklist') {
                      for (let p = 0; p < arrayField?.datasource?.options?.length; p++) {
                        let a = arrayField?.datasource?.options[p]
                        if (a[arrayField?.bind_value] === value) {
                          return a[arrayField?.bind_label]
                        }
                      }
                    }
                  } else {
                    return value
                  }
                }
              }
            } else if ((element.group_type === "TABLE") || (element.group_type === "DISPLAY_TABLE")) {
              for (let k = 0; k < element?.fields?.length; k++) {
                let tableRow = element?.fields[k]
                for (let m = 0; m < tableRow?.length; m++) {
                  let tableField = tableRow[m]
                  if (tableField?.slug === slug) {
                    if ((tableField?.type === 'DROPDOWN') || (tableField?.type === 'MULTIDROPDOWN') || (tableField?.type === 'PERSON_DROPDOWN') || (tableField?.type === 'CANDIDATE_DROPDOWN') || (tableField?.type === 'PERSON_MULTIDROPDOWN') || (tableField?.type === 'VENDOR_DROPDOWN')) {
                      if (tableField?.datasource?.type === 'url') {
                        const apiData = this.storageService.get(tableField?.slug)
                        for (let p = 0; p < apiData.length; p++) {
                          let a = apiData[p]
                          if (a[tableField?.bind_value] === value) {
                            return this.getValuekey(tableField?.bind_label, a)
                          }
                        }
                      } else if (tableField?.datasource?.type === 'picklist') {
                        for (let p = 0; p < tableField?.datasource?.options?.length; p++) {
                          let a = tableField?.datasource?.options[p]
                          if (a[tableField?.bind_value] === value) {
                            return a[tableField?.bind_label]
                          }
                        }
                      }
                    } else {
                      return value
                    }
                  }
                }
              }
            }
          } else {
            if (element?.slug === slug) {
              if ((element?.type === 'DROPDOWN') || (element?.type === 'MULTIDROPDOWN') || (element?.type === 'PERSON_DROPDOWN') || (element?.type === 'CANDIDATE_DROPDOWN') || (element?.type === 'PERSON_MULTIDROPDOWN') || (element?.type === 'VENDOR_DROPDOWN')) {
                if (element?.datasource?.type === 'url') {
                  const apiData = this.storageService.get(element?.slug)
                  for (let p = 0; p < apiData.length; p++) {
                    let a = apiData[p]
                    if (a[element?.bind_value] === value) {
                      return this.getValuekey(element?.bind_label, a)
                    }
                  }
                } else if (element?.datasource?.type === 'picklist') {
                  for (let p = 0; p < element?.datasource?.options?.length; p++) {
                    let a = element?.datasource?.options[p]
                    if (a[element?.bind_value] === value) {
                      return a[element?.bind_label]
                    }
                  }
                }
              } else {
                return value
              }
            }
          }
        }
      }
    }
  }

  getValuekey(key: string, data) {
    let keys = key.split('.')
    if (keys.length > 1) {
      keys.forEach(k => {
        data = data[k]
      })
    } else {
      data = data[key]
    }
    return data
  }

  sidebarClose(event) {
    if (event) {
      this.candidateId = event
    }
    this.isCreateCandidate = 'hidden';
  }
  onCandidateView(event) {
    window.open(`/candidates/view/${event}`)
  }
}
