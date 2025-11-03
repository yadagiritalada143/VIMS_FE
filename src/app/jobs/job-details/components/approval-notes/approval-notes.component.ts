import { Component, Input, OnInit,} from '@angular/core';

@Component({
  selector: 'app-approval-notes',
  templateUrl: './approval-notes.component.html',
  styleUrls: ['./approval-notes.component.scss']
})
export class ApprovalNotesComponent implements OnInit {
  @Input() visiblity = 'visible';
 

  constructor() { }

  ngOnInit(): void {
  }

 

}
