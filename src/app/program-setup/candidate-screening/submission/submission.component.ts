import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-submission',
  templateUrl: './submission.component.html',
  styleUrls: ['./submission.component.scss'],
})
export class SubmissionComponent implements OnInit {
  isSubmission: any;
  isRehire: any;
  programID: any;
  payload: any = {};
  currentProgram: any;

  constructor(
    private alert: AlertService,
    private httpService: HttpService, 
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programID = this.currentProgram.id;
    this.isSubmission = this.currentProgram.config?.is_candidate_address;
    this.isRehire = this.currentProgram.config?.is_rehire_approval_required;
  }

  onChange(event) {
    const dataPayload = [];
    const payload = {};
    payload['is_candidate_address'] = event;
    dataPayload.push(payload);
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res: any) => {
      if (res) {
        this.currentProgram.config.is_candidate_address = event;
        this.storageService.set('CurrentProgram', this.currentProgram, true);
      }
    });
  }

  onChangeRehire(event) {
    const dataPayload = [];
    const payload = {};
    payload['is_rehire_approval_required'] = event;
    dataPayload.push(payload);
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res: any) => {
      if (res) {
        this.currentProgram.config.is_rehire_approval_required = event;
        this.storageService.set('CurrentProgram', this.currentProgram, true);
        this.alert.success('Settings updated successfully.');
      }
    });
  }
}
