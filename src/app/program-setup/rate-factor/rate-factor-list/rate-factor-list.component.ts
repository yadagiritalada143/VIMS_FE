import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { Subscription } from 'rxjs';
import { RateFactorService } from '../rate-factor.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

type RateFactorItem = {
  term?: string,
  page: number,
  name?: string,
  abbr?: string
};

@Component({
  selector: 'app-rate-factor-list',
  templateUrl: './rate-factor-list.component.html',
  styleUrls: ['./rate-factor-list.component.scss']
})
export class RateFactorListComponent implements OnInit, OnDestroy {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  private subscriptions: Array <Subscription> = [];

  public vmsData: any;
  public title: string;
  public itemPerPage = 10;
  public totalRecords = 0;
  public buttonTitle = 'Save';

  public isEditMode: boolean = false;
  public isViewMode: boolean = false;
  public createMode: boolean = false;
  public isListingMode: boolean = true;

  public isFilterMode: boolean = false;
  public filterConfig: RateFactorItem = null;

  public tableConfig: VMSConfig = {
    title: 'Rate Factor Configuration',
    columnList: [
      {
        name: 'name',
        title: 'Rate Factor Name',
        width: 24,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: false
      }, {
        name: 'abbreviation',
        title: 'Rate Factor Abbreviation',
        width: 20,
        isIcon: true,
        isImage: false,
        isContact: false,
        isNumberBadge: false
      }, {
        name: 'hierarchies_data',
        title: 'Hierarchies',
        width: 20,
        isIcon: true,
        isImage: false,
        isContact: false,
        isNumberBadge: false
      }, {
        name: 'modified_on',
        title: 'Updated Date',
        width: 15,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false
      }, {
        name: 'is_enabled',
        title: 'Status',
        width: 13,
        isIcon: true,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isVieworEdit: true,
        isDisableorDelete: this.accessControlService.accessControl(),
      }
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    isCreate: true,
    isCreateButtonName: 'Add New',
    density: 'COMFORTABLE',
    advanceFilter: [
      { name: 'name', title: 'Rate Factor Name', filterType: 'TEXT' },
      { name: 'abbreviation', title: 'Abbreviation', filterType: 'TEXT' },
    ]
  };

  constructor (
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private accessControlService: AccessControlService,
    private alert: AlertService,
    private rateFactorService: RateFactorService
  ) {
    this.route.paramMap.subscribe((param: ParamMap) => {
      if (param.get('add')) {
        this.title = 'Add Rate Factor';
      }
    });
  }

  ngOnInit(): void {

    // Rate factor listener
    this.getRateFactorList({limit : 10, page:1})

    // Refresh listener
    this.subscriptions.push(
      this.eventStream.on(Events.REFRESH)
        .subscribe((data) => {
          this.createMode = data.create;
          this.isViewMode = data.view;
          this.isEditMode = data.edit;
          this.isListingMode = data.list;
          this.getRateFactorList(this.filterConfig);
        }
      )
    );
  }

  getRateFactorList(config: any) {
    this.filterConfig = config;
    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/rate-factors?limit=${this.itemPerPage}`;
    this.filterConfig.page = this.filterConfig?.page ? this.filterConfig?.page : 1;
    url += `&page=${this.filterConfig?.page}`;

    if (this.filterConfig?.term)
      url += `&k=${this.filterConfig?.term}`;
    if(this.filterConfig?.name)
      url += `&name=${this.filterConfig?.name}`;
    if(this.filterConfig?.abbr)
      url += `&abbreviation=${this.filterConfig?.abbr}`;
    this.loader.show();
    this.programService.get(url).subscribe(
      {
        next: (data: any) => {
          if(Array.isArray(data?.rate_factors)) {
            data['rate_factors'] = data.rate_factors.map((entry: any) => {
              return {
                ...entry,
                modified_on: this.parseTimestamp(entry?.modified_on)
              }
            })
          }

          this.vmsData = data;
          this.addHierarchyColumn(data);
          this.itemPerPage = data.items_per_page;
          this.totalRecords = data.total_records;
          this.loader.hide();
        },
        error: (err: any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      })
  }

  addHierarchyColumn(data) {

    const rateList: Array <any> = data?.rate_factors;
    if (Array.isArray(rateList)) {
      rateList.forEach((rate: any) => {
        let hierarchies: Array <string> = rate?.hierarchies;
        if (Array.isArray(hierarchies)) {
          let list: Array <string> = hierarchies.map((id: string) => (this.rateFactorService.hierarchyMap.get(id)));
          if (list.includes(null) || list.includes(undefined)) {
            setTimeout(() => {
              this.addHierarchyColumn(data);
            }, 1200);
          }

          list = list.filter((entry: string) => entry);
          rate['hierarchies_data'] = list.join(', ');
          if (!list.length) {
            rate['hierarchies_data'] = '—';
          }
        }
      });
    }
  }

  onCreateClick() {
    this.eventStream.emit(new EmitEvent(Events.CREATE_RATE_FACTOR, true));
    this.title = 'Add Rate Factor';
    this.buttonTitle = "Save"
    this.createMode = true;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isListingMode = false;
  }

  onViewClick(event) {
    const obj = { event: true, data: event };
    this.eventStream.emit(new EmitEvent(Events.VIEW_RATE_FACTOR, obj))
    this.title = `View Rate Factor`;
    this.buttonTitle = "Save"
    this.isViewMode = true;
    this.createMode = false;
    this.isEditMode = false;
    this.isListingMode = false;
  }

  onEditClick(event) {
    const obj = { event: true, data: event };
    this.eventStream.emit(new EmitEvent(Events.EDIT_RATE_FACTOR, obj));
    this.title = `Edit Rate factor`;
    this.buttonTitle = "Save"
    this.isEditMode = true;
    this.createMode = false;
    this.isViewMode = false;
    this.isListingMode = false;
  }

  onDisabledClicked(event) {

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/rate-factors/${event.id}`;
    let payload = {
      ...event,
      is_enabled: !event.is_enabled
    };

    if('hierarchies' in payload)
      delete payload.hierarchies;

    if ('job_template' in payload)
      delete payload.job_template;

    this.loader.show();
    this.programService.put(url, payload)
      .subscribe({
        next: (res: any) => {
          this.loader.hide();
          event.is_enabled = !event.is_enabled;
          this.alert.success(`Rate Factor ${event.is_enabled ? 'Enabled' : 'Disabled'} Successfully`);
        }, error: (err: Error | any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      }
    );
  }

  onSearch(term: string) {
    this.vmsTable.currentPage = 1;
    this.getRateFactorList({ term , page: 1 });
  }

  onPaginationClick(page: number) {
    if(this.isFilterMode) {
      this.filterConfig = { ...this.filterConfig, page };
      this.getRateFactorList(this.filterConfig);
    } else {
      this.getRateFactorList({ ...this.filterConfig, page });
    }
  }

  onListFilter(event: any) {

    if(!event) {
      this.isFilterMode = false;
      this.tableConfig.isSearch = true;
      this.getRateFactorList({ term: '', page: 1 });
      return;
    }

    this.tableConfig.isSearch = false;
    this.isFilterMode = true;
    this.filterConfig = {
      name: event['name'],
      abbr: event['abbreviation'],
      page: 1
    };

    this.getRateFactorList(this.filterConfig);

  }

  onSortClick(event) {
    if (event?.order) {
      switch (event.name) {
        case 'name':
        case 'jobs':
        case 'abbreviation':
          this.vmsData.rate_factors = this.vmsData.rate_factors.sort(function (a, b) {
            const nameA = a[event.name].toUpperCase(); // ignore upper and lowercase
            const nameB = b[event.name].toUpperCase(); // ignore upper and lowercase
            if (event.order === 'ASC') {
              return nameA < nameB ? -1 : 1;
            } else {
              return nameA < nameB ? 1 : -1;
            }
          });
          break;
        case 'is_enabled':
          this.vmsData.rate_factors = this.vmsData.rate_factors.sort(function (a, b) {
            const codeA = a.is_enabled;
            const codeB = b.is_enabled;
            if (event.order === 'ASC') {
              return codeA < codeB ? -1 : 1;
            } else {
              return codeA < codeB ? 1 : -1;
            }
          });
          break;
        case 'modified_on':
          event.order === 'ASC'
            ? this.vmsData.rate_factors.sort((a, b) => new Date(a.modified_on).getTime() > new Date(b.modified_on).getTime() ? -1 : 1)
            : this.vmsData.rate_factors.sort((a, b) => new Date(a.modified_on).getTime() > new Date(b.modified_on).getTime() ? 1 : -1);
          break;
      }
    }
  }

  parseTimestamp(stamp: number) {
    let str_data: string = '' + stamp;
    if(str_data.includes('.')) {
      let time_data: Array <string> = str_data.split('.');
      return Number.parseInt(time_data[0] + time_data[1].slice(0, 3));
    }

    // Change timestamp format from BE (if needed)
    return stamp;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

}
