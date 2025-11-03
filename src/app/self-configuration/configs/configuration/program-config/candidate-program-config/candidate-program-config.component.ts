import { Component, Injector, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { BaseProgramConfigComponent } from '../base/base-program-config.component';
import { ControlType } from '../program-config-control/program-config-control.model';
import * as _ from 'lodash';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';


@Component({
  selector: 'app-candidate-program-config',
  templateUrl: './candidate-program-config.component.html',
  styleUrls: ['./candidate-program-config.component.scss']
})
export class CandidateProgramConfigComponent extends BaseProgramConfigComponent implements OnInit {

  public mounted: boolean = false;
  public candidateIDFormatOptions: Array <any> = [
    { code: 'FN-MM-DD', description: 'FN-MM-DD' },
    { code: 'FF-MM-DD', description: 'FF-MM-DD' },
    { code: 'LL-MM-DD', description: 'LL-MM-DD' },
    { code: 'FF-MM-DD-XXX', description: 'FF-MM-DD-XXX' },
    { code: 'LL-MM-DD-XXX', description: 'LL-MM-DD-XXX' },
    { code: 'FF-DD-MM', description: 'FF-DD-MM' },
  ];

  constructor(
    public fb: UntypedFormBuilder, 
    protected injector: Injector,
    private programService: ProgramService,
    private storageService: StorageService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.createForm();
    this.isCountryDisabled();
  }

  setProgramConfig = () => {
    if(!this.mounted) {
      this.mounted = true;
      this.patchValue(_.cloneDeep(this.data?.value));
    }
    this.data.value = this.formGroup.value;
  }

  createForm() {
    this.formGroup = this.fb.group({
      'is_resume_mandatory': new UntypedFormControl(true, [Validators.required]),
      'is_country_mandatory': new UntypedFormControl(false, [Validators.required]),
      'is_state_national_id_mandatory': new UntypedFormControl(false, [Validators.required]),
      'is_candidate_image_hidden': new UntypedFormControl(false, [Validators.required]),
      'candidate_unique_id_format': new UntypedFormControl("FN-MM-DD"),
      'is_candidate_address': new UntypedFormControl(false, [Validators.required]),
      'is_candidate_education_required': new UntypedFormControl(false, [Validators.required])
    });
  }

  patchValue(data: any) {
    if(data) {
      let is_resume_mandatory: boolean = data?.candidate?.is_resume_mandatory ?? false;
      let is_country_mandatory: boolean = data?.candidate?.is_country_mandatory ?? false;
      let is_state_national_id_mandatory: boolean = data?.candidate?.is_state_national_id_mandatory ?? false;
      let is_candidate_image_hidden: boolean = data?.is_candidate_image_hidden ?? false;
      let candidate_unique_id_format: boolean = data?.candidate_unique_id_format ?? "FN-MM-DD";
      let is_candidate_address: boolean = data?.is_candidate_address ?? false;
      let is_candidate_education_required: boolean = data?.candidate?.is_candidate_education_required ?? false;

      this.formGroup.patchValue({
        is_country_mandatory,
        is_state_national_id_mandatory,
        is_candidate_image_hidden,
        candidate_unique_id_format,
        is_candidate_address,
        is_candidate_education_required,
        is_resume_mandatory
      });
    }
  }

  get ControlType() {
    return ControlType;
  }

  public countryDisabled: boolean = true;
  isCountryDisabled() {

    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/submission-manager/candidates?program_id=${programId}`;

    this.programService.get(url).subscribe({
      next: (data: any) => {
        if (data) {
          this.countryDisabled = !data?.total_records;
        }
      }, error: (err: any) => {
        this.countryDisabled = true;
        console.error(err);
      }
    });
  }
}
