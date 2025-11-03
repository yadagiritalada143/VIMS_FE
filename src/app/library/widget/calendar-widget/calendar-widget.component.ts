import { Component, Injector, OnInit } from '@angular/core';
import { IWidgetDataItem, IWidgetUpdateData } from '../../../../app/dashboard/dashboard.interfaces';
import { WidgetComponent } from '../widget.component';
import { ICalendarWidget } from '../widget.interfaces';
import { CalendarViewTypes } from '../../full-calendar/full-calendar.interfaces';
import { ViewTypeForCalendar } from './calendar-widget.config';
import { WidgetsDataByRole } from '../widget.config';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';
@Component({
  selector: 'app-calendar-widget',
  templateUrl: './calendar-widget.component.html',
  styleUrls: ['./calendar-widget.component.scss'],
})
export class CalendarWidgetComponent extends WidgetComponent implements OnInit {
  public widget: ICalendarWidget;
  public viewType: CalendarViewTypes;

  optionForm: any;
  calendarOptions: string[];
  calendarValues: string[];
  selectedOptionsValues: any = [];
  options = {};
  public reportApi;

  constructor(injector: Injector, private ConfigurationLoader: ConfigurationLoader ) {
    super(injector);
    this.reportApi = this.ConfigurationLoader?.getConfiguration()?.REPORT_API_ENDPOINT || environment.REPORT_API_ENDPOINT;
  }

  ngOnInit() {
    this.initWidget();
    this.initForm();
    this.selectedOptionsValues = this.optionForm?.value.options.map(elem => elem.toLowerCase());
  }

  initForm() {
    this.calendarOptions = this.widget.items?.map(el => el[0].toUpperCase() + el.slice(1)) || [];
    this.calendarValues = this.widget?.formData?.options?.values?.split('|') || [];
    this.calendarValues.forEach((el: string, indx: number) => {
      this.options[el] = this.calendarOptions[indx];
    });
    this.optionForm = new UntypedFormGroup({
      options: new UntypedFormControl(this.widget.items?.map(el => this.options[el]) || this.calendarOptions),
    });
  }

  assignWidget() {
    const widget: IWidgetDataItem = this._widget;
    this.widget = { ...WidgetsDataByRole.calendars[this._widget?.name] };
    this.viewType = ViewTypeForCalendar[this._widget?.name];
    this.widget.api = this.apiPreProcessing(this.widget.api);
    if (widget?.label) {
      this.widget.label = widget?.label;
    }
  }

  onUpdateWidget(data: IWidgetUpdateData) {
    if (data.name === this.widget?.name) {
      if (data.deleted !== undefined) {
        this._deleted = data.deleted;
      }
      if (data?.label !== undefined) {
        this.widget.label = data?.label;
      }
    }
  }

  getSelectedOptionData() {
    this.selectedOptionsValues = this.optionForm?.value.options.map(elem => elem.toLowerCase());
  }

  openEditWidgetModal() {
    this.emitOpenEditWidgetModal(this.widget);
  }

  undoWidget() {}

  onReloadWidget() {
    this.initWidget(true);
  }

  get isCalendarItems() {
    return this.widget?.name === 'calendar_items';
  }
}
