import { Injectable } from '@angular/core';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { UserService } from '../../core/services/user.service';
import { WidgetCategories, Widgets } from '../../library/widget/widget.types';
import { AlertService } from '../../core/components/alert/alert.service';
import { IWidgetData, IWidgetDataItem, IWidgetGridItem, IWidgetUpdateData } from '../dashboard.interfaces';
import { DashboardService } from '../dashboard.service';

import {
  defaultVendorWidgetConfigs,
  defaultWorkerWidgetConfigs,
  defaultClientWidgetConfigs,
  ClientWidgetConfigs,
  VendorWidgetConfigs,
  WorkerWidgetConfigs,
  WidgetsDataByRole
} from '../../library/widget/widget.config';

import {
  defaultVendorDashboardPosition,
  defaultClientDashboardPosition,
  defaultWorkerDashboardPosition,
  defaultGridItemSizes,
  widgetCategoryByName
} from '../dashboard.config';

import { DashboardPermissionService } from './dashboard.permission.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserType } from '../dashboard.enums';
import { ProgramService } from '../../programs/program.service';
import { IChartWidget, IListWidget, IWidget } from '../../library/widget/widget.interfaces';
import { EmitEvent, Events, EventStreamService } from '../../core/services/event-stream.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
import { Subscription } from 'rxjs';
import { quickLinkWidgetsConfig } from 'src/app/library/widget/quick-link-widget/quick-link-widget.model';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { UserDataObj } from 'src/app/shared/enums';

@Injectable({
  providedIn: 'root'
})

export class DashboardDataService {
  public programId: string;
  public user: any;
  public role: any;
  public workers: any;
  public assignment: any;
  public assignmentId: string;
  public workerId: string;
  public hasNoProgram: boolean = false;

  public widgetsData: IWidgetData = {};  //widgest data by user
  public copiedWidgetsData: IWidgetData = {};
  public widgetGridItems: IWidgetGridItem[] = [];
  public copiedWidgetGridItems: IWidgetGridItem[] = [];
  public hiddenWidgetGridItems: IWidgetGridItem[] = [];
  logs:any  = undefined;
  private subscriptions: Subscription[] = [];
  userDataEnum= UserDataObj;

  constructor(
    private dashboardService: DashboardService,
    private storageService: StorageService,
    private userService: UserService,
    private alertService: AlertService,
    private permissionService: DashboardPermissionService,
    private themeService: ThemeService,
    private eventStreamService: EventStreamService,
    private programService: ProgramService,
    private loaderService: LoaderService,
    private userPermissionService: UserPermissionService,
    private masterTalentProfileService:MasterTalentProfileService

  ) {
    this.subscriptions.push(this.eventStreamService.on(Events.PROGRAM_SIDEBAR).subscribe({next:(data:any) => {
      setTimeout(() => {
        if (Object.keys(this.widgetsData).length === 0) {
          this.role = this.storageService.get(StorageKeys?.CURRENT_ACCOUNT)?.role;
          if(this.role?.id){
          this.loadConfigWidgetData();
          }
        }
      }, 800);
    }}));
   }

  get currentProgram() {
    let program: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    return program;
  }

  get currentAccount() {
    return this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
  }

  get currentUser() {
    return this.storageService.get(StorageKeys.CURRENT_USER);
  }

  onDashboardInit() {
    this.loaderService.show();
    this.user = this.currentUser;
    const theme = this.storageService.get(this.userDataEnum[2]);
    this.themeService.changeTheme(theme || this.user?.theme?.code);
    this.waitForProgramInit();
  }

  waitForProgramInit() {
    if(this.currentProgram) {
      this.loadData(this.currentProgram);
      this.hasNoProgram = false;
      return;
    }else {
      this.loaderService.hide();
      this.hasNoProgram = true;
    }

    setTimeout(() => {
      this.waitForProgramInit();
    }, 400);
  }

  getMyPrograms() {
    this.userService.getAllPrograms().subscribe({next:(data:any) => {
      if (data?.programs?.length) {
        const programs = data.programs;
        this.programService.setProgram(programs[0], true);
        this.loadData(programs[0]);
      } else {
        this.hasNoProgram = true;
        this.loaderService.hide();
      }
    },error: err => {
      this.loaderService.hide();
      // this.alertService.error('Something went wrong with getting programs! Please try again later');
      let log=this.showError('Something went wrong with getting programs! Please try again later');
      this.emitLogs(log)
    }});
  }

