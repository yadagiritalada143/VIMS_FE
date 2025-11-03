import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-add-new-user',
  templateUrl: './add-new-user.component.html',
  styleUrls: ['./add-new-user.component.scss']
})
export class AddNewUserComponent implements OnInit {
  is_active = false;
  createUser = "hidden";
  showsidebar() {
    this.createUser = "visible";
  }

  sidebarClose() {
    this.createUser = "hidden";
  }

  constructor() { }

  ngOnInit(): void {
  }

}
