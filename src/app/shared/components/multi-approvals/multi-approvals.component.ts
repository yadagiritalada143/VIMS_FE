import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-multi-approvals',
  templateUrl: './multi-approvals.component.html',
  styleUrls: ['./multi-approvals.component.scss']
})
export class MultiApprovalsComponent implements OnInit {
  accordionItem: number = 1
  constructor() { }

  ngOnInit(): void {
  }
  showAccordion(value) {
    this.accordionItem = value
  }
}
