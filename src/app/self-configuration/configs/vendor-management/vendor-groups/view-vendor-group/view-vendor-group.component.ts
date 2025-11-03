import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Location } from '@angular/common';
import { CommonViewConfig, CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';

@Component({
  selector: 'app-view-vendor-group',
  templateUrl: './view-vendor-group.component.html',
  styleUrls: ['./view-vendor-group.component.scss']
})
export class ViewVendorGroupComponent implements OnInit {
  showHideText: boolean = false;
  private subscriptions: Array <Subscription> = [];
  showCondition: boolean = false;
  linkText: string = "Read more";
  textVisibility: boolean = false;
  programId: String = this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.id;
  vendorGroupDetails: any;
  id: any;
  public viewConfig: Array <CommonViewDetail> = [];


  constructor(
    private vendorService: VendorService,
    private router: Router,
    private localStorage: StorageService,
    private loader: LoaderService,
    private alert: AlertService,
    private route: ActivatedRoute,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params: any) => {
      if(params?.id){
        this.id = params?.id;
        this.getVendorGroupDetails(params?.id);
      }
    })
  }

  getVendorGroupDetails = (vendorGroupId: any) => {
    this.loader.show();
    this.vendorService.get(`/configurator/programs/${this.programId}/vendor-groups/${vendorGroupId}`).subscribe({
      next: (data: any) => {
        if(data){
          this.vendorGroupDetails = data?.vendor_groups;
          const then = new Date(data?.vendor_groups?.created_on);
          const now = new Date();
          const msBetweenDates = Math.abs(then.getTime() - now.getTime());
          const hoursBetweenDates = Math.round(msBetweenDates / (60 * 60 * 1000));
          const minutesBetweenDates = Math.round(msBetweenDates / (60 * 1000));
          if (hoursBetweenDates < 24) {
            this.vendorGroupDetails['created_on'] = { less_than_24: true, hours: hoursBetweenDates };
            if (hoursBetweenDates == 0) {
              this.vendorGroupDetails['created_on']['minutes'] = minutesBetweenDates;
            }
          } else {
            this.vendorGroupDetails['created_on'] = { less_than_24: false, date: then.toLocaleDateString() }
          }
        this.initializeViewConfig();

        }
        this.loader.hide();
      }
    , error: (err: any) => {
      this.alert.error(errorHandler(err));
      this.loader.hide();
    }
    })
  }
  initializeViewConfig() {
    this.viewConfig = [{
      label: 'Vendor Group Name',
      value: this.vendorGroupDetails?.name || '--',
      displayType: CommonViewConfig.TEXT
    }, {
      label: 'Status',
      value: this.vendorGroupDetails?.is_enabled ? 'Active' : 'Inactive',
      displayType: CommonViewConfig.STATUS,
      enabled: this.vendorGroupDetails?.is_enabled || false
    },
    //  {
    //   label: 'Labor Category',
    //   value:  '--',
    //   displayType: CommonViewConfig.TEXT
    // }, 
    {
      label: 'Description',
      value: (this.vendorGroupDetails?.description || '--'),
      displayType: CommonViewConfig.DESCRIPTION
    }];
  }
  backClicked(){
    this.location.back();
  }
  onEdit() {
    this.router.navigate([`/self-configuration/vendor/edit-vendor-group/${this.id}`]);
  }

  showHideFullText() {
    this.textVisibility = !this.textVisibility;
    if(this.linkText === "Read more") {
      this.linkText = "Read less"
    }
    else if(this.linkText === "Read less") {
      this.linkText = "Read more"
    }
  }
  showHideFullLevelText() {
   this.showHideText = !this.showHideText
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
