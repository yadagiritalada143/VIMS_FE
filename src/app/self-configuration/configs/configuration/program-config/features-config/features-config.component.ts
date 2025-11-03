import { Component, Injector, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { BaseProgramConfigComponent } from '../base/base-program-config.component';
import { ControlType, IProgramConfigurationControl } from '../program-config-control/program-config-control.model';
import * as _ from 'lodash';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';
import i18next from 'i18next';

@Component({
  selector: 'app-features-config',
  templateUrl: './features-config.component.html',
  styleUrls: ['./features-config.component.scss']
})
export class FeaturesConfigComponent extends BaseProgramConfigComponent implements OnInit {

  public mounted: boolean = false;
  public programControls: Array <IProgramConfigurationControl> = [];
  public dropdownItems : any = [{ value: 'days', name: 'Days' }, { value: 'months', name: 'Months' }, { value: 'years', name: 'Years' }]
  public userTypes: Array<{ code: any; description: string }> = [
    { code: 'client', description: 'Client' },
    { code: 'msp', description: 'MSP' },
    { code: 'vendor', description: 'Vendor' },
    { code: 'candidate', description: 'Candidate' },
  ];

  public tabularInputData: any = {
    headerColumns: [
      { description: "Key Parameter", inputDataField: "description" },
      { description: "Weighted %", inputDataField: "inputval" }
    ], 
    footerColumns: [
      { description: "Total" },
      { description: "inputvalTotal" }
    ], 
    inputData: [
      { code: "skills", description: "Skills", inputval: 20, type: ControlType.NUMERIC },
      { code: "labor_category", description: "Labor Category", inputval: 20, type: ControlType.NUMERIC },
      { code: "job_title", description: "Job Title", inputval: 20, type: ControlType.NUMERIC },
      { code: "education", description: "Education", inputval: 20, type: ControlType.NUMERIC },
      { code: "certification", description: "Certification", inputval: 20, type: ControlType.NUMERIC }
    ], 
    total: 100
  };

  constructor(
    private fb: UntypedFormBuilder, 
    private credentialingService: CredentialingService,
    protected injector: Injector
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.fillConfigData();
    this.createForm();
  }

  get ControlType() {
    return ControlType;
  }

  onToggleChange = (event) => {

    // if(!!this.formGroup?.get('enable_direct_sourcing').value) {
    //   this.formGroup.get('direct_sourcing_account_id')?.setValidators(Validators.required);
    // } else {
    //   this.formGroup.get('direct_sourcing_account_id')?.clearValidators();
    // }

    if(event.formControlName == 'candidate_matching_score' && this.formGroup.value.candidate_matching_score) {
      this.programControls.splice(12,0,
      {
        sequence:14,
        directoryIcon: true,
        subtitle: "Default Weighted %",
        description: "have the flexibility to adjust the weightage % on the given job.",
        type: ControlType.TABULARINPUT,
        formControlName: "candidate_weighted",
        dropDrownData: this.tabularInputData
      });
      this.formGroup?.get('candidate_weighted')?.setValue(this.tabularInputData.inputData)
    }

    if(event.formControlName == 'candidate_matching_score' && !this.formGroup.value.candidate_matching_score) {
      let findIndexWeightage = this.programControls.findIndex(x => x.formControlName == 'candidate_weighted')
      if(findIndexWeightage != -1) {
        this.programControls.splice(findIndexWeightage, 1);
        this.formGroup?.get('candidate_weighted')?.setValue([])
      }
    }

    if(event.formControlName == 'enable_direct_sourcing' && this.formGroup.value.enable_direct_sourcing) {
      for(let i=0; i < this.programControls.length; i++) {
        if(this.programControls[i]?.formControlName == "direct_sourcing_account_id") {
          delete this.programControls[i]
        }
      }

      this.programControls = this.programControls.filter(p => p)
      this.programControls.splice(10,0,{
        sequence:11,
        subtitle: 'Account ID',
        description: "It is Unique Identifier for Direct Souring Integration with the Program.",
        type: ControlType.TEXTBOX,
        formControlName: 'direct_sourcing_account_id',
        mandatePattern: /^[a-zA-Z0-9]+$/gm,
        isRequired: false,
        disabled: true
      });
    }

    if(event.formControlName == 'enable_direct_sourcing' && !this.formGroup.value.enable_direct_sourcing) {
      let findIndex = this.programControls.findIndex(x => x.formControlName == 'direct_sourcing_account_id')
      if(findIndex != -1) {
        const storedValue = this.formGroup.get('direct_sourcing_account_id')?.value;
        this.formGroup?.get('direct_sourcing_account_id')?.setValue(storedValue)
      }
    }

    if(event.formControlName == 'enable_data_subject_rights' && this.formGroup.value.enable_data_subject_rights) {
      for(let i=0; i < this.programControls.length; i++) {
        if(this.programControls[i]?.formControlName == "data_subject_rights_closed_assignments" || this.programControls[i]?.formControlName == "data_subject_rights_rejected_candidates") {
          delete this.programControls[i]
        }
      }
      this.programControls = this.programControls.filter(p => p)
      this.programControls.splice(5,0,{
        sequence:6,
        subtitle: 'Data Subject Rights for Closed Assignments',
        directoryIcon: true,
        description: "When enabled, system applies Data Subject Right Compliance for Closed Assginments.",
        type: ControlType.TOGGLE,
        formControlName: 'data_subject_rights_closed_assignments',
      });
      this.programControls.splice(7,0,{
        sequence:8,
        subtitle: 'Data Subject Rights for Rejected Candidates',
        directoryIcon: true,
        description: "When enabled, system applies Data Subject Right Compliance for Rejected Candidates.",
        type: ControlType.TOGGLE,
        formControlName: 'data_subject_rights_rejected_candidates',
      });
    }

    if(event.formControlName == 'enable_data_subject_rights' && !this.formGroup.value.enable_data_subject_rights) {
      let findIndexClosedAssignments = this.programControls.findIndex(x => x.formControlName == 'data_subject_rights_closed_assignments')
      if(findIndexClosedAssignments != -1) {
        this.programControls.splice(findIndexClosedAssignments, 1);
        this.formGroup?.get('data_subject_rights_closed_assignments')?.setValue(null)
      }

      let findIndexRejectedCandidates = this.programControls.findIndex(x => x.formControlName == 'data_subject_rights_rejected_candidates')
      if(findIndexRejectedCandidates != -1) {
        this.programControls.splice(findIndexRejectedCandidates, 1);
        this.formGroup?.get('data_subject_rights_rejected_candidates')?.setValue(null)
      }
    }

    if(this.formGroup.value.enable_data_subject_rights && event.formControlName == 'data_subject_rights_closed_assignments' && this.formGroup.value.data_subject_rights_closed_assignments) {
      let selectedValue = this.programControls?.filter(p => p.formControlName == 'threshold_closed_assignments')[0]?.selectedValue
      for(let i=0; i < this.programControls.length; i++) {
        if(this.programControls[i]?.formControlName == "threshold_closed_assignments") {
          delete this.programControls[i]
        }
      }
      this.programControls = this.programControls.filter(p => p)
      this.programControls.splice(6,0,{
        sequence:7,
        subtitle: 'Threshold for Closed Assignments',
        directoryIcon: true,
        subDirectoryIcon: true,
        selectedValue : selectedValue,
        isRequired : true,
        description: "When enabled, system anonymizes Closed Assignment's PII data after the defined threshold Period from Assignment closure date.",
        type: ControlType.NUMBERSELECTOPTION,
        formControlName: 'threshold_closed_assignments',
      });
      this.formGroup.get('threshold_closed_assignments')?.addValidators(Validators.required)
      this.formGroup.get('threshold_closed_assignments_option')?.addValidators(Validators.required)
      this.formGroup?.get('threshold_closed_assignments_option')?.setValue(selectedValue)
    }

    if((event.formControlName == 'data_subject_rights_closed_assignments' && !this.formGroup.value.data_subject_rights_closed_assignments) || !this.formGroup.value.enable_data_subject_rights) {
      let findIndexClosedAssignments = this.programControls.findIndex(x => x.formControlName == 'threshold_closed_assignments')
      if(findIndexClosedAssignments != -1) {
        this.programControls.splice(findIndexClosedAssignments, 1);
        this.formGroup.get('threshold_closed_assignments')?.removeValidators(Validators.required)
        this.formGroup.get('threshold_closed_assignments_option')?.removeValidators(Validators.required)
        this.formGroup?.get('threshold_closed_assignments')?.setValue(null)
        this.formGroup?.get('threshold_closed_assignments_option')?.setValue(null)
      }
    }

    if(this.formGroup.value.enable_data_subject_rights && event.formControlName == 'data_subject_rights_rejected_candidates' && this.formGroup.value.data_subject_rights_rejected_candidates) {
      let selectedValue = this.programControls?.filter(p => p.formControlName == 'threshold_for_rejected_candidates')[0]?.selectedValue
      for(let i=0; i < this.programControls.length; i++) {
        if(this.programControls[i]?.formControlName == "threshold_for_rejected_candidates") {
          delete this.programControls[i]
        }
      }
      this.programControls = this.programControls.filter(p => p)
      this.programControls.splice(8,0,{
        sequence:9,
        subtitle: 'Threshold for Rejected Candidates',
        directoryIcon: true,
        subDirectoryIcon: true,
        selectedValue : selectedValue,
        isRequired : true,
        dropDrownData: this.dropdownItems,
        description: "When enabled, system anonymizes Rejected Candidate's PII data after the defined threshold period from Candidate Rejection date.",
        type: ControlType.NUMBERSELECTOPTION,
        formControlName: 'threshold_for_rejected_candidates',
      });
      this.formGroup.get('threshold_for_rejected_candidates')?.addValidators(Validators.required)
      this.formGroup.get('threshold_for_rejected_candidates_option')?.addValidators(Validators.required)
      this.formGroup?.get('threshold_for_rejected_candidates_option')?.setValue(selectedValue)
    }

    if((event.formControlName == 'data_subject_rights_rejected_candidates' && !this.formGroup.value.data_subject_rights_rejected_candidates) || !this.formGroup.value.enable_data_subject_rights) {
      let findIndexClosedAssignments = this.programControls.findIndex(x => x.formControlName == 'threshold_for_rejected_candidates')
      if(findIndexClosedAssignments != -1) {
        this.programControls.splice(findIndexClosedAssignments, 1);
        this.formGroup.get('threshold_for_rejected_candidates')?.removeValidators(Validators.required)
        this.formGroup.get('threshold_for_rejected_candidates_option')?.removeValidators(Validators.required)
        this.formGroup?.get('threshold_for_rejected_candidates')?.setValue(null)
        this.formGroup?.get('threshold_for_rejected_candidates_option')?.setValue(null)
      }
    }

    this.programControls = this.programControls.sort((a, b) => a?.sequence - b?.sequence);
  };

  optionChanged(event, config) {
    this.programControls.filter(p => p.formControlName == config.formControlName)[0].selectedValue = event
    if(config.formControlName == 'threshold_closed_assignments') {
      this.formGroup?.get('threshold_closed_assignments_option')?.setValue(event)
    }
    if(config.formControlName == 'threshold_for_rejected_candidates') {
      this.formGroup?.get('threshold_for_rejected_candidates_option')?.setValue(event)
    }
    if(config.formControlName == 'candidate_weighted') {
      this.formGroup?.get('candidate_weighted')?.setValue(event)
    }
  }

  fillConfigData = () => {

    // this.programControls.push({
    //   sequence:1,
    //   title: 'Configuration',
    //   subtitle: 'Enable Account Code',
    //   description: "When enabled, the system will display the 'Account Code' admin object on the configuration screen.",
    //   type: ControlType.TOGGLE,
    //   formControlName: 'enable_account_code',
    // });

    this.programControls.push({
      sequence: 0,
      subtitle: 'Vendor Compliance Restriction Rule',
      description: 'When enabled, Vendor Compliance Restriction Rule can be defined through which selected Vendors can upload documents based on the defined Period and Document statuses.',
      type: ControlType.TOGGLE,
      formControlName: 'vendor_compliance_restriction_rule'
    });

    this.programControls.push({
      sequence: 1,
      subtitle: 'Manage Remote Workers',
      description: 'When enabled, the system will display a mandatory field upon candidate submittal called \'Remote Worker\' which is a Yes/No picklist. This field will follow the candidate through-out their journey within TalentIQ to the Offer and Assignment. Enabling this setting will also allow for Timesheet Configurations to base the \'Timesheet Type\' on the candidate\'s physical address rather than the Work Location.',
      type: ControlType.TOGGLE,
      formControlName: 'manage_remote_workers'
    });

    this.programControls.push({
      sequence:2,
      subtitle: 'Custom Invoice Report',
      description: "When enabled, the system should display the Custom Invoice Report for the Program in Reports.",
      type: ControlType.TOGGLE,
      formControlName: 'enable_custom_invoice_report',
    });

    this.programControls.push({
      sequence:3,
      subtitle: 'Accrual Report',
      description: "When enabled, the system should display the Accrual Report for the Program in Reports.",
      type: ControlType.TOGGLE,
      formControlName: 'enable_accrual_report',
    });

    this.programControls.push({
      sequence:4,
      subtitle: 'BWS Report',
      description: "When enabled, the system should display the BWS Report for the Program in Reports.",
      type: ControlType.TOGGLE,
      formControlName: 'enable_bws_report',
    });

    this.programControls.push({
      sequence:5,
      subtitle: 'Data Subject Rights',
      description: "When enabled, Data Subject Rights Compliance will be applicable for the Program.",
      type: ControlType.TOGGLE,
      formControlName: 'enable_data_subject_rights',
    });

    this.programControls.push({
      sequence:10,
      subtitle: 'Enable Direct sourcing',
      description: "When enabled, Direct Sourcing Business Model will be applicable for the Program.",
      type: ControlType.TOGGLE,
      formControlName: 'enable_direct_sourcing',
    });

    this.programControls.push({
      sequence: 11.25,
      subtitle: 'Enable Job Types',
      description: 'When enabled, Job Types can be defined to have different processes and settings such as driving Job templates, Custom fields, Onboarding items, Distribution list of suppliers, Approval Workflows etc.',
      type: ControlType.TOGGLE,
      formControlName: 'job_type'
    });

    this.programControls.push({
      sequence:12,
      subtitle: 'Candidate Matching Score',
      description: 'When enabled, the system will show the total matching score in the "Submitted Candidates" listing page on the job. The matching score results are based on the defined parameters and weighted percentages which will match candidate data against the job data.',
      type: ControlType.TOGGLE,
      formControlName: 'candidate_matching_score',
    });

    this.programControls.push({
      sequence:13,
      subtitle: i18next.t("credentialing_feature_subtitle"),
      description: i18next.t("credentialing_feature_description"),
      type: ControlType.TOGGLE,
      formControlName: 'credentialing',
      hidden: !this.credentialingService.globalLaunchFlagEnable()
    });
  };

  createForm = () => {
    this.formGroup = this.fb?.group({
      job_type: [false, [Validators.required]],
      enable_account_code: [false, [Validators.required]],
      enable_custom_invoice_report: [false, [Validators.required]],
      enable_accrual_report: [false, [Validators.required]],
      enable_bws_report: [false, [Validators.required]],
      enable_data_subject_rights: [false, [Validators.required]],
      data_subject_rights_closed_assignments: [false, []],
      data_subject_rights_rejected_candidates: [false, []],
      threshold_closed_assignments: [null, []],
      threshold_closed_assignments_option: [null, []],
      threshold_for_rejected_candidates: [null, []],
      threshold_for_rejected_candidates_option: [null, []],
      enable_direct_sourcing: [false, [Validators.required]],
      direct_sourcing_account_id: [null],
      candidate_matching_score: [true, []],
      candidate_user_types:[null],
      candidate_weighted:[[]],
      manage_remote_workers: [false],
      vendor_compliance_restriction_rule: [false],
      credentialing: [false, [Validators.required]],
    });
  };

  setProgramConfig = () => {
    if(!this.mounted) {
      this.mounted = true;
      this.patchValue(_.cloneDeep(this.data?.value));
    }
    this.data.value = this.formGroup.value;
  }

  patchValue(data: any) {
    if(data) {
      if(data?.direct_sourcing?.enabled) {
        this.programControls.splice(10,0,{
          sequence:11,
          subtitle: 'Account ID',
          description: "It is Unique Identifier for Direct Souring Integration with the Program.",
          type: ControlType.TEXTBOX,
          formControlName: 'direct_sourcing_account_id',
          mandatePattern: /^[a-zA-Z0-9]+$/gm,
          isRequired: false,
          disabled: true
        });
      }
      if(data?.candidate_matching_score?.is_enabled) {
        this.tabularInputData.inputData.forEach(element => {
          element.inputval = data?.candidate_matching_score.key_parameters[element.code]
        });

        this.programControls.splice(12,0,
        {
          sequence:14,
          directoryIcon: true,
          subtitle: "Default Weighted %",
          description: "have the flexibility to adjust the weightage % on the given job.",
          type: ControlType.TABULARINPUT,
          formControlName: "candidate_weighted",
          dropDrownData: this.tabularInputData
        });
      }
      if(data?.data_subject_rights?.enabled) {
        this.programControls.splice(5,0,{
          sequence:6,
          subtitle: 'Data Subject Rights for Closed Assignments',
          directoryIcon: true,
          description: "When enabled, system applies Data Subject Right Compliance for Closed Assginments.",
          type: ControlType.TOGGLE,
          formControlName: 'data_subject_rights_closed_assignments',
        });
        this.programControls.splice(7,0,{
          sequence:8,
          subtitle: 'Data Subject Rights for Rejected Candidates',
          directoryIcon: true,
          description: "When enabled, system applies Data Subject Right Compliance for Rejected Candidates.",
          type: ControlType.TOGGLE,
          formControlName: 'data_subject_rights_rejected_candidates',
        });
      }

      let assignments_unit_of_threshold;

      for(let key in data?.data_subject_rights?.closed_assignments?.unit_of_threshold){
        if(data?.data_subject_rights?.closed_assignments?.unit_of_threshold[key] === true){
          assignments_unit_of_threshold = key;
          break;
        }
      }

      let candidates_unit_of_threshold

      for(let key in data?.data_subject_rights?.rejected_candidates?.unit_of_threshold){
        if(data?.data_subject_rights?.rejected_candidates?.unit_of_threshold[key] === true){
          candidates_unit_of_threshold = key;
          break;
        }
      }

      if(data?.data_subject_rights?.enabled && data?.data_subject_rights?.closed_assignments?.enabled) {
        this.programControls.splice(6,0,{
          sequence:7,
          subtitle: 'Threshold for Closed Assignments',
          directoryIcon: true,
          subDirectoryIcon: true,
          selectedValue : assignments_unit_of_threshold,
          isRequired : true,
          description: "When enabled, system anonymizes Closed Assignment's PII data after the defined threshold Period from Assignment closure date.",
          type: ControlType.NUMBERSELECTOPTION,
          dropDrownData: this.dropdownItems,
          formControlName: 'threshold_closed_assignments',
        });
        this.formGroup.get('threshold_closed_assignments')?.addValidators(Validators.required)
        this.formGroup.get('threshold_closed_assignments_option')?.addValidators(Validators.required)
        this.formGroup?.get('threshold_closed_assignments_option')?.setValue(assignments_unit_of_threshold)
      }

      if(data?.data_subject_rights?.enabled && data?.data_subject_rights?.rejected_candidates?.enabled) {
        this.programControls.splice(8,0,{
          sequence:9,
          subtitle: 'Threshold for Rejected Candidates',
          directoryIcon: true,
          subDirectoryIcon: true,
          selectedValue : candidates_unit_of_threshold,
          isRequired : true,
          description: "When enabled, system anonymizes Rejected Candidate's PII data after the defined threshold period from Candidate Rejection date.",
          type: ControlType.NUMBERSELECTOPTION,
          formControlName: 'threshold_for_rejected_candidates',
        });
        this.formGroup.get('threshold_for_rejected_candidates')?.addValidators(Validators.required)
        this.formGroup.get('threshold_for_rejected_candidates_option')?.addValidators(Validators.required)
        this.formGroup?.get('threshold_for_rejected_candidates_option')?.setValue(candidates_unit_of_threshold)
      }
      this.programControls = this.programControls.sort((a, b) => a?.sequence - b?.sequence);
      const enable_bws_report: boolean = data?.report?.bws_report ?? false;
      const enable_account_code: boolean = data?.account_code?.enabled ?? false;
      const enable_accrual_report: boolean = data?.report?.accrual_report ?? false;
      const enable_custom_invoice_report: boolean = data?.report?.custom_invoice_report ?? false;
      const enable_direct_sourcing : any = data?.direct_sourcing?.enabled ? true : false
      const direct_sourcing_account_id : any = data?.direct_sourcing?.account_id;

      const enable_data_subject_rights: any = data?.data_subject_rights?.enabled ? true : false;
      const data_subject_rights_closed_assignments: any = data?.data_subject_rights?.closed_assignments?.enabled ? true : false;
      const data_subject_rights_rejected_candidates: any = data?.data_subject_rights?.rejected_candidates?.enabled ? true : false;
      const threshold_closed_assignments: any = data?.data_subject_rights?.closed_assignments?.threshold;
      const threshold_closed_assignments_option: any = assignments_unit_of_threshold;
      const threshold_for_rejected_candidates: any = data?.data_subject_rights?.rejected_candidates?.threshold ;
      const threshold_for_rejected_candidates_option: any = candidates_unit_of_threshold;
      const manage_remote_workers: any = data?.manage_remote_workers || false;
      const candidate_matching_score: any = data?.candidate_matching_score?.is_enabled ? true : false;
      const candidate_weighted:any = data?.candidate_matching_score?.is_enabled ? this.tabularInputData.inputData : []
      const vendor_compliance_restriction_rule: boolean = data?.vendor_compliance_restriction_rule?.is_allow || false;
      const job_type: boolean = data?.job_type || false;
      const credentialing: boolean = data?.credentialing || false;

      this.formGroup.patchValue({
        enable_account_code,
        enable_accrual_report,
        enable_bws_report,
        enable_custom_invoice_report,
        enable_direct_sourcing,
        direct_sourcing_account_id,
        enable_data_subject_rights,
        data_subject_rights_closed_assignments,
        data_subject_rights_rejected_candidates,
        threshold_closed_assignments,
        threshold_closed_assignments_option,
        threshold_for_rejected_candidates,
        threshold_for_rejected_candidates_option,
        manage_remote_workers,
        candidate_matching_score,
        candidate_weighted,
        vendor_compliance_restriction_rule,
        job_type,
        credentialing
      });
    }
  }
}
