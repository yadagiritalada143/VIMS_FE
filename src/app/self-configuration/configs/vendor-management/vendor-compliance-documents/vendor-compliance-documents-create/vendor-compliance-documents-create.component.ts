import { Component,  OnInit,  ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { Subscription } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Location } from '@angular/common';

@Component({
  selector: 'app-vendor-compliance-documents-create',
  templateUrl: './vendor-compliance-documents-create.component.html',
  styleUrls: ['./vendor-compliance-documents-create.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VendorComplianceDocumentsCreateComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  public titleToggle = {
    title: 'active',
    value: true,
  };
  is_required_for_onboarding: boolean = false;
  public frequencies: any = [
    { value: 'MONTHLY', name: 'Monthly' },
    { value: 'QUARTERLY', name: 'Quarterly' },
    { value: 'HALF-YEARLY', name: 'Half Yearly' },
    { value: 'ANNUALLY', name: 'Annually' },
  ];
  public documentName: any;
  public act: any;
  public documentDetails: any;
  public frequency: any;
  public documentNumber: string = '';
  public numberOfDays: any;
  public regainCompliance: any;
  public vendors: any;
  public vendor: any;
  public applicableLocations: any;
  public locations: any = [];
  public programId: any;
  public id: any;
  public label = 'Create New';
  public isError: boolean = false;
  public fileUploaded: { name: string; raw?: string } | null = null;
  public existingUplodedFileName: {name:string} | null = null;
  constructor(
    private router: SvmsRouterService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private loader: LoaderService,
    private localStorage: StorageService,
    private _alert: AlertService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private vendorService: VendorService,
    private location: Location,
  ) {}

  uploadFile = (result: any) => {
    if (result) {
      this.fileUploaded = {name:result.name,raw:result.raw}
    } else {
      this.fileUploaded = null;
    }
  }

  ngOnInit(): void {
    this.programId = this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.route.queryParams.subscribe(params => {
      if (params?.id) {
        this.id = params?.id;
        this.getComplianceDocumentDetails(this.id);
        this.label = 'Update';
      }
    });
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.subscriptions.push(
      this.vendorService.get(`/configurator/programs/${this.programId}/work-locations`).subscribe(
        (data: any) => {
          data.work_locations.map(work_location => {
            this.locations.push(work_location);
          });
        },
        error => {
          this._alert.error(errorHandler(error));
        },
      ),
    );
    // this.getVendors();
  }
  getComplianceDocumentDetails(id: any) {
    let url = `/configurator/programs/${this.programId}/vendor-compliance/required-documents/${id}`;
    this.loader.show();
    this.vendorService.get(url).subscribe({
      next: (data: any) => {
        if (data) {
          this.act = data?.required_document?.act;
          this.regainCompliance = data?.required_document?.days_to_regain_compliance;
          this.frequency = data?.required_document?.frequency;
          this.numberOfDays = data?.required_document?.days_to_upload;
          this.documentDetails = data?.required_document?.description;
          this.documentName = data?.required_document?.name;
          this.documentNumber = data?.required_document?.document_number;
          this.applicableLocations = data.required_document.work_locations.map(n => n.id);
          this.titleToggle.value = data.required_document?.is_enabled;
          this.is_required_for_onboarding = data.required_document?.is_required_for_onboarding;
          if(data.required_document?.local_file_name){
            this.existingUplodedFileName = {name:data.required_document?.local_file_name};
            this.fileUploaded = {name:data.required_document?.local_file_name}
          }
        }
        this.loader.hide();
      },
      error: err => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      },
    });
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
  backClicked() {
    this.location.back();
  }

  onSave() {
    this._loader.show();
    const data = {
      act: this.act,
      days_to_regain_compliance: Number(this.regainCompliance),
      days_to_upload: Number(this.numberOfDays),
      description: this.documentDetails,
      document_number: this.documentNumber,
      frequency: this.frequency,
      is_enabled: this.titleToggle?.value,
      is_required_for_onboarding: this.is_required_for_onboarding,
      name: this.documentName,
      vendors: this.vendor,
      work_locations: this.applicableLocations,
    }

    if(this.fileUploaded && this.fileUploaded.raw){
      data['file'] =  { file_name: this.fileUploaded.name, raw: this.fileUploaded.raw }
    }else if(this.id && !this.fileUploaded){
      data['file'] = null;
    }

    if (this.id) {
      this.subscriptions.push(
        this.vendorService.put(`/configurator/programs/${this.programId}/vendor-compliance/required-documents/${this.id}`, data).subscribe(
          (data: any) => {
            if (data) {
              this._alert.success('vendor document edited successfully');
              this.router.navigate(['vendor', 'vendor-compliance-view', data?.required_document?.id]);
            }
          },
          error => {
            this._loader.hide();
            this._alert.error(errorHandler(error));
          },
        ),
      );
    } else {
      this.subscriptions.push(
        this.vendorService.post(`/configurator/programs/${this.programId}/vendor-compliance/required-documents`, data).subscribe(
          (data: any) => {
            if (data) {
              this._loader.hide();
              this._alert.success('Vendor document created successfully');
              this.router.navigate(['vendor', 'vendor-compliance-view', data?.required_document?.id]);
            }
          },
          error => {
            this._loader.hide();
            this._alert.error(errorHandler(error));
          },
        ),
      );
    }
  }
  documentLengthCheck() {
    if (this.documentNumber.length < 3) {
      this.isError = true;
    } else {
      this.isError = false;
    }
  }
}
