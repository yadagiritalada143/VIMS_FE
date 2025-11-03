import { Component, OnInit, Input,Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-create-background-check',
  templateUrl: './create-background-check.component.html',
  styleUrls: ['./create-background-check.component.scss']
})
export class CreateBackgroundCheckComponent implements OnInit {
  createBackgroundCheckForm: UntypedFormGroup;
  submitted = false;


  @Input() isCreateCandidate = 'hidden';
  @Output() onCreateClose = new EventEmitter(); 
  @Output() createdCandidate = new EventEmitter()

  constructor(private formBuilder: UntypedFormBuilder,) { }
  get f() { return this.createBackgroundCheckForm.controls; }

  ngOnInit(): void {
    this.createBackgroundCheckForm = this.formBuilder.group({ 
      title: ['', Validators.required],
      description: ['', Validators.required],
   
    }); 
    
  }
  sidebarClose() {
    this.onCreateClose.emit(this.isCreateCandidate = 'hidden');
    // this.createCandidateForm.reset();
    // this.submitted = false;

  }
  saveCandidate() {
    this.submitted = true;
    if (this.createBackgroundCheckForm.invalid) {
      // this._alert.error(`Mandatory fields are not entered`);
      return;
    } else {  
      this.createdCandidate.emit(this.createBackgroundCheckForm.value); 
        this.sidebarClose(); 
      
      this.submitted = false;
      this.createBackgroundCheckForm.reset();
    }
  }
}
