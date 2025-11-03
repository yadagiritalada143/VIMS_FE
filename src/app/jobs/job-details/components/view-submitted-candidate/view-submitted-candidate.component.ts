import { Component, OnDestroy, OnInit } from '@angular/core';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-view-submitted-candidate',
  templateUrl: './view-submitted-candidate.component.html',
  styleUrls: ['./view-submitted-candidate.component.scss']
})
export class ViewSubmittedCandidateComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  viewCandidateProfile = "hidden";
  qualificationTypeName: any;
  public certificationsArr = [];
  public vaccinationsArr = [];
  public credentialsArr = [];
  public specialityArr = [];
  public educationArr = [];
  public skillsArr = [];
  basicInfo;
  constructor(
    private eventStream: EventStreamService,
    private candidateService: CandidateService,
    private _alert: AlertService,
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.VIEW_SUBMITTED_CANDIDATE_PROFILE).subscribe((data) => {
      if (data.value) {
        this.viewCandidateProfile = 'visible';
        this.getCandidateDetailsById(data.value.id);
      } else {
        this.viewCandidateProfile = 'hidden';
      }
    }));
  }
  sidebarClose() {
    this.certificationsArr = [];
    this.vaccinationsArr = [];
    this.credentialsArr = [];
    this.specialityArr = [];
    this.educationArr = [];
    this.skillsArr = [];
    this.viewCandidateProfile = 'hidden';
  }
  getCandidateDetailsById(id) {
    this.subscriptions.push(this.candidateService.getCandidateDetail(id).subscribe({
      next: (data: any) => {
      this.basicInfo = data.candidate;
      if (data.candidate.qualifications.length) {
        data.candidate.qualifications.filter((qItem) => {
          if (qItem.qualification_type) {
            this.getTypeName(qItem);
          }
        })
      }
    },
      error: error => {
        this._alert.error(errorHandler(error));
      }}));
  }
  getTypeName(qItem) {

          this.qualificationTypeName = qItem.qualification_name;
           
          if (qItem.qualification_type.code == 'CERTIFICATION') {
            qItem['certification_name'] = this.qualificationTypeName;
            delete qItem.qualification_type;
            this.certificationsArr.push(qItem);
          } else if (qItem.qualification_type.code == 'VACCINATION') {
            qItem['vaccine_name'] = this.qualificationTypeName;
            delete qItem.qualification_type;
            this.vaccinationsArr.push(qItem);
          } else if (qItem.qualification_type.code == 'CREDENTIAL') {
            qItem['credential_name'] = this.qualificationTypeName;
            delete qItem.qualification_type;
            this.credentialsArr.push(qItem);
          } else if (qItem.qualification_type.code == 'SPECIALITY') {
            qItem['speciality_name'] = this.qualificationTypeName;
            delete qItem.qualification_type;
            this.specialityArr.push(qItem);
          } else if (qItem.qualification_type.code == 'EDUCATION') {
            qItem['education_name'] = this.qualificationTypeName;
            delete qItem.qualification_type;
            this.educationArr.push(qItem);
          } 
          else if (qItem.qualification_type.code == 'SKILL') {
            qItem['skill_name'] = this.qualificationTypeName;
            delete qItem.qualification_type;
            this.skillsArr.push(qItem);
          }
  }
  downloadResume() {
    if (this.basicInfo.raw_resume) {
      const linkSource = this.basicInfo.raw_resume;
      const downloadLink = document.createElement("a");
      const fileName = this.basicInfo.resume;
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    }
    else {
      this._alert.error(`No resume found for this candidate.`);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
