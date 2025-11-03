import { Location } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import {  IColoumnDefinition, ITableOptions } from 'src/app/library/svms-table/svms-table.model';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-create-vendor-groups',
  templateUrl: './create-vendor-group.component.html',
  styleUrls: ['./create-vendor-group.component.scss']
})
export class CreateVendorGroupComponent implements OnInit {
  public titleToggle = {
    title: 'active',
    value: true
  };
  public name: string;
  public industries: any = [];
  public description: any;
  public laborCategories: any;
  public vendors: any;
  public programList: any;
  public tableOptions: ITableOptions;
  vendorSearch: any;
  public svmstableColomnDefn: Array<IColoumnDefinition>;
  private subscriptions: Array <Subscription> = [];
  public programVendorMap: Map <string, string> = new Map <string, string> ();
  selectVendors: boolean = false;
  selectedVendors: any = [];
  selectedVendorsFinal: any = [];
  programId: any;
  isEdit: boolean = false;
  vendorGroupDetails: any;
  @Input() request: any;

  constructor(
    private router: Router,
    private vendorService: VendorService,
    private localStorage: StorageService,
    private sortHelper: SortHelperPipe,
    private loader: LoaderService,
    private alert: AlertService,
    private location: Location,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.programId = this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.id;
    if(this.route.snapshot?.routeConfig?.path?.includes('edit')){
      this.isEdit = true;
      this.route.params.subscribe((params: any) => {
        if(params?.id){
          this.getVendorGroupDetails(params?.id);
        }
      })
    }
    this.getLaborCategoriesList();
    this.getVendors();
  }

  getLaborCategoriesList() {
    const url =`/configurator/programs/${this.programId}/industries`;
    this.subscriptions.push(this.vendorService.get(url)
      .subscribe((res:any) => {
        const { industries } = res;
        this.laborCategories = industries;
      }
    ))
  }

  getVendorGroupDetails = (vendorGroupId: any) => {
    this.loader.show();
    this.vendorService.get(`/configurator/programs/${this.programId}/vendor-groups/${vendorGroupId}`).subscribe({
      next: (data: any) => {
        if(data){
          this.vendorGroupDetails = data?.vendor_groups;
          this.name = this.vendorGroupDetails?.name;
          this.industries = this.vendorGroupDetails?.industries ? this.vendorGroupDetails?.industries : [];
          this.description = this.vendorGroupDetails?.description;
          this.selectedVendors = this.vendorGroupDetails?.vendors ? this.vendorGroupDetails?.vendors?.map((vendor: any) => {this.programVendorMap.set(vendor?.id, vendor?.name); return vendor?.id}): []
          this.selectedVendorsFinal = [...this.selectedVendors];
          this.titleToggle.value = this.vendorGroupDetails?.is_enabled;
          this.titleToggle.title = this.vendorGroupDetails?.is_enabled ? 'Active': 'Inactive';
          
        }
        this.loader.hide();
      }
    , error: (err: any) => {
      this.alert.error(errorHandler(err));
      this.loader.hide();
    }
    })
  }

  getVendors(term = '') {
    let url = `/configurator/programs/${this.programId}/vendors?active=enabled`;
    this.loader.show();
    if (term) {
      url += `&k=${term}`;
    }
    this.vendorService.get(url)
    .pipe(
      debounceTime(1200)
    )
    .subscribe({
      next : (data:any) => {
        this.vendors = [];
        if (data?.program_vendors && data?.program_vendors.length > 0) {
          this.programList = data?.program_vendors;
          data?.program_vendors.forEach(programList => {
            if (programList && programList.vendor) {
              if (!this.vendors) {
                this.vendors = new Array();
              }
              this.vendors.push(programList.vendor);
              this.programVendorMap.set(programList?.vendor?.id, programList?.vendor?.name);
            }
          });
        }
        this.sortedVendors();
        this.loader.hide();
    }, error: err => {
        console.error(err);
        this.loader.hide();
    }});
  }

  sortedVendors() {
    return this.sortHelper.transform(this.vendors, 'name');
  }

  getVendorNameLabel(id: any) {
    return this.programVendorMap.get(id);
  }

  searchVendor(evt: any) {
    this.getVendors(evt);
  }

  backClicked(){
    this.location.back();
  }

  removeVendor(id: any) {
    this.selectedVendors = this.selectedVendors?.filter((vendor_id: any) => vendor_id != id);
    this.selectedVendorsFinal = this.selectedVendorsFinal?.filter((vendor_id: any) => vendor_id != id);
  }

  onClickToggle() {
    if (this.titleToggle.value) {
      this.titleToggle.value = false;
      this.titleToggle.title = 'inactive';
    } else {
      this.titleToggle.value = true;
      this.titleToggle.title = 'active';
    }
  }
  addVendors() {
    this.selectedVendorsFinal = [...this.selectedVendors];
    this.vendorModalClose();
  }

  vendorSelection(id: any, name: any) {
    if(this.selectedVendors?.includes(id)){
      this.selectedVendors = this.selectedVendors?.filter((vendor_id: any) => vendor_id != id);
    }
    else {
      this.selectedVendors?.push(id);
    }
  }

  isValid(): boolean {
    if(!this.name || this.name?.length == 0){
      return false;
    }
    // if(!this.industries || this.industries?.length == 0){
    //   return false;
    // }

    return true;
  }

  vendorModalClose() {
    this.selectVendors = false;
    this.selectedVendors = [...this.selectedVendorsFinal];
  }

  selectVendorsPop(event: any) {
    if (event) {
      this.selectVendors = true
    }
  }

  createVendorGroup() {
    let selVendors = this.selectedVendorsFinal
    this.selectedVendorsFinal = [];
    this.programList.filter((n,index) =>{
      let exist = selVendors.filter(y=>y == n.vendor.id)
      if(exist.length == 1){
      this.selectedVendorsFinal.push(this.programList[index].id)
      }
    })
    const payLoad = {
      name: this.name,
      industries: this.industries,
      description: this.description || '',
      is_enabled: this.titleToggle?.value,
      // hierarchy_units: this.rendererData?.id ? this.rendererData : [],
      vendors: this.selectedVendorsFinal
    };
    if(this.isEdit) {
      this.subscriptions.push(this.vendorService.put(`/configurator/programs/${this.programId}/vendor-groups/${this.vendorGroupDetails?.id}`, payLoad).subscribe({
        next: (data:any) => {
          if (data) {
            this.alert.success(`You have updated vendor group successfully.`);
            this.router.navigate(['self-configuration', 'vendor', 'view-vendor-group', data?.id]);
          }
          this.loader.hide();
        },
        error: (err) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }})
      );
    }
    else {
      this.subscriptions.push(this.vendorService.post(`/configurator/programs/${this.programId}/vendor-groups`, payLoad).subscribe({
        next: (data:any) => {
          if (data) {
            this.alert.success(`You have added vendor group successfully.`);
            this.router.navigate(['self-configuration', 'vendor', 'view-vendor-group', data?.id]);
          }
          this.loader.hide();
        },
        error: (err) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }})
      );
    }
  }
}
