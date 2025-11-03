import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { Events, EventStreamService, EmitEvent } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
@Component({
  selector: 'app-distribution-sidebar',
  templateUrl: './distribution-sidebar.component.html',
  styleUrls: ['./distribution-sidebar.component.scss'],
})
export class DistributionSidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() laborCategories: any[] = [];
  @Input() vendorIds: string[] = [];
  @Input() vendorGroupIds: string[] = [];
  @Input() programId: string = '';
  @Input() scheduleIndex: number = 0;
  @Input() workLocationId = '';

  // talentTypeahead = new EventEmitter<string>();
  regionSearchTypeahead = new Subject<string>();
  viewCandidateProfile = 'hidden';
  tabIndex = 0;
  userBasic = true;
  visiblePanel = 'vendors';
  timeout: any = null;
  vendorSearchText;
  vendorGroupSearchText;
  selectedLaborCategoriesList: any[] = [];
  searchedLaborCategoriesList: any[] = [];
  laborCategoryList: any[] = [];
  searchRegionsList: any[] = [];
  regions: any[] = [];
  vendorsList: any[] = [];
  vendorsGroupList: any[] = [];
  regionList: any[] = [];
  selectedRegionList: any[] = [];

  private subscriptions = [];

  loadingData: boolean = false;
  regionLoading: boolean = false;

  @ViewChild('laborCategorySearch') ngSelectComponent: NgSelectComponent;
  @ViewChild('regionSearch') regionSearch: NgSelectComponent;

  constructor(
    private eventStream: EventStreamService,
    private jobService: JobService,
    private cd: ChangeDetectorRef,
    private sortPipe: SortHelperPipe,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.eventStream.on(Events.SEARCH_VENDOR).subscribe(data => {
        if (data.value) {
          this.viewCandidateProfile = 'visible';
          this.vendorsList = [];
          this.loadVendors();
          this.loadVendorsGroup();
        } else {
          this.viewCandidateProfile = 'hidden';
        }
      }),
    );

    // this.subscriptions.push(
    //   this.talentTypeahead
    //     .pipe(
    //       debounceTime(1000),
    //       switchMap(term => {
    //         return this.searchLaborCategories(term);
    //       }),
    //     )
    //     .subscribe((data: any) => {
    //       if (Array.isArray(data)) {
    //         this.searchedLaborCategoriesList = data.filter(inds => {
    //           return !this.hasSelectedIndsutry(inds.id);
    //         });
    //         this.searchedLaborCategoriesList = this.sortPipe.transform(this.searchedLaborCategoriesList, 'name');
    //         this.cd.markForCheck();
    //       }
    //     }),
    // );

    this.subscriptions.push(
      this.regionSearchTypeahead
        .pipe(
          map((v: any) => v?.term),
          debounceTime(300),
          distinctUntilChanged(),
          tap(() => {
            this.regionLoading = true;
          }),
          switchMap(term => {
            return this.searchRegion(term);
          }),
        )
        .subscribe((data: any) => {
          if (Array.isArray(data)) {
            this.searchRegionsList = this.sortPipe.transform(data, 'name');
            this.cd.markForCheck();
          }
          this.regionLoading = false;
        }),
    );

    this.jobService.get(`/configurator/programs/${this.programId}/industries`).subscribe((data: any) => {
      this.searchedLaborCategoriesList = this.laborCategoryList = this.sortPipe.transform(data?.industries, 'name');
    });

    this.jobService.get(`/configurator/programs/${this.programId}/work-locations`).subscribe((data: any) => {
      this.searchRegionsList = this.regions = this.sortPipe.transform(data?.work_locations, 'name');
    });
  }

  ngAfterViewInit(): void {
    this.loadVendors();
  }

  hasSelectedIndsutry(laborCategoryId) {
    return (
      this.selectedLaborCategoriesList.some(laborCategory => laborCategoryId == laborCategory.id) ||
      this.laborCategories.some(laborCategory => laborCategoryId == laborCategory.id)
    );
  }

  laborCategoryValueAdd(event) {
    if (event) {
      const present =
        this.laborCategories.some(ind => ind.industy_uid === event.id) || this.selectedLaborCategoriesList.some(ind => ind.id === event.id);
      if (!present) {
        this.selectedLaborCategoriesList.push(event);
        this.ngSelectComponent.handleClearClick();
      }
    }
  }

  regionAdd(event) {
    if (event) {
      const present = this.regionList.some(ind => ind.id === event.id) || this.selectedRegionList.some(ind => ind.id === event.id);
      if (!present) {
        this.selectedRegionList.push(event);
        this.regionSearch.handleClearClick();
      }
    }
  }

  loadVendors() {
    this.loadingData = true;
    let laborCategoriesId = this.laborCategories.map(ind => ind.industy_uid).concat(this.selectedLaborCategoriesList.map(ind => ind.id));
    const jobD = this.storageService.get(StorageKeys.VIEWD_JOB);
    let queryParams = '';

    let locationIds = this.regionList.map(ind => ind.id).concat(this.selectedRegionList.map(ind => ind.id));
    queryParams += locationIds.length > 0 ? `location_ids=${locationIds.join(',')}` : '';
    
    if(locationIds?.length == 0) {
      queryParams +=`work_locations=${jobD?.location?.id}`
    }

    queryParams+= laborCategoriesId.length > 0 ? `&program_industries=${laborCategoriesId.join(',')}` : '';

    if (this.vendorSearchText) {
      queryParams += `&name=${this.vendorSearchText}`;
    }
    queryParams+='&active=true';

    this.subscriptions.push(
      this.jobService.get(`/configurator/programs/${this.programId}/vendors?${queryParams}`).subscribe((data: any) => {
        const { program_vendors } = data;
        const selected = this.vendorsList.filter(vndr => vndr.selected);
        const notIncludedInMain = program_vendors
          .filter(vndr => !this.vendorIds?.includes(vndr.id))
          .map(vndr => {
            vndr.selected = false;
            return vndr;
          });
        const notInSelected = notIncludedInMain.filter(vndr => !selected.some(vndr_ => vndr_.id === vndr.id));
        this.vendorsList = selected.concat(notInSelected);
        this.loadingData = false;
      }),
    );
  }

  loadVendorsGroup() {
    this.loadingData = true;
    let queryParams =`?work_locations=${this.workLocationId}`
    queryParams+= this.vendorGroupSearchText ? `&k=${this.vendorGroupSearchText}` : '';
    queryParams+='&active=true';
    this.jobService.get(`/configurator/programs/${this.programId}/vendor-groups${queryParams}`).subscribe((data: any) => {
      const { vendor_groups } = data;
      const selected = this.vendorsGroupList.filter(vndrgrp => vndrgrp.selected);
      const notIncludedInMain = vendor_groups
        .filter(vndrgrp => !this.vendorGroupIds?.includes(vndrgrp.id))
        .map(vndrgrp => {
          vndrgrp.selected = false;
          return vndrgrp;
        });
      const notInSelected = notIncludedInMain.filter(vndrgrp => !selected.some(vndrgrp_ => vndrgrp_.id === vndrgrp.id));
      this.vendorsGroupList = selected.concat(notInSelected);
      this.loadingData = false;
    });
  }

  removeFromLaborCategories(index) {
    this.laborCategories.splice(index, 1);
  }

  removeFromSelected(index) {
    this.selectedLaborCategoriesList.splice(index, 1);
  }

  removeFromRegion(index) {
    this.regionList.splice(index, 1);
  }

  removeFromRegionSelected(index) {
    this.selectedRegionList.splice(index, 1);
  }

  searchLaborCategories(event) {
    return event
      ? this.jobService.get(`/configurator/programs/${this.programId}/industries`).pipe(map((resp: any) => resp.industries))
      : this.laborCategories;
  }

  searchRegion(term) {
    return this.jobService
      .get(`/configurator/programs/${this.programId}/work-locations?status=true${term ? `&k=${term}` : ''}`)
      .pipe(map((resp: any) => resp.work_locations));
  }

  sidebarClose() {
    if (this.viewCandidateProfile !== 'hidden') {
      this.viewCandidateProfile = 'hidden';
    }
    this.resetSidebar();
  }

  onIndexChange(event) {
    this.tabIndex = event;
    if (this.tabIndex === 0) {
      this.userBasic = true;
    } else if (this.tabIndex === 1) {
      this.userBasic = false;
    } else if (this.tabIndex == 2) {
      this.userBasic = false;
    }
  }

  next() {
    switch (this.visiblePanel) {
      case 'vendors':
        this.visiblePanel = 'vendor-group';
        break;
      case 'job-board':
        this.visiblePanel = 'vendor-group';
        break;
      case 'vendor-group':
        this.tabIndex = 1;
        break;
      default:
        break;
    }
  }

  addVendors() {
    this.setVendorsAndGroups();
    this.viewCandidateProfile = 'hidden';
    this.eventStream.emit(
      new EmitEvent(Events.ADD_VENDOR, {
        value: {
          vendors: this.vendorsList.filter(vndr => vndr.selected),
          vendorGroup: this.vendorsGroupList.filter(vndr => vndr.selected),
        },
      }),
    );
    this.resetSidebar();
  }

  resetSidebar() {
    this.tabIndex = 0;
    this.visiblePanel = 'vendors';
    this.vendorsList = [];
    this.vendorsGroupList = [];
    this.vendorSearchText = '';
    this.selectedLaborCategoriesList = [];
    this.selectedRegionList = [];
    this.vendorGroupSearchText = '';

    this.loadVendors();
    this.loadVendorsGroup();
  }

  getColorCode(index) {
    return index % 2 ? 'red' : 'blue';
  }

  onVendorSearch(event: any) {
    clearTimeout(this.timeout);
    var $this = this;
    this.timeout = setTimeout(function () {
      if (event.keyCode != 13) {
        $this.searchVendor(event.target.value);
      }
    }, 1000);
  }

  onVendorGroupSearch(event: any) {
    clearTimeout(this.timeout);
    var $this = this;
    this.timeout = setTimeout(function () {
      if (event.keyCode != 13) {
        $this.searchVendorGroup(event.target.value);
      }
    }, 1000);
  }

  private searchVendorGroup(value: string) {
    this.loadVendorsGroup();
  }

  private searchVendor(value: string) {
    this.loadVendors();
  }

  get vendorsSelected() {
    return this.vendorsList?.filter(v => v.selected).length ? true : false;
  }

  get vendorGroupsSelected() {
    return this.vendorsGroupList?.filter(vg => vg.selected).length ? true : false;
  }

  selectVendorGroup(vendorGroup) {
    vendorGroup?.vendors?.forEach(vgV => {
      const vendor = this.vendorsList?.find(v => v?.vendor?.id === vgV?.vendor?.id);
      vgV['selected'] = vendorGroup?.selected;
      if (vendor) {
        vendor['selected'] = vendorGroup?.selected;
        vendor['groupName'] = vendorGroup?.name;
      } else {
        vgV['groupName'] = vendorGroup?.name;
        this.vendorsList.push(vgV);
      }
    });
  }

  selectVendor() {
    this.vendorsGroupList?.forEach(vg => {
      if (vg?.selected) {
        vg?.vendors?.forEach(vgV => {
          vgV['selected'] = this.vendorsList?.find(v => v?.vendor?.id === vgV?.vendor?.id)['selected'];
        });
        vg['selected'] = vg?.vendors?.find(vgV => vgV?.selected) ? true : false;
      }
    });
  }

  setVendorsAndGroups(): void {
    this.vendorsGroupList.forEach(vg => {
      if (vg?.selected) {
        vg.vendors.forEach(vendor => {
          if (this.vendorsList.find(vndr => vndr.vendor.id === vendor.vendor.id && !vndr.selected) ? true : false) {
            vg.selected = false;
          }
        });
        if (vg.selected) {
          vg.vendors.forEach(vendor => {
            const selVendor = this.vendorsList.find(vndr => vndr.vendor.id === vendor.vendor.id);
            if (selVendor) {
              selVendor['selected'] = false;
            }
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  filterVendorOnEnter(event, vendorOrVendorGroup: string): void {
    if (event.keyCode === 13)
      if (vendorOrVendorGroup === 'vendor') {
        if (this.vendorSearchText || this.selectedLaborCategoriesList?.length || this.selectedRegionList?.length) this.loadVendors();
      } else if (vendorOrVendorGroup === 'vendor-group') {
        if (this.vendorGroupSearchText) this.loadVendorsGroup();
      }
  }

  get disableVendorFilter() {
    return !!(this.vendorSearchText || this.selectedLaborCategoriesList?.length || this.selectedRegionList?.length);
  }

  get disableVendorGroupFilter() {
    return !!this.vendorGroupSearchText;
  }
}
