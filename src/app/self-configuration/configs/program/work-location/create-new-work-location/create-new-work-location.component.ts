import { Component, OnInit, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Subject, Subscription, interval } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { takeUntil } from 'rxjs/operators';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import * as _ from 'lodash';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ActivatedRoute } from '@angular/router';
import { ModalItemConfig } from 'src/app/self-configuration/components/selector-modal/selector-modal.component';
import { CustomFieldsComponent } from 'src/app/library/custom-fields/custom-fields/custom-fields.component';
import { CommonService } from 'src/app/library/custom-fields/common.service';

@Component({
  selector: 'app-create-new-work-location',
  templateUrl: './create-new-work-location.component.html',
  styleUrls: ['./create-new-work-location.component.scss'],
})
export class CreateNewWorkLocationComponent implements OnInit, OnDestroy {

  @ViewChild(CustomFieldsComponent) cfCmp: CustomFieldsComponent;
  public updatedCFs: Array <any>;
  public recievedCFs: Array <any>;
  public isCFValid: boolean = true;

  public titleToggle: any = {
    title: 'active',
    value: true,
  };

  @ViewChild('searchAddress') searchAddress: SearchAddressComponent;
  @Output() onSaveWorkLocation: EventEmitter<any> = new EventEmitter<any>();

  private programId: string = null;
  private subscriptions: Subscription = new Subscription();
  // private stateSubject: Subject<string> = new Subject<string>();
  // private citySubject : Subject<string> = new Subject<string>();
  private currencyListLoaded: boolean = true;

  public title: string = 'create_work_location';
  public isViewMode: boolean = false;
  public isEditMode: boolean = false;
  public id: string = '';

  public buttonLabel: string = 'save';
  public countryShortName: string = 'all';
  public allCountryList: Array<any> = [];
  // public stateList: Array<any> = [];
  // public cityList : Array<any> = [];
  public countryMap: Map<string, string> = new Map<string, string>();
  public workLocationForm: UntypedFormGroup;
  public toggle = {
    title: 'active',
    value: true,
  };

  public timezoneLoader: boolean = false;
  public timezoneList: Array<any> = [];

  private allCurrencyList: Array<any> = [];
  private programCurrencyList: Array<any> = [];
  public currencyList: Array<any> = [];
  public selectedDefaultCurrency: string = null;
  public zipcodePattern: RegExp = /^[a-zA-Z0-9 -]+$/gm;

  constructor(
    private eventStream: EventStreamService,
    private loaderService: LoaderService,
    private fb: UntypedFormBuilder,
    private programService: ProgramService,
    private storageService: StorageService,
    private alertService: AlertService,
    private sortPipe: SortHelperPipe,
    private uniquePipe: UniqueKeyPipe,
    private router: SvmsRouterService,
    private route: ActivatedRoute,
    private cfService: CommonService
  ) {}

