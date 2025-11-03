import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { SortHelperPipe } from '../../pipe/sort-helper.pipe';
import { isEqual } from 'lodash';

@Component({
  selector: 'app-remote-worker-form',
  templateUrl: './remote-worker-form.component.html',
  styleUrls: ['./remote-worker-form.component.scss']
})
export class RemoteWorkerFormComponent implements OnInit {

  remoteWorkerForm: UntypedFormGroup;
  allCountryList: any[] = [];
  stateList: any[] = [];
  countyList: any[] = [];
  cityList: any[] = [];
  countryChange: boolean = false;
  stateChange: boolean = false;
  countyChange: boolean = false;
  cityChange: boolean = false;

  @Input() patchData;
  @Input() submitEvent;
  @Input() isReadOnly : boolean = false;
  @Output() formSubmitted = new EventEmitter<any>();
  @Output() allApiData = new EventEmitter();
  @Output() apiErrors = new EventEmitter<any>();
  @Input() remoteWorkSelected;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private loaderService: LoaderService,
    private jobService : JobDetailsService,
    private sortPipe : SortHelperPipe) { }

  ngOnInit(): void {
    this.remoteWorkerForm = this.formBuilder.group({
      country: [null,[Validators.required]],
      state: [null],
      county: [null],
      city: [null]
    });
    // this.getAllCountry();
    if(this.remoteWorkSelected){
       this.getAllCountry();
     }
    else{
      this.remoteWorkerForm?.get('country').clearValidators();
      this.remoteWorkerForm?.get('country').updateValueAndValidity();
    }
    this.remoteWorkerForm.valueChanges.pipe(debounceTime(800),distinctUntilChanged(isEqual)).subscribe((formValues) => {
      this.getFormValue(formValues)
  });
  }

  getFormValue(formValues){
    let isCountryValidated = (this.remoteWorkSelected && formValues?.country != null && this.remoteWorkerForm.get('country').value != null) ? true : false;
    let formObj = {
      formValues : formValues,
      countryValidated : isCountryValidated
    }
    this.formSubmitted.emit(formObj);
    this.allApiData.emit({countries: this.allCountryList, states: this.stateList, cities: this.cityList})
  }

  changeCountry(event){
    if(event){
      this.countryChange = true;
      let countryId = event?.id;
      this.remoteWorkerForm.patchValue({
        state: null,
        county: null,
        city: null
      })
      this.getAllStates(countryId);
    }
  }
  changeState(event){
    if(event){
      let stateId = event?.id;
      this.remoteWorkerForm.patchValue({
        county: null,
        city: null
      })
      this.getAllCounties(stateId);
      this.getAllCities(stateId);
      this.stateChange = true;
    }
  }
  changeCounty(event){
    if(event){
      this.countyChange = true;
    }
  }
  changeCity(event){
    if(event){
      this.cityChange = true;
    }
  }
  isObject(val){
    return (typeof val === 'object' && val !== null) ? true : false
  }
  onClear(event){
    if(event == 'country') {
      this.remoteWorkerForm.controls["country"].setValidators(Validators.required);
      this.remoteWorkerForm.patchValue({
        country: null,
        state: null,
        county: null,
        city: null
      });
      this.stateList = [];
      this.countyList = [];
      this.cityList = [];
    }
    else if(event == 'state'){
      this.remoteWorkerForm.patchValue({
        state: null,
        county: null,
        city: null
      })
      this.countyList = [];
      this.cityList = [];
    }
  }
  getAllCountry() {
    this.loaderService.show();
    this.jobService.getCountries().subscribe({
      next: data => {
        if (data) {
          this.loaderService.hide();
          this.allCountryList = this.sortPipe.transform(data['countries'], 'name');
          const country = this.allCountryList.find(res => res?.name?.toLowerCase() === this.patchData?.country?.toLowerCase());
          let countryId;
          if (country && !this.countryChange) {
            countryId = country?.id;
            this.remoteWorkerForm.patchValue({
              country: country
            });
          }
          if(countryId){
            this.getAllStates(countryId);
          }
          else{
            this.stateList = []
            this.cityList = [];
            this.countyList = [];
          }
        }
      },
      error: res => {
        this.loaderService.hide();
        this.apiErrors.emit(res)
      },
    });
 }
 getAllStates(countryId){
  this.loaderService.show();
  this.jobService.getStates(countryId).subscribe({
    next: data => {
      if (data) {
        this.loaderService.hide();
        this.stateList = this.sortPipe.transform(data['states'], 'name');
        const state = this.stateList?.find(res => (res?.name?.toLowerCase() === this.patchData?.state?.toLowerCase()));
        let stateId;
        if(state && !this.stateChange){
          stateId = state?.id;
          this.remoteWorkerForm.patchValue({
            state: state
          });
        }
        if(stateId){
          this.getAllCounties(stateId);
          this.getAllCities(stateId);
        }
        else{
          this.cityList = [];
          this.countyList = [];
        }
      }
    },
    error: res => {
      this.loaderService.hide();
      this.apiErrors.emit(res)
    },
  });
 }

 getAllCounties(stateId){
  this.loaderService.show();
  this.jobService.getCounties(stateId).subscribe({
    next: data => {
      if (data) {
        this.loaderService.hide();
        this.countyList = this.sortPipe.transform(data['counties'], 'name');
        const county = this.countyList?.find(res => res?.name?.toLowerCase() === this.patchData?.county?.toLowerCase());
        if(county && !this.countyChange){
          this.remoteWorkerForm.patchValue({
            county: county
          });
        }
      }
    },
    error: res => {
      this.loaderService.hide();
      this.apiErrors.emit(res)
    },
  });
 }

 getAllCities(stateId){
  this.loaderService.show();
  this.jobService.getCities(stateId).subscribe({
    next: data => {
      if (data) {
        this.loaderService.hide();
        this.cityList = this.sortPipe.transform(data['cities'], 'name');
        const city = this.cityList?.find(res => res?.name?.toLowerCase() === this.patchData?.city?.toLowerCase());
        if(city && !this.cityChange){
          this.remoteWorkerForm.patchValue({
            city: city
          });
        }
      }
    },
    error: res => {
      this.loaderService.hide();
      this.apiErrors.emit(res)
    },
  });
 }


}

