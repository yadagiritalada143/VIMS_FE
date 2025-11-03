import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ClonerService } from '../core/services/cloner.service';

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.scss']
})
export class OrganizationsComponent implements OnInit, AfterViewInit{

  organizations: any = [];
  showCreateForm = false;
  constructor(private cloner : ClonerService) {
    this.organizations.push({
      name: 'Viacom', address: '25 South Hill'
    });
    this.organizations.push({
      name: 'Citi Bank', address: '25 South Hill'
    });
   }

  ngOnInit(): void {

  }


  ngAfterViewInit() {
    // this.organizations = this.cloner.deepClone(this.organizations);
  }

  createOrganization() {
    this.showCreateForm = true;
  }

  onOrgCreated(org) {
    this.organizations.push(org);
    this.organizations = this.cloner.deepClone(this.organizations);
  }

}
