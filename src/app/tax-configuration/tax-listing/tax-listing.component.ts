import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-tax-listing',
  templateUrl: './tax-listing.component.html',
  styleUrls: ['./tax-listing.component.scss'],
})
export class TaxListingComponent implements OnInit {
  tabitem: string = 'client';

  public taxConfigId: string = null;
  public defaultDateFormat: string = 'dd/MM/yyyy';

  taxConfigList = [{}];
  fewerDetail: boolean = false;
  dropdownMenu: number;
  moreTaxInfo: boolean = false;
  taxConfigListLoading: boolean = true;

  logs: Log = undefined;

  constructor(
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private storage: StorageService,
    private route: Router,
    private alert: AlertService,
    private loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.showtab('client');
  }

  enableDisableTaxConfig(value, state) {
    this.taxConfigId = value;
    let payload: any = {};
    const programId = this.storage.get(StorageKeys.PROGRAM_ID);
    payload.is_enabled = state;

    const url = `/configurator/programs/${programId}/taxes/${this.taxConfigId}`;
    this.loader.show();

    this.programService.put(url, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.loader.hide();
          if (state) {
            this.alert.success('Tax configuration enabled successully');
          } else {
            this.alert.success('Tax configuration disabled successully');
          }
        }
      },
      error: (err: Error) => {
        this.showError(err);
        this.loader.hide();
      },
    });
  }

  cloneTaxConfig(value, name) {
    this.taxConfigId = value;
    let payload: any = {};
    const programId = this.storage.get(StorageKeys.PROGRAM_ID);

    payload.name = `Clone - ${name}`;
    payload.is_clone = true;
    const url = `/configurator/programs/${programId}/taxes/${this.taxConfigId}`;
    this.loader.show();

    this.programService.put(url, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.loader.hide();
          this.showtab(this.tabitem);
          this.alert.success('Tax configuration cloned successully');
        }
      },
      error: (err: Error) => {
        this.showError(err);
        this.loader.hide();
      },
    });
  }

  createTaxConfig() {
    this.route.navigate(['tax-configuration', 'create']);
  }
  showtab(value) {
    this.tabitem = value;
    const programId: string = this.storage.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/taxes`;
    if (value === 'client') {
      this.taxConfigListLoading = true;
      url += `?applicable_on=${value}`;
    } else {
      this.taxConfigListLoading = true;
      url += `?applicable_on=${value}`;
    }
    this.loader.show();
    this.programService.get(url).subscribe({
      next: (res: any) => {
        if (res) {
          console.log('Filtered Response', res);
          this.loader.hide();
          this.taxConfigListLoading = false;
          this.taxConfigList = res?.taxes;
        }
      },
      error: (err: Error | any) => {
        this.alert.error(errorHandler(err));
        this.taxConfigListLoading = false;
      },
    });
  }

  showHistory(value) {
    this.tabitem = value;
  }

  shoDetailHistory(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.TAX_CONFIGURATION_HISTORY, true));
    }
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : typeof err == 'string' ? err : '',
      messages: [],
      autoClose: true,
      isShown: true,
      showReportButton: err?.status == 500 || err?.status == 400,
      additionalInfo: { trace_id: err?.error?.trace_id },
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  showDropdown(i) {
    this.dropdownMenu = i;
  }

  hideDropdown(i) {
    this.dropdownMenu = null;
  }
  showFewerInfo(i) {
    this.fewerDetail = i;
  }
  moreDetail(i) {
    this.moreTaxInfo = i;
  }

  get editTaxConfigurationAllowed() {
    const permissions: Array <string> = this.storage.get(StorageKeys.USER_PERMISSION);
    if(Array.isArray(permissions) && permissions.includes('edit_tax_configuration'))
      return true;
    
    return false;
  }
}
