import { Component, EventEmitter, Input, OnInit, ViewChild , Output } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { StorageService } from '../../../core/services/storage.service';
import { ProgramConfig } from '../../../shared/enums';
import { JobsService } from '../../jobs.service';

@Component({
  selector: 'app-job-distribution',
  templateUrl: './job-distribution.component.html',
  styleUrls: ['./job-distribution.component.scss']
})
export class JobDistributionComponent implements OnInit {
  @Input() selectedTemplate: any;
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter();
  distributionSchedules: any[] = [];
  vendorsList: any[] = [];
  public programId: string;
  public clientId: string;
  public toggleDisable = {
    value: true
  };
  moreSearchVendorList: any[] = [];
  moreVendorTypehead = new EventEmitter<string>();
  @ViewChild('moreVendor') ngSelectComponent: NgSelectComponent;
  constructor(private localStorage: StorageService, private _jobsService: JobsService) { }

  ngOnInit(): void {
    let programid = this.localStorage.get(ProgramConfig[0]);
    programid = JSON.parse(programid);
    this.programId = '19106c90-e1f5-4016-b7bf-3cdf24a2b183';
    if (programid) {
      this.clientId = programid['clientId'];
      // this.programId = programid['program_req_id'];
    }
    this.getDistributionSchedule();
    this.moreVendorTypehead.pipe(debounceTime(1000), switchMap((term) => {
      return this.searchVendor(term);
    })).subscribe((data: any) => {
      const vendorList = data;
      this.moreSearchVendorList = vendorList;
    });
  }
  moreVendorList: any[] = [];
  moreVendorSelected(value) {
    if (value) {
      this.moreVendorList.push(value);
    }
    this.ngSelectComponent.handleClearClick();
  }

  searchVendor(term) {
    return this._jobsService.get(`/configurator/programs/${this.programId}/vendors?k=${term}`).pipe(map((res) => res.program_vendors));
  }

  addMoreVendor(event, scheduleIndex) {
    this.searchVendor(event).subscribe(data => {
      this.vendorsList[scheduleIndex].vendorSuggestion = data;
    });
  }

  hideFromSuggestion(vendorId, scheduleIndex) {
    return this.vendorsList[scheduleIndex]?.vendors.some(vendor => vendor.id === vendorId);
  }

  addToVendors(vendor, scheduleIndex) {
    this.vendorsList[scheduleIndex].vendors.push(vendor);
  }

  onClickToggleDisable() {
    if (this.toggleDisable.value) {
      this.toggleDisable.value = false;
    } else {
      this.toggleDisable.value = true;
    }
  }

  getDistributionSchedule() {
    this._jobsService.get(`/configurator/programs/${this.programId}/vendors/distribution-schedules`)
      .subscribe(data => {
        const { distribution_schedules } = data;
        this.distributionSchedules = distribution_schedules;
        // this.distributionSchedules.find(schedule => {})
      });
  }

  distributionScheduleSelected(schedule) {
    this.vendorsList = schedule?.schedules || [];
  }
  saveDistribution() {
    this.onClose.emit({ type: 'jobDistribution', value: 5 });
    this.onSubmit.emit({ type: 'jobDistribution', data: [] });
  }
}