  ngOnInit(): void {


    this.route.queryParams.subscribe(params => {
      if (params?.id) {
        this.getWorkLocationData(params.id);
      }
    });

    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.initFormControl();
    this.getAllCountry();
    this.getCurrencies();
    this.programService.get('/configurator/resources/time_zones').subscribe({
      next: (res: any) => {
        if (res?.time_zones) {
          this.timezoneLoader = false;
          this.timezoneList =
            res?.time_zones?.map((entry: any) => {
              let groups: Array<string> = entry?.name?.match(/(\([^\(\)]+\))(.*)/m);
              return {
                id: entry?.id,
                name: ((entry?.code ?? '')?.trim() + ' ' + (groups?.[1] ?? '').trim())?.trim(),
              };
            }) ?? [];

          this.timezoneList = this.uniquePipe.transform(this.timezoneList, 'name');
          this.timezoneList = this.sortPipe.transform(this.timezoneList, 'name');
        }
      },
      error: (err: any) => {
        this.timezoneLoader = false;
        this.alertService.error(errorHandler(err));
      },
    });

    // State search
    // this.subscriptions.add(
    //   this.stateSubject
    //     .pipe(
    //       debounceTime(600),
    //       distinctUntilChanged((prev: any, curr: any) => {
    //         return prev === curr;
    //       }),
    //       switchMap((country: string) => {
    //         this.loaderService.show();
    //         let url: string = `/configurator/resources/states?country_ids=${country}&limit=300`;
    //         return this.programService.get(url);
    //       }),
    //     )
    //     .subscribe(
    //       (data: any) => {
    //         if (data) {
    //           this.loaderService.hide();
    //           this.stateList = this.sortPipe.transform(data.states, 'name');
    //           if (this.id) {
    //             let locationField: AbstractControl = this.workLocationForm.get('state');
    //             let selectedState: string = locationField.value;

    //             let entryIndex: number = this.stateList.findIndex((state: any) => state?.id === selectedState);
    //             if (entryIndex === -1) {
    //               locationField.setValue(null);
    //             }
    //           }
    //         }
    //       },
    //       err => {
    //         this.loaderService.hide();
    //         this.alertService.error(errorHandler(err));
    //       },
    //     ),
    // );

    // City Worklocation
    // this.subscriptions.add(
    //   this.citySubject
    //     .pipe(
    //       debounceTime(600),
    //       distinctUntilChanged((prev: any, curr: any) => {
    //         return prev === curr;
    //       }),
    //       switchMap((state: string) => {
    //         this.loaderService.show();
    //         let url :string = `/configurator/resources/cities?state_ids=${state}&limit=300`;
    //         return this.programService.get(url);
    //       }),
    //     )
    //     .subscribe(
    //       (data: any) => {
    //         if (data) {
    //           this.loaderService.hide();
    //           this.cityList = this.sortPipe.transform(data.cities, 'name');
    //           if (this.id) {
    //             let locationField: AbstractControl = this.workLocationForm.get('city');
    //             let selectedCity: string = locationField.value;

    //             let entryIndex: number = this.cityList.findIndex((city: any) => city?.id === selectedCity);
    //             if (entryIndex === -1) {
    //               locationField.setValue(null);
    //             }
    //           }
    //         }
    //       },
    //       err => {
    //         this.loaderService.hide();
    //         this.alertService.error(errorHandler(err));
    //       },
    //     ),
    // );

    // Create work location
    this.subscriptions.add(
      this.eventStream.on(Events.WORK_LOCATION_CREATE).subscribe(
        (data: any) => {
          if (data) {
            this.title = 'create_work_location';
            this.isViewMode = false;
            this.isEditMode = false;
            this.buttonLabel = 'save';
          }
        },
        err => {
          console.error(err);
        },
      ),
    );

    // Disable work location
    this.subscriptions.add(
      this.eventStream.on(Events.WORK_LOCATION_DISABLE).subscribe((data: any) => {
        if (data) {
          let url: string = `/configurator/programs/${this.programId}/work-locations/${data.id}`;
          let payload: any = { is_enabled: !data.is_enabled };

          this.loaderService.show();
          this.programService.put(url, payload).subscribe(
            (res: any) => {
              if (res) {
                this.loaderService.hide();
                data.is_enabled = !data.is_enabled;
                this.alertService.success(`work_location_${data.is_enabled ? 'enabled' : 'disabled'}_successfully`);
              }
            },
            err => {
              this.loaderService.hide();
              this.alertService.error(errorHandler(err));
            },
          );
        }
      }),
    );


    // Address field changes
    // this.subscriptions.add(
    //   this.workLocationForm.get('address').valueChanges.subscribe(() => {
    //     let zipcode: string = this.searchAddress.currentZipCode;
    //     if (!!zipcode) {
    //       this.workLocationForm.get('zipcode').setValue(zipcode);
    //     }
    //   }),
    // );
  }

