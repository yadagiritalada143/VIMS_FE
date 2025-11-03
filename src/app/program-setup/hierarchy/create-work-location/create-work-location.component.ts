import { Component, OnInit, Input, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Subject, Subscription } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import * as _ from 'lodash';


type PanelVisibility = ('visible' | 'hidden');

@Component({
  selector: 'app-create-work-location',
  templateUrl: './create-work-location.component.html',
  styleUrls: ['./create-work-location.component.scss']
})
export class CreateWorkLocationComponent implements OnInit, OnDestroy {

  @ViewChild('searchAddress') searchAddress: SearchAddressComponent;

  @Input() visible: PanelVisibility = 'hidden';
  @Output() onSaveWorkLocation: EventEmitter<any> = new EventEmitter<any>();
  @Output() visibleChange: EventEmitter<PanelVisibility> = new EventEmitter<PanelVisibility>();

  private programId: string = null;
  private subscriptions: Array<Subscription> = [];
  private stateSubject: Subject<string> = new Subject<string>();

  public title: string = 'Create Work Location';
  public isViewMode: boolean = false;
  public isEditMode: boolean = false;
  public id: string = '';

  public buttonLabel: string = 'Save';
  public countryShortName: string = 'all';
  public allCountryList: Array<any> = [];
  public stateList: Array<any> = [];
  public countryMap: Map<string, string> = new Map<string, string>();
  public workLocationForm: UntypedFormGroup;
  public toggle = {
    title: 'active',
    value: true
  };

  public timezoneLoader: boolean = false;
  public timezoneList: Array <any> = [];

  private allCurrencyList: Array <any> = [];
  private programCurrencyList: Array <any> = [];
  public currencyList: Array <any> = [];
  public selectedDefaultCurrency: string = null;

  constructor(
    private eventStream: EventStreamService,
    private loaderService: LoaderService,
    private fb: UntypedFormBuilder,
    private programService: ProgramService,
    private storageService: StorageService,
    private alertService: AlertService,
    private sortPipe: SortHelperPipe,
    private uniquePipe: UniqueKeyPipe
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.initFormControl();
    this.getAllCountry();
    this.getCurrencies();
    this.programService.get('/configurator/resources/time_zones')
    .subscribe({
      next: (res: any) => {
        if(res?.time_zones) {
          this.timezoneLoader = false;
          this.timezoneList = res?.time_zones?.map((entry: any) => {
            return {
              id: entry?.id?.trim(),
              name: entry?.name?.trim()
            }
          }) ?? [];
          this.timezoneList = this.uniquePipe.transform(this.timezoneList, 'name');
        }
      }, error: (err: any) => {
        this.timezoneLoader = false;
        this.alertService.error(errorHandler(err));
      }
    });

    // State search
    this.subscriptions.push(
      this.stateSubject.pipe(
        debounceTime(600),
        distinctUntilChanged((prev: any, curr: any) => {
          return (prev === curr);
        }),
        switchMap((country: string) => {
          this.loaderService.show();
          let url: string = `/configurator/resources/states?country_ids=${country}&limit=300`;
          return this.programService.get(url);
        })
      ).subscribe((data: any) => {
        if (data) {
          this.loaderService.hide();
          this.stateList = this.sortPipe.transform(data.states, 'name');
          if (this.id) {

            let locationField: AbstractControl = this.workLocationForm.get('state');
            let selectedState: string = locationField.value;

            let entryIndex: number = this.stateList.findIndex((state: any) => (state?.id === selectedState));
            if (entryIndex === -1) {
              locationField.setValue(null);
            }
          }
        }
      }, err => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      })
    );

    // Create work location
    this.subscriptions.push(
      this.eventStream.on(Events.WORK_LOCATION_CREATE)
        .subscribe((data:any) => {
          if (data) {
            this.title = 'Create Work Location';
            this.isViewMode = false;
            this.isEditMode = false;
            this.buttonLabel = 'Save';
          }
        }, err => {
          console.error(err);
        })
    );

    // Disable work location
    this.subscriptions.push(
      this.eventStream.on(Events.WORK_LOCATION_DISABLE)
        .subscribe((data:any) => {
          if (data) {

            let url: string = `/configurator/programs/${this.programId}/work-locations/${data.id}`;
            let payload: any = { 'is_enabled': !data.is_enabled };

            this.loaderService.show();
            this.programService.put(url, payload)
              .subscribe((res:any) => {
                if (res) {
                  this.loaderService.hide();
                  data.is_enabled = !data.is_enabled;
                  this.alertService.success(`Work location ${data.is_enabled ? 'enabled' : 'disabled'} successfully`);
                }
              }, err => {
                this.loaderService.hide();
                this.alertService.error(errorHandler(err));
              });
          }
        })
    );

