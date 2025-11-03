import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-assignment-overlap-warning',
  templateUrl: './assignment-overlap-warning.component.html',
  styleUrls: ['./assignment-overlap-warning.component.scss']
})
export class AssignmentOverlapWarningComponent implements OnInit {

  @Input() showWarning: boolean;
  @Input() assignmentData = [];
  @Output() onWarningClose = new EventEmitter();
  constructor() { }

  ngOnInit(): void {
  }

  onClose(){
    this.onWarningClose.emit();
  }  

}
