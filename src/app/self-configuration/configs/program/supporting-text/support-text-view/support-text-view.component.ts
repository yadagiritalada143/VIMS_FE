import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { UrlService } from 'src/app/shared/service/url.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-support-text-view',
  templateUrl: './support-text-view.component.html',
  styleUrls: ['./support-text-view.component.scss'],
})
export class SupportTextViewComponent implements OnInit {

  details: any = [];
  editPage: boolean = false;
  modalVisibility: boolean = false;
  modalForm: UntypedFormGroup;
  editedItem: any = null;
  characterLimit: number = 20;
  supportTextId: string;
  isEditMode: boolean = false;
  lastUpdated :any;
  tableData: any = [];
  originalTableData: any = [];

  constructor(
    private loader: LoaderService,
    private router: SvmsRouterService,
    private formBuilder: UntypedFormBuilder,
    private programService: ProgramService,
    private route: ActivatedRoute,
    private storage: StorageService,
    private alert: AlertService,
    public commonViewService: CommonViewRuleFlowService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.modalForm = this.formBuilder.group(
      {
        description: [''],
        url: [''],
        label: ['', [Validators.maxLength(20)]],
      }
    );

    this.route.params.subscribe((param: Params) => {
      this.supportTextId = param?.id;
      this.fetchSupportTextDetails();
    });

    this.route.queryParams.subscribe((param: Params) => {
      this.editPage = param?.isEdit === 'true';
    });
  }

  get programId(): string {
    return this.storage.get(StorageKeys.PROGRAM_ID);
  }

  fetchSupportTextDetails() {
    let url = `/configurator/programs/${this.programId}/support/support_text/${this.supportTextId}`;
    this.programService.get(url).subscribe((res: any) => {
      this.loader.hide();
      let SupportTextDetails = [
        {
          label: 'Module',
          value: res.support_text_data?.event?.module?.name,
          displayType: 'text',
        },
        {
          label: 'Event',
          value: res.support_text_data?.event?.name,
          displayType: 'text',
        },
        {
          label: 'Performed By',
          value: res.support_text_data?.performed_by,
          displayType: 'template',
        },
      ];
      this.details = SupportTextDetails;
      this.lastUpdated = this.commonViewService.getTimeStamp(Number(res.support_text_data?.created_on *1000), Number(res.support_text_data?.modified_on *1000));
      this.originalTableData = JSON.parse(JSON.stringify(res.support_text_data?.supp_text_actions)); // Keep a copy of the original data
      this.tableData = res.support_text_data?.supp_text_actions;
    });
  }

  backClicked() {
    this.router.navigate(['program', 'support-text', 'list']);
  }

  onEdit() {
    this.editPage = true;
  }

  onUpdate() {
    this.editPage = false;
    let url = `/configurator/programs/${this.programId}/support/support_text/${this.supportTextId}`;

    let updatedData = this.tableData.filter((item, index) => {
      // Compare current table data with the original one to identify changes
      return JSON.stringify(item) !== JSON.stringify(this.originalTableData[index]);
    });

    let payload = {
      supp_text_actions: updatedData, // To Send only updated data
    };

    this.loader.show();
    this.programService.put(url, payload).subscribe({
      next: (res: any) => {
        this.alert.success('Supporting Text has been updated successfully');
        this.fetchSupportTextDetails();
      }, error: (err: any) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }
    });
  }

  editItem(item) {
    this.modalVisibility = true;
    this.editedItem = item; // To Store the item being edited.
    this.modalForm.setValue({
      description: item.description,
      url: item?.url ? item?.url : '',
      label: item?.label ? item?.label : '',
    });
  }

  onCloseModal() {
    this.modalVisibility = false;
  }

  Submit() {
    this.modalVisibility = false;
    this.editedItem.description = this.modalForm.value.description;
    this.editedItem.url = this.UrlMapping(this.modalForm.value.url) || '';
    if(this.editedItem.url) {
      this.editedItem.label = this.modalForm.value.label;
    }

    this.editedItem.ifVideo = !!this.modalForm.value.url; // if url exists, set ifVideo to true, else false

    // Reset the form and the formSubmitted flag.
    this.modalForm.reset();
    this.editedItem = null;
}

UrlMapping(url: string){
  if(url) {
    // Check if URL includes a protocol otherwise append HTTPS by default
    if(!url.includes("://")) {
      url = 'https://' + url;
    }

    return url.toLowerCase();
  }
}

  isValidUrl(str: string): boolean {
    return this.urlService.isURLValid(str, true);
  }

  openVideoInNewTab(url: string) {
    window.open(url, '_blank');
  }

  get modalValidationValid() {

    const form: UntypedFormGroup = this.modalForm;
    const urlControl = this.modalForm?.get('url');

    let value: any = form?.value || {};
    if(!form.valid) {
      return false;
    }

    if(value?.url) {
      if(!this.isValidUrl(value?.url)) {
        urlControl?.setErrors({ invalidUrl: true });
        return false;
      }

      urlControl?.setErrors(null);
      return !!value?.label;
    }

    return true;
  }

  get remainingCharacters(): number {
    const labelForm: AbstractControl = this.modalForm?.get('label');
    return 20 - (labelForm?.value?.length || 0)
  }
}
