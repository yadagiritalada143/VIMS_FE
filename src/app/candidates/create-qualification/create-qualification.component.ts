import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';
import { CandidateService } from '../service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../shared/util/error-handler';
@Component({
  selector: 'app-create-qualification',
  templateUrl: './create-qualification.component.html'
})
export class CreateQualificationComponent implements OnInit {
  certifications = false;
  certificationDelete = false;
  credentials = false;
  specialization = false;
  vaccination = false;
  skills = false;
  education = false;
  viewMode = false;
  credentialsArr = [];
  credentialTypeId = '';
  certificationTypeId = '';
  vaccineTypeId = '';
  specialityTypeId = '';
  educationTypeId = '';
  skillTypeId = '';
  certificationsArr = [];
  educationArr = [];
  specialityArr = [];
  vaccinationsArr = [];
  skillsArr = [];
  constructor(
    private eventStream: EventStreamService,
    private candidateService: CandidateService,
    private alert: AlertService,
  ) { }

  @Output() CertificateAdded = new EventEmitter();
  @Output() CredentialsAdded = new EventEmitter();
  @Output() SpecializationAdded = new EventEmitter();
  @Output() VaccinationAdded = new EventEmitter();
  @Output() EducationAdded = new EventEmitter();
  @Output() SkillAdded = new EventEmitter();
  ngOnInit(): void {
    this.getQualifications();
  }
  openCertifications(){
    this.certifications = !this.certifications;
  }

  closeCertifications() {
    this.certificationDelete = true;
  }
  confirmCertificationDelete() {
    this.certifications = false;
    this.certificationDelete = false;
  }
  removeDialog() {
    this.certificationDelete = false;
  }
  openCredentials() {
    this.credentials = !this.credentials;
  }
  closeCredentials() {
    this.credentials = false;
  }
  openSpecialization() {
    this.specialization = !this.specialization;
  }
  closeSpecialization() {
    this.specialization = false;
  }
  openVaccination() {
    this.vaccination = !this.vaccination;
  }
  closeVaccination() {
    this.vaccination = false;
  }
  openSkills() {
    this.skills = !this.skills;
  }
  closeSkills() {
    this.skills = false;
  }
  openEducation() {
    this.education = !this.education;
  }
  closeEducation() {
    this.education = false;
  }

  addCredentials(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_CREDENTIAL, { obj: null, value: true }));
    }
  }

  addCertificate(event) {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_CERTIFICATION, {obj: null, value: true}))
    }
  }
  addSpecialization(event) {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_SPECIALIZATION, {obj: null, value: true}))
    }
  }
  addVaccination(event) {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_VACCINATOIN, {obj: null, value: true}))
    }
  }
  addSkills(event) {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_SKILLS, {obj: null, value: true}))
    }
  }

  addEducation(event) {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_EDUCATION, {obj: null, value: true}))
    }
  }

  getCredentialData(data) {
    this.CredentialsAdded.emit(data);
    if (data.isEdit) {
      this.credentialsArr[data.clickedIndex] = data.payload;
    } else {
      this.credentialsArr.push(data.payload);
    }
  }
  getCertificateData(data) {
    this.CertificateAdded.emit(data);
    if (data.isEdit) {
     this.certificationsArr[data.clickedIndex] = data.payload;
    } else {
      this.certificationsArr.push(data.payload);
    }
  }

  getSpecialityData(data) {
    this.SpecializationAdded.emit(data);
    if (data.isEdit) {
      this.educationArr[data.clickedIndex] = data.payload;
    } else {
      this.specialityArr.push(data.payload);
    }
  }

  getVaccineData(data) {
    this.VaccinationAdded.emit(data);
    if (data.isEdit) {
      this.vaccinationsArr[data.clickedIndex] = data.payload;
    } else {
      this.vaccinationsArr.push(data.payload);
    }
  }

  getSkillData(data) {
    this.SkillAdded.emit(data);
    if (data.isEdit) {
      this.skillsArr[data.clickedIndex] = data.payload;
    } else {
      this.skillsArr.push(data.payload);
    }
  }

  getEducationData(data) {
    this.EducationAdded.emit(data);

    if (data.isEdit) {
      this.educationArr[data.clickedIndex] = data.payload;
    } else {
      this.educationArr.push(data.payload);
    }
  }

  getQualifications(){
    this.candidateService.getQualifications().subscribe({
      next: (data: any) => {
      if(data){
        let qualificationArr = data.qualification_types;
        qualificationArr.filter((type) => {
          if (type.code == 'CERTIFICATION') {
            this.certificationTypeId = type.id;
          } else if (type.code == 'VACCINATION') {
            this.vaccineTypeId = type.id;
          } else if (type.code == 'CREDENTIAL') {
            this.credentialTypeId = type.id;
          } else if (type.code == 'SPECIALITY') {
            this.specialityTypeId = type.id;
          } else if (type.code == 'EDUCATION') {
            this.educationTypeId = type.id;
          } else if (type.code == 'SKILL') {
            this.skillTypeId = type.id;
          }
        });
      }
    }, 
    error: (err) => {
      this.alert.error(errorHandler(err));
    }})
  }

  editPanel(type, data, index) {
    data['clickedIndex'] = index;
    if (type == 'CERTIFICATION') {
      this.eventStream.emit(new EmitEvent(Events.EDIT_CANDIDATE_CERTIFICATION, { obj: data, value: true }));
    } else if (type == 'VACCINATION') {
      this.eventStream.emit(new EmitEvent(Events.EDIT_CANDIDATE_VACCINATOIN, { obj: data, value: true }));
    } else if (type == 'CREDENTIAL') {
      this.eventStream.emit(new EmitEvent(Events.EDIT_CANDIDATE_CREDENTIAL, { obj: data, value: true }));
    } else if (type == 'SPECIALITY') {
      this.eventStream.emit(new EmitEvent(Events.EDIT_CANDIDATE_SPECIALIZATION, { obj: data, value: true }));
    } else if (type == 'EDUCATION') {
      this.eventStream.emit(new EmitEvent(Events.EDIT_CANDIDATE_EDUCATION, { obj: data, value: true }));
    } else if (type == 'SKILL') {
      this.eventStream.emit(new EmitEvent(Events.EDIT_CANDIDATE_SKILLS, { obj: data, value: true }));
    }
  }
}
