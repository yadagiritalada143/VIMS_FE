import { ChangeDetectorRef, Component, Input, OnInit, Output } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { FormRendererService } from 'src/app/library/form-renderer/form-renderer.service';
import { EventEmitter } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-mass-assignment-fields',
  templateUrl: './mass-assignment-fields.component.html',
  styleUrls: ['./mass-assignment-fields.component.scss']
})
export class MassAssignmentFieldsComponent implements OnInit {
  @Input() renderForm : UntypedFormGroup;
  @Input() programID: any;
  @Input() errorMessage: any;
  totalRecords: any;
  @Input() set field(value: any) {
    this._field = value;
    this.calculatedValue = null;
    if (value?.type === 'HUMAN_DROPDOWN') {
      this.renderForm.get(this.field?.slug).markAsUntouched();
      this.renderForm.get(this.field?.slug).updateValueAndValidity();
      this.getDropDownData({ term: '' });
    }
  };
  get field() {
    return this._field;
  }
  @Output() onDataChange = new EventEmitter();
  @Output() isFieldExist = new EventEmitter();
  @Output() valueReset = new EventEmitter();
  public destroy$: Subject<boolean> = new Subject<boolean>();
  disabledEventEmit = {};
  searchSubscription: Subscription;
  dropDownList = []
  isLoading = false;
  _field: any;
  url: string;
  calculatedValue:any;

  constructor(private _formRendererService: FormRendererService,
    private _storageService: StorageService,
    private changeDetectorRef: ChangeDetectorRef,
    private eventStream: EventStreamService) {

  }

  ngOnInit(): void {
    this.eventStream.on(Events.UPDATE_DROPDOWN_VALUES).subscribe((data) => {
      if (this.field?.slug === data?.slug) {
        this.isLoading = false;
        this.dropDownList = Array.isArray(this._storageService.get(data?.slug)) ? [...this._storageService.get(data?.slug)] : [];
        this.changeDetectorRef.detectChanges();
      }
    });
    this.eventStream.on(Events.SAME_NAME_EXIST).subscribe((data) => {
      this.disabledEventEmit[data.slug] = data?.value;
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
  loadMoreFieldData(event) {
    if(this.field.datasource.page < parseInt(Number(this.totalRecords/25).toString())) {
      this.field.datasource.page = this.field.datasource.page + 1;
    } else if (this.totalRecords % 25 === 0) {
      this.field.datasource.page = this.field.datasource.page + 1;
    } else {
      this.isLoading = false;
      return;
    }
    let url= this.url + `&page=${this.field?.datasource?.page}`
    this.getResponse(url).then((data) => {
      this.setFieldData(data , true);
    });
  }

  getDropDownData(event , isSearched = false) {
    this.url = this.field?.datasource?.url ? this.field?.datasource?.url?.replace('${programId}', this.programID) : `/configurator/programs/${this.programID}/members?org_category=CLIENT&info_level=basic&ordering=contact_name&is_enabled=true&k=`;
    this.field.datasource.page = 1;
    if ((this.url && (this.field?.type === 'HUMAN_DROPDOWN'))) {
      this.url = isSearched ? this.url + '&k=' + (event?.term || '')  : this.url;
      this.getResponse().then((data) => {
        this.setFieldData(data);
      });
    }
  }
  getResponse(url? , limit?) {
   return new Promise<any> ((resolve) => {
    this.isLoading = true;
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    };
    this.searchSubscription = this._formRendererService.get(url ? url : this.url).subscribe((data: any) => {
      if (data) {
        this.totalRecords = data?.total_records;
        this.field?.datasource?.getBy.forEach(d => {
          data = data[d]
        });
      }
      this.isLoading = false;
      resolve(data);
    }, err => {
      this.isLoading = false
    })
   })
  }
  setFieldData(data , loadMoreFieldData = false) {
    if(loadMoreFieldData) {
      this.dropDownList = this.dropDownList.concat(data);
    } else {
      this.dropDownList = data;
    }
    this._storageService.set(this.field?.slug, this.dropDownList);
    this.changeDetectorRef.detectChanges();
  }
  onDateTimeChange(field, $event) {
    this.isFieldExist.emit({slug : this.field?.slug});
    this.renderForm.get(this.field?.slug).markAsTouched();
    this.renderForm.get(this.field?.slug).setValue($event?.value);
    this.renderForm.get(this.field?.slug).updateValueAndValidity();
    if(field?.slug && $event?.value && !this.disabledEventEmit[this.field?.slug]) {
      this.renderForm.get(this.field?.slug).setValue($event?.value);
      this.renderForm.get(this.field?.slug).updateValueAndValidity();
      this.onDataChange.emit({slug : this.field?.slug , value : $event?.value , disable : false});
    }
  }
  resetValue() {
    this.valueReset.emit({slug : this.field?.slug , value : true});
  }
}
