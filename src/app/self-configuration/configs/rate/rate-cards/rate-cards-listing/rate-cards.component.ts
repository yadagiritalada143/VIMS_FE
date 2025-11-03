import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ActivatedRoute } from '@angular/router';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { MappingService } from 'src/app/program-setup/rate-card/mapping-service.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { FilterType, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig, IActionLinks, IAdvanceFilterConfig } from 'src/app/library/svms-table/svms-table.model';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { AuthorizationService } from 'src/app/core/services/authorize.service';


@Component({
  selector: 'app-rate-cards',
  templateUrl: './rate-cards.component.html',
  styleUrls: ['./rate-cards.component.scss']
})
export class RateCardsComponent implements OnInit, OnDestroy {

  isExpand = false;
  vmsData: any;
  description: any;

  private subscriptions: Array <Subscription> = [];
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('activeBadge',{static:true}) activeBadge: TemplateRef<void>;
  @ViewChild('showCurrency',{static:true}) showCurrency: TemplateRef<void>;
  public svmsData: any;

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig:ITablePaginationConfig;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        type: FilterType.SELECT,
        title: 'Job Category',
        name: 'job_category.category_name',
        placeholder: 'Select Job Category',
        options: [],
        loading: false,
        onSearch: this.searchJobCategory,
        disabled: true
      }, 
      {
        type: FilterType.SELECT,
        title: 'Job Title',
        name: 'job_title',
        placeholder: 'Select Job Title',
        options: [],
        loading: false,
        onSearch: this.searchJobTitle
      }, {
        type: FilterType.SELECT,
        title: 'Currency',
        name: 'currency',
        placeholder: 'Select Currency',
        options: [],
        advanceFilter: false
      },
      {
        type: FilterType.SELECT,
        title: 'Active Jobs Range',
        name: 'active_jobs',
        placeholder: 'Select Range Condition',
        disabled: true,
        options: [
          { name: 'Less than', value: 'active_jobs__lt' },
          { name: 'Equal to', value: 'active_jobs' },
          { name: 'Greater than', value: 'active_jobs__gt' },
          { name: 'Less than or equal to', value: 'active_jobs__lte' },
          { name: 'Greater than or equal to', value: 'active_jobs__gte' }
        ]
      },
      {
        type: FilterType.TEXT,
        title: 'Active Job Count',
        name: 'active_jobs_count',
        placeholder: 'Enter Active Job count'
      },
      {
        type: FilterType.SELECT,
        title: 'Active Rates Range',
        name: 'active_rates',
        placeholder: 'Select Range Condition',
        disabled: true,
        options: [
          { name: 'Less than', value: 'active_rates__lt' },
          { name: 'Equal to', value: 'active_rates' },
          { name: 'Greater than', value: 'active_rates__gt' },
          { name: 'Less than or equal to', value: 'active_rates__lte' },
          { name: 'Greater than or equal to', value: 'active_rates__gte' }
        ]
      }, {
        type: FilterType.TEXT,
        title: 'Active Rate Count',
        name: 'active_rates_count',
        placeholder: 'Enter Active Rate count'
      },
    ];

    this.tableHeaderConfig = {
      title: 'Rate Cards',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('rate_card_manage'),
      onAdd: this.onCreateClick,
      onSearch: this.onSearch,
      advanceFilter: true,
      importData: false,
      exportData: false,
      columnSetting: false, 
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView, hide: !this.authService.authorize('rate_card_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('rate_card_manage') },
      { linkName: 'Details', method: this.onDetailClick, hide: !this.authService.authorize('rate_card_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination:this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords,
      itemsPerPage:10,
      recordsPerPageSetting:[10,25,50,100]
    }

    this.svmstableColomnDefn = [
      { field: 'job_category.category_name', header: 'Name', width: 35, primary: true,order:1, sortable: true, onClick: this.onClickView },
      { field: 'active_jobs', header: 'Active Jobs', width: 20,templateRef:this.activeBadge,order:2, sortable: true },
      { field: 'active_rates', header: 'Active Rates', width: 20,templateRef:this.activeBadge,order:3, sortable: true },
      { field: 'currency', header: 'Currency', width: 15,order:4,templateRef: this.showCurrency, sortable: true },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination:true,
      paginationConfig:this.tablePaginationConfig,
      noDataMessage:"No Records Found",
      actionLinks:actionLinks,
      enableColumnFilter: true
    };
  };


  public itemPerPage = 10;
  public totalRecords: number;

  public currencies: Array <any> = [];
  public categories: Array <any> = [];
  public job_titles: Array <any> = [];

  selectedCard = {};
  searchTerm: any;
  isAdvanceSearch = false;
  filterpayLoad: any;
  isSearchedFlag = false;
  createCardVisibility: 'visible' | 'hidden' = 'hidden';
  editCardVisibility = 'hidden';
  viewCardVisibility = 'hidden';
  sidebartitle = 'Add Rate Card';
  private searchRateCardSub: Subject<any> = new Subject<any>();


  constructor (
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private _programService: ProgramService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    public mapper: MappingService,
    private authService: AuthorizationService
  ) {
  }

  ngOnInit(): void {

    this.initalizeTableConfigs();
    this.eventStream.on(Events.RATE_CARD_FILTER)
    .pipe(
      debounceTime(400),
      throttleTime(400)
    )
    .subscribe(res => {

      const { name, term } = res;
      switch(name) {

        case 'job_category':
          this.fetchCategoryList(term);
          break;

        case 'job_title':
          this.fetchJobTitleList(term);
          break;

        default:
          console.log('Incorrect filter triggered');

      }
    });

    this.fetchCurrencyList();
    this.fetchCategoryList();
    this.fetchJobTitleList();
    
    this.route.paramMap.subscribe(param => {
      if (param.get('add')) {
        this.createCardVisibility = 'visible';
      }
    });

    this.searchRateCardSub
      .pipe(debounceTime(600))
      .subscribe((term: any) => {
        this.searchTerm = term;
        this.isSearchedFlag = this.searchTerm !== '' || this.searchTerm !== null || this.searchTerm !== undefined;
        this.rateCardList();
      })

  }

  searchJobCategory = (term: any) => {
    if(term)
      this.eventStream.emit(new EmitEvent(Events['RATE_CARD_FILTER'], {term, name: 'job_category' }));
  }

  searchJobTitle = (term: any) => {
    if(term)
      this.eventStream.emit(new EmitEvent(Events['RATE_CARD_FILTER'], {term, name: 'job_title' }));
  }

  onSearch = (term: any) => {
    this.vmsTable.currentPage = 1;
    this.searchRateCardSub.next(term);
  }

  rateCardList = (pageNo:any = 1) => {
    const offset = (pageNo - 1) * this.itemPerPage;
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let filters;
    if (!!this.filterpayLoad) {
      filters = {
        name: this.filterpayLoad.name,
        unit_of_measure: this.filterpayLoad.unit_of_measure,
      };
    }
    const programId = programDetails.program_req_id;
    const url =
      !!this.filterpayLoad ?
        `/configurator/programs/${programId}/rate-cards?limit=${this.itemPerPage}&offset=${offset}&page=${pageNo}${filters.name ? '&q=' + filters.name : ''}${filters.unit_of_measure ? '&unit_of_measure=' + filters.unit_of_measure : ''}` :
        `/configurator/programs/${programId}/rate-cards?limit=${this.itemPerPage}&offset=${offset}&page=${pageNo}${this.searchTerm ? ('&q=' + this.searchTerm) : ''}`;
    this._loader.show();
    this._programService.get(url)
      .subscribe({
        next: (data: any) => {
          if (data) {
            data.results.forEach((result: any, it: number) => {

              if (result.currency)
                result.currency = result.currency.toUpperCase();

              if (result.currency && !(result.currency.includes('(')))
                result.currency = this.mapper.currencies.get(result.currency);

              if (result.job_title && result.job_category) {
                result.job_category.category_name = result.job_category.category_name + ' - ' + result.job_title.title;
              } else if (result.job_title) {
                result['job_category'] = {};
                result['job_category'].category_name = result.job_title.title;
              }

            });
            this.vmsData = data;
            this.svmsData = data;
            this.itemPerPage = data?.items_per_page;
            this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
            this.totalRecords = data.count;
            this.tableOptions.totalRecords = this.totalRecords;
            this._loader.hide();
          }
        },
        error: (err: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(err));
        }
      }
    );
  }

  fetchCurrencyList() {
    let url = `/configurator/resources/currencies?limit=250`;
    return this._programService.get(url)
      .subscribe({
        next: (res: any) => {
          if (res) {

            let currency_list: Array<any> = res?.currencies;
            currency_list.forEach(node => {
              this.currencies.push({
                value: node?.code,
                name: node?.code + " (" + node?.symbol + ")"
              })
            });

            this.tableHeaderConfig.advanceFilterConfig[2].options = this.currencies;
            this.currencies.forEach((node: any) => {
              this.mapper.currencies.set(node.value.toUpperCase(), node.name);
            });

            this.rateCardList();
            
          }
        },
        error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
        }
      }
    );
  }

  fetchCategoryList(term: string = null) {

    let url = `/job-manager/job-catalog/category?limit=20`;

    if (term)
      url += `&search=${term}`;

    this.tableHeaderConfig.advanceFilterConfig[0].loading = true;
    this._programService.get(url)
      .subscribe({
        next: (res: any) => {
          if (res) {

            this.categories = [];
            let results: Array<any> = res?.results;
            results.forEach(node => {
              this.categories.push({
                name: node?.category_name,
                value: node?.id
              })
            });

            this.tableHeaderConfig.advanceFilterConfig[0].options = this.categories;
            this.tableHeaderConfig.advanceFilterConfig[0].loading = false;

          }
        },
        error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
          this.tableHeaderConfig.advanceFilterConfig[0].loading = false;
        }
      }
    );
  }

  fetchJobTitleList(term: string = null) {

    let url = `/job-manager/job-catalog/job_title?limit=20`;
    if (term) {
      url += `&search=${term}`;
    }

    this.tableHeaderConfig.advanceFilterConfig[1].loading = true;
    this._programService.get(url)
      .subscribe({
        next: (res: any) => {
          if (res) {

            this.job_titles = [];
            let results: Array<any> = res?.results;
            results.forEach(node => {
              this.job_titles.push({
                name: node?.title,
                value: node?.id
              })
            });

            this.tableHeaderConfig.advanceFilterConfig[1].options = this.job_titles;
            this.tableHeaderConfig.advanceFilterConfig[1].loading = false;
          }
        }, error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
          this.tableHeaderConfig.advanceFilterConfig[1].loading = false;
        }
      }
    );
  }

  onExpandClick(event) {
    this.vmsData.results.forEach(element => {
      if (element.id === event) {
        this.description = element.description;
      }
    });
    this.isExpand = event !== null;
  }

  onCreateClick = (event: any) => {
    this.sidebartitle = 'Add Rate Card';
    this.createCardVisibility = 'visible';
  }

  onClickView = (ev: any) => {
    if (ev) {

      const { name, vmsData } = ev;
      switch (name) {

        case 'active_jobs':
          this.router.navigate(['jobs', 'list', 'all']);
          break;

        case 'active_rates':
        case 'job_category.category_name': {
          const { id } = vmsData;
          this.router.navigate(['rate', 'rate-card', 'details', id]);
          break;
        }

        default: {
          const { id } = ev;
          this.router.navigate(['rate', 'rate-card','details', id]);
          break;
        }
      }
    }
  }

  onEditClick = (event: any) => {
    this.selectedCard = event;
    this.sidebartitle = 'Edit Rate Card';
    this.editCardVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.EDIT_RATE_CARD, true));
  }

  onDisableClicked(event) { }

  onDeleteClick(event) { }

  onDetailClick = (event: any) => {
    this.selectedCard = event;
    this.sidebartitle = 'View Rate Card';
    this.viewCardVisibility = 'visible';
  }

  onPaginationClick = (event: any) => {
    if (!(JSON.stringify(this.filterpayLoad) === JSON.stringify({}))) {
      this.filterRateCard(this.filterpayLoad,event);
    }
    else{
      this.rateCardList(event);
    }
  }

  onListFilter = (event: any) => {
    this.isAdvanceSearch = true;
    this.filterpayLoad = event;
    this.filterRateCard(event);
  }

  onSortClick(event) {
    if (event?.order) {
      switch (event.name) {
        case 'job_category.category_name':
        case 'active_jobs':
        case 'active_rates':
        case 'currency':
          this.vmsData.results = this.vmsData.results.sort(function (a, b) {
            const nameA = typeof a[event.name] === 'string' ? a[event.name].toUpperCase() : a[event.name]; // ignore upper and lowercase
            const nameB = typeof b[event.name] === 'string' ? b[event.name].toUpperCase() : b[event.name]; // ignore upper and lowercase
            if (event.order === 'ASC') {
              return nameA < nameB ? -1 : 1;
            } else {
              return nameA < nameB ? 1 : -1;
            }
          });
          break;
      }
    }
  }

  filterRateCard = (event = null, pageNo = 1) => {

    const offset = (pageNo - 1) * this.itemPerPage;
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url =  `/configurator/programs/${programId}/rate-cards?limit=${this.itemPerPage}&offset=${offset}&page=${pageNo}`;

    if(event) {
    
      const { 
         
        job_title, 
        currency, 
        active_jobs,
        active_jobs_count, 
        active_rates, 
        active_rates_count 
      } = event;

      if(event['job_category.category_name']) {
        url += `&job_category_id=${event['job_category.category_name']}`;
      }

      if(job_title) {
        url += `&job_title_id=${job_title}`;
      }

      if(currency) {
        url += `&currency=${currency}`;
      }
    
      if(active_jobs && active_jobs_count) {
        url += `&${active_jobs}=${active_jobs_count}`;
      }

      if(active_rates && active_rates_count) {
        url += `&${active_rates}=${active_rates_count}`;
      }

    }

    this._loader.show();
    this._programService.get(url)
      .subscribe({
        next: (data: any) => {
          data.results.forEach(result => {

            if (result.currency)
              result.currency = result.currency.toUpperCase();

            if (result.currency && !(result.currency.includes('(')))
              result.currency = this.mapper.currencies.get(result.currency);

            if (result?.job_title?.title && result?.job_category?.category_name) {
              result.job_category.category_name = result?.job_category?.category_name + ' - ' + result?.job_title?.title;
            } else if (result?.job_title?.title && !result?.job_category?.category_name) {
              if(result?.job_category){
              result.job_category.category_name = result?.job_title?.title;
              }
            }

          });
          this.vmsData = data;
          this.itemPerPage = data?.items_per_page;
          this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
          this.svmsData = data;
          this.totalRecords = data.count;
          this.tableOptions.totalRecords = this.totalRecords;
          this._loader.hide();
        },
        error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
          this._loader.hide();
        }
      }
    );
  }

  onCloseCreateCard() {
    this.createCardVisibility = 'hidden';
    this.selectedCard = null;
  }

  onCloseEditCard() {
    this.editCardVisibility = 'hidden';
    this.selectedCard = null;
  }

  onCloseViewCard() {
    this.viewCardVisibility = 'hidden';
    this.selectedCard = null;
  }

  onSaveRateCard(event) {
    if (event.job_title.title && event.job_category.category_name) {
      event.job_category.category_name = event.job_category.category_name + event.job_title.title;
    } else if (event.job_title.title && !event.job_category.category_name) {
      event.job_category.category_name = event.job_title.title;
    }
    if (this.vmsData.results) {
      this.vmsData.results.unshift(event);
    }
    this.rateCardList();
  }

  onUpdateRateCard(event) {
    this.rateCardList();
    if (event.job_title.title && event.job_category.category_name) {
      event.job_category.category_name = event.job_category.category_name + event.job_title.title;
    } else if (event.job_title.title && !event.job_category.category_name) {
      event.job_category.category_name = event.job_title.title;
    }
    const obj = this.vmsData.results.find(result => {
      return result.uid === event.uid;
    });
    const idx = this.vmsData.results.indexOf(obj);
    this.vmsData.results[idx] = event;

  }

  validatorActionLinksFn = (actionLinks:Array<IActionLinks>,rowData:any) => {
      if(actionLinks && actionLinks.length > 0){
          actionLinks[0].hide = !actionLinks[0].hide;
      }
  }

  onChangeRecords = (records: any) => {
    this.itemPerPage = records;
    if (!(JSON.stringify(this.filterpayLoad) === JSON.stringify({}))) {
      this.filterRateCard(this.filterpayLoad);
    }
    else{
      this.rateCardList();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(node => {
      node.unsubscribe();
    });
  }

}
