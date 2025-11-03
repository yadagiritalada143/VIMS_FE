import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Subscription ,Subject } from 'rxjs';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UpdateFormRenderModel } from '../../form-renderer.model';
import { FormRendererService } from '../../form-renderer.service';
import { throttleTime ,takeUntil , distinctUntilChanged} from 'rxjs/operators';
@Component({
  selector: 'app-field-handler',
  templateUrl: './field-handler.component.html',
  styleUrls: ['./field-handler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldHandlerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @Input() field;
  @Input() renderForm: UntypedFormGroup;
  @Input() is_continue = false;
  @Input() is_update = false
  @Input() updateConfig: UpdateFormRenderModel[];
  @Input() updateValue: any;
  @Input() errorMassage: any;
  @Input() candidateId: string;
  @Input() dateFieldDisable = [];
  @Input() jobId: string;

  @Output() onClickHierarchy = new EventEmitter();
  @Output() onDataChange = new EventEmitter();
  @Output() onClickCandidateView = new EventEmitter();
  @Output() onClickVendorView = new EventEmitter();
  @Output() onBtnClick = new EventEmitter();
  @Output() selectedHierarchy = new EventEmitter();

  public destroy$: Subject<boolean> = new Subject<boolean>();
  searchSubscription: Subscription;
  hierarchyNameSubscription: Subscription;
  currencySubscription: Subscription;

  url: string = ''
  selectedHierarchyName: string = ''
  dropDownList = []
  isLoading = false;
  programId = ''
  is_selected = false
  dateValue  :any = ''

  selectedDta: any = {}
  items = [
    { label: "Yes", value: true },
    { label: "No", value: false }
  ];

  currencySym = '₹'
  currencyData = [
    { key: 'usd', value: '$' },
    { key: 'inr', value: '₹' },
    { key: 'eur', value: '€' }
  ]

  country = { 'US': 'USA', 'CA': 'Canada', 'IN': 'India', 'USA': 'USA', 'CAD': 'Canada', 'IND': 'India' }
  selectedCandidate;
  assignmentManagerId: string = '';
  assignmentManagerName: string = '';
  currentFieldValue: any;

  constructor(private _formRendererService: FormRendererService,
    private _storageService: StorageService,
    private changeDetectorRef: ChangeDetectorRef, private eventStream: EventStreamService) {
    if (this.currencySubscription) {
      this.currencySubscription.unsubscribe()
    }
    this.currencySubscription = this._formRendererService.getCurrencySymbol().subscribe(data => {
      this.currencySym = data;
    })
  }

  ngOnInit(): void {
    // this.url = this.field?.datasource?.url; // remove if works from on change
    let programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetails) {
      this.programId = programDetails['id'];
    }
    if (!this.is_update) {
      let user_type = this._storageService.get('user_type')
      if (user_type === 'CLIENT') {
        let account = this._storageService.get('account')
        if (account) {
          this.assignmentManagerId = account?.id
          this.assignmentManagerName = account?.full_name
          // this.renderForm?.controls['assignment_manager']?.setValue(this.assignmentManagerId, { emitEvent: true });
        }
      }
    }
    this.eventStream.on(Events.UPDATE_DROPDOWN_VALUES).pipe(distinctUntilChanged(),throttleTime(500),takeUntil(this.destroy$)).subscribe((data) => {
      if (data?.slug === this.field?.slug) {
        this.getDropDownData(data?.slug);
        this.dropDownList = Array.isArray(this._storageService.get(data?.slug)) ? [...this._storageService.get(data?.slug)] : [];
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.currentFieldValue =  changes?.field?.currentValue?.slug;
    if (changes?.field?.currentValue?.slug?.toLowerCase() !== changes?.field?.previousValue?.slug?.toLowerCase()) {
      if (changes?.field?.currentValue?.slug?.toLowerCase() === 'assignment_manager') {
        this.renderForm.controls[changes?.field?.currentValue?.slug].setValue(null, { emitEvent: true })
      } else if (changes?.field?.currentValue?.slug?.toLowerCase() === 'end_date') {
        this.renderForm.controls[changes?.field?.currentValue?.slug].setValue('', { emitEvent: true })
      }
      if(!changes?.field?.firstChange) {
        this.ngAfterViewInit(true);
      }
    }
    this.dropDownList = []
    this.isLoading = false;
    this.is_selected = false
    this.dateValue = ''
    this.selectedDta = {}
    this.url = this.field?.datasource?.url;
    if ((this._storageService.get(this.field?.slug) !== undefined) && (this._storageService.get(this.field?.slug) !== null)) {
      this.dropDownList = this._storageService.get(this.field?.slug)
      if (this.field.slug === 'assignment_title_uuid') {
        this.dropDownList = [...this.dropDownList];
      }
    }
    if (this.field?.type === 'HIERARCHY') {
      if (this.hierarchyNameSubscription) {
        this.hierarchyNameSubscription.unsubscribe()
      }
      this.hierarchyNameSubscription = this._formRendererService.getHierarchyName().subscribe(data => {
        this.selectedHierarchyName = data
        this.changeDetectorRef.detectChanges()
      })
      if (this.renderForm.get(this.field?.slug).value) {
        this.selectedHierarchy.emit(this.renderForm.get(this.field?.slug).value)
      }
    } else if (this.field?.type === 'CANDIDATE_DROPDOWN') {
      if (this.candidateId) {
        this.selectedCandidate = this.candidateId
        let tempCandidateList = this._storageService.get(this.field?.slug)
        this.dropDownList = tempCandidateList
      }
      this.onSelect(this.renderForm.get(this.field?.slug).value, false, true)
    } else if (this.field?.type === 'VENDOR_DROPDOWN') {
      this.onSelect(this.renderForm.get(this.field?.slug).value)
    } else if (this.field?.type === 'CURRENCY') {

      this.field?.meta_data?.rules.forEach(element => {
        if (element?.condition === 'currency') {
          this.currencyData.forEach(c => {
            if (c.key === this.renderForm.get(element?.name).value) {
              this._formRendererService.setCurrencySymbol(c.value)
              this._formRendererService.setCurrency((c.key).toUpperCase())
            }
          })
        }
      });
    }
  }

  ngAfterViewInit(changeDetected?) {
    let slug = changeDetected ? this.currentFieldValue : this.field?.slug;
    this.renderForm.get(slug)?.valueChanges
    .pipe(
      distinctUntilChanged(),
      throttleTime(500),
      takeUntil(this.destroy$)
    )
    .subscribe(value => {
      if(value) {
      if (this.field?.type === 'DATE') {
        this.dateValue = value instanceof Date && !isNaN(Number(value)) ? value : '' ;
      } else if (this.field?.type === 'DROPDOWN') {
        this.currencyData.forEach(c => {
          if (c.key === value) {
            this._formRendererService.setCurrencySymbol(c.value)
            this._formRendererService.setCurrency((c.key).toUpperCase())
          }
        })
      }
      else if (this.field?.type === 'MULTIDROPDOWN') {
        this.currencyData.forEach(c => {
          if (c.key === value) {
            this._formRendererService.setCurrencySymbol(c.value)
            this._formRendererService.setCurrency((c.key).toUpperCase())
          }
        })
      } else if (this.field?.type === 'VENDOR_DROPDOWN') {
        if (this.renderForm.get(this.field?.slug).value) {
          this.dropDownList = this._storageService.get(this.field?.slug)
          this.onSelect(this.renderForm.get(this.field?.slug).value)
          this.is_selected = true
        }
      }
      this.onDataChange.emit({ value, slug: slug });
      this.changeDetectorRef.detectChanges();
    }
    })


    // let fieldValue = this.renderForm.get(this.field?.slug).value
    // if ((fieldValue === null) || (fieldValue === undefined) || this.is_update) {
    this.getDropDownData({ term: '' })
    // }

    if ((this.field?.datasource?.type !== 'url') && (this.field?.datasource?.options?.length === 1)) {
      this.renderForm.controls[this.field?.slug].setValue(this.field?.datasource?.options[0][this.field?.bind_value])
    }

    this.setDataToDropDown()
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  setDataToDropDown() {
    this.renderForm.valueChanges.subscribe(value => {
      if (this.field?.meta_data?.rules?.length > 0) {
        this.field?.meta_data?.rules?.forEach(rule => {
          if (rule?.condition === 'set_value') {
            if ((rule?.slug in value) && (value[rule?.slug] !== null)) {
              const ruleSlugData = this._storageService.get(rule?.slug)
              if (ruleSlugData) {
                let result = this.getDataByKey(ruleSlugData, rule?.slug_value, value[rule?.slug])
                let id = this.getDataByKeyArray(result, rule?.value_get_by)
                if ((this.field?.type === 'DROPDOWN') || (this.field?.type === 'MULTIDROPDOWN') || (this.field?.type === 'PERSON_DROPDOWN') || (this.field?.type === 'CANDIDATE_DROPDOWN') || (this.field?.type === 'VENDOR_DROPDOWN') || (this.field?.type === 'HUMAN_DROPDOWN') || (this.field?.type === 'JOB_DROPDOWN')) {
                  let label = this.getDataByKeyArray(result, rule?.label_get_by)
                  if (!this.dropDownList.some(e => e[this.field?.bind_value] === id) && id && label) {
                    this.dropDownList.push({ [this.field?.bind_value]: id, [this.field?.bind_label]: label })
                    this._storageService.set(this.field?.slug, this.dropDownList)
                    this.changeDetectorRef.detectChanges();
                  }
                }
              }
            }
          }
        });
      }
    })
  }

  getDataByKey(updateData, key: string, value: string) {
    if (updateData.hasOwnProperty(key) && updateData[key] === value) {
      return updateData;
    } else {
      for (let i = 0; i < Object.keys(updateData).length; i++) {
        let data = updateData[Object.keys(updateData)[i]];
        if (typeof data === "object" && data !== null) {
          let result = this.getDataByKey(data, key, value);
          if (result) return result;
        }
      }
    }
  }

  getDataByKeyArray(data, keyArray) {
    if (data) {
      for (let key of keyArray) {
        data = data[key]
      }
      return data
    }
  }

  onClickhierarchy() {
    if (this.is_update && !this.field?.is_update_allow) {
      return;
    }
    this.onClickHierarchy.emit()
  }

  getDropDownData(event) {
    if ((this.url !== '') && (this.url !== undefined) && ((this.field?.type === 'DROPDOWN') || (this.field?.type === 'MULTIDROPDOWN') || (this.field?.type === 'PERSON_DROPDOWN') || (this.field?.type === 'CANDIDATE_DROPDOWN') || (this.field?.type === 'VENDOR_DROPDOWN') || (this.field?.type === 'HUMAN_DROPDOWN') || (this.field?.type === 'JOB_DROPDOWN'))) {
      this.isLoading = true
      this.url = this.url.replace('${programId}', this.programId)
      if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
        this.dropDownList = [];
      }
      this.searchSubscription = this._formRendererService.get(this.url + (event?.term ? event?.term : '')).subscribe((data: any[]) => {
        if (data) {
          this.field?.datasource?.getBy.forEach(d => {
            data = data[d]
          });
          if (this.renderForm.get(this.field?.slug)?.value) {
            const selectedId = this.renderForm.get(this.field?.slug)?.value;
            const selectedValue = (this.dropDownList && Array.isArray(this.dropDownList)) ? this.dropDownList?.find(d => d[this.field?.bind_value] === selectedId) : null;
            if (selectedValue)
              data.push(selectedValue);
          }
          this.dropDownList = data
          if (this.is_update) {
            if ((this.field?.type === 'DROPDOWN') || (this.field?.type === 'MULTIDROPDOWN') || (this.field?.type === 'PERSON_DROPDOWN') || (this.field?.type === 'CANDIDATE_DROPDOWN') || (this.field?.type === 'VENDOR_DROPDOWN') || (this.field?.type === 'HUMAN_DROPDOWN') || (this.field?.type === 'JOB_DROPDOWN')) {
              const fieldData = this.updateConfig.find(a => a.fieldName === this.field?.slug)
              if (this.field?.type === 'MULTIDROPDOWN') {
                fieldData?.value?.forEach((element, index) => {
                  if ((this.dropDownList.findIndex(a => a[this.field?.bind_value] === element) === -1)) {
                    this.dropDownList.push({
                      [this.field?.bind_value]: element,
                      [this.field?.bind_label]: fieldData?.label[index]
                    })
                  }
                });
              } else {
                if ((this.dropDownList.findIndex(a => a[this.field?.bind_value] === fieldData?.value) === -1)) {
                  this.dropDownList.push({ [this.field?.bind_value]: fieldData.value, [this.field?.bind_label]: fieldData.label ? fieldData.label : fieldData.value })
                }
              }
              this._storageService.set(this.field?.slug, this.dropDownList)
            }
          } else {
            // if ((this.field?.slug === 'assignment_manager') || (this.field?.slug === 'timesheet_manager')) {
            //   if ((this.dropDownList.findIndex(a => a[this.field?.bind_value] === this.assignmentManagerId) === -1) && this.assignmentManagerId) {
            //     this.dropDownList.push({ [this.field?.bind_value]: this.assignmentManagerId, [this.field?.bind_label]: this.assignmentManagerName , ...this._storageService.get('account') });
            //   }
            //   if ((this.renderForm.get(this.field?.slug).value === null) || this.renderForm.get(this.field?.slug).value === undefined) {
            //     this.renderForm.controls[this.field?.slug].setValue(this.assignmentManagerId, { emitEvent: false })
            //   }
            // }
            this._storageService.set(this.field?.slug, this.dropDownList);
            this.renderForm.controls[this.field?.slug].setValue(this.renderForm.get(this.field?.slug).value , { emitEvent: true });
            // if (this.dropDownList?.length === 1) {
            //   this.renderForm.controls[this.field?.slug].setValue(this.field?.type !== 'MULTIDROPDOWN' ? this.dropDownList[0][this.field?.bind_value] : [this.dropDownList[0][this.field?.bind_value]], { emitEvent: true })
            // }
          }
          this.isLoading = false
          this.changeDetectorRef.detectChanges()
        }
      }, err => {
        this.isLoading = false
      })
    }
  }

  getLabel() {
    if (this.is_update) {
      if (this.updateConfig?.length > 0) {

        for (let j = 0; j < this.updateConfig?.length; j++) {
          const data = this.updateConfig[j]
          if (data?.fieldName === this.field?.slug) {
            let value = this.updateValue;
            if (data?.label && (typeof data?.label === 'string')) {
              const keyList = data?.label.split('.');
              for (let i = 0; i < keyList.length; i++) {
                if (value) {
                  value = value[keyList[i]]
                }
              }
              return value
            }
          }
        }
      }
    }
  }

  onSelect(event, is_candidate = false, on_start = false) {
    const bindKeyList = this.field?.bind_value.split('.')
    if (this.dropDownList) {
      this.dropDownList.forEach(data => {
        let tempData = data;
        for (let key of bindKeyList) {
          if (tempData) {
            tempData = tempData[key]
          }
        }
        if (tempData === event) {
          this.selectedDta = data
          this.is_selected = true
        }
      })
      this.changeDetectorRef.detectChanges()
    }
    if (is_candidate) {
      this.renderForm.get(this.field?.slug).setValue(this.selectedCandidate)
    }

    if (on_start) {
      this.selectedCandidate = this.renderForm.get(this.field?.slug).value
    }
  }

  onSelectVendor(event) {
    this.selectedDta = event
    this.is_selected = true
  }

  onCandidateView() {
    this.onClickCandidateView.emit(this.selectedDta?.id)
  }

  onVendorClick() {
    this.onClickVendorView.emit(this.selectedDta?.id)
  }

  onBtnClickEvent(slug) {
    this.onBtnClick.emit(slug)
  }

  onCandidate() {
    this.selectedDta = undefined
    this.is_selected = false
  }
  resetSelectedValue() {
    this.assignmentManagerId = this.assignmentManagerName = null;
  }

}