  loadData(program) {
    this.programId = program['id'];
    if (this.currentAccount) {
      this.role = this.currentAccount.role;
      this.checkAccountRole();
    } else {
      this.getAccount();
    }

    // handle widgetload after vendor checks
    // const isVendor = this.storageService.get('user_type') === 'VENDOR';
    // if (isVendor) {
    //   this.userService.get(`/configurator/programs/${this.programId}/vendors/${this.user.organization_id}`)
    //     .subscribe(res => {
    //       const { program_vendor } = res;
    //       if (!program_vendor.is_onboarded) {
    //         this.route.navigate(['vendor-managment/setup'])
    //       }
    //     });
    // }
  }

  checkAccountRole() {
    if (this.role) {
      if (this.user?.is_candidate) {
        this.getWorkersList();
      } else {
        this.loadConfigWidgetData();
      }
    } else {
      this.loaderService.hide();
      if (!this.isUserSuperAdmin) {
        this.alertService.info('Oops! This user has no role');
      }
    }
  }

  get isUserSuperAdmin() {
    return this.userPermissionService.isUserSuperAdmin();
  }

  get showPendingActionWidget(){
    return this.masterTalentProfileService.hasPermission('manage_master_talent_profile');
  }

  getAccount() {
    this.userService.getMembershipDetails(this.programId, this.user?.id).subscribe({next:(data:any) => {
      this.role = data?.member?.role;
      this.checkAccountRole();
    },error: err => {
      this.loaderService.hide();
      this.alertService.error('Something went wrong with getting role! Please try again later');
    }});
  }

  getWorkersList() {
    this.dashboardService.getWorkersList(this.programId).subscribe({next:(data:any) => {
      this.workers = data?.data?.worker;
      if (this.workers && this.workers?.length > 0) {
        this.workerId = this.workers[0].worker_id;
        this.getAssignment(this.workers[0]);
        // this.loadConfigWidgetData();
      } else {
        this.loaderService.hide();
        this.alertService.info('Oops! Worker info is not available!')
      }
    },error: err => {
      this.loaderService.hide();
      // this.alertService.error('Something went wrong with getting worker info! Please try again later');
      let logs=this.showError('Something went wrong with getting programs! Please try again later');
      this.emitLogs(logs)

    }});
  }

  getAssignment(worker) {
    this.dashboardService.getAssignment(this.programId, worker.worker_id).subscribe({next:(data:any) => {
      if (data) {
        this.assignment = data?.data;
        this.loadConfigWidgetData();
      }
    },error: err => {
      this.loaderService.hide();
      // this.alertService.error('Something went wrong with getting assignment! Please try again later');
      let logs=this.showError('Something went wrong with getting assignment! Please try again later');
      this.emitLogs(logs)
    }});
  }

  processRecievedData(widgetData: any) {
    if (widgetData) {
      const isDefaultDataOld = Object.keys(widgetData).some(widgetKey => !Object.values(Widgets).includes(widgetKey as Widgets));
      return isDefaultDataOld ? this.getDefaultWidgetsData() : widgetData;
    } else return {};
  }

  loadConfigWidgetData() {
    this.dashboardService.getWidgetsConfigByRole(this.programId, this.role.id)?.subscribe({next:(res:any) => {
      const widgetsDataByRole = this.fixIncorrectNames(res.data?.widget_data); // TO REMOVE IN FUTURE
      this.dashboardService.getWidgetsConfigByUserAndRole(this.programId, this.user?.id, this.role?.id).subscribe({next:(result:any) => {
        let widgetDataByUser = null;
        const data = result?.data?.widget_data
        if(this.showPendingActionWidget){
          widgetDataByUser  = { 'quick_pending_action' : quickLinkWidgetsConfig.quick_pending_action, ...data};
        }else{
          if(data && ('quick_pending_action' in data)){
            delete data['quick_pending_action'];
          }
          widgetDataByUser = data 
        }
        if(widgetDataByUser){
          this.setConfigByRole(widgetsDataByRole, widgetDataByUser);
          this.splitWidgetData(widgetDataByUser);
        }
        this.loaderService.hide();
      },error: err => {
        this.loaderService.hide();
        // this.alertService.error('Something went wrong with getting widgets! Please try again later');
      }});
    },error: err => {
      this.loaderService.hide();
      // this.alertService.error('Something went wrong with getting widgets! Please try again later');
      let logs=this.showError('Something went wrong with getting widgets! Please try again later');
      this.emitLogs(logs)
    }});
  }

