import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { StorageService } from 'src/app/core/services/storage.service';
import { defaultChartTypes } from 'src/app/library/widget/widget.config';
import { IChartWidget, IListWidget, IWidget } from 'src/app/library/widget/widget.interfaces';
import { ChartTypes, WidgetCategories } from 'src/app/library/widget/widget.types';
import { AlertService } from '../../../core/components/alert/alert.service';
import { FormDataTypes, FormGroupValidators } from '../../dashboard.enums';
import { IChartDimensions, IChartType, IListOptions } from '../../dashboard.interfaces';
import { DashboardDataService } from '../../services/dashboard.data.service';

@Component({
  selector: 'app-dashboard-widget-settings',
  templateUrl: './dashboard-widget-settings.component.html',
  styleUrls: ['./dashboard-widget-settings.component.scss']
})
export class DashboardWidgetSettingsComponent implements OnInit, OnDestroy {
  viewMode: any = 'tab0';
  form: UntypedFormGroup;
  widgets: any;
  chartTypes = defaultChartTypes;
  selectedWidget: IWidget;
  selectedWidgetChartTypes: IChartType[] = [];
  selectedWidgetChartDimensions: IChartDimensions[] = [];
  selectedWidgetListOptions: IListOptions[] = [];

  selectedChartType: ChartTypes;
  selectedChartDimension: string;
  selectedListOptions = new Set<string>();
  sortedWidgets: any;
  searchControl = new UntypedFormControl(null);
  openSearch = false;
  userRole: string;
  errorMessage: string;
  isFormValid = true;

  private searchValueSubscription: Subscription;

  @Input() dashboardDataService: DashboardDataService;
  @Input() widgetModalUpdateView = false;
  @Input() set updatedWidget(widget: IWidget) {
    this.prepareUpdateModal(widget);
  }

  constructor(
    private activeModal: NgbActiveModal,
    private alertService: AlertService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.getUserRole();
    this.widgets = this.dashboardDataService?.getAllWidgetsConfigs();
    this.form = new UntypedFormGroup({
      widget_name: new UntypedFormControl(this.selectedWidget?.label,
        [
          Validators.pattern(''),
          Validators.required,
          Validators.maxLength(35)
        ]),
      widget_type: new UntypedFormControl(''),
      widget_chart: new UntypedFormControl({}),
    });
    this.sortedWidgets = { ...this.widgets };
    this.addSearchSubscription();
  }

  hideModal(): void {
    this.activeModal.close(false);
  }

  onSubmit(): void {
    this.onSubmitValidation();
    if (this.isFormValid) {
      const message = (this.widgetModalUpdateView || this.selectedWidget.isActive) ? 'Widget successfully update to Dashboard' : 'Widget successfully added to Dashboard';
      this.alertService.success(message, { color: 'black', bgColor: 'lightgreen' });
      this.selectedWidget.label = this.form.value.widget_name;

      if (this.widgetModalUpdateView || (!this.widgetModalUpdateView && this.selectedWidget.isActive)) {
        this.selectedWidget.isActive = true;
        this.dashboardDataService.updateWidget(this.selectedWidget);
      } else {
        this.selectedWidget.isActive = true;
        this.dashboardDataService.addWidget(this.selectedWidget);
      }
    } else {
      setTimeout(() => {
        this.errorMessage = '';
      }, 2000);
    }
  }

  onSubmitValidation() {
    this.isFormValid = true;
    this.errorMessage = '';
    if (this.selectedWidget.category === WidgetCategories.Charts) {
      if (this.selectedChartDimension) {
        (this.selectedWidget as IChartWidget).dimension = this.selectedChartDimension;
      } else {
        if (this.selectedWidgetChartDimensions.length) {
          this.errorMessage = 'Please choose chart dimension';
          this.isFormValid = false;
        }
      }
      if (this.selectedChartType) {
        (this.selectedWidget as IChartWidget).chartType = this.selectedChartType;
      } else {
        if (this.selectedWidgetChartTypes.length) {
          this.errorMessage = 'Please choose chart type';
          this.isFormValid = false;
        } else {
          (this.selectedWidget as IChartWidget).chartType = (this.selectedWidget as IChartWidget).defaultChartType;
        }
      }
    } else if (this.selectedWidget.category === WidgetCategories.Lists) {
      if (this.selectedListOptions.size) {
        const options = [];
        for (const item of this.selectedListOptions.keys()) {
          options.push(item);
        }
        (this.selectedWidget as IListWidget).options = options;
      } else {
        this.errorMessage = 'Please choose one of the list options';
        this.isFormValid = false;
      }
    }
  }

