import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, pluck, switchMap } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TaxTableComponent } from '../components/tax-table/tax-table.component';
import { TaxDetail } from '../tax-configuration.interfaces';
import { TaxConfigurationService } from '../tax-configuration.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { GlobalLaunchService,GlobalLaunchKeys } from 'src/app/control-panel/configs/global-launches/global-launch.service';

@Component({
  selector: 'app-tax-details',
  templateUrl: './tax-details.component.html',
  styleUrls: ['./tax-details.component.scss'],
})
export class TaxDetailsComponent implements OnInit, OnDestroy {
  public isCreateMode: boolean = false;
  public isViewMode: boolean = false;
  public isEditMode: boolean = false;
  public subscriptions: Array<Subscription> = [];

  public taxConfigId: string = null;
  public taxConfigForm: UntypedFormGroup;

  public hierarchyTreeInput: Array<any> = [];
  public hierarchyList: Array<{ id: string; name: string }> = [];

  public moduleList: Array<{ id: string; name: string; code: string }> = [];
  public moduleListLoading: boolean = true;

  public locationList: Array<{ id: string; name: string; code: string }> = [];
  public locationListLoading: boolean = false;
  public locationSub: Subject<{ term: string; event: string }> = new Subject<{ term: string; event: string }>();
  public locationPageCount: number = 1;
  public locationSearchTerm: string = null;
  public locationTotalRecords: number = null;

  public countryList: Array<any> = [];
  public countryListLoading: boolean = true;

  public stateList: Array<any> = [];
  public stateListLoading: boolean = false;
  public stateSub: Subject<any> = new Subject<any>();
  public statePageCount: number = 1;
  public stateSearchTerm: string = null;
  public stateTotalRecords: number = null;

  public countyList: Array<any> = [];
  public countyListLoading: boolean = false;
  public countySub: Subject<any> = new Subject<any>();
  public countyPageCount: number = 1;
  public countySearchTerm: string = null;
  public countyTotalRecords: number = null;

  public cityList: Array<any> = [];
  public cityListLoading: boolean = false;
  public citySub: Subject<any> = new Subject<any>();
  public cityPageCount: number = 1;
  public citySearchTerm: string = null;
  public cityTotalRecords: number = null;

  public isTaxDetailTouched: boolean = false;
  public taxDetailsList: Array<TaxDetail> = [];
  public taxDetailsDeletedList: Array<TaxDetail> = [];
  public taxInputForm: UntypedFormGroup = null;

  public payloadDateFormat: string = DATE_FORMAT.FORMATDDMMYY;
  public datePickerStartOptions: any = {
    language: 'English',
    timepicker: false,
    format12h: true,
    range: false,
    enabledDateRanges: [],
  };
  public datePickerEndOptions: any = {
    language: 'English',
    timepicker: false,
    format12h: true,
    range: false,
    enabledDateRanges: [],
  };

  // Mandatory fields
  private allowed_modules: Array<any> = ['JOBS', 'ASSIGNMENTS', 'SOW', 'OFFERS', 'SUBMISSIONS', 'EXPENSES', 'INVOICES'];
  private primary_fields: Array<string> = ['name', 'hierarchy', 'sourcing_model', 'category', 'allocation_method', 'modules'];

  // Decorator based data members
  @ViewChild('taxTable') taxTable: TaxTableComponent;

  constructor(
    private programService: ProgramService,
    private storage: StorageService,
    private router: ActivatedRoute,
    private route: Router,
    private alert: AlertService,
    private uniqueKeyPipe: UniqueKeyPipe,
    private customDatePipe: LocalDateFormatPipe,
    private eventStream: EventStreamService,
    private taxService: TaxConfigurationService,
    private loader: LoaderService,
    private globalLaunchService:GlobalLaunchService
  ) {}