    // Edit work location
    this.subscriptions.push(
      this.eventStream.on(Events.WORK_LOCATION_EDIT)
        .subscribe((data:any) => {
          if (data) {

            this.id = data.id;
            this.isEditMode = true;
            this.isViewMode = false;

            this.title = 'Edit Work Location';
            this.buttonLabel = 'Update';
            this.toggle.value = data.is_enabled;
            this.toggle.title = data.is_enabled ? 'active' : 'inactive';

            let selectedCurr: Array <any> = (data?.currencies ?? []).map((entry: any) => {
              if(entry?.is_default) {
                this.selectedDefaultCurrency = entry?.id;
              }
              return entry;
            });

            this.workLocationForm.patchValue({
              code: data.code,
              location: data.name,
              country: data.country?.id,
              zipcode: data.zipvalue,
              description: data.description,
              address: data.address,
              currency: selectedCurr.map((entry: any) => entry?.id),
            });

            this.currencyList = this.uniquePipe.transform([
              ...this.currencyList,
              ...selectedCurr.map((entry: any) => {
                return {
                  name: entry?.code,
                  value: entry?.id
                }
              })
            ], 'value');

            let timezone: string = (typeof (data.timezone) === 'string') ? data.timezone : data.timezone?.id;
            if(timezone) {
              const timezoneForm: AbstractControl = this.workLocationForm?.get('timezone');
              timezoneForm?.setValue(timezone);
            }

            if (data.country?.id && data.state?.id) {
              this.workLocationForm.get('state').setValue(data.state?.id);
              this.stateSubject.next(data.country?.id);
            }

            this.countryShortName = data.country ? data.country?.iso_code_2 : 'all';
            this.searchAddress._value = data.address;
          }
        }
      )
    );

    // View work location
    this.subscriptions.push(
      this.eventStream.on(Events.WORK_LOCATION_VIEW)
        .subscribe((data: any) => {
          // console.log(data);

          if (data) {

            this.isEditMode = false;
            this.isViewMode = true;

            this.title = 'View Work Location';
            this.toggle.value = data.is_enabled;
            this.toggle.title = data.is_enabled ? 'active' : 'inactive';

            let selectedCurr: Array <any> = (data?.currencies ?? []).map((entry: any) => {
              if(entry?.is_default) {
                this.selectedDefaultCurrency = entry?.id;
              }
              return entry;
            });

            this.workLocationForm.patchValue({
              code: data.code,
              location: data.name,
              country: data.country?.id,
              zipcode: data.zipvalue,
              description: data.description,
              address: data.address,
              currency: selectedCurr.map((entry: any) => entry?.id),
            });

            this.currencyList = this.uniquePipe.transform([
              ...this.currencyList,
              ...selectedCurr.map((entry: any) => {
                return {
                  name: entry?.code,
                  value: entry?.id
                }
              })
            ], 'value');

            let timezone: string = (typeof (data.timezone) === 'string') ? data.timezone : data.timezone?.id;
            if(timezone) {
              const timezoneForm: AbstractControl = this.workLocationForm?.get('timezone');
              timezoneForm?.setValue(timezone);
            }

            if (data.country?.id && data.state?.id) {
              this.workLocationForm.get('state').setValue(data.state?.id);
              this.stateSubject.next(data.country?.id);
            }

            this.searchAddress._value = data.address;
            this.searchAddress.addresstext.nativeElement.disabled = true;
            this.countryShortName = data.country ? data.country?.iso_code_2 : 'all';

          }
        }
      )
    );