  findCategoryByName(name: string): string {
    if (name.includes('quick')) {
      return WidgetCategories.QuickLink;
    } else if (name.includes('table')) {
      return WidgetCategories.Table;
    } else if (name.includes('calendar')) {
      return WidgetCategories.Calendars;
    } else if (name.includes('custom')) {
      return WidgetCategories.Custom;
    } else if (name.includes('list')) {
      return WidgetCategories.Lists;
    } else if (name.includes('chart')) {
      return WidgetCategories.Charts;
    } else {
      return WidgetCategories.Custom;
    }
  }

  setConfigByRole(widgetData: any, widgetList: any) {
    const widgetListTemp=[];
    if(widgetList && widgetList!=undefined && widgetList!=null && widgetData){
      Object.values(widgetData).forEach(element => {
        if(element){
          Object.values(element).forEach((wg) => {
            if(wg){
              widgetListTemp.push(wg)
            }
          });
        }
      });
    }


    // const widgetResult = Object.values(widgetList).map((wg: {name: string; category: string}) => {

    const widgetResult = Object.values(widgetListTemp).map((wg: {name: string; category: string}) => {
      const category = wg?.category ?? this.findCategoryByName(wg?.name);
      const name = wg && wg.name;
      return [name as string, { ...widgetData[category][name], ...wg }];
    });

    if (widgetData) {
      WidgetsDataByRole.quick_link = widgetResult.filter(wg => wg[1].category === 'quick_link').reduce((a, v) => ({ ...a, [v[0]]: v[1]}), {});
      WidgetsDataByRole.lists = widgetResult.filter(wg => wg[1].category === 'lists').reduce((a, v) => ({ ...a, [v[0]]: v[1]}), {});
      WidgetsDataByRole.charts = widgetResult.filter(wg => wg[1].category === 'charts').reduce((a, v) => ({ ...a, [v[0]]: v[1]}), {});
      WidgetsDataByRole.calendars = widgetResult.filter(wg => wg[1].category === 'calendars').reduce((a, v) => ({ ...a, [v[0]]: v[1]}), {});
      WidgetsDataByRole.table = widgetResult.filter(wg => wg[1].category === 'table').reduce((a, v) => ({ ...a, [v[0]]: v[1]}), {});
      WidgetsDataByRole.custom = widgetResult.filter(wg => wg[1].category === 'custom').reduce((a, v) => ({ ...a, [v[0]]: v[1]}), {});
    }
  }

  splitWidgetData(widgetData: IWidgetData) {
    this.widgetGridItems = [];
    for (const widget in widgetData) {
      const widgetName = this.getCorrectName(widget); // TO REMOVE IN FUTURE
      const item = { ...widgetData[widget] };
      this.widgetGridItems.push(this.getGridItem(widgetName, item));

      const widgetInfo: IWidgetDataItem = {
        name: widgetName as Widgets,
        label: item.label
      }

      if (item.chartType) {
        widgetInfo.chartType = item.chartType;
      }
      if (item.dimension) {
        widgetInfo.dimension = item.dimension;
      }
      if (item.options) {
        widgetInfo.options = item.options;
      }

      this.widgetsData[widgetName] = widgetInfo;
    }
  }

  getGridItem(widget: string, item: any) {
    //create new grid item from widget data
    let maxItemCols = item.maxItemCols ? item.maxItemCols : item.maxWidth;
    let maxItemRows = item.maxItemRows ? item.maxItemRows : item.maxHeight;
    let minItemCols = item.minItemCols ? item.minItemCols : item.minWidth;
    let minItemRows = item.minItemRows ? item.minItemRows : item.minHeight;

    if(item.name === 'quick_pending_action'){
      item['cols'] = 6;
      item['maxItemCols'] = 6;
      item['maxItemRows'] = 3;
      item['minItemCols'] = 6;
      item['minItemRows'] = 3;
      item['rows'] = 3;
      item['x'] = 12;
      item['y'] = 0;
   }

    if (this.isFixedSizeWidget(item.name)) {
      maxItemCols = item.cols ? item.cols : item.width;
      maxItemRows = item.rows ? item.rows : item.height;
      minItemCols = item.cols ? item.cols : item.width;
      minItemRows = item.rows ? item.rows : item.height;
    }

    return {
      cols: item.cols ? item.cols : item.width,
      label: item.label,
      maxItemCols: maxItemCols ?? item.cols,
      maxItemRows: maxItemRows ?? item.rows,
      minItemCols: minItemCols ?? item.cols,
      minItemRows: minItemRows ?? item.rows,
      name: widget as Widgets,
      rows: item.rows ? item.rows : item.height,
      x: item.x,
      y: item.y
    } as IWidgetGridItem;
  }

