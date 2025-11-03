import { Component, OnInit } from '@angular/core';
import { Records, flowType, tableConfig } from './flows-list.model';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { Subject } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-flows-list',
  templateUrl: './flows-list.component.html',
  styleUrls: ['./flows-list.component.scss']
})
export class FlowsListComponent implements OnInit {
  public tableConfig: any = tableConfig;
  public programId: any;
  public moduleFilterInput = new Subject<string | null>();
  public eventNameFilterInput = new Subject<string | null>();
  public searchmoduleId: string = null;
  public searchEventId: string = null;
  Records: Records = {
    totalRecords: 0,
    limitRecords: 10,
    pageNo: 1,
    activeFilters: false
  };
  dataLoader: boolean = false;
  searchTerm: string = null;

  constructor (
    private route: SvmsRouterService,
    private loader: LoaderService,
    private accessControlService: AccessControlService,
    private alert: AlertService,
    private localStorage: StorageService,
    private programService: ProgramService
  ) { }

  ngOnInit(): void {
    this.programId = this.localStorage.get("PROGRAM_ID");
    const modulesIndex = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'modules');
    const eventsIndex = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'events');
    const methodIndex = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'flow_type');
    this.tableConfig.advanceFilter[modulesIndex].eventEmiiter = this.moduleFilterInput;
    this.tableConfig.advanceFilter[eventsIndex].eventEmiiter = this.eventNameFilterInput;
    this.tableConfig.advanceFilter[modulesIndex].changeHandler = this.searchModuleFilter;
    this.tableConfig.advanceFilter[methodIndex].changeHandler = this.searchMethodNameFilter;
    this.tableConfig.advanceFilter[modulesIndex].changeOutput = this.changeOutputHandler;
    this.tableConfig.advanceFilter[eventsIndex].changeOutput = this.changeEventOutputHandler;
    this.tableConfig.advanceFilter[eventsIndex].changeHandler = this.searchEventNameFilter;
    this.tableConfig.columnList.forEach(x => {
      if(x.name == 'code') {
        x.isDeleteFlow = this.accessControlService.accessControl()
      }
    })
    this.getFlowsList();
  }

  searchModuleFilter = (term = '') => {
    let url = `/configurator/programs/${this.programId}/modules?limit=25&page=1`;
    const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'modules');
    if (term) {
      url += `&k=${term}`;
    }
    this.programService.get(url)
      .subscribe(
        {
          next: (data: any) => {
            const moduleData = data?.modules;
            const fmoduleData = [];
            moduleData?.forEach((item: any) => {
              fmoduleData.push({ value: item?.id, name: item?.name });
            });
            this.tableConfig.advanceFilter[index].multiSelectData = fmoduleData;
          }
        });

  }

  searchEventNameFilter = (term = '') => {
    if (this.searchmoduleId) {
      let url = `/configurator/flow-system/modules/${this.searchmoduleId}/events`;
      const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'events');
      if (term) {
        url += `?k=${term}`;
      }
      this.programService.get(url)
        .subscribe(
          {
            next: (data: any) => {
              const eventData = data?.events;

              const feventData = [];
              eventData?.forEach((item: any) => {
                feventData.push({ value: item?.id, name: item?.name });
              });
              this.tableConfig.advanceFilter[index].multiSelectData = feventData;
            }
          });
    }
  }

  searchMethodNameFilter = (term = '') => {
    if (this.searchmoduleId && this.searchEventId) {
      let url = `/configurator/flow-system/modules/${this.searchmoduleId}/events/${this.searchEventId}/methods`;
      const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'flow_type');
      if (term) {
        url += `?k=${term}`;
      }
      this.programService.get(url)
        .subscribe(
          {
            next: (data: any) => {
              const methodData = data?.methods;

              const fmethodData = [];
              methodData?.forEach((item: any) => {
                fmethodData.push({ value: item?.slug, name: item?.name });
              });
              this.tableConfig.advanceFilter[index].multiSelectData = fmethodData;
            }
          });
    }
  }

  changeEventOutputHandler = (selectedOutput: any = null) => {
    const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'flow_type');
    if (selectedOutput) {
      this.searchEventId = selectedOutput;
      this.searchMethodNameFilter();
    }
    else {
      this.searchmoduleId = null;
      this.tableConfig.advanceFilter[index].multiSelectData = [];
    }
  }

  changeOutputHandler = (selectedOutput: any = null) => {
    const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'events');
    if (selectedOutput) {
      this.searchmoduleId = selectedOutput;
      this.searchEventNameFilter();
    }
    else {
      this.searchmoduleId = null;
      this.tableConfig.advanceFilter[index].multiSelectData = [];
    }
  }

  onCreateClick(create: any) {
    if (create) {
      this.route.navigate(['flows-management', 'create']);
    }
  }

  onViewClick(view: any) {
    if (view) {
      const { id } = view;
      this.route.navigate(['flows-management', 'view', id]);
    }
  }

  onEditClick(edit: any) {
    if (edit) {
      const { id } = edit;
      this.route.navigate(['flows-management', 'edit', id]);
    }
  }

  onDeleteClick(deleteData: any) {
    const { id } = deleteData;
    if (id) {
      this.loader.show();
      this.programService.delete(`/configurator/programs/${this.programId}/flow-configs/${id}`)
        .subscribe(
          {
            next: (message: any) => {
              this.alert.success("Flow Deleted Successfully");
              this.loader.hide();
              this.ngOnInit();
            }, error: (err: any) => {
              this.loader.hide();
              this.alert.error(errorHandler(err));
            }
          });
    }

  }

  onSearch(searchTerm: string) {
    this.Records.pageNo = 1;
    this.searchTerm = searchTerm ? searchTerm : '';
    this.getFlowsList();
  }

  onPaginationClick(pagination: any) {
    this.Records.pageNo = pagination;
    if (!this.Records.activeFilters) {
      this.getFlowsList();
    }
    else {
      this.getFlowsAdvancedFiltered();
    }
  }

  onFilterList(filterData: flowType) {
    if (filterData) {
      this.Records.pageNo = 1;
      this.Records.activeFilters = true;
      if (filterData.modified_on) {
        filterData.modified_on = {
          start: filterData.modified_on[0] / 1000,
          end: filterData.modified_on[1] / 1000
        }
      }
      if (filterData.modules) {
        filterData.modules = [filterData.modules]
      }
      if (filterData.events) {
        filterData.events = [filterData.events]
      }
      this.Records.filterData = filterData;
      this.getFlowsAdvancedFiltered();
    }
    else {
      this.Records.pageNo = 1;
      this.Records.filterData = null;
      this.Records.activeFilters = false;
      const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'modules');
      this.tableConfig.advanceFilter[index].multiSelectData = [];
      this.searchmoduleId = null;
      this.getFlowsList();
    }
  }

  onClickRecords(recordsData: any) {
    this.Records.limitRecords = recordsData;
    this.Records.pageNo = 1;
    this.getFlowsList();
  }

  getFlowsAdvancedFiltered() {
    this.dataLoader = true;
    let url = `/configurator/programs/${this.programId}/flow-configs/advance-search?limit=${this.Records.limitRecords}&page=${this.Records.pageNo}`;
    this.programService.post(url, this.Records.filterData).subscribe(
      {
        next: (data: any) => {
          this.Records.noOfPages = Math.ceil(data?.total_records / data?.items_per_page);
          let flowArr = [];
          data?.flow_configs.map((flow: any) => {
            let flowData = {
              code: flow?.code,
              is_enabled: flow?.is_enabled,
              name: flow?.name,
              modules: flow?.module?.name,
              flow_type: flow?.flow_type,
              modified_on: flow?.modified_on,
              id: flow?.id,
              events: flow?.event?.name
            }
            flowArr.push(flowData);
          });
          this.Records.flowsData = flowArr;
          this.dataLoader = false;
          this.Records.totalRecords = data?.total_records;
          this.Records.limitRecords = data?.items_per_page;
        },
        error: (err: any) => {
          this.dataLoader = false;
          this.alert.error(errorHandler(err));
        }
      })
  }

  getFlowsList() {
    this.dataLoader = true;
    let url = `/configurator/programs/${this.programId}/flow-configs?limit=${this.Records.limitRecords}&page=${this.Records.pageNo}&order_by=-created_on`;
    if (this.searchTerm) {
      url += `&k=${this.searchTerm}`;
    }
    this.programService.get(url).subscribe(
      {
        next: (data: any) => {
          this.Records.noOfPages = Math.ceil(data?.total_records / data?.items_per_page);
          let flowArr = [];
          data?.flow_configs.map((flow: any) => {
            let flowData = {
              code: flow?.code,
              is_enabled: flow?.is_enabled,
              name: flow?.name,
              modules: flow?.module?.name,
              flow_type: flow?.flow_type,
              modified_on: flow?.modified_on,
              id: flow?.id,
              events: flow?.event?.name
            }
            flowArr.push(flowData);
          });
          this.searchModuleFilter();
          this.Records.flowsData = flowArr;
          this.dataLoader = false;
          this.Records.totalRecords = data?.total_records;
          this.Records.limitRecords = data?.items_per_page;
        },
        error: (err: any) => {
          this.dataLoader = false;
          this.alert.error(errorHandler(err));
        }
      })
  }
}
