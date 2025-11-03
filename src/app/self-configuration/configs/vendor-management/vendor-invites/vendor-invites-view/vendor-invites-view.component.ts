import { Component, ElementRef, OnInit, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Location } from '@angular/common';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';


@Component({
  selector: 'app-vendor-invites-view',
  templateUrl: './vendor-invites-view.component.html',
  styleUrls: ['./vendor-invites-view.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VendorInvitesViewComponent implements OnInit {

  programId: any;
  vendorInviteId: any;
  vendorInviteData:any
  details : any = [];
  actionDropdownBox: boolean = false;
  @ViewChild('actionTrigger', { read: ElementRef, static: false })
  actionTrigger: ElementRef | undefined;
  @ViewChild('actionDropdown', { read: ElementRef, static: false })
  actionDropdown: ElementRef | undefined;
  programDetails:any;
  dateFormat:any;

  constructor (
    private router: SvmsRouterService,
    private activatedRoute: ActivatedRoute,
    private alert: AlertService,
    private loader: LoaderService,
    private localStorage: StorageService,
    private location: Location,
    private renderer: Renderer2,
    private vendorService: VendorService,
    public commonViewService: CommonViewRuleFlowService

  ) {

    this.renderer.listen('window', 'click', (e: Event) => {
      if (
        (this.actionTrigger && this.actionTrigger.nativeElement.contains(e.target) && !this.actionDropdownBox) ||
        (this.actionDropdown && this.actionDropdown.nativeElement.contains(e.target))
      ) {
        const triggerPos = this.actionTrigger?.nativeElement.getBoundingClientRect();
        this.actionDropdownBox = true;

        setTimeout(() => {
          const dropDownBox = document.getElementById('c-action-dropdown');
          dropDownBox?.setAttribute(
            'style',
            'top :  ' + (triggerPos.top + 50) + 'px; left: ' + (triggerPos.left - 155) + 'px; display : block',
          );
        }, 100);
      } else {
        this.actionDropdownBox = false;
      }
    });

  }

  ngOnInit(): void {
    this.programDetails = this.localStorage.get(StorageKeys?.CURRENT_PROGRAM);
    this.dateFormat = this.programDetails?.defaultDateFormat.toUpperCase();
    this.programId = this.localStorage.get("PROGRAM_ID");
    this.vendorInviteId = this.activatedRoute.snapshot.paramMap.get('id');
     this.getVendorInviteDetails();
  }

  backtoList() {
    this.location.back();
  }

  editVendorInvite() {
    this.router.navigate(['vendor','vendor-invites','edit',this.vendorInviteId]);
  }

  getVendorInviteDetails() {
    this.loader.show();
    let url: string = `/configurator/programs/${this.programId}/vendors/invite/${this.vendorInviteId}?notification=true`;
    this.vendorService.get(url)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.vendorInviteData=data?.vendor_invite
           // this.vendorInviteData.invited_on = this.localDateFormat.transform(this.vendorInviteData.invited_on, null, null, null, true,);
            if(!Number.isInteger(this.vendorInviteData.invited_on)){
              this.vendorInviteData.invited_on = this.vendorInviteData.invited_on * 1000
            }
            if(!Number.isInteger(this.vendorInviteData.accepted_on)){
              this.vendorInviteData.accepted_on = this.vendorInviteData.accepted_on * 1000
            }
            let invitedTimeStamp = this.commonViewService.getTimeStamp(this.vendorInviteData?.accepted_on, this.vendorInviteData?.accepted_on,null);
            invitedTimeStamp = invitedTimeStamp.replace("Created on ", "");
            invitedTimeStamp = invitedTimeStamp.replace("Created about ", "");
            let cssClass = '',registrationStatus='';
            if(this.vendorInviteData.status == 'EXPIRED'){
              cssClass = 'expired';
              registrationStatus = 'Expired';
            }else if (this.vendorInviteData.status == 'ACCEPTED'){
              cssClass = 'active';
              registrationStatus = 'Registration Completed';
            }else{
              cssClass = 'pending';
              registrationStatus = 'Pending Registration';
            }

            this.details = [{
              label: "Vendor Name",
              value:this.vendorInviteData?.vendor?.name,
              displayType: 'text',
            }, {
              label: "Status",
              value: registrationStatus,
              displayType: 'custom-status',
              cssClass: cssClass
            }, {
              label: "Primary Contact First Name",
              value: this.vendorInviteData.vendor?.primary_contact?.first_name,
              displayType: 'text'
            }, {
              label: "Primary Contact Last Name",
              value: this.vendorInviteData.vendor?.primary_contact?.last_name,
              displayType: 'text'
            }, {
              label: "Primary Contact Email",
              value: this.vendorInviteData.vendor?.primary_contact?.email,
              displayType: 'text'
            }
            ]
            if (this.vendorInviteData.status == 'ACCEPTED'){
              this.details.push({
                label: "Registration Completed On",
                value: invitedTimeStamp,
                displayType: 'text'
              })
            }
            this.loader.hide();
          }
        }, error: (err: any) => {
            this.alert.error(errorHandler(err));
            this.loader.hide();
        }
      });

  }

  navigateToResendInvitation(){
    this.router.navigate(['vendor','vendor-invites','resend',this.vendorInviteId]);
  }


}
