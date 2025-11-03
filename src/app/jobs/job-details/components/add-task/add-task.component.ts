import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss']
})
export class AddTaskComponent implements OnInit {
  @Input() visiblity = 'visible';
  constructor() { }

  ngOnInit(): void {
  }

}