  onChange(widget: IWidget) {
    let selectedWidget: IWidget = this.widgets[widget.category][widget.name];
    if (widget.isActive) {
      selectedWidget.isActive = false;
      selectedWidget.changed = true;
      this.dashboardDataService.deleteWidget(widget.name, true);
    } else {
      selectedWidget.isActive = true;
      this.dashboardDataService.addWidget(selectedWidget);
    }
  }

  prepareUpdateModal(widget: IWidget) {
    this.prepareSelectedWidget(widget);
  }

  getColor(color: any): string {
    return `background: ${color}3b`;
  }

  selectWidget(widget: IWidget): void {
    this.selectedWidget = widget;
    this.form.controls.widget_name.setValue(widget.label);
    this.form.controls.widget_name.setValidators([
      Validators.pattern(FormGroupValidators[widget.category]),
      Validators.required,
      Validators.maxLength(35)
    ]);
    this.form.controls.widget_name.updateValueAndValidity();
    this.selectedChartDimension = null;
    this.selectedChartType = null;
    this.selectedListOptions.clear();
    this.selectedWidgetChartDimensions = [];
    this.selectedWidgetChartTypes = [];
    this.selectedWidgetListOptions = [];
    this.prepareSelectedWidget(widget);
  }

  prepareSelectedWidget(widget: IWidget) {
    this.selectedWidget = widget;
    if (widget.category === WidgetCategories.Charts) {
      const chart = widget as IChartWidget;
      this.processFormData(chart, FormDataTypes.ChartType);
      this.processFormData(chart, FormDataTypes.Dimension);
      if (chart.hasOwnProperty('chartType')) {
        this.selectedChartType = chart.chartType;
      }
      if (chart.hasOwnProperty('dimension')) {
        this.selectedChartDimension = chart.dimension;
      }
    } else if (widget.category === WidgetCategories.Lists) {
      const list = widget as IListWidget;
      this.processFormData(list, FormDataTypes.Options);
      if (list.hasOwnProperty('options')) {
        const options = list.options;
        if (options) {
          for (let i = 0; i < options.length; ++i) {
            this.selectedListOptions.add(options[i]);
          }
        }
      } else {
        for (let i = 0; i < this.selectedWidgetListOptions.length; ++i) {
          this.selectedListOptions.add(this.selectedWidgetListOptions[i].option);
        }
      }
    }
  }

  selectChartDimension(type: string) {
    this.selectedChartDimension = type.toLowerCase();
  }

  selectChartType(type: ChartTypes) {
    this.selectedChartType = type;
  }

  selectListOption(option: string) {
    if (this.selectedListOptions.has(option)) {
      this.selectedListOptions.delete(option);
    } else {
      this.selectedListOptions.add(option);
    }
  }

  isWidgetSelected(widget) {
    return this.selectedWidget?.name === widget?.name;
  }

  isChartTypeSelected(type: ChartTypes) {
    return this.selectedChartType === type;
  }

  isChartDimensionSelected(type: string) {
    return this.selectedChartDimension === type.toLowerCase();
  }

  isListOptionSelected(option: string) {
    return this.selectedListOptions.has(option);
  }

  isObjectEmpty(object: any) {
    return object && Object.keys(object).length === 0 && object.constructor === Object;
  }

  isNoWidgets() {
    return this.isObjectEmpty(this.widgets?.quick_link)
      && this.isObjectEmpty(this.widgets?.lists)
      && this.isObjectEmpty(this.widgets?.calendars)
      && this.isObjectEmpty(this.widgets?.charts)
      && this.isObjectEmpty(this.widgets?.table)
      && this.isObjectEmpty(this.widgets?.custom);
  }

