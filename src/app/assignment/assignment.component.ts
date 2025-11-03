import { Component, OnInit, ViewChild } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';


@Component({
  selector: 'app-assignment',
  template: `<router-outlet></router-outlet>`
})
export class AssignmentComponent implements OnInit {
  createAssignmentForm: UntypedFormGroup;

  @ViewChild('searchUser') searchUser: NgSelectComponent;
  @ViewChild('dateFiled') svmsDatePicker: SvmsDatepickerComponent;

  constructor(private fb: UntypedFormBuilder) { }

  ngOnInit(): void {

    this.createAssignmentForm = this.fb.group({

    });

  }

}