  ///// TO REMOVE IN FUTURE ------>
  getCorrectName(widgetName: string) {
    return widgetName === 'calendar_iterview_and_offers' ? 'calendar_interview_and_offers' : widgetName;
  }

  fixIncorrectNames(widgetData: any) {
    const badNames = ['calendar_iterview_and_offers'];
    for (let i = 0; i < badNames.length; ++i) {
      const badName = badNames[i];
      if (widgetData && widgetData.calendars?.hasOwnProperty(badName)) {
        const badNameData = widgetData?.calendars[badName];
        widgetData.calendars[this.getCorrectName(badName)] = badNameData;
        delete widgetData.calendars[badName];
      }
    }
    return widgetData;
  }
  // <---------/////////////////

  isFixedSizeWidget(name: Widgets) {
    return widgetCategoryByName[name] === WidgetCategories.QuickLink
  }

  mergeWidgetData(widgetData: IWidgetData, gridItems: IWidgetGridItem[]) {
    const mappedGridItems = gridItems.map(item => item.name);
    let mergedWidgetData: any = {};
    for (const widget in widgetData) {
      const item = widgetData[widget];
      const gridItemIndex = mappedGridItems.indexOf(widget as Widgets);
      if (gridItemIndex !== -1) {
        mergedWidgetData[widget] = { ...gridItems[gridItemIndex], ...item };
      }
    }
    return mergedWidgetData;
  }

  addWidget(widget: IWidget) {
    if (widget) {
      const gridItemIndex = this.getGridItemIndex(widget.name, this.widgetGridItems);
      if (gridItemIndex !== -1) {
        delete this.widgetGridItems[gridItemIndex].deleted;
        delete this.widgetGridItems[gridItemIndex].hidden;

        const hiddenGridItemIndex = this.getGridItemIndex(widget.name, this.hiddenWidgetGridItems);
        if (hiddenGridItemIndex !== -1) {
          this.hiddenWidgetGridItems.splice(hiddenGridItemIndex, 1);
        }
        this.updateWidget(widget);
      } else {
        const gridItem = { ...defaultGridItemSizes[widget.category], name: widget.name };
        const widgetDataItem: IWidgetDataItem = {
          name: widget.name,
          label: widget.label
        }
        this.widgetGridItems.push(gridItem);

        if (widget.category === WidgetCategories.Charts) {
          if ((widget as IChartWidget).chartType) {
            widgetDataItem.chartType = (widget as IChartWidget).chartType;
          }
          if ((widget as IChartWidget).dimension) {
            widgetDataItem.dimension = (widget as IChartWidget).dimension;
          }
        } else if (widget.category === WidgetCategories.Lists) {
          if ((widget as IListWidget).options) {
            widgetDataItem.options = (widget as IListWidget).options
          }
        }
        this.widgetsData[widget.name] = widgetDataItem;
      }
    }
  }

  updateWidget(widget: IWidget) {
    if (widget) {
      if (widget.category === WidgetCategories.Charts) {
        const chart = widget as IChartWidget;
        this.widgetsData[widget.name].label = chart.label;
        if (chart.chartType) {
          this.widgetsData[widget.name].chartType = chart.chartType;
        }
        if (chart.dimension) {
          this.widgetsData[widget.name].dimension = chart.dimension;
        }
        this.emitWidgetUpdateEvent({
          name: chart.name,
          label: chart.label,
          chartType: chart.chartType,
          dimension: chart.dimension,
          deleted: false,
        })
      } else if (widget.category === WidgetCategories.Lists) {
        const list = widget as IListWidget;
        this.widgetsData[widget.name].label = list.label;
        if (list.options) {
          this.widgetsData[widget.name].options = list.options;
        }
        this.emitWidgetUpdateEvent({
          name: list.name,
          label: list.label,
          options: list.options,
          deleted: false,
        })
      } else {
        this.widgetsData[widget.name].label = widget.label;
        this.emitWidgetUpdateEvent({
          name: widget.name,
          label: widget.label,
          deleted: false
        });
      }
    }
  }

  deleteWidgetWithoutUndo(widget: IWidget) {
    if (widget) {
      const mappedGridItems = this.widgetGridItems.map(item => item.name);
      const widgetIndex = mappedGridItems.indexOf(widget.name);
      if (widgetIndex !== -1) {
        this.widgetGridItems.splice(widgetIndex, 1);
        delete this.widgetsData[widget.name];
      }
    }
  }

