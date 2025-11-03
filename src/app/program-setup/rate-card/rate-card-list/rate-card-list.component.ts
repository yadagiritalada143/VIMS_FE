import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ActivatedRoute } from '@angular/router';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MappingService } from '../mapping-service.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rate-card-list',
  templateUrl: './rate-card-list.component.html',
  styleUrls: ['./rate-card-list.component.scss']
})
export class RateCardListComponent implements OnInit, OnDestroy {

  isExpand = false;
  vmsData: any;
  description: any;

  private subscriptions: Array <Subscription> = [];
  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;
  
  tableConfig: VMSConfig = {
    title: 'Rate Card',
    columnList: [
      {
        name: 'job_category.category_name',
        title: 'Job Category - Job Title',
        width: 30,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        enableClick: true
      },
      {
        name: 'active_jobs',
        title: 'Active Jobs',
        width: 25,
        isIcon: true,
        isImage: false,
        isContact: false,
        isNumberBadge: true,
        enableClick: false
      },
      {
        name: 'active_rates',
        title: 'Active Rates',
        width: 25,
        isIcon: true,
        isImage: false,
        isContact: false,
        isNumberBadge: true,
        enableClick: false,
      },
      {
        name: 'currency',
        title: 'Currency',
        width: 20,
        isIcon: true,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isRateCard: true,
        isDetails: true,
        isVieworEdit: true,
        isNoOption: false,
      }
    ],
    isCreateButtonName: 'Add new Rate Card',
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isCreate: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    density: 'COMFORTABLE',
    advanceFilter: [
      {
        filterType: 'SELECT',
        title: 'Job Category',
        name: 'job_category',
        placeholder: 'Select Job Category',
        multiSelectData: [],
        fieldLoading: false,
        searchEvent: 'RATE_CARD_FILTER'
      }, {
        filterType: 'SELECT',
        title: 'Job Title',
        name: 'job_title',
        placeholder: 'Select Job Title',
        multiSelectData: [],
        fieldLoading: false,
        searchEvent: 'RATE_CARD_FILTER'
      }, {
        filterType: 'SELECT',
        title: 'Currency',
        name: 'currency',
        placeholder: 'Select Currency',
        multiSelectData: [],
      }, {
        filterType: 'SELECT',
        title: 'Active Jobs Range',
        name: 'active_jobs',
        placeholder: 'Select Range Condition',
        multiSelectData: [
          { name: 'Less than', value: 'active_jobs__lt' },
          { name: 'Equal to', value: 'active_jobs' },
          { name: 'Greater than', value: 'active_jobs__gt' },
          { name: 'Less than or equal to', value: 'active_jobs__lte' },
          { name: 'Greater than or equal to', value: 'active_jobs__gte' }
        ]
      }, {
        filterType: 'NUMBER',
        title: 'Active Job Count',
        name: 'active_jobs_count',
        placeholder: 'Enter Active Job count'
      }, {
        filterType: 'SELECT',
        title: 'Active Rates Range',
        name: 'active_rates',
        placeholder: 'Select Range Condition',
        multiSelectData: [
          { name: 'Less than', value: 'active_rates__lt' },
          { name: 'Equal to', value: 'active_rates' },
          { name: 'Greater than', value: 'active_rates__gt' },
          { name: 'Less than or equal to', value: 'active_rates__lte' },
          { name: 'Greater than or equal to', value: 'active_rates__gte' }
        ]
      }, {
        filterType: 'NUMBER',
        title: 'Active Rate Count',
        name: 'active_rates_count',
        placeholder: 'Enter Active Rate count'
      },
    ]
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
  createCardVisibility = 'hidden';
  editCardVisibility = 'hidden';
  viewCardVisibility = 'hidden';
  title = 'Add Rate Card';


  constructor (
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private _programService: ProgramService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    public mapper: MappingService,
    private coreRouter: Router
  ) {
    this.route.paramMap.subscribe(param => {
      if (param.get('add')) {
        this.createCardVisibility = 'visible';
      }
    });
  }

  ngOnInit(): void {

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
  }

  onSearch(term) {
    this.searchTerm = term;
    this.isSearchedFlag = this.searchTerm !== '' || this.searchTerm !== null || this.searchTerm !== undefined;
    this.vmsTable.currentPage = 1;
    this.rateCardList();
  }

  rateCardList(pageNo = 1) {
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
            this.itemPerPage = 10;
            this.totalRecords = data.count;
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

            this.tableConfig.advanceFilter[2].multiSelectData = this.currencies;
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

    this.tableConfig.advanceFilter[0].fieldLoading = true;
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

            this.tableConfig.advanceFilter[0].multiSelectData = this.categories;
            this.tableConfig.advanceFilter[0].fieldLoading = false;

          }
        },
        error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
          this.tableConfig.advanceFilter[0].fieldLoading = false;
        }
      }
    );
  }

  fetchJobTitleList(term: string = null) {

    let url = `/job-manager/job-catalog/job_title?limit=20`;
    if (term) {
      url += `&search=${term}`;
    }

    this.tableConfig.advanceFilter[1].fieldLoading = true;
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

            this.tableConfig.advanceFilter[1].multiSelectData = this.job_titles;
            this.tableConfig.advanceFilter[1].fieldLoading = false;
          }
        }, error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
          this.tableConfig.advanceFilter[1].fieldLoading = false;
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

  onCreateClick(event) {
    this.title = 'Add Rate Card';
    this.createCardVisibility = 'visible';
  }

  onClickView(ev) {
    if (ev) {

      const { name, vmsData } = ev;
      switch (name) {

        case 'active_jobs':
          this.router.navigate(['jobs', 'list', 'all']);
          break;

        case 'active_rates':
        case 'job_category.category_name': {
          const { id } = vmsData;
          if(this.coreRouter.url.includes('self-configuration')) {
            this.router.navigate(['rate', 'rate-card', 'details', id]);
          } else {
            this.router.navigate(['rate-card', 'details', id]);
          }
          break;
        }

        default: {
          const { id } = ev;
          if(this.coreRouter.url.includes('self-configuration')) {
            this.router.navigate(['rate', 'rate-card','details', id]);
          } else {
            this.router.navigate(['rate-card','details', id]);
          }
          break;
        }
      }
    }
  }

  onEditClick(event) {
    this.selectedCard = event;
    this.title = 'Edit Rate Card';
    this.editCardVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.EDIT_RATE_CARD, true));
  }

  onDisableClicked(event) { }

  onDeleteClick(event) { }

  onDetailClick(event) {
    this.selectedCard = event;
    this.title = 'View Rate Card';
    this.viewCardVisibility = 'visible';
  }

  onPaginationClick(event) {
    this.rateCardList(event);
  }

  onListFilter(event) {
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

  filterRateCard(event = null, pageNo = 1) {

    const offset = (pageNo - 1) * this.itemPerPage;
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url =  `/configurator/programs/${programId}/rate-cards?limit=${this.itemPerPage}&offset=${offset}&page=${pageNo}`;

    if(event) {
    
      const { 
        job_category, 
        job_title, 
        currency, 
        active_jobs,
        active_jobs_count, 
        active_rates, 
        active_rates_count 
      } = event;

      if(job_category) {
        url += `&job_category_id=${job_category}`;
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

            if (result.job_title.title && result.job_category.category_name) {
              result.job_category.category_name = result.job_category.category_name + ' - ' + result.job_title.title;
            } else if (result.job_title.title && !result.job_category.category_name) {
              result.job_category.category_name = result.job_title.title;
            }

          });
          this.vmsData = data;
          this.itemPerPage = 10;
          this.totalRecords = data.count;
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(node => {
      node.unsubscribe();
    });
  }

}