  processFormData(widget: any, type: FormDataTypes) {
    if (type === FormDataTypes.Dimension && widget.formData?.dimension) {
      const dimensionLabels = widget.formData.dimension.labels.split('|');
      const dimensionTypes = widget.formData.dimension.values.split('|');

      for (let i = 0; i < dimensionLabels.length; ++i) {
        const label = dimensionLabels[i];
        const dimension = dimensionTypes[i];
        this.selectedWidgetChartDimensions.push({
          label,
          dimension
        })
      }
    } else if (type === FormDataTypes.ChartType && widget.formData?.chartType) {
      const chartTypeIcons = widget.formData.chartType.icons.split('|');
      const chartTypeLabels = widget.formData.chartType.labels.split('|');
      const chartTypeValues = widget.formData.chartType.values.split('|');

      for (let i = 0; i < chartTypeLabels.length; ++i) {
        const icon = chartTypeIcons[i];
        const label = chartTypeLabels[i];
        const type = chartTypeValues[i];
        this.selectedWidgetChartTypes.push({
          icon,
          label,
          type
        });
      }
    } else if (type === FormDataTypes.Options) {
      const apis = widget.apis[0];
      for (const value in apis) {
        this.selectedWidgetListOptions.push({
          label: apis[value].label,
          option: value
        });
      }
    }
  }

  public getUserRole(): void {
    this.userRole = this.storageService.get('account').role.organization_category.toLowerCase();
  }

  public listsByRole(lists) {
    let processedLists = { ...lists };
    for (const key in lists) {
      if (!lists[key].hasOwnProperty('category')) {
        if (lists[key].hasOwnProperty(this.userRole)) {
          processedLists = { ...processedLists, [key]: lists[key][this.userRole] };
        } else {
          delete processedLists[key];
        }
      }
    }
    return processedLists;
  }

  public openSearchInput() {
    this.openSearch = !this.openSearch;
    setTimeout(() => {
      document.getElementById('searchField').focus();
    });
  }

  public hideIfEmpty() {
    if (this.searchControl.value === null || this.searchControl.value === '') {
      this.openSearch = false;
    }
  }

  public isEmpty(obj: any) {
    return obj && Object.keys(obj).length === 0;
  }

  public changeTab(tab: string) {
    this.viewMode = tab;
    this.displaySearchResults();
  }

  private sortWidgetsByTerm(key: string, searchTerm: string) {
    let resObj = {};
    const widgetGroup = { ...this.widgets[key] };
    for (let w in widgetGroup) {
      if (widgetGroup[w].label?.toLowerCase().includes(searchTerm)) {
        resObj = { ...resObj, [w]: widgetGroup[w] };
      }
    }
    this.sortedWidgets[key] = resObj;
  }

  private displaySearchResults() {
    if (this.openSearch) {
      const searchTerm = this.searchControl.value?.toLowerCase();

      switch (this.viewMode) {
        case 'tab1': {
          this.sortWidgetsByTerm('quick_link', searchTerm);
          break;
        }

        case 'tab2': {
          this.sortWidgetsByTerm('lists', searchTerm);
          break;
        }

        case 'tab3': {
          this.sortWidgetsByTerm('charts', searchTerm);
          break;
        }

        case 'tab4': {
          this.sortWidgetsByTerm('calendars', searchTerm);
          break;
        }

        default: {
          for (let w in this.widgets) {
            this.sortWidgetsByTerm(w, searchTerm);
          }
          break;
        }
      }
    }
  }

  private addSearchSubscription() {
    this.searchValueSubscription = this.searchControl.valueChanges.subscribe(() => {
      this.displaySearchResults();
    });
  }

  private clearWidgets() {
    if(this.widgets){
      Object.values(this.widgets).forEach((category: any) => {
        Object.values(category).forEach((widget: IWidget) => {
          delete widget.changed;
        });
      });
    }
  }

  ngOnDestroy() {
    if(this.searchValueSubscription)
      this.searchValueSubscription.unsubscribe();
    this.clearWidgets();
  }
}
