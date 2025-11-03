import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from '../../../core/components/alert/alert.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { ReportService } from '../../services/report.service';
import { ReportItemModel, ReportSubItemModel, ReportTypesModel } from '../../models/report.model';
import { favouritesLimit, NavigationPaths } from '../../enums/report.enums';
import { forkJoin } from 'rxjs';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss'],
})
export class ReportsListComponent implements OnInit {
  public search: string;
  public isLoaded = false;
  public reports: ReportItemModel[] = [];
  public reportTypes = ReportTypesModel;
  public selectedTab = ReportTypesModel.All.filter;
  public reportsFavorites: ReportItemModel[] = [];
  public reportTabs = [];
  public logs: Log = undefined;
  constructor(
    private reportService: ReportService,
    private loader: LoaderService,
    private alertService: AlertService,
    private router: Router,
    private sort: SortHelperPipe,
  ) {}

  ngOnInit(): void {
    this.reportService.updateCurrentProgram();
    this.getReports();
  }

  private getReports(): void {
    this.loader.show();
    forkJoin([this.reportService.getReports(), this.reportService.getFavoriteReports()]).subscribe({
      next: (result: [ReportItemModel[], Array<string>]) => {
        this.reports = result[0];
        this.reports = [
          ...this.sort.transform(
            this.reports?.filter(x => x.sort_id),
            'sort_id',
          ),
          ...this.sort.transform(
            this.reports?.filter(x => !x.sort_id),
            'label',
          ),
        ];
        this.reportTabs = [
          { ...ReportTypesModel.All },
          ...this.reports.map(item => {
            return {
              filter: item?.key,
              name: item?.label,
            };
          }),
        ];
        this.reports?.forEach((item: ReportItemModel) => {
          item.sub_items?.forEach((subItem: ReportSubItemModel) => {
            subItem.is_favorite = result[1]?.length && result[1].includes(subItem.key);
          });
          item.sub_items = [
            ...this.sort.transform(
              item.sub_items?.filter(x => x.sort_id),
              'sort_id',
            ),
            ...this.sort.transform(
              item.sub_items?.filter(x => !x.sort_id),
              'label',
            ),
          ];
        });
        this.setReportsFavorites();
        this.loader.hide();
        this.isLoaded = true;
      },
      error: error => {
        this.isLoaded = true;
        this.loader.hide();
        // this.alertService.error(errorHandler(error));
        this.showError(error);
      },
    });
  }

  public setReportsFavorites() {
    const arrayFavoriteReports = [];
    this.reports?.forEach((item: ReportItemModel) => {
      item.sub_items?.forEach((report: ReportSubItemModel) => {
        if (report.is_favorite) {
          arrayFavoriteReports.push(report);
        }
      });
    });
    this.reportsFavorites = arrayFavoriteReports;
  }

  public showReport(link: string): void {
    this.router.navigateByUrl(NavigationPaths.details(link));
  }

  public showReportTyped(event, report: ReportSubItemModel, isSaved: boolean): void {
    event.stopPropagation();
    const type = isSaved ? [NavigationPaths.allSaved()] : [NavigationPaths.allScheduled()];
    this.router.navigate(type, { queryParams: { name: report.label, key: report.key } });
  }

  public openNewTab(event, link): void {
    event.stopPropagation();
    const url = this.router.serializeUrl(this.router.createUrlTree([NavigationPaths.details(link)]));
    window.open(url, '_blank');
  }

  public changeTabReport(state: string): void {
    this.selectedTab = state;
  }

  public isReportEmpty(): boolean {
    if (!this.reports?.length) {
      return true;
    } else if (this.selectedTab === this.reportTypes.All.filter) {
      let state = true;
      this.reports.forEach((report: ReportItemModel) => {
        if (state) {
          state = !this.isShowReportOnSearch(report);
        }
      });
      return state;
    } else {
      const report = this.reports.find((report: ReportItemModel) => report.key === this.selectedTab);
      return !this.isShowReportOnSearch(report || ({} as ReportItemModel));
    }
  }

  public addToFavorite(reportItem: ReportSubItemModel, event?): void {
    if (event) {
      event.stopPropagation();
    }
    if (this?.reportsFavorites?.length >= favouritesLimit) {
      return this.alertService.info('Cannot add more then 20 items to favorites!');
    }
    this.reportService.addReportToFavorite(reportItem).subscribe({
      next: (res: any) => {
        reportItem.is_favorite = true;
        this.setReportsFavorites();
        this.alertService.success(res.message);
      },
      error: error => {
        this.loader.hide();
        // this.alertService.error(errorHandler(error));
        this.showError(error);
      },
    });
  }

  public removeFromFavorite(reportItem: ReportSubItemModel, event?): void {
    if (event) {
      event.stopPropagation();
    }
    this.reportService.removeReportFromFavorite(reportItem).subscribe({
      next: (res: any) => {
        reportItem.is_favorite = false;
        this.setReportsFavorites();
        this.alertService.success(res.message);
      },
      error: error => {
        this.loader.hide();
        // this.alertService.error(errorHandler(error));
        this.showError(error);
      },
    });
  }

  public isShowReport(report: ReportItemModel): boolean {
    if (report.key !== this.selectedTab && this.selectedTab !== this.reportTypes.All.filter) {
      return false;
    } else {
      if (this.search) {
        return this.isShowReportOnSearch(report);
      } else {
        return true;
      }
    }
  }

  private isShowReportOnSearch(report: ReportItemModel): boolean {
    let state: boolean = false;
    report.sub_items?.forEach((item: ReportSubItemModel) => {
      if (!state) {
        state = this.isShowSubReport(item);
      }
    });
    return state;
  }

  public isShowSubReport(item: ReportSubItemModel): boolean {
    if (!this.search) {
      return true;
    } else {
      const value = this.search?.toLocaleLowerCase() || '';
      return item.label.toLocaleLowerCase()?.includes(value);
    }
  }

  public resetSearch() {
    this.search = '';
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error ? err?.error?.error : err,
      messages: [],
      autoClose: true,
      isShown: true,
      showReportButton: err?.status == 500,
      additionalInfo: { trace_id: err?.error?.trace_id },
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }
}