  deleteWidget(name: Widgets, emitUpdateEvent?: boolean) {
    this.widgetGridItems = [...this.widgetGridItems.map(item => {
      if (item?.deleted && !item?.hidden && item.name !== name) {
        item.hidden = true;
        this.hiddenWidgetGridItems.push(item);
      } else {
        if (item.name === name) {
          item.deleted = true;
        }
      }
      return item;
    })];

    if (emitUpdateEvent) {
      this.emitWidgetUpdateEvent({ name: name, deleted: true });
    }
  }

  undoWidget(name) {
    const lastDeleted = this.hiddenWidgetGridItems.pop();
    this.widgetGridItems = [...this.widgetGridItems.map(item => {
      if (item.name === name) {
        delete item?.deleted;
      } else {
        if (item.name === lastDeleted?.name) {
          delete item.hidden;
        }
      }
      return item;
    })];
  }

  getGridItemIndex(name: Widgets, collection: IWidgetGridItem[]) {
    const mappedGridItems = collection.map(item => item.name);
    return mappedGridItems.indexOf(name);
  }

  emptyDashboardData() {
    this.widgetsData = this.copiedWidgetsData = {};
    this.widgetGridItems = this.copiedWidgetGridItems = this.hiddenWidgetGridItems = [];
    WidgetsDataByRole.quick_link =
      WidgetsDataByRole.lists =
      WidgetsDataByRole.charts =
      WidgetsDataByRole.calendars =
      WidgetsDataByRole.table =
      WidgetsDataByRole.custom =
        [];
  }

  saveDashboard() {
    this.copiedWidgetGridItems = [];
    this.widgetGridItems = this.widgetGridItems.filter(item => !item?.deleted);
    const mergedWidgetsData = this.mergeWidgetData(this.widgetsData, this.widgetGridItems);
    const dataToSend = {
      user_id: this.user.id,
      role_id: this?.role?.id,
      widget_data: mergedWidgetsData
    };
    this.dashboardService.saveDashboardByUserAndRole(this.programId, dataToSend).subscribe(
      {next: (res:any) => {
        this.loadConfigWidgetData();
        this.alertService.success('Dashboard has been successfully saved', { color: 'black', bgColor: 'lightgreen' });
      },error:
      (err) => this.alertService.warn('Something went wrong.PLease try later', { color: 'black', bgColor: '#DE4E5E' })
  });
  }

  deleteDashboard() {
    const requestDeleteData = {
      user_id: this.user.id,
      role_id: this?.role?.id,
    };
    this.dashboardService.deleteDashboardByUserAndRole(this.programId, requestDeleteData).subscribe(
      {next: (data) => {
        // this.loadData(this.currentProgram);
        this.alertService.success('Dashboard has been successfully deleted', { color: 'black', bgColor: 'lightgreen' });
      },error:
      (err) => this.alertService.warn('Something went wrong. Please try later', { color: 'black', bgColor: '#DE4E5E' })
  });
  }

  // resetDashboard() {
  //   const requestGetData = {
  //     role_id: this?.role?.id
  //   };

  //   this.dashboardService.getDefaultDashboardByRole(requestGetData).subscribe(
  //     (res) => {
  //       if (res.data && res.data.widget_data) {
  //         const requestSaveData = {
  //           user_id: this.user.id,
  //           role_id: this?.role?.id,
  //           widget_data: res.data.widget_data
  //         };
  //         this.dashboardService.saveDashboardByUserAndRole(requestSaveData).subscribe(
  //           (data) => {
  //             this.alertService.success('The dashboard has been successfully updated', { color: 'black', bgColor: 'lightgreen' });
  //             this.widgetsData = res.data.widget_data;
  //             this.splitWidgetData(res.data.widget_data);
  //           },
  //           (err) => this.alertService.warn('Something went wrong.PLease try later', { color: 'black', bgColor: '#DE4E5E' })
  //         );
  //       }
  //     },
  //     (err) => {
  //       (err) => this.alertService.warn('Something went wrong.PLease try later', { color: 'black', bgColor: '#DE4E5E' })
  //     }
  //   )
  // }

