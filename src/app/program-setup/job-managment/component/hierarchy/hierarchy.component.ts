import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-hierarchy',
  templateUrl: './hierarchy.component.html',
  styleUrls: ['./hierarchy.component.scss']
})
export class HierarchyComponent implements OnInit {
  hirerachyLvlList: any;
  selectedHierarchy: string[] = []

  constructor() { }

  ngOnInit(): void {
  }

  selectHierarchy(event){

  }

}