  initFormControl() {
    this.workLocationForm = this.fb.group({
      code: new UntypedFormControl('', [Validators.pattern('^[a-zA-Z0-9_/-]+$'), Validators.required]),
      location: new UntypedFormControl('', [Validators.required]),
      description: new UntypedFormControl(''),
      country: new UntypedFormControl(null, [Validators.required]),
      // state: new FormControl(null),
      // city : new FormControl(null),
      address: new UntypedFormControl('', [Validators.required]),
      zipcode: new UntypedFormControl(''),
      timezone: new UntypedFormControl(null),
      currency: new UntypedFormControl([]),
      address_secondary: new UntypedFormControl(''),
      city_name: new UntypedFormControl(''),
      county_name: new UntypedFormControl(''),
      state_name: new UntypedFormControl('')
    });

    // if (this.isZipcodeMandatory) {
    //   this.workLocationForm.get('zipcode').addValidators([Validators.required]);
    //   this.workLocationForm.get('zipcode').updateValueAndValidity();
    //   this.workLocationForm.updateValueAndValidity();
    // }
  }

  get form() {
    return this.workLocationForm.controls;
  }

  backClicked() {
    this.router.navigate(['program', 'work-location', 'list']);
  }

  getWorkLocationData(id) {

    this.id = id;
    this.isEditMode = true;
    this.isViewMode = false;
    this.buttonLabel = 'update';
    this.title = 'edit_work_location';

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/work-locations/${id}`;
    this.programService.get(url).subscribe({
      next: (res: any) => {
        let data = res.work_location;

        if (data) {

          this.cfService.queueCFpopulation(data['custom_fields'] || {}, this.cfCmp).then((cfs: any) => {
            this.recievedCFs = cfs;
          });

          this.toggle.value = data.is_enabled;
          this.toggle.title = data.is_enabled ? 'active' : 'inactive';

          let selectedCurr: Array<any> = (data?.currencies ?? []).map((entry: any) => {
            if (entry?.is_default) {
              this.selectedDefaultCurrency = entry?.id;
            }
            return entry;
          });
          let selected_ids = selectedCurr.map((entry: any) => entry?.id);

          this.workLocationForm.patchValue({
            code: data.code,
            location: data.name,
            country: data.country?.id,
            zipcode: data.zipcode,
            description: data.description,
            address: data.address,
            address_secondary: data.address_line_2,
            currency: selectedCurr.map((entry: any) => entry?.id),
            city_name: data?.city_name || '',
            state_name: data?.state_name || '',
            county_name: data?.county_name || ''
          });

          this.initializeModalListingAction(selected_ids);
          let timezone: string = typeof data.timezone === 'string' ? data.timezone : data.timezone?.id;
          if (timezone) {
            const timezoneForm: AbstractControl = this.workLocationForm?.get('timezone');
            timezoneForm?.setValue(timezone);
          }

          // if (data?.country?.id) {
          //   this.stateSubject.next(data.country?.id);
          //   if (data.state?.id) {
          //     this.workLocationForm.get('state').setValue(data.state?.id);
          //     this.citySubject.next(data.state?.id);
          //     if (data.city?.id) {
          //       this.workLocationForm.get('city').setValue(data?.city?.id);
          //     }
          //   }
          // }

          this.countryShortName = data.country ? data.country?.iso_code_2 : 'all';
          this.searchAddress._value = data.address;
        }
      }, error: (err: any) => {
        console.error(err);
        this.alertService.error(errorHandler(err));
      },
    });
  }

  onSubmit() {
    let selectedCurr = (this.currencyList ?? []).filter((entry: any) => entry?.is_selected);
    if (this.workLocationForm?.valid) {
      const formValues = this.workLocationForm.value;
      const payload = {
        name: formValues.location,
        code: formValues.code,
        address: formValues.address,
        description: formValues.description,
        address_line_1: formValues.address,
        address_line_2: formValues.address_secondary,
        // house_number: '',
        // street_name: '',
        // city: formValues.city,
        // state: formValues.state,
        city_name: formValues.city_name,
        county_name: formValues.county_name,
        state_name: formValues.state_name,
        // state_code: null,
        country: formValues.country,
        is_enabled: !!this.id ? this.toggle.value : true,
        zipcode: formValues.zipcode,
        timezone_id: formValues.timezone,
        currencies: selectedCurr.map((entry: any) => {
          return {
            id: entry?.value,
            is_default: entry?.is_default
          }
        })
      };

      if(this.allowedCFuserType) {
        payload['custom_fields'] = this.cfService.amendCFData(this.updatedCFs);
      }

      this.onSave(payload, this.id);
    }
  }

  getAllCountry() {
    let url: string = `/configurator/resources/countries?limit=300`;

    this.loaderService.show();
    this.programService.get(url).subscribe(
      (data: any) => {
        if (data) {
          this.loaderService.hide();
          this.allCountryList = this.sortPipe.transform(data.countries, 'name');
          if (Array.isArray(this.allCountryList)) {
            this.allCountryList.forEach((entry: any) => {
              const { id, name } = entry;
              this.countryMap.set(id, name);
            });
          }
        }
      },
      err => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      },
    );
  }

  getCurrencies() {
    let url: string = `/configurator/resources/currencies?limit=300`;
    this.programService.get(url).subscribe({
      next: (res: any) => {
        if (Array.isArray(res?.currencies)) {
          this.allCurrencyList = res.currencies.map(entry => {
            return {
              name: entry?.code,
              value: entry?.id,
            };
          });

          this.setProgramCurrencies();
          this.currencyListLoaded = true;
        }
      },
      error: (err: Error | any) => {
        console.error(err);
        this.alertService.error(errorHandler(err));
      },
    });
  }

  onSave(payload: any, id: string) {
    let url: string = `/configurator/programs/${this.programId}/work-locations${id ? '/' + id : ''}`;

    if (id) {
      this.loaderService.show();
      this.programService.put(url, payload).subscribe(
        (data: any) => {
          if (data) {
            this.alertService.success(`work_location_has_been_updated_successfully`);
            this.onSaveWorkLocation.emit(true);
            this.loaderService.hide();
            this.sidebarClose();
            this.router.navigate(['program', 'work-location' ,'view'], {
              queryParams: {
                id: data?.id
              }
            });
          }
        },
        err => {
          this.loaderService.hide();
          this.alertService.error(errorHandler(err));
        },
      );
    } else {
      this.loaderService.show();
      this.programService.post(url, payload).subscribe(
        (data: any) => {
          if (data) {
            this.alertService.success(`work_location_has_been_created_successfully`);
            this.onSaveWorkLocation.emit(true);
            this.loaderService.hide();
            this.sidebarClose();
            this.router.navigate(['program', 'work-location' ,'view'], {
              queryParams: {
                id: data?.id
              }
            });
          }
        },
        err => {
          this.loaderService.hide();
          this.alertService.error(errorHandler(err));
        },
      );
    }
  }

  setProgramCurrencies() {
    // Get selected program currencies (code)
    const programConfig: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config;
    this.programCurrencyList = [...Object.values(programConfig?.billing?.supported_currencies ?? [])];
    this.currencyList = this.allCurrencyList.filter((entry: any) => {
      return this.programCurrencyList.includes(entry?.name);
    });
  }

  currencyValidation = (items: Array <ModalItemConfig>) => {
    let defaultPresent: boolean = false;
    let selectedItems: Array <ModalItemConfig> = items.filter((entry: any) => {
      if(entry?.is_default) {
        defaultPresent = true;
      }
      return entry?.is_selected;
    });
    if(!selectedItems.length || defaultPresent)
      return null;
    return "please_select_default_currency_default_currency_will_be_prefilled_on_the_job_when_the_user_selects_this_work_location_and_can_be_changed_to_any_option_defined_here_";
  }

  sidebarClose() {
    this.isViewMode = false;
    this.isEditMode = false;

    this.id = '';
    this.setProgramCurrencies();
    this.workLocationForm.reset();
    this.searchAddress._value = '';
    this.searchAddress.currentZipCode = '';
    this.searchAddress.addresstext.nativeElement.disabled = false;
    // this.visibleChange.emit('hidden');
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
  }

  changeCountry(id: string) {
    let countryForm: AbstractControl = this.workLocationForm.get('country');
    // let stateForm: AbstractControl = this.workLocationForm.get('state');
    // let cityForm: AbstractControl = this.workLocationForm.get('city');
    if (Array.isArray(this.allCountryList)) {
      this.allCountryList.forEach((entry: any) => {
        if (countryForm?.value === entry?.id) this.countryShortName = entry?.iso_code_2;
      });

      this.workLocationForm.patchValue({
        address: '',
        address_secondary: '',
        city_name: '',
        county_name: '',
        state_name: '',
        zipcode: '',
      });

      // this.cityList = [];
      // cityForm.setValue(null);
      // stateForm.setValue(null);
      // this.stateSubject.next(id);
    }
  }

  // changeCity(id:string){
  //   let cityForm: AbstractControl = this.workLocationForm.get('city');
  //   if (Array.isArray(this.stateList)) {
  //     cityForm.setValue(null);
  //     this.citySubject.next(id);
  //   }

  // }

  initializeModalListingAction(selected_ids: any) {
    let destroySub$: Subject <void> = new Subject <void> ();
    interval(400)
    .pipe(takeUntil(destroySub$))
    .subscribe(() => {
      if(this.currencyListLoaded) {
        destroySub$.next();
        this.currencyList = this.currencyList.map((entry: any) => {
          return {
            name: entry?.name,
            value: entry?.value,
            is_default: entry?.value == this.selectedDefaultCurrency,
            is_selected: selected_ids.includes(entry?.value)
          }
        })
      }
    });
  }

  removeItem(item: string) {
    const currencyForm: AbstractControl = this.workLocationForm?.get('currency');
    currencyForm?.setValue(currencyForm?.value?.filter((entry: string) => entry !== item) ?? []);

    if (item === this.selectedDefaultCurrency && currencyForm?.value?.length) {
      this.selectedDefaultCurrency = currencyForm.value[0];
    }
  }

  selectDefaultItem(item: any) {
    if (item?.length === 1) {
      this.selectedDefaultCurrency = item[0]?.value;
    }
  }

  // get noStatePresent() {
  //   const countryForm: AbstractControl = this.workLocationForm.get('country');
  //   let country: string = countryForm?.value;

  //   if (!country) {
  //     return false;
  //   }

  //   if (Array.isArray(this.stateList) && !this.stateList.length) {
  //     return this.countryMap.get(country) || 'Undefined';
  //   }

  //   return false;
  // }

  trimSpace(evt: MouseEvent) {
    const target: any = evt.target;
    let value: string = target?.value;
    this.workLocationForm.get('zipcode').setValue(value.trim());
  }

  // get isZipcodeMandatory() {
  //   const program: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  //   if (!program?.config?.is_zipcode_mandatory) return false;

  //   return program?.config?.is_zipcode_mandatory;
  // }

  get userType() {
    return (this.storageService.get(StorageKeys.USER_TYPE) || '')?.toUpperCase();
  }

  get allowedCFuserType() {
    return true;
  }

  setAddressDetails(data: any) {
    let city_name: string = this.getCity(data);
    let state_name: string = this.getState(data);
    let county_name: string = this.getCounty(data);
    let zipcode: string = this.getZipCode(data);
    this.workLocationForm.patchValue({
      city_name, state_name, county_name, zipcode
    })
  }

  getCity(place) {
    let city: string = this.getAddrComponent(place, 'locality', 'long_name');
    return city || '';
  }

  getZipCode(place) {
    let postCode: string = this.getAddrComponent(place, 'postal_code', 'long_name');
    return postCode || '';
  }

  getState(place) {
    let state: string = this.getAddrComponent(place, 'administrative_area_level_1', 'long_name');
    return state || '';
  }

  getCounty(place) {
    let county: string = this.getAddrComponent(place, 'administrative_area_level_2', 'long_name');
    return county || '';
  }

  private getAddrComponent(place, type: string, attr: string) {
    const addressComponents: Array <string> = place?.address_components || [];
    if(Array.isArray(addressComponents)) {
      for (let it: number = 0; it < addressComponents.length; it++) {
        const entry: any = addressComponents[it];
        const types: Array <string> = entry?.types;
        if(Array.isArray(types) && types.includes(type)) {
          return entry?.[attr];
        }
      }
    }

    return '';
  }

  blurActiveElement() {
    document.activeElement?.['blur']?.();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
