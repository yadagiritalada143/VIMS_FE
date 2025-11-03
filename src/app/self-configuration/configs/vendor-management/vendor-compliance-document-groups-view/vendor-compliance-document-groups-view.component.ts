import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { ProgramConfig } from 'src/app/shared/enums';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-vendor-compliance-document-groups-view',
  templateUrl: './vendor-compliance-document-groups-view.component.html',
  styleUrls: ['./vendor-compliance-document-groups-view.component.scss']
})
export class VendorComplianceDocumentGroupsViewComponent implements OnInit {

  public groupName: any;
  public description: any;
  public selectedDocument: any = [];

  isActive :string;
  public id: any;
  readMore: boolean = false;
  createdTime: any;
  modifiedTime: any;
  constructor(private router : SvmsRouterService,
    private activatedRoute: ActivatedRoute,
    private storageService: StorageService,
    private vendorService: VendorService,
    private alertService: AlertService,
    private route: SvmsRouterService,
    public commonViewService: CommonViewRuleFlowService
    ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.id = params['id'];
      if(this.id){
        this.getVendorDocumentDetails(this.id);
      }
    });
  }

  getVendorDocumentDetails(id) {
    let programDetails = this.storageService.get(ProgramConfig[0]);
    programDetails = JSON.parse(programDetails);
    let programId
    if (programDetails) {
      programId = programDetails.program_req_id;
    }
    const url = `/configurator/programs/${programId}/vendor-compliance/required-document-groups/${id}`;
    this.vendorService.get(url)
      .subscribe({
        next: (data: any) => {
          if (data) {

            this.groupName = data?.required_document_group?.name;
            this.description = data?.required_document_group?.description || '-';
            this.createdTime = Number.parseInt('' + (data?.required_document_group?.created_on *1000));
            this.modifiedTime = Number.parseInt('' + (data?.required_document_group?.modified_on *1000));

             if(data?.required_document_group?.is_enabled){
              this.isActive = 'Active'
             }else{
              this.isActive = 'Inactive'
             }
            
              data?.required_document_group?.required_documents.forEach(list => {
                  this.selectedDocument.push(list.name)
              })
          
          }
        }, error: (error: Error | any) => {
          this.alertService.error(errorHandler(error), {});
        }
      }
    );
  }
  backClicked() {
    this.router.navigate(['vendor', 'vendor-document-group-list']);
  }
  navigateEditPage(){
    this.route.navigate(['vendor', 'vendor-document-group-create'], { queryParams: { id: this.id }});
  }
}
