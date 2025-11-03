
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { errorHandler } from '../../../../shared/util/error-handler';

@Component({
  selector: 'app-distribution',
  templateUrl: './distribution.component.html',
  styleUrls: ['./distribution.component.scss']
})
export class DistributionComponent implements OnInit {
  public _jobTemplateviewData: any;
  vendorSearchList = false;
  _isSaveLoader: any;
  @Input() isSaveLoader(data) {
    if (data) {
      this._isSaveLoader = data;
    }
  };
  get loaderState() {
    return this._isSaveLoader;
  }

  programId: any;

  @Input() set distributionFormData(data) {
    if (data) {
      this._jobTemplateviewData = data;
      this.distributionForm.patchValue({
        submission_limit_vendor: this._jobTemplateviewData?.submission_limit_vendor,
        is_automatic_distribution: this._jobTemplateviewData?.is_automatic_distribution,
        is_tiered_distribute_schedule: this._jobTemplateviewData?.is_tiered_distribute_schedule,
        is_manual_distribution_job_submit: this._jobTemplateviewData?.is_manual_distribution_job_submit,
        is_automatic_distribute_submit: this._jobTemplateviewData?.is_automatic_distribute_submit,
        is_automatic_distribute_final_approval: this._jobTemplateviewData?.is_automatic_distribute_final_approval,
        distribute_schedule: this._jobTemplateviewData?.distribute_schedule || null,
        submissions_from_direct_sourcing: this._jobTemplateviewData?.submissions_from_direct_sourcing,
        after_immediate_distribution_schedule: this._jobTemplateviewData?.after_immediate_distribution_schedule,
        immediate_distribution: this._jobTemplateviewData?.immediate_distribution,
        after_immediate_distribution: this._jobTemplateviewData?.after_immediate_distribution,
      });
      this.direct_sourcing = this._jobTemplateviewData?.submissions_from_direct_sourcing;
      this.distributionScheduleSelected(this.distributionForm?.value?.distribute_schedule)
    }
  }
  get jobTemplate() {
    return this._jobTemplateviewData;
  }

  visibility: any;
  public itemPerPage = 20;
  distributionScheduleList: any;
  vendorsList: any = [];
  direct_sourcing = [
    { name: 'indeed', src: 'assets/images/indeed.png', id: 1, ischecked: false },
    { name: 'zip_recruiter', src: 'assets/images/zip_recruiter.png', id: 1, ischecked: false },
    { name: 'linkedin', src: 'assets/images/linkedin.png', id: 1, ischecked: false }
  ]
  public distributionForm: UntypedFormGroup;
  public toggleDisable = {
    value: true
  };
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter();
  constructor(public route: ActivatedRoute,
    public jobService: JobService,
    public storageService: StorageService,
    public alertService: AlertService,
    private fb: UntypedFormBuilder) { }

  ngOnInit(): void {
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails?.['id'];
    this.getVendorScheduleListItems();
    this.visibility = this.route.snapshot.params['name'];
    this.distributionForm = this.fb.group({
      submission_limit_vendor: [, [Validators.required, Validators.min(1), Validators.max(65535)]],
      is_automatic_distribution: [true, [Validators.required]],
      is_tiered_distribute_schedule: [false, [Validators.required]],
      is_manual_distribution_job_submit: [false, [Validators.required]],
      is_automatic_distribute_submit: [true, [Validators.required]],
      is_automatic_distribute_final_approval: [false, [Validators.required]],
      distribute_schedule: [],
      submissions_from_direct_sourcing: ['',],
      after_immediate_distribution_schedule: [],
      immediate_distribution: [],
      after_immediate_distribution: []
    });
    // this.distributionForm.reset();
    // this.selectDistribution('is_automatic_distribution');

  }
  onClickToggleDisable() {
    if (this.toggleDisable.value) {
      this.toggleDisable.value = false;
    } else {
      this.toggleDisable.value = true;
    }
  }
  removeDistribution(c) {
    this.distributionForm.patchValue({
      distribute_schedule: null,
    })
  }

  selectDirectSourcing(data, d) {
    data?.forEach(ds => {
      if (ds?.name === d?.name) {
        ds.ischecked = true;
      }
    });
    this.distributionForm.patchValue({ submissions_from_direct_sourcing: data });
  }
  setDistributionMethod(value) {
    if (value === 'is_automatic_distribute_submit') {
      this.distributionForm.patchValue({
        is_automatic_distribute_submit: true,
        is_automatic_distribute_final_approval: false
      });
    } else {
      this.distributionForm.patchValue({
        is_automatic_distribute_submit: false,
        is_automatic_distribute_final_approval: true
      });
    }
  }

  selectDistribution(value) {
    this.distributionForm?.controls?.distribute_schedule?.setValidators(null);
    if (value === 'is_automatic_distribution') {
      this.distributionForm.patchValue({
        is_automatic_distribution: true,
        is_tiered_distribute_schedule: false,
        is_manual_distribution_job_submit: false,
        is_automatic_distribute_submit: true,
      });
    }
    if (value === 'is_tiered_distribute_schedule') {
      // this.distributionForm.
      this.distributionForm?.controls?.distribute_schedule?.setValidators([Validators.required]);
      this.distributionForm.patchValue({
        is_automatic_distribution: false,
        is_tiered_distribute_schedule: true,
        is_manual_distribution_job_submit: false,
        is_automatic_distribute_submit: false,
        is_automatic_distribute_final_approval: false
      });
    } if (value === 'is_manual_distribution_job_submit') {
      this.distributionForm.patchValue({
        is_automatic_distribution: false,
        is_tiered_distribute_schedule: false,
        is_manual_distribution_job_submit: true,
        is_automatic_distribute_submit: false,
        is_automatic_distribute_final_approval: false
      });
    }
    this.distributionForm?.controls?.distribute_schedule?.updateValueAndValidity();
  }

