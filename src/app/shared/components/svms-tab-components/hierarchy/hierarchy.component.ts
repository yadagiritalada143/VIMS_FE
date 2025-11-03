import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-hierarchy',
  templateUrl: './hierarchy.component.html',
  styleUrls: ['./hierarchy.component.scss']
})
export class HierarchyComponent implements OnInit {
  levelActive = false;

  constructor() { }

  ngOnInit(): void {
  }

  levelSelection() {
    this.levelActive = !this.levelActive; 
  }
}