  getDefaultWidgetsData() {
    let defaultWidgetsConfig = {};
    let defaultDashboardPosition = [];

    if (this.permissionService.isUserRole(UserType.Vendor) ||
      this.permissionService.isUserRole(UserType.MSP) ||
      this.permissionService.isUserRole(UserType.Super_org)
    ) {
      defaultWidgetsConfig = defaultVendorWidgetConfigs;
      defaultDashboardPosition = defaultVendorDashboardPosition;
    } else if (this.permissionService.isUserRole(UserType.Worker)) {
      defaultWidgetsConfig = defaultWorkerWidgetConfigs;
      defaultDashboardPosition = defaultWorkerDashboardPosition;
    } else if (this.permissionService.isUserRole(UserType.Client)) {
      defaultWidgetsConfig = defaultClientWidgetConfigs;
      defaultDashboardPosition = defaultClientDashboardPosition;
    }
    const defaultWidgetsData = this.mergeWidgetData(defaultWidgetsConfig, defaultDashboardPosition);
    return defaultWidgetsData;
  }

  saveDefaultDashboard() {
    const defaultWidgetsData = this.getDefaultWidgetsData();
    const requestData = {
      role_id: this?.role?.id,
      widget_data: defaultWidgetsData
    };

    console.log(requestData);

    this.dashboardService.saveDefaultDashboardByRole(this.programId, requestData).subscribe({next:
      (res) => this.alertService.success('The dashboard has been successfully updated', { color: 'black', bgColor: 'lightgreen' }),
      error:(err) => this.alertService.warn('Something went wrong.PLease try later', { color: 'black', bgColor: '#DE4E5E' })
       });
  }

  deleteDefaultDashboard() {
    const requestData = {
      role_id: this?.role?.id,
    };

    this.dashboardService.deleteDefaultDashboardByRole(this.programId, requestData).subscribe({next:
      (res) => this.alertService.success('The dashboard has been successfully updated', { color: 'black', bgColor: 'lightgreen' }),
    error: (err) => this.alertService.warn('Something went wrong.PLease try later', { color: 'black', bgColor: '#DE4E5E' })
     } );
  }

  saveWidgetConfigsByRole() {
    let widgetConfigs = {};

    if (this.permissionService.isUserRole(UserType.Vendor) ||
      this.permissionService.isUserRole(UserType.MSP) ||
      this.permissionService.isUserRole(UserType.Super_org)
    ) {
      widgetConfigs = VendorWidgetConfigs.widget_data;
    } else if (this.permissionService.isUserRole(UserType.Worker)) {
      widgetConfigs = WorkerWidgetConfigs.widget_data;
    } else if (this.permissionService.isUserRole(UserType.Client)) {
      widgetConfigs = ClientWidgetConfigs.widget_data;
    }

    const requestData = {
      role_uuid: this?.role?.id,
      widget_data: widgetConfigs
    };

    console.log(widgetConfigs);

    this.dashboardService.saveWidgetConfigsByRole(this.programId, requestData).subscribe({next:
      (res) => this.alertService.success('Dashboard has been successfully saved', { color: 'black', bgColor: 'lightgreen' }),
     error: (err) => this.alertService.warn('Something went wrong.PLease try later', { color: 'black', bgColor: '#DE4E5E' })
     });
  }

  getAllWidgetsConfigs() {
    Object.values(WidgetsDataByRole).forEach((category: any) => {
      Object.values(category).forEach((widget: IWidget) => {
        Object.values(this.widgetGridItems).forEach((gridItem: IWidgetGridItem) => {
          if (gridItem.name === widget.name) {
            gridItem.deleted ? widget.isActive = false : widget.isActive = true;
            widget.label = this.widgetsData[gridItem.name].label;
            if (widget.category === WidgetCategories.Charts) {
              (widget as IChartWidget).chartType = this.widgetsData[gridItem.name].chartType;
              (widget as IChartWidget).dimension = this.widgetsData[gridItem.name].dimension;
            }
            if (widget.category === WidgetCategories.Lists) {
              if (this.widgetsData[gridItem.name].options) {
                (widget as IListWidget).options = this.widgetsData[gridItem.name].options;
              }
            }
          }
        })
      })
    })
    return WidgetsDataByRole;
  }

  emitWidgetUpdateEvent(data: IWidgetUpdateData) {
    this.eventStreamService.emit(new EmitEvent(Events.DASHBOARD_UPDATE_WIDGET, data));
  }
  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
      return this.logs;
  }
  emitLogs(logs){
    // this.eventStreamService.emit()
    this.eventStreamService.emit(new EmitEvent(Events.SHOW_DASHBOARD_LOGS, logs));


  }
}
