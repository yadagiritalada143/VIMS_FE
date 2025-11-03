import { Component, Injector } from '@angular/core';
import { IWidgetDataItem, IWidgetUpdateData } from '../../../dashboard/dashboard.interfaces';
import { WidgetComponent } from '../widget.component';
import { WidgetsDataByRole } from '../widget.config';
import { IQuickLinkWidget } from '../widget.interfaces';


@Component({
  selector: 'app-quick-link-widget',
  templateUrl: './quick-link-widget.component.html',
  styleUrls: ['./quick-link-widget.component.scss']
})

export class QuickLinkWidgetComponent extends WidgetComponent {
  public widget: IQuickLinkWidget;
  public count = 0;

  constructor(injector: Injector) {
    super(injector);
  }

  assignWidget() {
    const widget: IWidgetDataItem = this._widget;
    this.widget = { ...WidgetsDataByRole.quick_link[this._widget?.name] };
    if (widget?.label) {
      this.widget.label = widget?.label;
    }

    if (this.widget.api) {
      this.widget.api = this.apiPreProcessing(this.widget.api);
    }

    if (this.widget.link) {
      this.widget.link = this.apiPreProcessing(this.widget.link);
    }

  }

  onUpdateWidget(data: IWidgetUpdateData) {
    if (data?.name === this.widget?.name) {
      if (data.deleted !== undefined) {
        this._deleted = data.deleted;
      }
      if (data?.label !== undefined) {
        this.widget.label = data?.label;
      }
    }
  }

  onReloadWidget() {
    this.initWidget(true);
  }

  openEditWidgetModal() {
    this.emitOpenEditWidgetModal(this.widget);
  }

  getData() {
    if (this.widget.api) {
      this.dashboardService.get(`${this.widget.api}`).subscribe(response => {
        const res = JSON.parse(JSON.stringify(response));
        res?.data?.count
          ? this.count = res.data.count
          : this.count = 0;
      }, error => {
        this.onError(error);
      });
    }
  }

  hexToRGBA(hex, alpha: number = null): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (alpha) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else {
      return `rgba(${r}, ${g}, ${b})`;
    }
  }
}
