import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { Subscription } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-vendor-invites-create',
  templateUrl: './vendor-invites-create.component.html',
  styleUrls: ['./vendor-invites-create.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VendorInvitesCreateComponent implements OnInit {
  [x: string]: any;
  private subscriptions: Subscription[] = [];
  public vendorInviteObj: any = {};
  public programId: any;
  public id: any;
  public label = 'Create New';
  public isError: boolean = false;
  public vendorInviteId: any
  public vendorInviteMode: any = 'CREATE'
  public buttonLabel: any
  public headerlabel: any
  public support_data: any = {
    support_text: 'Note that this invite will expire in 48 hours.  Once expired, the Vendor will not be able to complete the registration process.  However, invite can be resent as necessary.'
  }

  constructor(
    private router: SvmsRouterService,
    private _alert: AlertService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private vendorService: VendorService,
    private location: Location,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.vendorInviteId = this.route.snapshot.params['id'];
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.route.url.subscribe((segment) => {
      let routerPath = segment.map(p => p.path)
      if (routerPath.includes('create')) {
        this.vendorInviteMode = 'CREATE'
        this.headerlabel = 'New Vendor Invite'
        this.buttonLabel = 'Send Invite'
      }
      else if (routerPath.includes('edit')) {
        this.vendorInviteMode = 'EDIT'
        this.headerlabel = 'Edit Vendor Invite'
        this.buttonLabel = 'Update'
        this.getVendorInviteDetails()
      }

      else if (routerPath.includes('resend')) {
        this.vendorInviteMode = 'RESEND'
        this.headerlabel = 'Resend Vendor Invite'
        this.buttonLabel = 'Resend Invite'
        this.getVendorInviteDetails()
      }
      else {
        this.alertService.error('this route does not exist');
      }

    })
  }

  backClicked() {
    this.location.back();
  }
  onSave() {
    this.isError = false
    this._loader.show();
    const payload = {
      resend: false,
      vendor_name: this.vendorInviteObj.vendorName,
      first_name: this.vendorInviteObj.primaryContactFirstName,
      last_name: this.vendorInviteObj.primaryContactLastName,
      email: this.vendorInviteObj.primaryContactEmail
    }
    if (this.vendorInviteMode == "CREATE") {
      delete payload.resend
      this.subscriptions.push(this.vendorService.post(`/configurator/programs/${this.programId}/vendors/invite?notification=true`, payload).subscribe((data: any) => {
        if (data?.vendor_invite?.id) {
          this._loader.hide();
          this._alert.success('vendor invite created successfully');
          this.router.navigate(['vendor', 'vendor-invites', 'list']);
        }
      }, error => {
        this._loader.hide();
        if (error?.error?.error?.ref == 'ALREADY_EXIST') {
          this.isError = true
        }
        this._alert.error(errorHandler(error));
      }));
    }
    else if (this.vendorInviteMode == "EDIT" || this.vendorInviteMode == "RESEND") {
      if (this.vendorInviteMode == "EDIT") {
        delete payload.email
      }
      else if (this.vendorInviteMode == "RESEND") {
        payload.resend = true
      }
      this.subscriptions.push(this.vendorService.put(`/configurator/programs/${this.programId}/vendors/invite/${this.vendorInviteId}?notification=true`, payload).subscribe((data: any) => {
        if (data?.vendor_invite?.id) {
          this._loader.hide();
          if (this.vendorInviteMode == "EDIT") {
            this._alert.success('vendor invite has been updated successfully');
          }
          else if (this.vendorInviteMode == "RESEND") {
            this._alert.success('vendor invite has been resent successfully');
          }
          this.router.navigate(['vendor', 'vendor-invites', 'view', this.vendorInviteId]);

        }
      }, error => {
        this._loader.hide();
        if (error?.error?.error?.ref == 'ALREADY_EXIST') {
          this.isError = true
        }
        this._alert.error(errorHandler(error));
      }));
    }

  }

  getVendorInviteDetails() {
    this._loader.show();
    let url: string = `/configurator/programs/${this.programId}/vendors/invite/${this.vendorInviteId}?notification=true`;
    this.vendorService.get(url)
      .subscribe({
        next: (data: any) => {
          if (data) {
            let vendorInviteData = data?.vendor_invite
            this.vendorInviteObj.vendorName = vendorInviteData?.vendor?.name
            this.vendorInviteObj.primaryContactFirstName = vendorInviteData?.vendor?.primary_contact.first_name
            this.vendorInviteObj.primaryContactLastName = vendorInviteData?.vendor?.primary_contact.last_name
            this.vendorInviteObj.primaryContactEmail = vendorInviteData?.vendor?.primary_contact.email
            this._loader.hide();
          }
        }, error: (err: any) => {
          this.alert.error(errorHandler(err));
          this._loader.hide();
        }
      });

  }


}