  ngOnInit(): void {
    this.initURLData();
    this.initFormControls();
    this.initWorkLocationListener();
    this.fetchHierarchyDetails();
    this.fetchCountries();
    this.initStateListener();
    this.initCountyListener();
    this.initCityListener();
    this.fetchModules();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  // Initializer Methods
  initURLData() {
    let url: string = this.route.url;

    if (url.endsWith('/create')) {
      this.isCreateMode = true;
      return;
    }

    if (url.includes('/edit/')) this.isEditMode = true;
    if (url.includes('/view/')) this.isViewMode = true;
  }

  initFormControls() {
    this.taxConfigForm = new UntypedFormGroup({
      name: new UntypedFormControl('', Validators.required),
      status: new UntypedFormControl(true, Validators.required),
      hierarchy: new UntypedFormControl([], Validators.required),
      sourcing_model: new UntypedFormControl([], Validators.required),
      category: new UntypedFormControl(null, Validators.required),
      allocation_method: new UntypedFormControl(null, Validators.required),
      modules: new UntypedFormControl([], Validators.required),
      location: new UntypedFormControl([], Validators.required),
      tax_system: new UntypedFormControl('AUTO', Validators.required),
      country: new UntypedFormControl([], Validators.required),
      state: new UntypedFormControl([]),
      county: new UntypedFormControl([]),
      city: new UntypedFormControl([]),
    });

    this.taxInputForm = new UntypedFormGroup({
      name: new UntypedFormControl(null, [Validators.required]),
      min_value: new UntypedFormControl(null, [Validators.required]),
      max_value: new UntypedFormControl(null, [Validators.required]),
      tax_type: new UntypedFormControl(null, [Validators.required]),
      start_date: new UntypedFormControl(null, [Validators.required]),
      end_date: new UntypedFormControl(null, [Validators.required]),
    });

    this.subscriptions.push(
      this.taxInputForm.controls['start_date'].valueChanges.subscribe(date => {
        this.datePickerEndOptions = {
          ...this.datePickerEndOptions,
          enabledDateRanges: [
            {
              start: this.convertToDateNow(date),
            },
          ],
        };
      }),
    );

    this.subscriptions.push(
      this.taxInputForm.controls['end_date'].valueChanges.subscribe(date => {
        this.datePickerStartOptions = {
          ...this.datePickerStartOptions,
          enabledDateRanges: [
            {
              end: this.convertToDateNow(date),
            },
          ],
        };
      }),
    );
  }

  initWorkLocationListener() {
    this.subscriptions.push(
      this.locationSub
        .pipe(
          debounceTime(600),
          switchMap(({ term, event }) => {
            const progId = this.storage.get(StorageKeys.PROGRAM_ID);
            let url = `/configurator/programs/${progId}/work-locations?limit=20&status=true`;

            if (event === 'show') this.locationPageCount += 1;
            else this.locationPageCount = 1;
            url += `&page=${this.locationPageCount}`;

            if (term) url += `&k=${term}`;
            this.locationSearchTerm = term;

            this.locationListLoading = true;
            return this.programService.get(url);
          }),
        )
        .subscribe({
          next: (res: any) => {
            if (res) {
              this.locationListLoading = false;
              this.locationTotalRecords = res.total_records ? res.total_records : 0;
              let locations: Array<string> = res.work_locations;
              let newList: Array<any> = locations.map((entry: any) => {
                const { id, name, code } = entry;
                this.taxService.workLocationMap.set(id, name);
                return { id, name, code };
              });

              if (this.locationPageCount === 1) {
                this.locationList = newList;
              } else {
                this.locationList = this.uniqueKeyPipe.transform([...this.locationList, ...newList], 'id');
              }
            }
          },
          error: (err: Error | any) => {
            this.locationListLoading = false;
            this.alert.error(errorHandler(err));
          },
        }),
    );
  }

  initStateListener() {
    this.subscriptions.push(
      this.stateSub
        .pipe(
          distinctUntilChanged((x: any, y: any) => {
            const eventY: string = y.event;
            if (eventY === 'show' || eventY === 'change') return false;

            return x.term === y.term;
          }),
          debounceTime(800),
          switchMap(({ term, event }) => {
            let url = `/configurator/resources/states?limit=10`;
            const countries: Array<string> = this.taxConfigForm.get('country').value;
            if (!countries.includes('ALL') && countries.length) url += `&country_ids=${countries.join(',')}`;

            if (event === 'show') {
              this.statePageCount += 1;
            } else {
              this.statePageCount = 1;
            }
            url += `&page=${this.statePageCount}`;

            if (term) url += `&search_text=${term}`;
            this.stateSearchTerm = term;

            this.stateListLoading = true;
            return this.programService.get(url);
          }),
        )
        .subscribe({
          next: (res: any) => {
            if (res) {
              this.stateListLoading = false;
              this.stateTotalRecords = res.total_records ? res.total_records : 0;

              let states: Array<any> = res.states;
              states.forEach((state: any) => {
                this.taxService.stateMap.set(state.id, state.name);
              });

              if (this.statePageCount === 1) this.stateList = states;
              else this.stateList = this.uniqueKeyPipe.transform([...this.stateList, ...states], 'id');
            }
          },
          error: (err: Error | any) => {
            this.alert.error(errorHandler(err));
            this.stateListLoading = false;
          },
        }),
    );
  }

  initCountyListener() {
    this.subscriptions.push(
      this.countySub
        .pipe(
          distinctUntilChanged((x: any, y: any) => {
            const eventY: string = y.event;
            if (eventY === 'show' || eventY === 'change') return false;

            return x.term === y.term;
          }),
          debounceTime(800),
          switchMap(({ term, event }) => {
            let url = `/configurator/resources/counties?limit=10`;
            const states: Array<string> = this.taxConfigForm.get('state').value;
            if (!states.includes('ALL') && states.length) url += `&state_ids=${states.join(',')}`;
            else if (states.includes('ALL')) {
              const countries: Array<string> = this.taxConfigForm.get('country').value;
              if (!countries.includes('ALL') && countries.length) url += `&country_ids=${countries.join(',')}`;
            }

            if (event === 'show') {
              this.countyPageCount += 1;
            } else {
              this.countyPageCount = 1;
            }
            url += `&page=${this.countyPageCount}`;

            if (term) url += `&search_text=${term}`;
            this.countySearchTerm = term;

            this.countyListLoading = true;
            return this.programService.get(url);
          }),
        )
        .subscribe({
          next: (res: any) => {
            if (res) {
              this.countyListLoading = false;
              this.countyTotalRecords = res.total_records ? res.total_records : 0;

              let counties: Array<any> = res.counties;
              counties.forEach(({ id, name }) => {
                this.taxService.countyMap.set(id, name);
              });

              if (this.countyPageCount === 1) this.countyList = counties;
              else this.countyList = this.uniqueKeyPipe.transform([...this.countyList, ...counties], 'id');
            }
          },
          error: (err: Error | any) => {
            this.alert.error(errorHandler(err));
            this.countyListLoading = false;
          },
        }),
    );
  }

  initCityListener() {
    this.subscriptions.push(
      this.citySub
        .pipe(
          distinctUntilChanged((x: any, y: any) => {
            const eventY: string = y.event;
            if (eventY === 'show' || eventY === 'change') return false;

            return x.term === y.term;
          }),
          debounceTime(800),
          switchMap(({ term, event }) => {
            let url = `/configurator/resources/cities?limit=10`;
            const counties: Array<string> = this.taxConfigForm.get('county').value;
            if (!counties.includes('ALL') && counties.length) url += `&county_ids=${counties.join(',')}`;
            else if (counties.includes('ALL')) {
              const states: Array<string> = this.taxConfigForm.get('state').value;
              if (!states.includes('ALL') && states.length) url += `&state_ids=${states.join(',')}`;
              else if (states.includes('ALL')) {
                const countries: Array<string> = this.taxConfigForm.get('country').value;
                if (!countries.includes('ALL') && countries.length) url += `&country_ids=${countries.join(',')}`;
              }
            }

            if (event === 'show') {
              this.cityPageCount += 1;
            } else {
              this.cityPageCount = 1;
            }
            url += `&page=${this.cityPageCount}`;

            if (term) url += `&search_text=${term}`;
            this.citySearchTerm = term;

            this.cityListLoading = true;
            return this.programService.get(url);
          }),
        )
        .subscribe({
          next: (res: any) => {
            if (res) {
              this.cityListLoading = false;
              this.cityTotalRecords = res.total_records ? res.total_records : 0;

              let cities: Array<any> = res.cities;
              cities.forEach(({ id, name }) => {
                this.taxService.cityMap.set(id, name);
              });

              if (this.cityPageCount === 1) this.cityList = cities;
              else this.cityList = this.uniqueKeyPipe.transform([...this.cityList, ...cities], 'id');
            }
          },
          error: (err: Error | any) => {
            this.alert.error(errorHandler(err));
            this.cityListLoading = false;
          },
        }),
    );
  }

  // API call methods
  fetchTaxConfigDetails() {
    let programId: string = this.storage.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/taxes/${this.taxConfigId}`;

    this.loader.show();
    this.programService.get(url).subscribe({
      next: (res: any) => {
        if (res) {
          this.loader.hide();
          if ('tax' in res) {
            res = res.tax;
            this.parseTaxDetails(res);
          }
        }
      },
      error: (err: Error | any) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      },
    });
  }

  fetchHierarchyDetails() {
    const programId: string = this.storage.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/hierarchy`;

    this.loader.show();
    this.programService.get(url).subscribe({
      next: (res: any) => {
        if (res) {
          this.loader.hide();
          if ('result' in res) {
            res = res.result;
            this.hierarchyTreeInput = res;
            if (Array.isArray(res) && res.length) res = res[0];
          }

          if (this.isNonEmptyArray(res.hierarchies)) {
            res.hierarchies.forEach((entry: any) => {
              this.parseHierarchyDetails(entry);
            });
          }
        }

        if (!this.isCreateMode) {
          this.router.params.subscribe((params: any) => {
            this.taxConfigId = params['id'];
            this.fetchTaxConfigDetails();
          });
        }
      },
      error: (err: Error | any) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      },
    });
  }

