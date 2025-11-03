import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TenureConfigurationService } from '../tenure-configuration.service';
import { ConfigurationMode } from 'src/app/program-setup/expense-configuration/enums/configuration-mode.enums';

@Component({
  selector: 'app-tenure-limit-create',
  templateUrl: './tenure-limit-create.component.html',
  styleUrls: ['./tenure-limit-create.component.scss']
})
export class TenureLimitCreateComponent implements OnInit {
  public hierarchies:any = null;
  defaultHierarchy: string[] = [];
  userAssociateHierarchy: string[] = [];
  public selections: Array<string> = [];
  public defaultSelections: Array<string> = [];
  public readonly configurationMode = ConfigurationMode;
  modulesSelectionLabel : string = "Select all";
  public request: any = {
    name: '',
    is_active: 1,
    credit_debit: { is_enabled: false },
    invoice_number: {
      code: '',
      start_from: '',

    },
    client_email: '',
    msp_email: '',
    rollback: false,
    vendor_rollback: false,
    voucher_number: {
      code: '',
      "type": 1,
      "start_from": ''
    },
    consecutive_employment_span: '',
    consecutive_employment_span_unit: '',
    is_tenure_extension_allowed: false,
    is_gap_between_assignments: false,
    consecutive_assignment_span: '',
    consecutive_assignment_span_unit:''
  };

  sourcingModel = [
    {
      label: 'Contingent',
      isSelected: false
    },
    {
      label: 'SOW',
      isSelected: false
    }
  ]
  
  approveList = [];

  modules = []
  hierarchyList: any = [];
  span = [
    {
      value: 'DAYS',
      label: 'DAYS'
    },
    {
      value: 'MONTHS',
      label: 'MONTHS'
    },
    {
      value: 'YEARS',
      label: 'YEARS'
    }
  ]

  updateStatus() {
    this.request.is_active = this.request.is_active === 1 ? 0 : 1;
  }

  sourcingModelChanged() {
    this.request.sourcing_model = this.sourcingModel.filter(a => a.isSelected).map(a => a.label)
  }

  onSave() {
    this.spinner.show();
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/configurator/programs/${currentProgram?.id}/tenures`;

    this.request = {...this.request, modules: this.modules.filter(m=> m.isSelected).map(m=> m.id), hierarchy_levels: this.defaultHierarchy}
    this.tenureConfigurationService.post(url, this.request)
      .subscribe({
        next: (response: any) => {
          this.router.navigate(['self-configuration/tenure-limit/config/list'])
          this.spinner.hide();
          
        }, error: (err: Error | any) => {
          this.alertService.error(errorHandler(err));
          this.spinner.hide();
        },
        complete : () =>{
          this.spinner.hide();
        }
      }
    );
  }

  constructor( private tenureConfigurationService: TenureConfigurationService,  
    private storageService: StorageService, private router: Router,
     private alertService: AlertService, private spinner: LoaderService) {
      }

  ngOnInit(): void {
    this.getModulesList();
    this.getApprovalGroup();
    this.getHierarchy();
  }

  selectAllModules() {
   this.modules.forEach(e => e.isSelected =  true);
   this.modulesSelectionLabel = "Unselect all";
  }
  unSelectAllModules() {
    this.modules.forEach(e => e.isSelected =  false);
   this.modulesSelectionLabel = "Select all";
  }

  getModulesList() {
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/configurator/programs/${currentprogram?.id}/modules`;
    this.tenureConfigurationService.get(url)
    .subscribe({
      next: (data: any) => {
        if (data?.modules) {
          this.modules = data?.modules.map(e => {e.isSelected =  false; return e});
        }
      },
      error: (err: Error) => {
      }
    }
    );
  }

  getHierarchy() {
    const currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = '/configurator/programs/' + currentprogram?.id + '/hierarchy'

    this.tenureConfigurationService.get(url)
    .subscribe((data: any) => {
      if(data?.result?.length > 0) {
        
        this.hierarchyList = data?.result;
        this.defaultHierarchy = [data.result[0].hierarchies[0].id];
      }
    });
  }

  hierarchySelectionChanged(event: Array<string>) {
    this.selections = event;
  if (this.selections.length && !this.defaultSelections.length) {
    this.defaultSelections = [this.selections[0]];
  }
}


  tenureApprovalChange(event) {
    this.request.tenure_extension_approval_group = event;
  }

  assignmentApprovalgroupChange(event) {
    this.request.assignment_gap_approval_group = event;
  }

  getApprovalGroup() {
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/approval/approval-config/programs?program_id=${currentprogram?.id}&module=ASSIGNMENTS`;
    this.tenureConfigurationService.get(url)
    .subscribe({
      next: (res: any) => {
        this.approveList =  res?.data?.map(d => {
          return {
            value: d?.id,
            label: d?.name,
            name: d?.name
          }
        })
      },
      error: (err: Error) => {
      }
    }
    );
  }


  tenureLengthChange(event) {
    this.request.consecutive_employment_span = event;
  }

  tenureSpanChange(event) {
    this.request.consecutive_employment_span_unit = event;
  }

  tenureToggleClicked() {
    this.request.is_tenure_extension_allowed = !this.request.is_tenure_extension_allowed
  }


  assignmentLengthChange(event) {
    this.request.consecutive_assignment_span = event;
   }

  assignmentSpanChange(event) { 
    this.request.consecutive_assignment_span_unit = event;
  }

  tenureAssignmentToggleClicked() { 
    this.request.is_gap_between_assignments = !this.request.is_gap_between_assignments
  }

}
