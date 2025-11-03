import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { forkJoin, interval, Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, filter, switchMap, takeUntil } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { DragTableColumn, DragTableConfig } from 'src/app/shared/components/svms-drag-table/svms-drag-table.interfaces';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { TaxDetail } from '../../tax-configuration.interfaces';
import { TaxConfigurationService } from '../../tax-configuration.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';

@Component({
  selector: 'app-tax-table',
  templateUrl: './tax-table.component.html',
  styleUrls: ['./tax-table.component.scss']
})
export class TaxTableComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

  public taxTableConfig: DragTableConfig = null;
  public taxTableEntries: Array<any> = [];
  public manualTaxList: Array<any> = null;
  public columnTypeMap: Map <string, string> = new Map <string, string> ();
  public taxTypeOptions: Array <any> = [{
    name: 'Percentage',
    value: 'PERCENTAGE'
  }, {
    name: 'Flat',
    value: 'FLAT'
  }];

  private locationPageCount: number = 1;
  private locationRecordCount: number = 0;
  private locationSearchTerm: string = null;
  public workLocations: Array<string> = [];
  public isAllWorkLocationSelected: boolean = false;
  public allWorkLocationList: Array<{ name: string, value: string }> = [];
  @Input('work_location') set workLocation(data: Array<string>) {
    this.isAllWorkLocationSelected = data.includes('ALL');
    this.workLocations = [];
    this.workLocations = data;
  };

  private statePageCount: number = 1;
  private stateRecordCount: number = 0;
  private stateSearchTerm: string = null;
  public states: Array <string> = [];
  public isAllStateSelected: boolean = false;
  public allStateList: Array <{ name: string, value: string }> = [];
  @Input('state') set setStates(data: Array <string>) {
    this.isAllStateSelected = data.includes('ALL');
    this.states = [];
    this.states = data;
  }

  private countyPageCount: number = 1;
  private countyRecordCount: number = 0;
  private countySearchTerm: string = null;
  public counties: Array <string> = [];
  public isAllCountySelected: boolean = false;
  public allCountyList: Array <{ name: string, value: string }> = [];
  @Input('county') set setCounty(data: Array <string>) {
    this.isAllCountySelected = data.includes('ALL');
    this.counties = [];
    this.counties = data;
  }

  private cityPageCount: number = 1;
  private cityRecordCount: number = 0;
  private citySearchTerm: string = null;
  public cities: Array <string> = [];
  public isAllCitySelected: boolean = false;
  public allCityList: Array <{ name: string, value: string }> = [];
  @Input('city') set setCity(data: Array <string>) {
    this.isAllCitySelected = data.includes('ALL');
    this.cities = [];
    this.cities = data;
  }

  private subscriptions: Array<Subscription> = [];
  private changeDetectorSub: Subject<void> = new Subject<void>();
  private rowHashList: Array <Array <string>> = [];

  public currentHierarchyOptions: Array <any> = [];
  public currentSourcingOptions: Array <any> = [];
  public currentCountryOptions: Array <any> = [];
  public currentStateOptions: Array <any> = [];
  public currentCountyOptions: Array <any> = [];
  public currentCityOptions: Array <any> = [];

  @Input() hierarchy: Array<string> = null;
  @Input() sourcing_model: Array<string> = null;
  @Input() category: string = null
  @Input() allocation_method: string = null;
  @Input() isViewMode: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() allCountryList: Array <any> = [];
  @Input() country: Array <string> = [];

  // Fields for multiple date format support
  @Input() defaultDateFormat: any = DATE_FORMAT.FORMATMDY;
  @Input() payloadDateFormat: any = DATE_FORMAT.FORMATDDMMYY;

  // Data members only used for view/edit mode
  public allowEntryAppend: boolean = false;
  public appendInputEntry: any = null;
  public $destroyIntervalSub: Subject <void> = new Subject <void> ();

  constructor (
    private eventStream: EventStreamService,
    private taxService: TaxConfigurationService,
    private storage: StorageService,
    private programService: ProgramService,
    private alert: AlertService,
    private uniqueKeyPipe: UniqueKeyPipe,
    private customDatePipe: LocalDateFormatPipe
  ) { }

  ngOnInit(): void {

    // Change detector
    this.subscriptions.push(
      this.changeDetectorSub
        .subscribe({
          next: (data: any) => {

            console.log('Rendering started at ', new Date());

            // Update hierarchy options
            this.currentHierarchyOptions = [
              ...this.hierarchy.map((id: string) => {
                return {
                  name: (this.taxService.hierarchyMap.get(id) || 'Undefined'),
                  value: id
                }
              })
            ];

            // Update sourcing options
            this.currentSourcingOptions = [
              ...this.sourcing_model.map((id: string) => {
                let name;
                if (id === 'SOW')
                  name = 'SOW';
                if (id === 'CONTINGENT')
                  name = 'Contingent';
                if (id === 'DIRECT_SOURCING')
                  name = 'Direct Sourcing';
                return { name, value: id };
              })
            ];

            // Update Country options
            if (this.country.includes('ALL')) {
              this.currentCountryOptions = this.allCountryList;
            } else {
              this.currentCountryOptions = this.country.map((id: string) => {
                return {
                  name: (this.taxService.countryMap.get(id) || 'Undefined'),
                  value: id
                };
              });
            }

            // Update State options
            if (this.states.includes('ALL')) {
              this.currentStateOptions = this.allStateList;
            } else {
              this.currentStateOptions = this.states.map((id: string) => {
                return {
                  name: (this.taxService.stateMap.get(id) || 'Undefined'),
                  value: id
                };
              });
            }

            // Update County options
            if (this.counties.includes('ALL')) {
              this.currentCountyOptions = this.allCountyList;
            } else {
              this.currentCountyOptions = this.counties.map((id: string) => {
                return {
                  name: (this.taxService.countyMap.get(id) || 'Undefined'),
                  value: id
                };
              });
            }

            // Update City options
            if (this.cities.includes('ALL')) {
              this.currentCityOptions = this.allCityList;
            } else {
              this.currentCityOptions = this.cities.map((id: string) => {
                return {
                  name: (this.taxService.cityMap.get(id) || 'Undefined'),
                  value: id
                };
              });
            }

            this.initTaxTableColumns();

          }, error: (err: Error) => {
            console.error(err);
          }
        })
    );

    // Change detector (Tax Details)
    this.subscriptions.push(
      this.eventStream.on(Events.TAX_DETAIL_LIST_CHANGED)
        .pipe(debounceTime(600))
        .subscribe((list: Array<any>) => {
          if(this.isViewMode || this.isEditMode)
            this.allowEntryAppend = true;
          this.manualTaxList = list;
          this.changeDetectorSub.next();
        })
    );

    // Change listener (ng-select)
    this.subscriptions.push(
      this.eventStream.on(Events.DRAG_TABLE_FIELD_CHANGED)
        .subscribe(res => {
          if (res) {
            const index: number = res.index;
            const columnKey: string = res.column;
            const selections: any = res.data;

            switch(columnKey) {

              case 'tax_name': 
                this.fillTaxDetails(index, selections);
                break;

              case 'country':
                if(this.isNonEmptyArray(this.states))
                  this.taxTableEntries[index].state.selected = [];

              case 'state':
                if(this.isNonEmptyArray(this.counties))
                  this.taxTableEntries[index].county.selected = [];

              case 'county':
                if(this.isNonEmptyArray(this.cities))
                  this.taxTableEntries[index].city.selected = [];

              case 'hierarchy':
              case 'sourcing_model':
              case 'work_location':
              case 'city':
                if(index < this.taxTableEntries.length) {
                  console.log(`Hashes update for row: ${index}`);
                  let newHashList: Array <string> = this.generateEntryHash(index);
                  this.rowHashList[index] = newHashList;
                }
                break;
                
            }
          }
        }
      )
    );

    // Change listener (Icon click)
    this.subscriptions.push(
      this.eventStream.on(Events.DRAG_TABLE_ICON_CLICKED)
        .subscribe(res => {
          if (res) {

            const index: number = res.index;
            const icon_name: string = res.name;
            console.log(`"Events.DRAG_TABLE_ICON_CLICKED": ${icon_name}, rowIndex: ${index}`);

            if (icon_name === 'delete') {
              this.taxTableEntries.splice(index, 1);
              this.rowHashList.splice(index, 1);
              this.refreshIconEntries();
            }

            if (icon_name === 'add') {
              if (this.isValidTaxTableRow())
                this.attachNewRow();  
            }

          }
        })
    );

    // Search listener (ng-select)
    this.subscriptions.push(
      this.eventStream.on(Events.DRAG_TABLE_SEARCH)
        .pipe(debounceTime(600),
          switchMap(res => {

            let httpCall: Observable<any> = of(null);
            const {name} = res;

            switch (name) {

              case 'work_location':
                if (this.isAllWorkLocationSelected)
                  httpCall = this.getWorkLocationURL(res);
                break;

              case 'state':
                if(this.isAllStateSelected)
                  httpCall = this.getStateURL(res);
                break;

              case 'county':
                if(this.isAllCountySelected)
                  httpCall = this.getCountyURL(res);
                break;

              case 'city':
                if(this.isAllCitySelected)
                  httpCall = this.getCityURL(res);
                break;

              default:
                console.log(`"Events.DRAG_TABLE_SEARCH": Case not handled for column: ${name}`);

            }


            return forkJoin([of(res), httpCall]);
          })
        )
        .subscribe({
          next: (res: any) => {
            if (res && Array.isArray(res) && res.length) {

              const input: any = res[0];
              const output: any = res[1];

              switch (input.name) {

                case 'work_location':
                  this.parseLocationResponse(input, output);
                  break;

                case 'state':
                  this.parseStateResponse(input, output);
                  break;

                case 'county':
                  this.parseCountyResponse(input, output);
                  break;

                case 'city':
                  this.parseCityResponse(input, output);
                  break;

                default:
                  // Check allowed entries
                  if (input.open) {
                    const rowIndex: number = input.row;
                    const columnKey: string = input.name;
                    if ((rowIndex >= 0) && columnKey) {
                      this.disableUsedCombinations(rowIndex, columnKey);
                    }
                  }

              }
            }
          }, error: (err: Error) => {
            console.error(err);
            this.alert.error('Error encountered while fetching entries');
          }
        })
    );

    // Drag Event Listener
    this.subscriptions.push(
      this.eventStream.on(Events.DRAG_TABLE_ENTRY_MOVED)
        .subscribe((evt: any) => {
          if(evt) {
            const { start, end } = evt;
            let startEntry = this.rowHashList[start];
            this.rowHashList[start] = this.rowHashList[end];
            this.rowHashList[end] = startEntry;
          }
        }
      )
    );

    // Event listener for populating entries
    this.subscriptions.push(
      this.eventStream.on(Events.TAX_TABLE_ENTRY_OVERRIDE)
      .pipe(takeUntil(this.$destroyIntervalSub))
      .subscribe((result: Array <any>) => {
        this.appendInputEntry = result;
      })
    );

    // Helper listener for populating entries
    if(this.isViewMode || this.isEditMode) {
      this.subscriptions.push(
        interval(400)
        .pipe(
          takeUntil(this.$destroyIntervalSub),
          filter((res) => ((this.allowEntryAppend === true) && (this.appendInputEntry !== null)))   
        )
        .subscribe((res: any) => {

          let result = this.appendInputEntry;
          this.taxTableEntries = [];
          this.rowHashList = [];
  
          if(this.isViewMode) {
            this.taxTableConfig.showDraggable = false;
          } else {
            this.taxTableConfig.showDraggable = true;
          }
  
          if(Array.isArray(result)) {
            result.forEach((entry: any, it: number) => {
  
              this.attachNewRow();
              let entryKeys: Array <string> = [...Object.keys(entry)];
              entryKeys.forEach((key: string) => {
                let colType: string = this.columnTypeMap.get(key);
                switch(colType) {
  
                  case 'READONLY':
                    this.taxTableEntries[it][key] = {
                      ...this.taxTableEntries[it][key],
                      'name': entry[key]
                    }                
                    break;
  
                  case 'NUMBER':
                    this.taxTableEntries[it][key] = {
                      ...this.taxTableEntries[it][key],
                      'value': entry[key],
                      'disabled': this.isViewMode
                    }
                    break;
  
                  case 'NUMBER-RANGE':
                    this.taxTableEntries[it][key] = {
                      ...this.taxTableEntries[it][key],
                      'min_value': entry[key].min,
                      'max_value': entry[key].max,
                      'disabled': this.isViewMode
                    }
                    break;
  
                  case 'SELECT':
  
                    let case_one: boolean = !(entry[key] instanceof Array);
                    let case_two: boolean = !entry[key].length;
                    let case_three: boolean = (typeof entry[key][0] === 'string');
                    if(case_one || case_two || case_three) {
                      this.taxTableEntries[it][key] = {
                        ...this.taxTableEntries[it][key],
                        'selected': entry[key],
                        'disabled': this.isViewMode
                      }
                    } else {
                    
                      let newOptions: Array <any> = entry[key].map((obj: any) => {
  
                        const { name, id } = obj;
  
                        if(key === 'work_location')
                          (this.taxService.workLocationMap.set(id, name || 'Undefined'));
                        if(key === 'country')
                          (this.taxService.countryMap.set(id, name || 'Undefined'));
                        if(key === 'state')
                          (this.taxService.stateMap.set(id, name || 'Undefined'));
                        if(key === 'city')
                          (this.taxService.cityMap.set(id, name || 'Undefined'));
                        if(key === 'county')
                          (this.taxService.workLocationMap.set(id, name || 'Undefined'));
  
                        return { name, value: obj.id };
  
                      });
  
                      this.taxTableEntries[it][key] = {
                        ...this.taxTableEntries[it][key],
                        'selected': entry[key].map((obj: any) => obj.id),
                        'disabled': this.isViewMode,
                        'options': this.uniqueKeyPipe.transform([...this.taxTableEntries[it][key].options, ...newOptions], 'value')
                      }
                    }
                    break;

                  case 'DATEPICKER':
                    this.taxTableEntries[it][key] = {
                      ...this.taxTableEntries[it][key],
                      'start_date': this.customDatePipe.transform(
                        this.customDatePipe.transform(entry?.[key]?.start_date, null, null, null, true, this.payloadDateFormat),
                        this.defaultDateFormat
                      ),
                      'end_date': this.customDatePipe.transform(
                        this.customDatePipe.transform(entry?.[key]?.end_date, null, null, null, true, this.payloadDateFormat),
                        this.defaultDateFormat
                      ),
                      'disabled': this.isViewMode
                    }
                    break;

                  default:
                    console.log(`"Events.TAX_TABLE_ENTRY_OVERRIDE": Column type not found/handled for ${key}: ${colType}`)
                    break;
                }
              });

              // Add Entry Hash for that row
              let newHashList: Array <string> = this.generateEntryHash(it);
              this.rowHashList[it] = newHashList;
            });
          }

            
          // Disable required fields if tax system is selected            
          this.taxTableEntries.forEach((rowRef: any, it: any) => {
            if('tax_name' in rowRef) {
              if(rowRef['tax_name'].selected) {
                  rowRef['tax_range'].disabled = true;
                  rowRef['tax_type'].disabled = true;
              }
            }
          });

          // Add empty row for edit mode
          if(this.isEditMode)
            this.attachNewRow();

          // Clear states of unrequired data members
          this.appendInputEntry = null;
          this.$destroyIntervalSub.next();

        })
      );
    };

  }

  ngAfterViewInit() {
    this.changeDetectorSub.next();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(!('category' in changes))
      this.changeDetectorSub.next();
    else {
      this.taxTableEntries.forEach((entry: any, it: number) => {
        this.taxTableEntries[it]['category'].name = changes.category.currentValue;
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  initTaxTableColumns() {

    this.taxTableConfig = {
      showDraggable: true,
      showIcons: true,
      showLastDraggable: false,
      columns: []
    };

    if (this.hierarchy) {
      this.columnTypeMap.set('hierarchy', 'SELECT');
      this.taxTableConfig.columns.push({
        showHeader: true,
        headerName: 'Hierarchy',
        headerKey: 'hierarchy',
        width: 240,
        type: 'SELECT'
      });
    }

    if (this.sourcing_model) {
      this.columnTypeMap.set('sourcing_model', 'SELECT');
      this.taxTableConfig.columns.push({
        showHeader: true,
        headerName: 'Sourcing Model',
        headerKey: 'sourcing_model',
        width: 240,
        type: 'SELECT'
      });
    }

    if (this.isNonEmptyArray(this.allocation_method)) {

      const method: string = this.allocation_method[0];
      if (method === 'LOCATION') {

        if (this.workLocations) {
          this.columnTypeMap.set('work_location','SELECT');
          this.taxTableConfig.columns.push({
            showHeader: true,
            headerName: 'Work Location',
            headerKey: 'work_location',
            width: 300,
            type: 'SELECT'
          });
        }

      } else if (method === 'REGION') {
        
        if(this.isNonEmptyArray(this.country)) {
          this.columnTypeMap.set('country','SELECT');
          this.taxTableConfig.columns.push({
            showHeader: true,
            headerName: 'Country',
            headerKey: 'country',
            width: 300,
            type: 'SELECT'
          });
        }

        if(this.isNonEmptyArray(this.states)) {
          this.columnTypeMap.set('state','SELECT');
          this.taxTableConfig.columns.push({
            showHeader: true,
            headerName: 'Location - State',
            headerKey: 'state',
            width: 300,
            type: 'SELECT'
          })
        }

        if(this.isNonEmptyArray(this.counties)) {
          this.columnTypeMap.set('county','SELECT');
          this.taxTableConfig.columns.push({
            showHeader: true,
            headerName: 'County',
            headerKey: 'county',
            width: 300,
            type: 'SELECT'
          })
        }

        if(this.isNonEmptyArray(this.cities)) {
          this.columnTypeMap.set('city','SELECT');
          this.taxTableConfig.columns.push({
            showHeader: true,
            headerName: 'City',
            headerKey: 'city',
            width: 300,
            type: 'SELECT'
          })
        }

      }

    }

    if (this.isNonEmptyArray(this.manualTaxList)) {

      this.columnTypeMap.set('tax_name','SELECT');
      this.taxTableConfig.columns.push({
        showHeader: true,
        headerName: 'Tax Name',
        headerKey: 'tax_name',
        width: 240,
        type: 'SELECT'
      });

      this.columnTypeMap.set('tax_range','NUMBER-RANGE');
      this.taxTableConfig.columns.push({
        showHeader: true,
        headerName: 'Applicable Range',
        headerKey: 'tax_range',
        width: 240,
        type: 'NUMBER-RANGE'
      });

      this.columnTypeMap.set('tax_type','SELECT');
      this.taxTableConfig.columns.push({
        showHeader: true,
        headerName: 'Tax Type',
        headerKey: 'tax_type',
        width: 240,
        type: 'SELECT'
      });

      this.columnTypeMap.set('tax_value','NUMBER');
      this.taxTableConfig.columns.push({
        showHeader: true,
        headerName: 'Tax Value',
        headerKey: 'tax_value',
        width: 200,
        type: 'NUMBER'
      });

      this.columnTypeMap.set('date_range','DATEPICKER');
      this.taxTableConfig.columns.push({
        showHeader: true,
        headerName: 'Start Date - End Date',
        headerKey: 'date_range',
        width: 320,
        type: 'DATEPICKER'
      });

    }

    if (this.category) {
      this.columnTypeMap.set('category','READONLY');
      this.taxTableConfig.columns.push({
        showHeader: true,
        headerName: 'Applicable',
        headerKey: 'category',
        width: 136,
        type: 'READONLY'
      });
    }

    if(this.taxTableEntries.length <= 1) {
      this.taxTableEntries = [];
      this.rowHashList = [];
      this.attachNewRow();
    } else {
      this.updateCurrentRows();
    }

  }

  attachNewRow() {

    let tableEntry = {};
    let initialRowHash = "";
    this.taxTableConfig.columns.forEach((col: DragTableColumn) => {

        const col_key: string = col.headerKey;
        switch (col_key) {

          case 'hierarchy':
            initialRowHash += '*';
            tableEntry = {
              ...tableEntry,
              'hierarchy': {
                'multiple': true,
                'disabled': this.isViewMode,
                'clearable': false,
                'highlight': true,
                'options': this.currentHierarchyOptions
              }
            };
            break;

          case 'sourcing_model':
            initialRowHash += '*';
            tableEntry = {
              ...tableEntry,
              'sourcing_model': {
                'multiple': true,
                'disabled': this.isViewMode,
                'clearable': false,
                'highlight': true,
                'options': this.currentSourcingOptions
              }
            };
            break;

          case 'category':
            tableEntry = {
              ...tableEntry,
              'category': {
                'name': this.category
              }
            };
            break;

          case 'tax_name':
            tableEntry = {
              ...tableEntry,
              'tax_name': {
                'highlight': true,
                'disabled': this.isViewMode,
                'options': this.taxNameList
              },
              'tax_range': {
                'highlight': true,
                'disabled': this.isViewMode,
                'decimalPrecision': 0,
                'min_value': '',
                'max_value': '',
                'min_placeholder': 'Min Value',
                'max_placeholder': 'Max Value'
              },
              'tax_type': {
                'highlight': true,
                'disabled': this.isViewMode,
                'options': this.taxTypeOptions
              },
              'tax_value': {
                'highlight': true,
                'disabled': this.isViewMode,
                'value': ''
              },
              'date_range': {
                'start_date': null,
                'start_options': {
                  language: 'English',
                  timepicker: false,
                  format12h: true,
                  range: false,
                  enabledDateRanges: []
                },
                'disabled': this.isViewMode,
                'end_date': null,
                'end_options': {
                  language: 'English',
                  timepicker: false,
                  format12h: true,
                  range: false,
                  enabledDateRanges: []
                }
              }
            }
            break;

          case 'work_location':
            initialRowHash += '*';
            tableEntry = {
              ...tableEntry,
              'work_location': {
                'disabled': this.isViewMode,
                'options': this.locationListForTaxTable,
                'multiple': true,
                'clearable': false,
                'highlight': true
              }
            };
            break;

          case 'country':
            initialRowHash += '*';
            tableEntry = {
              ...tableEntry,
              'country': {
                'disabled': this.isViewMode,
                'options': this.currentCountryOptions,
                'multiple': true,
                'clearable': false,
                'highlight': true
              }
            };
            break;

          case 'state':
            initialRowHash += '*';
            tableEntry = {
              ...tableEntry,
              'state': {
                'disabled': this.isViewMode,
                'options': this.currentStateOptions,
                'multiple': true,
                'clearable': true,
                'highlight': false
              }
            };
            break;

          case 'county':
            initialRowHash += '*';
            tableEntry = {
              ...tableEntry,
              'county': {
                'disabled': this.isViewMode,
                'options': this.currentCountyOptions,
                'multiple': true,
                'clearable': true,
                'highlight': false
              }
            };
            break;

          case 'city':
            initialRowHash += '*';
            tableEntry = {
              ...tableEntry,
              'city': {
                'disabled': this.isViewMode,
                'options': this.currentCityOptions,
                'multiple': false,
                'clearable': true,
                'highlight': false
              }
            };
            break;

          default:
            console.log(`"attachNewRow()": No case found for ${col.headerKey}`);
        }

      });

    this.taxTableEntries.push(tableEntry);
    this.rowHashList.push([initialRowHash]);
    this.refreshIconEntries();

  }

  updateCurrentRows() {

    let entryCount = this.taxTableEntries.length;
    let renderedColumns: Array <string> = this.taxTableConfig.columns.map((col: DragTableColumn) => col.headerKey);
    let validateColumns: Array <string> = ['hierarchy', 'sourcing_model', 'work_location', 'country', 'state', 'county', 'city'];

    this.taxTableEntries.forEach((entry: any, it: number) => {
      if(it < (entryCount - 1)) {

        let updatedEntry: any = {};
        const currEntry: any = entry;
        renderedColumns.forEach((colKey: string) => {

          // Only clear the required fields
          let colType: string = this.columnTypeMap.get(colKey);
          if(!!currEntry[colKey] && (colType === 'SELECT')) {

            let options: Array <any> = [];
            let allSelected: boolean = false;
            let allowed_values: Array <string> = [];
            const selected: any | Array <string> = currEntry[colKey].selected;

            // Check for hash based fields
            if(validateColumns.includes(colKey)) {

              switch(colKey) {

                case 'hierarchy':
                  options = this.currentHierarchyOptions;
                  break;

                case 'sourcing_model':
                  options = this.currentSourcingOptions;
                  break;

                case 'work_location':
                  options = this.locationListForTaxTable;
                  allSelected = this.isAllWorkLocationSelected;
                  break;

                case 'country':
                  options = this.currentCountryOptions;
                  allSelected = this.country.includes('ALL');
                  break;

                case 'state':
                  options = this.currentStateOptions;
                  allSelected = this.isAllStateSelected;
                  break;

                case 'city':
                  options = this.currentCityOptions;
                  allSelected = this.isAllCitySelected;
                  break;

                case 'county':
                  options = this.currentCountyOptions;
                  allSelected = this.isAllCountySelected;
                  break;
                
              }

              if (colKey === 'hierarchy' || colKey === 'sourcing_model') {
                allowed_values = options.map((val: any) => val.value);
                updatedEntry = {
                  ...updatedEntry,
                  [colKey]: {
                    ...currEntry[colKey],
                    options, 
                    selected: selected.filter((val: string) => allowed_values.includes(val))
                  }
                }
              } else {
                if(allSelected) {
                  updatedEntry = {
                    ...updatedEntry,
                    [colKey]: currEntry[colKey]
                  }
                } else {
                  allowed_values = options.map((val: any) => val.value);
                  updatedEntry = {
                    ...updatedEntry,
                    [colKey]: {
                      ...currEntry[colKey],
                      options,
                      selected: selected.filter((val: string) => allowed_values.includes(val))
                    }
                  }
                }
              }
            } 
            
            // Change handler for manual tax list change
            else if(colKey === 'tax_name') {
              options = this.taxNameList;
              allowed_values = options.map((val: any) => val.value);
              if(allowed_values.length) {
                updatedEntry = {
                  ...updatedEntry,
                  'tax_name': {
                    ...currEntry['tax_name'],
                    options, 
                    selected: allowed_values.includes(selected)?selected:null
                  },
                  'tax_range': currEntry['tax_range'],
                  'tax_type': currEntry['tax_type'],
                  'tax_value': currEntry['tax_value'],
                  'date_range': currEntry['date_range']
                }
              }

              if(!allowed_values.includes(selected)) {

                updatedEntry = {
                  ...updatedEntry,
                  'tax_range': {
                    ...currEntry['tax_range'],
                    disabled: false,
                    min_value: null,
                    max_value: null
                  }, 
                  'tax_type': {
                    ...currEntry['tax_type'],
                    disabled: false,
                    selected: null
                  }, 
                  'tax_value': {
                    ...currEntry['tax_value'],
                    value: null
                  }, 
                  'date_range': {
                    ...currEntry['date_range'],
                    start_date: null,
                    end_date: null
                  }
                }

                this.taxTableEntries[it] = {
                  ...this.taxTableEntries[it],
                  ...updatedEntry
                };
              }
            }
          } else {

            // Add column metadata if introduced
            if(!currEntry[colKey]) {
              switch (colKey) {

                case 'hierarchy':
                  updatedEntry = {
                    ...updatedEntry,
                    'hierarchy': {
                      'multiple': true,
                      'disabled': this.isViewMode,
                      'clearable': false,
                      'highlight': true,
                      'options': this.currentHierarchyOptions
                    }
                  };
                  break;
      
                case 'sourcing_model':
                  updatedEntry = {
                    ...updatedEntry,
                    'sourcing_model': {
                      'multiple': true,
                      'disabled': this.isViewMode,
                      'clearable': false,
                      'highlight': true,
                      'options': this.currentSourcingOptions
                    }
                  };
                  break;
      
                case 'category':
                  updatedEntry = {
                    ...updatedEntry,
                    'category': {
                      'name': this.category
                    }
                  };
                  break;
      
                case 'tax_name':
                  updatedEntry = {
                    ...updatedEntry,
                    'tax_name': {
                      'highlight': true,
                      'disabled': this.isViewMode,
                      'options': this.taxNameList
                    },
                    'tax_range': {
                      'highlight': true,
                      'disabled': this.isViewMode,
                      'decimalPrecision': 0,
                      'min_value': '',
                      'max_value': '',
                      'min_placeholder': 'Min Value',
                      'max_placeholder': 'Max Value'
                    },
                    'tax_type': {
                      'highlight': true,
                      'disabled': this.isViewMode,
                      'options': this.taxTypeOptions
                    },
                    'tax_value': {
                      'highlight': true,
                      'disabled': this.isViewMode,
                      'value': ''
                    },
                    'date_range': {
                      'start_date': null,
                      'start_options': {
                        language: 'English',
                        timepicker: false,
                        format12h: true,
                        range: false,
                        enabledDateRanges: []
                      },
                      'disabled': this.isViewMode,
                      'end_date': null,
                      'end_options': {
                        language: 'English',
                        timepicker: false,
                        format12h: true,
                        range: false,
                        enabledDateRanges: []
                      }
                    }
                  }
                  break;
      
                case 'work_location':
                  updatedEntry = {
                    ...updatedEntry,
                    'work_location': {
                      'disabled': this.isViewMode,
                      'options': this.locationListForTaxTable,
                      'multiple': true,
                      'clearable': false,
                      'highlight': true
                    }
                  };
                  break;
      
                case 'country':
                  updatedEntry = {
                    ...updatedEntry,
                    'country': {
                      'disabled': this.isViewMode,
                      'options': this.currentCountryOptions,
                      'multiple': true,
                      'clearable': false,
                      'highlight': true
                    }
                  };
                  break;
      
                case 'state':
                  updatedEntry = {
                    ...updatedEntry,
                    'state': {
                      'disabled': this.isViewMode,
                      'options': this.currentStateOptions,
                      'multiple': true,
                      'clearable': true,
                      'highlight': false
                    }
                  };
                  break;
      
                case 'county':
                  updatedEntry = {
                    ...updatedEntry,
                    'county': {
                      'disabled': this.isViewMode,
                      'options': this.currentCountyOptions,
                      'multiple': true,
                      'clearable': true,
                      'highlight': false
                    }
                  };
                  break;
      
                case 'city':
                  updatedEntry = {
                    ...updatedEntry,
                    'city': {
                      'disabled': this.isViewMode,
                      'options': this.currentCityOptions,
                      'multiple': false,
                      'clearable': true,
                      'highlight': false
                    }
                  };
                  break;
      
                default:
                  console.log(`"updateCurrentRows()": No case found for ${colKey}`);
              }
            } else {
              updatedEntry = {
                ...updatedEntry,
                [colKey]: this.taxTableEntries[it][colKey]
              }
            }
          }
        });

        // Update entry
        this.taxTableEntries[it] = updatedEntry;
      
      }
    });

    // Update row instances
    this.taxTableEntries.pop();
    this.attachNewRow();
    this.refreshRowHashList();

  }

  refreshRowHashList() {
    this.rowHashList = [];
    this.taxTableEntries.forEach((entry: any, it: number) => {
      let newHashList: Array <string> = this.generateEntryHash(it);
      this.rowHashList[it] = newHashList;
    });
  }

  refreshIconEntries() {

    if (!this.taxTableConfig.showIcons)
      return;

    this.taxTableEntries.forEach((entry: any, it: number) => {

      if (it + 1 === (this.taxTableEntries.length)) {
        this.taxTableEntries[it].iconsList = [{
          name: 'add',
          class: 'custom_add'
        }];
      } else {
        this.taxTableEntries[it].iconsList = [{
          name: 'delete',
          theme: 'outlined'
        }];
      }

    });

  }

  fillTaxDetails(it: number, selected: string) {
    this.manualTaxList.forEach((entry: TaxDetail) => {
      if (entry.name === selected) {
        const rowRef: any = this.taxTableEntries[it];
        rowRef['tax_range'] = {
          ...rowRef['tax_range'],
          min_value: entry.min_value,
          max_value: entry.max_value,
          disabled: true
        };
        rowRef['tax_type'] = {
          ...rowRef['tax_type'],
          selected: entry.tax_type,
          disabled: true
        };
        rowRef['date_range'] = {
          ...rowRef['date_range'],
          start_date: entry.start_date,
          end_date: entry.end_date
        };
      }
    });
  }

  getWorkLocationURL({ term, name, row }) {

    const progId = this.storage.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${progId}/work-locations?limit=10&status=true`;

    if (this.locationSearchTerm === term)
      this.locationPageCount += 1;
    else
      this.locationPageCount = 1;
    url += `&page=${this.locationPageCount}`;

    if (term)
      url += `&k=${term}`;
    this.locationSearchTerm = term;

    this.taxTableEntries[row][name].loading = true;
    return this.programService.get(url);
  }

  parseLocationResponse({ row, name, term }: any, output: any) {

    if(!this.isAllWorkLocationSelected) {
      if(Number.isInteger(row) && name)
        this.disableUsedCombinations(row, name);
      return;
    }

    let total_records: number = output.total_records;
    this.locationRecordCount = total_records;

    let locations: Array<string> = output.work_locations;
    let newList: Array<any> = locations.map((entry: any) => {
      const { id, name } = entry;
      this.taxService.workLocationMap.set(id, name);
      return { name, value: id };
    });

    if (this.locationPageCount > 1) {
      this.allWorkLocationList = this.uniqueKeyPipe.transform([...this.allWorkLocationList, ...newList], 'value');
    } else {
      this.allWorkLocationList = newList;
    }

    this.taxTableEntries[row][name].options = this.allWorkLocationList;
    if(row && name)
      this.disableUsedCombinations(row, name);

    this.taxTableEntries[row][name].loading = false;
    this.taxTableEntries[row][name].metadata = {
      'total_records': total_records,
      'record_count': this.allWorkLocationList.length,
      'search_term': term
    };

  }

  getStateURL({ term, name, row, show }) {
    
    let url = `/configurator/resources/states?limit=10`;
    const countries: Array <string> = this.taxTableEntries[row]['country'].selected || [];
    
    if(show && this.stateSearchTerm === term)
      this.statePageCount += 1;
    else {
      this.statePageCount = 1;
    }

    url += `&page=${this.statePageCount}`;

    if(this.isNonEmptyArray(countries) && !countries.includes('ALL')) 
      url += `&country_ids=${ countries.join(',')}`;

    if(term)
      url += `&search_text=${term}`;
    this.stateSearchTerm = term;
            
    this.taxTableEntries[row][name].loading = true;
    return this.programService.get(url);

  }

  parseStateResponse({ row, name, term }: any, output: any) {

    if(!this.isAllStateSelected) {
      if(Number.isInteger(row) && name)
        this.disableUsedCombinations(row, name);
      return;
    }

    let total_records: number = output.total_records;
    this.stateRecordCount = total_records;

    let states: Array<string> = output.states;
    let newList: Array<any> = states.map((entry: any) => {
      const { id, name } = entry;
      this.taxService.stateMap.set(id, name);
      return { name, value: id };
    });

    if (this.statePageCount > 1) {
      this.allStateList = this.uniqueKeyPipe.transform([...this.allStateList, ...newList], 'value');
    } else {
      this.allStateList = newList;
    }

    this.taxTableEntries[row][name].options = this.allStateList;
    if(row && name)
      this.disableUsedCombinations(row, name);

    this.taxTableEntries[row][name].loading = false;
    this.taxTableEntries[row][name].metadata = {
      'total_records': total_records,
      'record_count': this.allStateList.length,
      'search_term': term
    };

  }

  getCountyURL({ term, name, row, show }) {

    let url = `/configurator/resources/counties?limit=10`;
    const states: Array<string> = this.taxTableEntries[row]['state'].selected || [];

    if (show && this.countySearchTerm === term)
      this.countyPageCount += 1;
    else {
      this.countyPageCount = 1;
    }

    url += `&page=${this.countyPageCount}`;

    if (this.isNonEmptyArray(states) && !states.includes('ALL'))
      url += `&state_ids=${states.join(',')}`;
    else if (!states || (Array.isArray(states) && !states.length)) {
      const countries: Array<string> = this.taxTableEntries[row]['country'].selected || [];
      if (!countries.includes('ALL') && countries.length)
        url += `&country_ids=${countries.join(',')}`;
    }

    if (term)
      url += `&search_text=${term}`;
    this.countySearchTerm = term;

    this.taxTableEntries[row][name].loading = true;
    return this.programService.get(url);

  }

  parseCountyResponse({ row, name, term }: any, output: any) {

    if(!this.isAllCountySelected) {
      if(Number.isInteger(row) && name)
        this.disableUsedCombinations(row, name);
      return;
    }
    
    let total_records: number = output.total_records;
    this.countyRecordCount = total_records;

    let counties: Array<string> = output.counties;
    let newList: Array<any> = counties.map((entry: any) => {
      const { id, name } = entry;
      this.taxService.countyMap.set(id, name);
      return { name, value: id };
    });

    if (this.countyPageCount > 1) {
      this.allCountyList = this.uniqueKeyPipe.transform([...this.allCountyList, ...newList], 'value');
    } else {
      this.allCountyList = newList;
    }

    this.taxTableEntries[row][name].options = this.allCountyList;
    if(row && name)
      this.disableUsedCombinations(row, name);

    this.taxTableEntries[row][name].loading = false;
    this.taxTableEntries[row][name].metadata = {
      'total_records': total_records,
      'record_count': this.allCountyList.length,
      'search_term': term
    };

  }

  getCityURL({ term, name, row, show }) {

    let url = `/configurator/resources/cities?limit=10`;
    const counties: Array<string> = this.taxTableEntries[row]['county'].selected || [];

    if (show && this.citySearchTerm === term)
      this.cityPageCount += 1;
    else {
      this.cityPageCount = 1;
    }

    url += `&page=${this.cityPageCount}`;

    if (this.isNonEmptyArray(counties) && !counties.includes('ALL'))
      url += `&county_ids=${counties.join(',')}`;
    else if (!counties || (Array.isArray(counties) && !counties.length)) {
      const states: Array<string> = this.taxTableEntries[row]['state'].selected || [];
      if (this.isNonEmptyArray(states) && !states.includes('ALL'))
        url += `&state_ids=${states.join(',')}`;
      else if (!states || (Array.isArray(states) && !states.length)) {
        const countries: Array<string> = this.taxTableEntries[row]['country'].selected || [];
        if (!countries.includes('ALL') && countries.length)
          url += `&country_ids=${countries.join(',')}`;
      }
    }

    if (term)
      url += `&search_text=${term}`;
    this.citySearchTerm = term;

    this.taxTableEntries[row][name].loading = true;
    return this.programService.get(url);

  }

  parseCityResponse({ row, name, term }: any, output: any) {

    if(!this.isAllCitySelected) {
      if(Number.isInteger(row) && name)
        this.disableUsedCombinations(row, name);
      return;
    }
    
    let total_records: number = output.total_records;
    this.cityRecordCount = total_records;

    let cities: Array<string> = output.cities;
    let newList: Array<any> = cities.map((entry: any) => {
      const { id, name } = entry;
      this.taxService.cityMap.set(id, name);
      return { name, value: id };
    });

    if (this.cityPageCount > 1) {
      this.allCityList = this.uniqueKeyPipe.transform([...this.allCityList, ...newList], 'value');
    } else {
      this.allCityList = newList;
    }

    this.taxTableEntries[row][name].options = this.allCityList;
    if(row && name)
      this.disableUsedCombinations(row, name);

    this.taxTableEntries[row][name].loading = false;
    this.taxTableEntries[row][name].metadata = {
      'total_records': total_records,
      'record_count': this.allCityList.length,
      'search_term': term
    };

  }

  isValidTaxTableRow() {

    if(this.isNonEmptyArray(this.allocation_method)) {

      const method: string = this.allocation_method[0];
      const lastIndex: number = this.taxTableEntries.length - 1;
      const entryRef: any = this.taxTableEntries[lastIndex];
      let isInvalidCombination: boolean = false;
      let nonSelectedList: Array <any> = [];

      if('hierarchy' in entryRef) {
        const selected: Array <string> = entryRef.hierarchy.selected;
        if(!selected)
          nonSelectedList.push('Hierarchy'); 
        else if(Array.isArray(selected) && !selected.length) {
          nonSelectedList.push('Hierarchy');
        }
      }

      if('sourcing_model' in entryRef) {
        const selected: Array <string> = entryRef.sourcing_model.selected;
        if(!selected)
          nonSelectedList.push('Sourcing Model'); 
        else if(Array.isArray(selected) && !selected.length) {
          nonSelectedList.push('Sourcing Model');
        }
      }

      if(method === 'LOCATION') {
        if('work_location' in entryRef) {
          const selected: Array <string> = entryRef.work_location.selected;
          if(!selected)
            nonSelectedList.push('Work Location'); 
          else if(Array.isArray(selected) && !selected.length) {
            nonSelectedList.push('Work Location');
          }
        }
      }

      if(method === 'REGION') {
        if('country' in entryRef) {
          const selected: Array <string> = entryRef.country.selected;
          if(!selected)
            nonSelectedList.push('Country'); 
          else if(Array.isArray(selected) && !selected.length) {
            nonSelectedList.push('Country');
          }
        }
      }

      if(entryRef.tax_name && !entryRef.tax_name.selected)
        nonSelectedList.push('Tax Name');

      if(entryRef.tax_type && !entryRef.tax_type.selected) 
        nonSelectedList.push('Tax Type');

      if(entryRef.tax_range) {
        const { min_value, max_value } = entryRef.tax_range;
        let minValue = parseInt(min_value);
        let maxValue = parseInt(max_value);
        if(!Number.isInteger(minValue) || !Number.isInteger(maxValue)) {
          nonSelectedList.push('Applicable range');
        }
         else if(Number.isInteger(minValue) && Number.isInteger(maxValue)) {
          if(minValue > maxValue) {
            this.alert.error('Min range greater than max applicable range');
            return;
          }
        }
      }

      if(entryRef.tax_value) {
        let taxValue: number = parseFloat(entryRef.tax_value.value);
        if(!Number.isInteger(parseInt(taxValue+''))) {
          nonSelectedList.push('Tax Value');
        } else if(entryRef.tax_range) {
          let minVal: number = parseFloat(entryRef.tax_range.min_value);
          let maxVal: number = parseFloat(entryRef.tax_range.max_value);
          if(minVal > taxValue) {
            this.alert.error('Tax value smaller than minimum applicable range');
            return;
          }
          if(taxValue > maxVal) {
            this.alert.error('Tax value greater than maximum applicable range');
            return;
          }
        }
      }

      if(entryRef.date_range) {
        const { start_date, end_date } = entryRef.date_range;
        if(!start_date || !end_date) {
          nonSelectedList.push('Start Date - End Date');
        }
         else if(start_date && end_date && !this.validDateRange(start_date, end_date)) {
          this.alert.error('Start date greater than specified end date');
          return;
        }
      }
      
      if(this.isNonEmptyArray(nonSelectedList)) {
        this.alert.error(`Please fill the required Field(s): 
        ${nonSelectedList.join(', ')}`);
        return false;
      }

      let rowHash: Array <string> = this.generateEntryHash(lastIndex);
      let allHashList = this.rowHashList.reduce(
        (prev: Array <string>, curr: Array <string>, it: number) => {
          if(it === lastIndex)
            return prev;
          return [...prev, ...curr];
      }, []);

      for (let it = 0; it < allHashList.length; it++) {
        const entry = allHashList[it];
        if(rowHash.includes(entry)) {
          isInvalidCombination = true;
          break;
        }
      }

      if(isInvalidCombination) {
        this.alert.error(
          `Following combination already exists on tax table.
          Please select a new combination.`
        );
        return false;
      } else {
        this.rowHashList[lastIndex] = rowHash;
      }

      return true;
    }

    return false;
  }

  generateEntryHash(index: number) {

    let entryRef = this.taxTableEntries[index];
    let allowed_cols = ['hierarchy', 'sourcing_model'];
    let columnData: Array<any> = this.taxTableConfig.columns.map((entry: DragTableColumn) => {
      return {
        name: entry.headerKey,
        type: entry.type
      }
    });

    if(this.allocation_method && this.allocation_method[0] === 'LOCATION') {
      allowed_cols.push('work_location');
    }

    if(this.allocation_method && this.allocation_method[0] === 'REGION') {
      allowed_cols.push('country');
      if(this.isNonEmptyArray(this.states))
        allowed_cols.push('state');
      if(this.isNonEmptyArray(this.counties))
        allowed_cols.push('county');
      if(this.isNonEmptyArray(this.cities))
        allowed_cols.push('city');
    }

    let entryCombinations: Array<Array<string>> = [];

    columnData.forEach((data: any) => {
      if(allowed_cols.includes(data.name)) {
        switch (data.type) {

          case 'NUMBER':
            entryCombinations.push([entryRef[data.name].value]);
            break;

          case 'NUMBER_RANGE':
            entryCombinations.push([entryRef[data.name].min_value + "#" + entryRef[data.name].max_value])
            break;

          case 'SELECT':
            if (entryRef[data.name].multiple) {
              if(this.isNonEmptyArray(entryRef[data.name].selected))
                entryCombinations.push(entryRef[data.name].selected);
              else
                entryCombinations.push(['']);
            }
            else
              entryCombinations.push([entryRef[data.name].selected]);
            break;

          case 'DATEPICKER':
            entryCombinations.push([entryRef[data.name].start_date + '#' + entryRef[data.name].end_date]);
            break;

          default:
            console.log(`"generateEntryHash()": Case not found for ${data.name + ": " + data.type}`);
        }
      }

      return data;
    });

    let result: Array <string> = [];
    result = this.generateCombinations(entryCombinations);
    return result;
  }

  generateCombinations(arr: Array <Array <string>>, it: number = 0): Array <string> {

    if(it >= arr.length)
      return [''];

    let result: Array <string> = [];
    let curr_arr: Array <string> = arr[it];
    for(let index = 0; index < curr_arr.length; index++) {
      let stacked_result = this.generateCombinations(arr, it+1);
      stacked_result.forEach((entry: string, it: number) => {
        stacked_result[it] = curr_arr[index] + '*' + entry;
      });

      result = [ ...result, ...stacked_result ];
    }

    return result;
  }

  disableUsedCombinations(rowIndex: number, columnKey: string) {

    console.log(`"this.disableUsedCombinations()": column: ${columnKey}, rowIndex: ${rowIndex}`);
    let replaceIndex: number = -1;

    switch(columnKey) {
      case 'hierarchy':
        replaceIndex = 0;
        break;

      case 'sourcing_model':
        replaceIndex = 1;
        break;

      case 'work_location':
        replaceIndex = 2;
        break;

      case 'country':
        replaceIndex = 2;
        break;

      case 'state':
        replaceIndex = 3;
        break;

      case 'county':
        replaceIndex = 4;
        break;

      case 'city':
        replaceIndex = 5;
        break;

      default: 
        console.log(`"this.disableUsedCombinations()": Non mandatory column found: ${columnKey}`);

    }

    // Method triggered for Optional field
    if(replaceIndex === -1)
      return;

    // Get all hashes except current row
    let relevantHashes: Array <string> = this.rowHashList.reduce(
      (prev: Array <string>, curr: Array <string>, it: number) => {
        if(it === rowIndex)
          return prev;
        return [...prev, ...curr];
    }, []);

    const currHashRef: Array <string> = this.rowHashList[rowIndex];
    const fieldRef: any = this.taxTableEntries[rowIndex][columnKey];
    const optionRef: Array <any> = fieldRef.options;

    if(optionRef && this.isNonEmptyArray(currHashRef)) {

      optionRef.forEach(({ name, value }, opt_index: number) => {

        let validOption: boolean = true;
        let optionSet: Array <string> = [];

        currHashRef.forEach((hash: string) => {
          let result = this.replaceValueThroughDelimiter(hash, '*', replaceIndex, value);
          optionSet.push(result);
        });

        relevantHashes.forEach((hash: string) => {
          if(optionSet.includes(hash))
            validOption = false;
        });          


        if(!validOption) {
          optionRef[opt_index].disabled = true;
        } else {
          optionRef[opt_index].disabled = false;
        }

      });
    }

  }

  replaceValueThroughDelimiter(val: string, delim: string, index: number, name: string) {
    let selections: Array <string> = val.split(delim);
    selections[index] = name;
    return selections.join(delim);
  }

  isNonEmptyArray(entry: any) {
    return entry && Array.isArray(entry) && entry.length;
  }

  validDateRange(start_date: string, end_date: string) {
    let startDate: Date = this.convertToDate(start_date);
    let endDate: Date = this.convertToDate(end_date);
    if(startDate > endDate)
      return false;
    return true;
  }

  convertToDate(date: string) {
    if(!date)
      return (new Date());
    let dateVal = date.split('/');
    dateVal = [dateVal[1], dateVal[0], dateVal[2]];
    date = dateVal.join('/');
    let result = new Date(date);
    return result;
  }

  get locationListForTaxTable() {

    if (this.isAllWorkLocationSelected) {
      return this.allWorkLocationList;
    }

    return [
      ...this.workLocations.map((id: string) => {
        return {
          name: (this.taxService.workLocationMap.get(id) || 'Undefined'),
          value: id
        }
      })
    ];
  }

  get isTemplateRenderAllowed() {

    let taxListValid: boolean = Boolean(this.manualTaxList && this.manualTaxList.length);
    if(!this.isViewMode)
      return taxListValid;
    
    return (taxListValid && this.taxTableEntries.length)
  }

  get taxNameList(): Array <any> {
    return [
      ...this.manualTaxList.map((entry: any) => {
        return {
          name: entry.name,
          value: entry.name
        }
      })
    ];
  }
}