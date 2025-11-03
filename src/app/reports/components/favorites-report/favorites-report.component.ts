import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReportItemModel, ReportSubItemModel } from '../../models/report.model';
import { NavigationPaths } from '../../enums/report.enums';
import { Router } from '@angular/router';


@Component({
  selector: 'app-favorites-report',
  templateUrl: './favorites-report.component.html',
  styleUrls: ['./favorites-report.component.scss']
})

export class FavoritesReportComponent implements OnInit {
  @Input() public reports: ReportItemModel[] = [];
  @Output() public removeReportFromFavorite = new EventEmitter<{ event: any, item: ReportSubItemModel }>();

  constructor(private router: Router) { }

  ngOnInit(): void { }

  public showReport(link: string): void {
    this.router.navigateByUrl(NavigationPaths.details(link));
  }
}
