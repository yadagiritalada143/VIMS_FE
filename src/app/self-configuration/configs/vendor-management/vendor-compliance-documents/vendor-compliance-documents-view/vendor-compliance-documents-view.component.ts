import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Location } from '@angular/common';
import { CommonViewConfig, CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';

@Component({
  selector: 'app-vendor-compliance-documents-view',
  templateUrl: './vendor-compliance-documents-view.component.html',
  styleUrls: ['./vendor-compliance-documents-view.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VendorComplianceDocumentsViewComponent implements OnInit {

  programId: any;
  vendorID: any;
  vendorDocumentData: any;
  public viewConfig: Array <CommonViewDetail> = [];


  constructor (
    private router: SvmsRouterService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private loader: LoaderService,
    private localStorage: StorageService,
    private vendorService: VendorService,
    private location: Location,
    public commonViewService: CommonViewRuleFlowService
  ) { }

  ngOnInit(): void {
    this.programId = this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.route.params.forEach((param: any) => {
      if(param?.id){
        this.vendorID = param?.id;
        this.getComplianceDocumentDetails(param?.id);
      }
    })
  }

  getComplianceDocumentDetails(id: any) {
    let url = `/configurator/programs/${this.programId}/vendor-compliance/required-documents/${id}`;
    this.loader.show();
    this.vendorService.get(url)
    .subscribe({
      next: (data: any) => {
        if(data){
          this.vendorDocumentData = data?.required_document;
          this.initializeViewColumns();
        }
        this.loader.hide();
      },error: (err) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }
    })
  }
  private initializeViewColumns() {

    let result: Array <CommonViewDetail> = [
      {
        label: 'Document Name',
        value: this.vendorDocumentData?.name || '--',
        displayType: CommonViewConfig.TEXT
      }, {
        label: 'Status',
        value: this.vendorDocumentData?.is_enabled?'Active':'Inactive',
        displayType: CommonViewConfig.STATUS,
        enabled: this.vendorDocumentData?.is_enabled || false
      }, {
        label: 'Act',
        value: this.vendorDocumentData?.act || '--',
        displayType: CommonViewConfig.TEXT,
      }, {
        label: 'Onboarding',
        value: this.vendorDocumentData?.is_required_for_onboarding?'Enabled':'Disabled',
        displayType: CommonViewConfig.STATUS,
        enabled: this.vendorDocumentData?.is_required_for_onboarding || 'Disabled'
      }, {
        label: 'Document Details',
        value: this.vendorDocumentData?.description ||'--',
        displayType: CommonViewConfig.DESCRIPTION
      }, {
        label: 'Frequency',
        value: this.vendorDocumentData?.frequency || '--',
        displayType: CommonViewConfig.TEXT
      }, {
        label: 'Document Number',
        value: this.vendorDocumentData?.document_number || '--',
        displayType: CommonViewConfig.TEXT
      }, {
        label: 'Number of Days To Upload Document',
        value: this.vendorDocumentData?.days_to_upload || '--',
        displayType: CommonViewConfig.TEXT
      }, {
        label: 'Number of Days To Regain Compliance',
        value: this.vendorDocumentData?.days_to_regain_compliance || '--',
        displayType: CommonViewConfig.TEXT
      },
      {
        label: 'attachment',
        value: this.getAttachmentValue(),
        displayType: CommonViewConfig.TEMPLATE
      }
    ];
    this.viewConfig = result;
  }

  getAttachmentValue = () => {
    if(this.vendorDocumentData?.attached_doc_url){
      return `<a href="${this.vendorDocumentData?.attached_doc_url || '#'}" target='_self' download='${this.vendorDocumentData?.local_file_name || '--'}'  style="background: #EDF2FE; padding: 8px; border-radius: 4px; color: #001A43">${this.vendorDocumentData?.local_file_name || '--'}</a>`
    }else {
      return '<span style="background: #EDF2FE; padding: 8px; border-radius: 4px; color: #001A43"> -- </span>'
    }
  }

  goBack() {
    this.location.back();
  }

  toTimestamp(strDate: any){
    var datum = Date.parse(strDate);
    return datum
 }

 editPage(){
  this.router.navigate(['vendor', 'vendor-compliance-create'], { queryParams: { id: this.vendorID }});
 }
}