  backTo() {
    this.onClose.emit({ type: 'saveQualification', value: 4 });
  }
  getVendorScheduleListItems(pageNo = 1) {
    const url = `/configurator/programs/${this.programId}/vendors/distribution-schedules?limit=${this.itemPerPage}&page=${pageNo}`;
    this.jobService.get(url).subscribe(
      data => {
        if (data) {
          this.distributionScheduleList = data;
        }
      },
      (err) => {
        this.alertService.error(errorHandler(err));
      });
  }
  selectedSchedule: any;
  distributionScheduleSelected(schedule) {
    if (schedule) {
      this.selectedSchedule = schedule;
      const immediateSchedule = schedule?.schedules?.filter(unit => unit?.schedule_unit === 'IMMEDIATE');
      const nonImmediateSchedule = schedule?.schedules?.filter(unit => unit?.schedule_unit !== 'IMMEDIATE');
      this.vendorsList = immediateSchedule?.concat(nonImmediateSchedule);
      if (nonImmediateSchedule && nonImmediateSchedule?.length) {
        this.distributionForm.patchValue({
          after_immediate_distribution_schedule: { schedule_unit: nonImmediateSchedule[0]?.schedule_unit, schedule_value: nonImmediateSchedule[0]?.schedule_value }
        });
      }
    } else {
      this.vendorsList = [];
    }
  }

  searchVendor(searchString, schedule_id) {
    this.vendorSearchList = true;
    this.jobService.get(`/configurator/programs/${this.programId}/vendors?name=${searchString}`)
      .subscribe((data: any) => {
        const { program_vendors } = data;
        let indx;
        if (schedule_id !== 'IMMEDIATE') {
          indx = this.vendorsList.findIndex(vndrList => vndrList.id === schedule_id);
        } else {
          indx = this.vendorsList.findIndex(vndrList => vndrList.schedule_unit === 'IMMEDIATE');
        }
        if (indx > -1) {
          this.vendorsList[indx].vendorSearch = program_vendors;
        }
      })
  }

  addMoreVendor(vendor, schedule_id) {
    const indx = this.vendorsList.findIndex(vndrList => vndrList.id === schedule_id);
    if (indx > -1) {
      if (!Array.isArray(this.vendorsList[indx].moreVendors)) {
        this.vendorsList[indx].moreVendors = [];
      }
      const inIndex = this.vendorsList[indx].vendorSearch.findIndex(vn => vn.id === vendor.id);
      if (inIndex > -1) {
        this.vendorsList[indx].vendorSearch.splice(inIndex, 1);
      }
      const includeInVendor = this.vendorsList[indx].vendors
        .some(_vendor => _vendor.id === vendor.id) ||
        this.vendorsList[indx].moreVendors.some(_vendor => _vendor.id === vendor.id);
      if (!includeInVendor) {
        this.vendorsList[indx].moreVendors.push(vendor)
      }
    }
  }

  deleteVendor(vendorListIndex, vendorArray, vendorArrayIndex) {
    this.vendorsList[vendorListIndex][vendorArray].splice(vendorArrayIndex, 1);
  }

  saveDistributionForm() {
    this.setImmediateDistribution();
    this._isSaveLoader = true;
    this.onClose.emit({ type: 'distributionInfo', value: 5 });
    this.onSubmit.emit({ type: 'distributionInfo', data: this.distributionForm.value, value: 5 });
  }

  setImmediateDistribution() {
    this.vendorsList?.forEach(im => {
      if (im?.schedule_unit === 'IMMEDIATE') {
        let immediateVendorIDs: any = [];
        let result = im?.vendors?.map(function (a) { return a?.vendor?.id; });
        const vendor_group_id = im?.vendor_groups?.map(function (a) { return a?.id; });
        let result2 = im?.moreVendors?.map(function (a) { return a?.vendor?.id; });
        if (result?.length > 0) {
          immediateVendorIDs = immediateVendorIDs?.concat(result)
        }
        if (result2?.length > 0) {
          immediateVendorIDs = immediateVendorIDs?.concat(result2)
        }
        this.distributionForm.patchValue({
          immediate_distribution: { vendor_id: immediateVendorIDs , vendor_group_id }
        })
      } else {
        let afterimmediateVendorIDs: any = [];
        let result = im?.vendors?.map(function (a) { return a?.vendor?.id; });
        const vendor_group_id = im?.vendor_groups?.map(function (a) { return a.id; });
        let result2 = im?.moreVendors?.map(function (a) { return a?.vendor?.id; });
        if (result?.length > 0) {
          afterimmediateVendorIDs = afterimmediateVendorIDs?.concat(result)
        }
        if (result2?.length > 0) {
          afterimmediateVendorIDs = afterimmediateVendorIDs?.concat(result2)
        }
        this.distributionForm.patchValue({
          after_immediate_distribution: { vendor_id: afterimmediateVendorIDs, vendor_group_id }
        })
      }
    });
  }
}

