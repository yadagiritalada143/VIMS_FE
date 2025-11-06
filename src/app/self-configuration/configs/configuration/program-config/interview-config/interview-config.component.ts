import { Component, Injector, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { BaseProgramConfigComponent } from '../base/base-program-config.component';
import { ControlType, IProgramConfigurationControl } from '../program-config-control/program-config-control.model';
import * as _ from 'lodash';

@Component({
  selector: 'app-interview-config',
  templateUrl: './interview-config.component.html',
  styleUrls: ['./interview-config.component.scss']
})
export class InterviewConfigComponent extends BaseProgramConfigComponent implements OnInit {

  public mounted: boolean = false;
  public programControls: Array <IProgramConfigurationControl> = [];

  constructor(private fb: UntypedFormBuilder, protected injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.fillConfigData();
    this.createForm();
  }

  setProgramConfig = () => {
    if(!this.mounted) {
      this.mounted = true;
      this.patchValue(_.cloneDeep(this.data?.value));
    }
    this.data.value = this.formGroup.value;
  }

  get ControlType() {
    return ControlType;
  }

  fillConfigData = () => {
    
    // ‘Virtual’ Interview Type
    this.programControls.push({
      subtitle: 'Required "Virtual" Interview Link',
      description: 'When enabled, the field "Link" presented after selecting "Virtual" as the interview type will be mandatory.',
      type: ControlType.TOGGLE,
      formControlName: 'is_interview_virtual_link',
    });

    // Enable Outlook Integration
    this.programControls.push({
      subtitle: "Enable Outlook Integration",
      description: "When enabled, the system will show the available timeslot(s) for each Interviewer selected based on what is available within that Interviewer's Outlook calendar.",
      type: ControlType.TOGGLE,
      formControlName: 'is_outlook_disabled',
    });

    this.programControls.push({
      subtitle: "Work Location Master",
      description: 'When enabled, the system will show the interview scheduler an additional field called "Location Type" when they select "In Person" as the "Interview Type".  This "Location Type" field will then have options of either "Work Location" or "Other Location".  Selecting "Work Location" will provide the option to select a value from the Program\'s work location master while selecting "Other Location" will display a free-form text field.',
      type: ControlType.TOGGLE,
      formControlName: 'is_work_location_master_enabled',
    });

    this.programControls.push({
      subtitle: "Allow External Attendees",
      description: 'When enabled, the system will display an additional field to the interview scheduler called "Additional Attendees" to enter email addresses of interviewers who all non-TalentIQ users.  Any email addresses entered here will NOT be given TalentIQ system access.',
      type: ControlType.TOGGLE,
      formControlName: 'is_additional_attendees_from_out_organization',
    });

  }

  createForm = () => {
    this.formGroup = this.fb.group({
      is_interview_virtual_link: [false, [Validators.required]],
      is_outlook_disabled: [false, [Validators.required]],
      is_additional_attendees_from_out_organization: [false, [Validators.required]],
      is_work_location_master_enabled: [false, [Validators.required]]
    });
  };

  patchValue(data: any) {
    if(data) {
      
      let is_interview_virtual_link: boolean = data?.interview?.is_interview_virtual_link ?? false;
      let is_outlook_disabled: boolean = data?.submission?.is_outlook_disabled ?? false;
      let is_additional_attendees_from_out_organization: boolean = data?.interview?.is_additional_attendees_from_out_organization ?? false;
      let is_work_location_master_enabled: boolean = data?.interview?.is_work_location_master_enabled ?? false;

      this.formGroup.patchValue({
        is_interview_virtual_link,
        is_outlook_disabled,
        is_additional_attendees_from_out_organization,
        is_work_location_master_enabled
      });
    }
  }
}