  fetchCountries() {
    const url: string = `/configurator/resources/countries?limit=250`;
    this.programService.get(url).subscribe({
      next: (res: any) => {
        if (res) {
          this.countryListLoading = false;
          if (res.countries) {
            this.countryList = res.countries.map((country: any) => {
              const { name, id } = country;
              this.taxService.countryMap.set(id, name);
              return { name, value: id };
            });
          }
        }
      },
      error: (err: Error | any) => {
        this.countryListLoading = false;
        this.alert.error(errorHandler(err));
      },
    });
  }

  get modulesToHide() {
    let modulesToHide: Array<string> = [];
    if (!this.globalLaunchService.isglobalLaunchSlugFlagEnabled(GlobalLaunchKeys.MASTER_TALENT_PROFILE_MODULE))
      modulesToHide.push('Master Talent Profile');
    return modulesToHide;
  }

  fetchModules() {
    const url = `/configurator/resources/module-groups?limit=100`;
    this.programService
      .get(url)
      .pipe(
        pluck('module_groups'),
        map((modulegrp: Array<any>) => modulegrp.filter(grp => !this.modulesToHide.includes(grp.name))),
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.moduleListLoading = false;
            this.parseModules(res);
          }
        },
        error: (err: Error | any) => {
          this.moduleListLoading = false;
          this.alert.error(errorHandler(err));
        },
      });
  }

  onSave() {
    let payload = this.createPayload();
    this.taxConfigForm.markAllAsTouched();
    const programId = this.storage.get(StorageKeys.PROGRAM_ID);

    if (payload) {
      if (this.isCreateMode) {
        const url = `/configurator/programs/${programId}/taxes`;
        this.loader.show();

        this.programService.post(url, payload).subscribe({
          next: (res: any) => {
            if (res) {
              this.loader.hide();
              this.alert.success('Tax configuration created successully');
              this.redirectToListing();
            }
          },
          error: (err: Error | any) => {
            this.alert.error(errorHandler(err));
            this.loader.hide();
          },
        });
      }

      if (this.isEditMode) {
        const url = `/configurator/programs/${programId}/taxes/${this.taxConfigId}`;
        this.loader.show();

        this.programService.put(url, payload).subscribe({
          next: (res: any) => {
            if (res) {
              this.loader.hide();
              this.alert.success('Tax configuration updated successully');
              this.redirectToListing();
            }
          },
          error: (err: Error | any) => {
            this.alert.error(errorHandler(err));
            this.loader.hide();
          },
        });
      }
    }
  }

  createPayload(): false | any {
    let payload: any = {};
    let validPayload: boolean = true;
    const formValues: any = this.taxConfigForm.value;

    this.primary_fields.forEach((field: string) => {
      const value: any = formValues[field];
      if (Array.isArray(value) && !value.length) validPayload = false;
      else if (!value) validPayload = false;
    });

    if (!validPayload) {
      this.alert.error('Please fill all the required fields');
      return false;
    }

    payload = {
      name: formValues['name'],
      is_enabled: formValues['status'],
      hierarchy_levels: formValues['hierarchy'],
      sourcing_model: formValues['sourcing_model'],
      applicable_on: formValues['category'],
      tax_allocation_base: formValues['allocation_method'],
      modules: formValues['modules'],
      manage_tax: Boolean(formValues['tax_system'] !== 'AUTO'),
    };

    // Modules
    if (payload.modules.includes('ALL')) payload.modules = ['*'];

    // Location based allocation
    if (payload.tax_allocation_base === 'LOCATION') {
      payload.tax_allocation_base = 'WORK_LOCATION';
      payload.work_locations = formValues['location'].includes('ALL') ? ['*'] : formValues['location'];
      if (!this.isNonEmptyArray(payload.work_locations)) {
        validPayload = false;
      }
    }

    // "Region/Country" based allocation
    if (payload.tax_allocation_base === 'REGION') {
      // Mandatory
      payload.tax_allocation_base = 'COUNTRY';
      payload.countries = formValues['country'].includes('ALL') ? ['*'] : formValues['country'];
      if (!this.isNonEmptyArray(payload.countries)) {
        validPayload = false;
      }

      // Optional
      if (formValues['state'].length) {
        payload.states = formValues['state'].includes('ALL') ? ['*'] : formValues['state'];
        if (formValues['county'].length) {
          payload.counties = formValues['county'].includes('ALL') ? ['*'] : formValues['county'];
          if (formValues['city'].length) {
            payload.cities = formValues['city'].includes('ALL') ? ['*'] : formValues['city'];
          }
        }
      }
    }

    if (!validPayload) {
      this.alert.error('Please fill all the required fields');
      return false;
    }

    if (payload.manage_tax) {
      if (!this.taxDetailsList.length) {
        this.alert.error('Atleast one Tax system field is required');
        return false;
      }

      payload.tax_detail = this.taxDetailsList.map((entry: TaxDetail) => {
        let field: any = {
          name: entry.name,
          tax_type: this.renameTaxType(entry.tax_type),
          applicable_range: {
            min: parseInt(entry.min_value + '') || 0,
            max: parseInt(entry.max_value + '') || 0,
          },
          start_date: this.customDatePipe.transform(
            this.customDatePipe.transform(entry?.start_date, null, null, null, true, this.defaultDateFormat),
            this.payloadDateFormat,
          ),
          end_date: this.customDatePipe.transform(
            this.customDatePipe.transform(entry?.end_date, null, null, null, true, this.defaultDateFormat),
            this.payloadDateFormat,
          ),
        };

        if (this.isEditMode) {
          field.id = entry.id;
        }

        return field;
      });

      if (this.isEditMode) {
        // Fields to be deleted in Edit Mode
        payload.tax_detail = [
          ...payload.tax_detail,
          ...this.taxDetailsDeletedList.map((entry: TaxDetail) => {
            return {
              id: entry.id,
              name: entry.name,
              tax_type: this.renameTaxType(entry.tax_type),
              applicable_range: {
                min: parseInt(entry.min_value + '') || 0,
                max: parseInt(entry.max_value + '') || 0,
              },
              start_date: this.customDatePipe.transform(
                this.customDatePipe.transform(entry?.start_date, null, null, null, true, this.defaultDateFormat),
                this.payloadDateFormat,
              ),
              end_date: this.customDatePipe.transform(
                this.customDatePipe.transform(entry?.end_date, null, null, null, true, this.defaultDateFormat),
                this.payloadDateFormat,
              ),
              is_deleted: true,
            };
          }),
        ];
      }

      let tax_table_payload = this.parseTaxTable();
      if (!tax_table_payload) return false;

      payload.tax_table = tax_table_payload;
    }

    return payload;
  }

  // Functional Methods
  parseTaxTable(): null | any {
    let validity: boolean = true;
    document.querySelector('input').blur();
    let htmlContent: any = document.querySelector('.error-border');
    if (htmlContent !== null) {
      this.alert.error('Please fill the required fields in tax table');
      return null;
    }

    const columns: Array<any> = this.taxTable.taxTableConfig.columns;
    let colTypeMap: Map<string, string> = new Map<string, string>();
    columns.forEach((column: any) => {
      const { headerKey, type } = column;
      colTypeMap.set(headerKey, type);
    });

    let result: Array<any> = [];
    const entries: Array<any> = this.taxTable.taxTableEntries;
    entries.forEach((entry: any, it: number) => {
      let taxEntry: any = {};
      let entryKeys: Array<string> = [...Object.keys(entry)];
      entryKeys.forEach((key: string) => {
        let colType: string = colTypeMap.get(key);
        switch (colType) {
          case 'READONLY':
            taxEntry = {
              ...taxEntry,
              [key]: entry[key].name,
            };
            break;

          case 'SELECT':
            if (!(entry[key].selected instanceof Array)) {
              taxEntry = {
                ...taxEntry,
                [key]: entry[key].selected,
              };
            } else {
              let selections: Array<any> = [];
              entry[key].selected.forEach((id: string) => {
                let label: string = null;

                if (key === 'work_location') label = this.taxService.workLocationMap.get(id) || 'Undefined';
                if (key === 'country') label = this.taxService.countryMap.get(id) || 'Undefined';
                if (key === 'state') label = this.taxService.stateMap.get(id) || 'Undefined';
                if (key === 'city') label = this.taxService.cityMap.get(id) || 'Undefined';
                if (key === 'county') label = this.taxService.workLocationMap.get(id) || 'Undefined';

                if (label) selections.push({ id, name: label });
                else selections.push(id);
              });

              taxEntry = {
                ...taxEntry,
                [key]: selections,
              };
            }
            break;

          case 'DATEPICKER':
            taxEntry = {
              ...taxEntry,
              [key]: {
                start_date: this.customDatePipe.transform(
                  this.customDatePipe.transform(entry?.[key]?.start_date, null, null, null, true, this.defaultDateFormat),
                  this.payloadDateFormat,
                ),
                end_date: this.customDatePipe.transform(
                  this.customDatePipe.transform(entry?.[key]?.end_date, null, null, null, true, this.defaultDateFormat),
                  this.payloadDateFormat,
                ),
              },
            };
            break;

          case 'NUMBER':
            taxEntry = {
              ...taxEntry,
              [key]: entry[key].value,
            };
            break;

          case 'NUMBER-RANGE':
            taxEntry = {
              ...taxEntry,
              [key]: {
                min: entry[key].min_value,
                max: entry[key].max_value,
              },
            };
            break;

          default:
            console.log(`"parseTaxTable()": Column type not found (${colType}) for column: ${key}`);
        }
      });

      if (it < entries.length - 1) {
        if ('tax_range' in taxEntry) {
          let min: any = parseInt(taxEntry['tax_range'].min);
          let max: any = parseInt(taxEntry['tax_range'].max);
          if (Number.isInteger(min) && Number.isInteger(max)) {
            if (parseInt(min) > parseInt(max)) {
              this.alert.error(`Min tax greater than max tax range for row: ${it + 1}`);
              validity = false;
              return null;
            }
            if ('tax_value' in taxEntry) {
              let value: number = parseFloat(taxEntry['tax_value']);
              if (value < parseFloat(min)) {
                this.alert.error(`Tax value smaller than min tax range for row: ${it + 1}`);
                validity = false;
                return null;
              }
              if (value > parseFloat(max)) {
                this.alert.error(`Tax value greater than max tax range for row: ${it + 1}`);
                validity = false;
                return null;
              }
            }
          }
        }

        if ('date_range' in taxEntry) {
          const { start_date, end_date } = taxEntry['date_range'];
          if (start_date && end_date && !this.validDateRange(start_date, end_date)) {
            this.alert.error(`Start date greater end date range for row: ${it + 1}`);
            validity = false;
            return null;
          }
        }

        result.push(taxEntry);
      }
    });

    return validity ? result : null;
  }

  parseTaxDetails(res: any): void {
    const form: AbstractControl = this.taxConfigForm;

    // Name
    if ('name' in res) form.get('name').setValue(res.name);

    // Status
    if ('is_enabled' in res) form.get('status').setValue(res.is_enabled);

    // Hierarchy
    if ('hierarchies' in res) {
      let hierarchies: Array<string> = this.parseNameValuePairWithMapping(res.hierarchies, 'id', 'name');
      if (Array.isArray(hierarchies)) form.get('hierarchy').setValue(hierarchies);
    }

    // Sourcing Model
    if ('sourcing_model' in res) {
      if (Array.isArray(res.sourcing_model)) {
        form.get('sourcing_model').setValue(res.sourcing_model);
      }
    }

    // Tax Applicable
    if ('applicable_on' in res) {
      let category: string = res.applicable_on;
      if (category && category.includes('CLIENT')) form.get('category').setValue('CLIENT');
      if (category && category.includes('VENDOR')) form.get('category').setValue('VENDOR');
    }

    // Allocation Method
    if ('tax_allocation_base' in res) {
      let allocation_method: string = res.tax_allocation_base;
      if (allocation_method === 'COUNTRY') form.get('allocation_method').setValue('REGION');
      if (allocation_method === 'WORK_LOCATION') form.get('allocation_method').setValue('LOCATION');
    }

    // Work Location
    if ('work_locations' in res) {
      let work_location: any = this.parseNameValuePairWithMapping(res.work_locations, 'id', 'name', this.taxService.workLocationMap);
      if (work_location === 'All') {
        form.get('location').setValue(['ALL']);
      }
      if (Array.isArray(work_location)) {
        if (work_location.includes('All')) form.get('location').setValue(['ALL']);
        else {
          form.get('location').setValue(work_location);
          let newOpts: Array<any> = work_location.map((id: string) => {
            return {
              id: id,
              name: this.taxService.workLocationMap.get(id) || id,
            };
          });
          this.locationList = this.uniqueKeyPipe.transform([...this.locationList, ...newOpts], 'id');
        }
      }
    }

    // Country
    if ('countries' in res) {
      let countries: any = this.parseNameValuePairWithMapping(res.countries, 'id', 'name', this.taxService.countryMap);
      if (countries === 'All') {
        form.get('country').setValue(['ALL']);
      }
      if (Array.isArray(countries)) {
        if (countries.includes('All')) form.get('country').setValue(['ALL']);
        else form.get('country').setValue(countries);
      }
    }

    // State
    if ('states' in res) {
      let states: any = this.parseNameValuePairWithMapping(res.states, 'id', 'name', this.taxService.stateMap);
      if (states === 'All') {
        form.get('state').setValue(['ALL']);
      }
      if (Array.isArray(states)) {
        if (states.includes('All')) form.get('state').setValue(['ALL']);
        else {
          form.get('state').setValue(states);
          let newOpts: Array<any> = states.map((id: string) => {
            return {
              id: id,
              name: this.taxService.stateMap.get(id) || id,
            };
          });
          this.stateList = this.uniqueKeyPipe.transform([...this.stateList, ...newOpts], 'id');
        }
      }
    }

    // County
    if ('counties' in res) {
      let counties: any = this.parseNameValuePairWithMapping(res.counties, 'id', 'name', this.taxService.countyMap);
      if (counties === 'All') {
        form.get('county').setValue(['ALL']);
      }
      if (Array.isArray(counties)) {
        if (counties.includes('All')) form.get('county').setValue(['ALL']);
        else {
          form.get('county').setValue(counties);
          let newOpts: Array<any> = counties.map((id: string) => {
            return {
              id: id,
              name: this.taxService.countyMap.get(id) || id,
            };
          });
          this.countyList = this.uniqueKeyPipe.transform([...this.countyList, ...newOpts], 'id');
        }
      }
    }

    // City
    if ('cities' in res) {
      let cities: any = this.parseNameValuePairWithMapping(res.cities, 'id', 'name', this.taxService.cityMap);
      if (cities === 'All') {
        form.get('city').setValue(['ALL']);
      }
      if (Array.isArray(cities)) {
        if (cities.includes('All')) form.get('city').setValue(['ALL']);
        else {
          form.get('city').setValue(cities);
          let newOpts: Array<any> = cities.map((id: string) => {
            return {
              id: id,
              name: this.taxService.cityMap.get(id) || id,
            };
          });
          this.cityList = this.uniqueKeyPipe.transform([...this.cityList, ...newOpts], 'id');
        }
      }
    }

    // Modules
    if ('modules' in res) {
      let modules: any = this.parseNameValuePairWithMapping(res.modules, 'id', 'name');
      if (modules === 'All') {
        form.get('modules').setValue(['ALL']);
      }
      if (Array.isArray(modules)) {
        if (modules.includes('All')) form.get('modules').setValue(['ALL']);
        else form.get('modules').setValue(modules);
      }
    }

    // Tax System
    if ('manage_tax' in res) {
      form.get('tax_system').setValue(res.manage_tax ? 'MANUAL' : 'AUTO');
    }

    // Tax Type
    if ('tax_details' in res) {
      const details: Array<any> = res.tax_details;
      if (Array.isArray(details)) {
        this.taxDetailsList = details.map((entry: any): TaxDetail => {
          return {
            id: entry.id,
            name: entry.name,
            tax_type: this.renameTaxType(entry.tax_type),
            min_value: entry.applicable_range.min,
            max_value: entry.applicable_range.max,
            start_date: this.customDatePipe.transform(
              this.customDatePipe.transform(entry?.start_date, null, null, null, true, this.payloadDateFormat),
              this.defaultDateFormat,
            ),
            end_date: this.customDatePipe.transform(
              this.customDatePipe.transform(entry?.end_date, null, null, null, true, this.payloadDateFormat),
              this.defaultDateFormat,
            ),
          };
        });

        this.emitTaxDetailListChange();
      }
    }

    // Tax Table
    if ('tax_table' in res) {
      setTimeout(() => {
        this.eventStream.emit(new EmitEvent(Events.TAX_TABLE_ENTRY_OVERRIDE, res.tax_table));
      }, 1200);
    }
  }

  parseNameValuePairWithMapping(input: Array<any>, key: string, val: string, map: Map<any, any> = null) {
    if (!Array.isArray(input)) return input;
    else if (input.length && typeof input[0] === 'string') {
      return input;
    }

    let mapped_result = input?.map((entry: any) => {
      let $key: string = entry[key];
      let $val: string = entry[val];

      if ($key && $val) {
        if (map) map.set($key, $val);
        return $key;
      }

      return null;
    });

    let final_result = mapped_result?.filter((id: string) => id !== null);
    return final_result;
  }

  parseHierarchyDetails(res: any) {
    const { id, name, hierarchies, is_enabled } = res;
    if (id && name && is_enabled) {
      this.hierarchyList.push({ id, name });
      this.taxService.hierarchyMap.set(id, name);
    }

    if (Array.isArray(hierarchies)) {
      hierarchies.forEach((hierarchy: any) => {
        this.parseHierarchyDetails(hierarchy);
      });
    }
  }

  parseModules(module_groups: any) {
    if (module_groups) {
      let groups: Array<any> = module_groups;
      groups.forEach((group: any) => {
          if ('modules' in group) {
            let modules: Array<any> = group.modules;
            if (Array.isArray(modules)) {
              modules.forEach((module: any) => {
                const { id, name, code } = module;
                if (id && name && code && this.allowed_modules.includes(code)) {
                  this.taxService.moduleMap.set(id, name);
                  this.moduleList.push({ id, name, code });
                }
              });
            }
          }
        }
      );
    }
  }

  toggleStatus(evt: string) {
    if (!this.isViewMode) {
      this.taxConfigForm.get('status').setValue(evt);
    }
  }

  changeAllocationMethod(evt: string) {}

  searchForStates() {
    const countryForm: AbstractControl = this.taxConfigForm.get('country');
    const countyForm: AbstractControl = this.taxConfigForm.get('county');
    const stateForm: AbstractControl = this.taxConfigForm.get('state');
    const cityForm: AbstractControl = this.taxConfigForm.get('city');

    let selectedCountries: Array<string> = countryForm.value;
    // Reset initial state selection
    if (!selectedCountries.includes('ALL')) {
      cityForm.setValue([]);
      countyForm.setValue([]);
      stateForm.setValue([]);
    }

    if (this.countrySelected) {
      this.stateSub.next({ term: '', event: 'change' });
    }
  }

  searchForCounties() {
    const countyForm: AbstractControl = this.taxConfigForm.get('county');
    const stateForm: AbstractControl = this.taxConfigForm.get('state');
    const cityForm: AbstractControl = this.taxConfigForm.get('city');

    let selectedStates: Array<string> = stateForm.value;
    // Reset initial state selection
    if (!selectedStates.includes('ALL')) {
      cityForm.setValue([]);
      countyForm.setValue([]);
    }

    if (this.stateSelected) {
      this.countySub.next({ term: '', event: 'change' });
    }
  }

  searchForCities() {
    const countyForm: AbstractControl = this.taxConfigForm.get('county');
    const cityForm: AbstractControl = this.taxConfigForm.get('city');

    let selectedCounties: Array<string> = countyForm.value;
    // Reset initial state selection
    if (!selectedCounties.includes('ALL')) {
      cityForm.setValue([]);
    }

    if (this.countySelected) {
      this.citySub.next({ term: '', event: 'change' });
    }
  }

  addTaxDetail() {
    if (this.isViewMode) return;

    this.taxInputForm.markAllAsTouched();
    if (this.taxInputForm.valid) {
      let taxDetailNamesList: Array<string> = this.taxDetailsList.map((entry: TaxDetail) => entry.name.trim().toLowerCase());
      if (taxDetailNamesList.includes(this.taxDetailsInput.name.split(/[ ]+/gi).join(' ').trim().toLowerCase())) {
        this.alert.error('Tax Name should be unique for every entry');
        return;
      }

      if (!this.isTaxRangeValid) {
        this.alert.error('Minimum tax value greater than maximum applicable range');
        return;
      }

      this.taxDetailsList.push({
        ...this.taxDetailsInput,
        name: this.taxDetailsInput.name.split(/[ ]+/gi).join(' ').trim(),
      });

      this.taxInputForm.reset();
      this.taxInputForm.markAsUntouched();
      this.datePickerStartOptions = {
        language: 'English',
        timepicker: true,
        format12h: true,
        range: false,
        enabledDateRanges: [],
      };

      this.datePickerEndOptions = {
        language: 'English',
        timepicker: true,
        format12h: true,
        range: false,
        enabledDateRanges: [],
      };

      this.emitTaxDetailListChange();
    } else {
      this.alert.error('Please fill all the required fields');
      return;
    }
  }

  editTaxDetail(index: number) {
    let editEntry: TaxDetail = this.taxDetailsList[index];
    this.taxDetailsList = this.taxDetailsList.filter((entry: any, it: number) => {
      return it !== index;
    });

    const { name, min_value, max_value, start_date, end_date, tax_type } = editEntry;
    this.taxInputForm.get('name').setValue(name);
    this.taxInputForm.get('min_value').setValue(min_value);
    this.taxInputForm.get('max_value').setValue(max_value);
    this.taxInputForm.get('start_date').setValue(start_date);
    this.taxInputForm.get('end_date').setValue(end_date);
    this.taxInputForm.get('tax_type').setValue(tax_type);
    this.taxDetailsDeletedList.push(editEntry);
    this.emitTaxDetailListChange();
  }

  removeTaxDetail(index: number) {
    this.taxDetailsDeletedList.push(this.taxDetailsList[index]);
    this.taxDetailsList = this.taxDetailsList.filter((entry: any, it: number) => {
      return it !== index;
    });
    this.emitTaxDetailListChange();
  }

  emitTaxDetailListChange() {
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.TAX_DETAIL_LIST_CHANGED, this.taxDetailsList));
    }, 600);
  }

  changeHierarchySelections(newVal: any) {
    const oldVal: Array<any> = this.taxConfigForm.get('hierarchy').value || [];
    if (!this.taxService.compareLists(oldVal, newVal)) {
      let hierarchyForm: AbstractControl = this.taxConfigForm.get('hierarchy');
      hierarchyForm.setValue(newVal);
      if (newVal.length) {
        hierarchyForm.markAsTouched();
      }
    }
  }

  disableAllOption(name: string) {
    const controlRef: AbstractControl = this.taxConfigForm.get(name);
    if (controlRef.value.length === 0) return false;

    if (controlRef.value.includes('ALL')) return false;

    return true;
  }

  redirectToListing() {
    this.route.navigate(['tax-configuration', 'list']);
  }

  isNonEmptyArray(data: any) {
    return data && Array.isArray(data) && data.length;
  }

  convertToDMYY(timestamp: number) {
    let date: Date = new Date(timestamp * 1000);
    return this.customDatePipe.transform(date, this.payloadDateFormat);
  }

  renameTaxType(val: string): any {
    if (val === 'FLAT') return 'FIXED';
    if (val === 'PERCENTAGE') return 'PERCENT';
    if (val === 'FIXED') return 'FLAT';
    if (val === 'PERCENT') return 'PERCENTAGE';
    return null;
  }

  validDateRange(start_date: string = '', end_date: string = '') {
    let startDate: Date = new Date(start_date.split('/').reverse().join('-'));
    let endDate: Date = new Date(end_date.split('/').reverse().join('-'));
    if (startDate > endDate) return false;
    return true;
  }

  convertToDateNow(date: string) {
    if (!date) {
      return new Date();
    }

    return new Date(
      this.customDatePipe.transform(
        this.customDatePipe.transform(date, null, null, null, true, this.defaultDateFormat),
        DATE_FORMAT?.FORMATYMD,
      ),
    );
  }

  // Template GET Methods
  get displayHeader() {
    if (this.isCreateMode) return 'Create Tax Configuration';
    if (this.isViewMode) return 'View Tax Configuration';

    return 'Edit Tax Configuration';
  }

  get selectedTaxAllocation() {
    return this.taxConfigForm.get('allocation_method').value;
  }

  get countrySelected() {
    return this.taxConfigForm.get('country').valid;
  }

  get stateSelected() {
    return this.taxConfigForm.get('state').value.length !== 0;
  }

  get countySelected() {
    return this.taxConfigForm.get('county').value.length !== 0;
  }

  get isManualTaxSystemSelected() {
    return this.taxConfigForm.get('tax_system').value === 'MANUAL';
  }

  get isTaxRangeValid() {
    let min_range = Number.parseInt(this.taxDetailsInput['min_value']);
    let max_range = Number.parseInt(this.taxDetailsInput['max_value']);
    if (Number.isInteger(min_range) && Number.isInteger(max_range)) {
      if (min_range <= max_range) {
        return true;
      }
    }

    return false;
  }

  get displayHierarchyList() {
    const values: Array<string> = this.taxConfigForm.get('hierarchy').value;
    let names: Array<string> = values.map((id: string) => this.taxService.hierarchyMap.get(id) || id);
    return names.join(', ');
  }

  get displayAllocationMethod() {
    const value: string = this.taxConfigForm.get('allocation_method').value;
    if (value === 'REGION') return 'Country/Region';
    if (value === 'LOCATION') return 'Work Location';
    return 'Undefined';
  }

  get displayWorkLocations() {
    const values: Array<string> = this.taxConfigForm.get('location').value;
    if (values.includes('All')) return 'All';

    let names: Array<string> = values.map((id: string) => this.taxService.workLocationMap.get(id) || id);
    return names.join(', ');
  }

  get displayModules() {
    const values: Array<string> = this.taxConfigForm.get('modules').value;
    if (values.includes('All')) return 'All';

    let names: Array<string> = values.map((id: string) => this.taxService.moduleMap.get(id) || id);
    return names.join(', ');
  }

  get displayTaxSystem() {
    const value: string = this.taxConfigForm.get('tax_system').value;
    if (value === 'MANUAL') return 'Configure the tax for system user to enter value';
    return 'Allow system user to enter tax name (self-driven)';
  }

  get displayCountries() {
    const values: Array<string> = this.taxConfigForm.get('country').value;
    if (values.includes('All')) return 'All';

    let names: Array<string> = values.map((id: string) => this.taxService.countryMap.get(id) || id);
    return names.join(', ');
  }

  get displayStates() {
    const values: Array<string> = this.taxConfigForm.get('state').value;
    if (values.includes('All')) return 'All';

    let names: Array<string> = values.map((id: string) => this.taxService.stateMap.get(id) || id);
    return names.join(', ');
  }

  get displayCounties() {
    const values: Array<string> = this.taxConfigForm.get('county').value;
    if (values.includes('All')) return 'All';

    let names: Array<string> = values.map((id: string) => this.taxService.countyMap.get(id) || id);
    return names.join(', ');
  }

  get displayCities() {
    const values: Array<string> = this.taxConfigForm.get('city').value;
    if (values.includes('All')) return 'All';

    let names: Array<string> = values.map((id: string) => this.taxService.cityMap.get(id) || id);
    return names.join(', ');
  }

  get isTaxTableApplicable() {
    if (this.taxDetailsList && !this.taxDetailsList.length) {
      return false;
    }

    const form: AbstractControl = this.taxConfigForm;
    let validity: boolean = true;

    // Validation check for primitive fields
    this.primary_fields.forEach((name: string) => {
      if (form.get(name).invalid) validity = false;
    });

    if (!validity) return false;

    let allocation_method = form.get('allocation_method').value;
    if (allocation_method === 'LOCATION') {
      let locations: Array<any> = form.get('location').value;
      if (!locations.length) return false;
    } else if (allocation_method === 'REGION') {
      let countries: Array<any> = form.get('country').value;
      if (!countries.length) return false;
    }

    return true;
  }

  get taxDetailsInput() {
    return this.taxInputForm.value;
  }

  get defaultDateFormat(): string {
    let format: string = this.storage.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat ?? DATE_FORMAT.FORMATMDY;
    while (format.includes('D')) {
      format = format.replace('D', 'd');
    }

    return format;
  }
}