    // Address field changes
    this.subscriptions.push(
      this.workLocationForm.get('address').valueChanges
        .subscribe(() => {
          let zipcode: string = this.searchAddress.currentZipCode;
          if (!!zipcode) {
            this.workLocationForm.get('zipcode').setValue(zipcode);
          }
        })
    );
  }

  initFormControl() {

    this.workLocationForm = this.fb.group({
      code: new UntypedFormControl('', [
        Validators.pattern('^[a-zA-Z0-9_/-]+$'),
        Validators.required
      ]),
      location: new UntypedFormControl('', [Validators.required]),
      description: new UntypedFormControl(''),
      country: new UntypedFormControl(null, [Validators.required]),
      state: new UntypedFormControl(null),
      address: new UntypedFormControl(''),
      zipcode: new UntypedFormControl('', [
        Validators.pattern("^[a-zA-Z0-9 -]+$"),
        Validators.minLength(5),
        Validators.maxLength(6)
      ]),
      timezone: new UntypedFormControl(null),
      currency: new UntypedFormControl([])
    });

    if(this.isZipcodeMandatory) {
      this.workLocationForm.get('zipcode').setValidators([
        Validators.required,
        Validators.pattern("^[a-zA-Z0-9 -]+$"),
        Validators.minLength(5),
        Validators.maxLength(6)
      ]);

      this.workLocationForm.get('zipcode').updateValueAndValidity();
      this.workLocationForm.updateValueAndValidity();
    }
  }

  get form() {
    return this.workLocationForm.controls;
  }

  onSubmit() {
    if (this.workLocationForm?.valid) {
      const formValues = this.workLocationForm.value;
      const payload = {
        name: formValues.location,
        code: formValues.code,
        address: formValues.address,
        description: formValues.description,
        address_line_1: '',
        address_line_2: '',
        house_number: '',
        street_name: '',
        city: null,
        state: formValues.state,
        state_code: null,
        country: formValues.country,
        is_enabled: !!this.id ? this.toggle.value : true,
        zipcode: formValues.zipcode,
        timezone_id: formValues.timezone,
        currencies: (formValues?.currency ?? []).map((entry: string) => {
          return {
            id: entry,
            is_default: (this.selectedDefaultCurrency === entry)
          }
        })
      };

      this.onSave(payload, this.id);
    }
  }

  getAllCountry() {

    let url: string = `/configurator/resources/countries?limit=300`;

    this.loaderService.show();
    this.programService.get(url)
      .subscribe((data: any) => {
        if (data) {
          this.loaderService.hide();
          this.allCountryList = this.sortPipe.transform(data.countries, 'name');
          if (Array.isArray(this.allCountryList)) {
            this.allCountryList.forEach((entry: any) => {
              const { id, name } = entry
              this.countryMap.set(id, name);
            });
          }
        }
      }, err => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      }
      );
  }

  getCurrencies() {

    let url: string = `/configurator/resources/currencies?limit=300`;
    this.programService.get(url)
    .subscribe({
      next: (res: any) => {
        if(Array.isArray(res?.currencies)) {

          this.allCurrencyList = res.currencies.map((entry) => {
            return {
              name: entry?.code,
              value: entry?.id
            }
          });

          this.setProgramCurrencies();
        };
      }, error: (err: Error | any) => {
        console.error(err);
        this.alertService.error(errorHandler(err));
      }
    });
  }

  onSave(payload: any, id: string) {

    let url: string = `/configurator/programs/${this.programId}/work-locations${id ? ('/' + id) : ''}`;

    if (id) {
      this.loaderService.show();
      this.programService.put(url, payload)
        .subscribe((data: any) => {
          if (data) {
            this.alertService.success(`Work location has been updated successfully`);
            this.onSaveWorkLocation.emit(true);
            this.loaderService.hide();
            this.sidebarClose();
          }
        }, err => {
          this.loaderService.hide();
          this.alertService.error(errorHandler(err));
        }
        );
    } else {
      this.loaderService.show();
      this.programService.post(url, payload)
        .subscribe((data: any) => {
          if (data) {
            this.alertService.success(`Work location has been created successfully`);
            this.onSaveWorkLocation.emit(true);
            this.loaderService.hide();
            this.sidebarClose();
          }
        }, err => {
          this.loaderService.hide();
          this.alertService.error(errorHandler(err));
        }
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

  sidebarClose() {

    this.isViewMode = false;
    this.isEditMode = false;

    this.id = '';
    this.setProgramCurrencies();
    this.workLocationForm.reset();
    this.searchAddress._value = '';
    this.searchAddress.currentZipCode = '';
    this.searchAddress.addresstext.nativeElement.disabled = false;
    this.visibleChange.emit('hidden');
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
    let stateForm: AbstractControl = this.workLocationForm.get('state');
    if (Array.isArray(this.allCountryList)) {

      this.allCountryList.forEach((entry: any) => {
        if (countryForm?.value === entry?.id)
          this.countryShortName = entry?.iso_code_2;
      });

      stateForm.setValue(null);
      this.stateSubject.next(id);
    }
  }

  removeItem(item: string) {
    const currencyForm: AbstractControl = this.workLocationForm?.get('currency');
    currencyForm?.setValue(
      currencyForm?.value?.filter((entry: string) => (entry !== item)) ?? []
    );

    if((item === this.selectedDefaultCurrency) && (currencyForm?.value?.length)) {
      this.selectedDefaultCurrency = currencyForm.value[0];
    }
  }

  selectDefaultItem(item: any) {
    if(item?.length === 1) {
      this.selectedDefaultCurrency = item[0]?.value;
    }
  }

  get noStatePresent() {

    const countryForm: AbstractControl = this.workLocationForm.get('country');
    let country: string = countryForm?.value;

    if (!country) {
      return false;
    }

    if (Array.isArray(this.stateList) && !this.stateList.length) {
      return (this.countryMap.get(country) || 'Undefined');
    }

    return false;
  }

  trimSpace(evt: MouseEvent) {
    const target: any = evt.target;
    let value: string = target?.value;
    this.workLocationForm.get('zipcode').setValue(value.trim());
  }

  get isZipcodeMandatory() {

    const program: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if(!program?.config?.is_zipcode_mandatory)
      return false;

    return program?.config?.is_zipcode_mandatory;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
