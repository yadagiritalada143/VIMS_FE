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
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-list-work-location',
  templateUrl: './list-work-location.component.html',
  styleUrls: ['./list-work-location.component.scss']
})
export class ListWorkLocationComponent implements OnInit, OnDestroy {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  private subscriptions: Array<Subscription> = [];
  private locationSub: Subject<any> = new Subject<any>();

  public prevLocationQuery: any = {};
  public sidepanelVisibility: ('visible' | 'hidden') = 'hidden';

  public vmsData: any;
  public itemPerPage = 10;
  public totalRecords = 10;
  public tableConfig: VMSConfig = {
    title: 'Work Locations',
    columnList: [
      { name: 'name', title: 'Work Location', width: 24, isIcon: true, isImage: true, isContact: false, isNumberBadge: false },
      { name: 'code', title: 'Code', width: 16, isIcon: true, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'country.name', title: 'Country', width: 16, isIcon: true, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'state.name', title: 'State/Province', width: 16, isIcon: true, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'zipcode', title: 'Zip Code', width: 16, isIcon: true, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'is_enabled', title: 'Status', width: 16, isIcon: true, isImage: false, isContact: false, isDetails: false, isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDelete: false, isNumberBadge: false }
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    isCreate: true,
    density: 'COMFORTABLE',
    advanceFilter: [
      { name: 'name', title: 'Work Location Name', filterType: 'TEXT' },
      { name: 'code', title: 'Code', filterType: 'TEXT' },
      { name: 'zipcode', title: 'Zip Code', filterType: "TEXT" }
    ]
  };

  constructor(
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private accessControlService: AccessControlService,
    private loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private sortPipe: SortHelperPipe
  ) {
  }

  ngOnInit(): void {

    this.subscriptions.push(
      this.locationSub.pipe(
        debounceTime(600),
        switchMap((query: any) => {

          this.loader.show();
          this.prevLocationQuery = query;
          if (this.vmsTable) {
            this.vmsTable.currentPage = (query?.page || 1);
          }

          return this.getLocationURL(query);
        })
      ).subscribe((data: any) => {
        if (data) {
          this.vmsData = data;
          this.itemPerPage = data.items_per_page;
          this.totalRecords = data.total_records;

          const locations: Array<any> = this.vmsData?.work_locations;
          if (Array.isArray(locations)) {
            locations.forEach((entry: any, it: number) => {
              locations[it].zipvalue = locations[it].zipcode;
              if (entry?.zipcode) {
                locations[it].zipcode = entry.zipcode.toString();
              } else {
                locations[it].zipcode = '—';
              }
            })
          }

          this.loader.hide();
        }
      }, err => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      })
    );

    this.subscriptions.push(
      this.route.paramMap
        .subscribe((param: ParamMap) => {
          if (param.get('add')) {
            this.sidepanelVisibility = 'visible';
          }
        })
    );

    this.locationSub.next({ page: 1 });

  }

  getLocationURL(query: any): Observable<any> {

    const { search, name, code, zipcode, page } = query;
    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/work-locations?limit=${this.itemPerPage}&page=${(page || 1)}`;

    // Advance search
    if (name || code || zipcode) {
      if (name)
        url += `&name=${name}`;
      if (code)
        url += `&code=${code}`;
      if (zipcode)
        url += `&zipcode=${zipcode}`;
    }
    // Normal search
    else if (search) {
      url += `&k=${search}`;
    }

    return this.programService.get(url);

  }

  onSearch(term: string) {
    this.locationSub.next({ page: 1, search: term });
  }

  onPaginationClick(page: number) {
    this.locationSub.next({
      ...this.prevLocationQuery,
      page: page
    });
  }

  onListFilter(event: any) {
    if (event) {
      this.locationSub.next({
        name: event?.name,
        code: event?.code,
        zipcode: event?.zipcode,
        page: 1
      });
    } else {
      this.locationSub.next({ page: 1, search: '' });
    }
  }

  onEditClick($event) {
    if ($event) {
      this.sidepanelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.WORK_LOCATION_EDIT, $event));
    }
  }

  onCreateClick($event) {
    if ($event) {
      this.sidepanelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.WORK_LOCATION_CREATE, true));
    }
  }

  onViewClick($event) {
    if ($event) {
      this.sidepanelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.WORK_LOCATION_VIEW, $event));
    }
  }

  onDisableClicked($event) {
    if ($event) {
      this.eventStream.emit(new EmitEvent(Events.WORK_LOCATION_DISABLE, $event));
    }
  }

  onSortClick(event: any) {

    if (!event)
      return;

    const order: string = "" + ((event.order === 'ASC') ? 1 : -1);
    if (this.vmsData?.work_locations) {
      switch (event.name) {

        case 'name':
        case 'code':
        case 'zipcode':
        case 'is_enabled':
          this.vmsData.work_locations = this.sortPipe.transform(this.vmsData.work_locations, event.name, order);
          break;

        case 'country.name':
        case 'state.name':
          this.vmsData.work_locations = this.vmsData.work_locations.sort((a: any, b: any) => {
            let params: Array<string> = event.name.split('.');
            const nameA: string = a[params[0]][params[1]]?.toUpperCase();
            const nameB: string = b[params[0]][params[1]]?.toUpperCase();
            return Number(order) * nameA.localeCompare(nameB);
          });
          break;

        default:
          console.error('No case found for field: ' + event.name);
          break;
      }
    }
  }

  refreshListing() {
      this.locationSub.next(this.prevLocationQuery);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
