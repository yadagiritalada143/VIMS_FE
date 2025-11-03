import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoginService } from 'src/app/auth/login/login.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { CommonService } from 'src/app/library/custom-fields/common.service';
import { ProgramService } from 'src/app/programs/program.service';
import { CommonViewConfig, CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-view-work-location',
  templateUrl: './view-work-location.component.html',
  styleUrls: ['./view-work-location.component.scss'],
})
export class ViewWorkLocationComponent implements OnInit, OnDestroy, AfterViewInit {
  $destroy = new Subject();
  worklocationData: any;
  timezoneData: Array<any> = [];

  count = 0;
  viewConfig: Array<CommonViewDetail> = null;
  @ViewChild('currency', { static: true }) currencyTemplate: TemplateRef<any>;

  constructor(
    private router: SvmsRouterService,
    private route: ActivatedRoute,
    private eventStream: EventStreamService,
    private storageService: StorageService,
    private programService: ProgramService,
    private alert: AlertService,
    private loginService: LoginService,
    private loader: LoaderService,
    public commonViewService: CommonViewRuleFlowService,
    private cfService: CommonService
  ) {}

  ngOnInit(): void {
    this.fetchTimezoneData();

    this.route.queryParams.subscribe(params => {
      if (params.id && !this.worklocationData) {
        this.getWorkLocationData(params.id);
      }
    });

    this.eventStream
      .on(Events.WORK_LOCATION_VIEW)
      .pipe(takeUntil(this.$destroy))
      .subscribe((data: any) => {
        if (data && !this.worklocationData) {
          this.worklocationData = data;
        }
      });
  }

  fetchTimezoneData() {
    let url: string = '/configurator/resources/time_zones';
    this.programService.get(url).subscribe({
      next: (res: any) => {
        if (res?.time_zones) {
          this.timezoneData =
            res?.time_zones?.map((entry: any) => {
              return {
                id: entry?.id,
                name: entry?.name,
              };
            }) ?? [];
        }
      },
      error: (err: any) => {
        this.alert.error(errorHandler(err));
      },
    });
  }

  getWorkLocationData(id) {
    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/work-locations/${id}`;
    this.programService.get(url).subscribe({
      next: (res: any) => {
        this.worklocationData = res.work_location;
      },
      error: (err: any) => {
        console.log(err);
      },
    });
  }

  ngAfterViewInit(): void {
    this.loader.show();
    if (this.loginService.APICallLock !== 0) {
      setTimeout(() => {
        this.ngAfterViewInit();
      }, 400);
      return;
    }

    this.viewConfig = [
      {
        label: 'Work Location Title',
        value: this.worklocationData?.name || '--',
        displayType: CommonViewConfig.TEXT,
      },
      {
        label: 'Location Code',
        value: this.worklocationData?.code || '--',
        displayType: CommonViewConfig.TEXT,
      },
      {
        label: 'Description',
        value: this.worklocationData?.description || '--',
        displayType: CommonViewConfig.DESCRIPTION,
      },
      {
        label: 'Timezone',
        value: this.timezoneName(this.worklocationData?.timezone) || '--',
        displayType: CommonViewConfig.TEXT,
      },
      {
        label: 'Currency',
        value: this.worklocationData?.currencies,
        displayType: CommonViewConfig.TEMPLATE_REF,
        template: this.currencyTemplate,
      },
      {
        label: 'Address',
        value: 'Address',
        displayType: CommonViewConfig.HEADER
      },
      {
        label: 'Country',
        value: this.worklocationData?.country?.name || '--',
        displayType: CommonViewConfig.TEXT,
      },
      {
        label: 'Address Line 1',
        value: this.worklocationData?.address || '--',
        displayType: CommonViewConfig.TEXT,
      },
      {
        label: 'Address Line 2',
        value: this.worklocationData?.address_line_2 || '--',
        displayType: CommonViewConfig.TEXT,
      },
      {
        label: 'City',
        value: this.worklocationData?.city_name || '--',
        displayType: CommonViewConfig.TEXT,
      },
      {
        label: 'County',
        value: this.worklocationData?.county_name || '--',
        displayType: CommonViewConfig.TEXT,
      },
      {
        label: 'State',
        value: this.worklocationData?.state_name || '--',
        displayType: CommonViewConfig.TEXT,
      },
      {
        label: 'Zip Code',
        value: this.worklocationData?.zipcode || '--',
        displayType: CommonViewConfig.TEXT,
      }
    ];

    if(this.allowedCFuserType) {
      this.cfService.amendCFViewData(this.worklocationData?.custom_fields || {}, this.programID, 'WORK_LOCATIONS')
      .then((res: any) => { this.viewConfig.push(...res); });
    }
  }

  backToList() {
    this.router.navigate(['program', 'work-location', 'list']);
  }

  editWorkLocation() {
    this.eventStream.emit(new EmitEvent(Events.WORK_LOCATION_EDIT, this.worklocationData));
    this.router.navigate(['program', 'work-location', 'edit'], { queryParams: { id: this.worklocationData.id } });
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
  }

  currencyNames(currencies: Array<any>): string {
    if (!Array.isArray(currencies)) return '--';

    return currencies
      .map((curr: any) => {
        const currRef: any = curr?.currency?.[0];
        return `${currRef?.code} (${currRef?.symbol})`;
      })
      .filter(x => !!x)
      .join(', ');
  }

  timezoneName(id: string) {
    let name: string = this.timezoneData.find((entry: any) => entry?.id === id)?.name;
    return name ?? '--';
  }

  get programID() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  get userType() {
    return (this.storageService.get(StorageKeys.USER_TYPE) || '')?.toUpperCase();
  }

  get allowedCFuserType() {
    return true;
  }
}
