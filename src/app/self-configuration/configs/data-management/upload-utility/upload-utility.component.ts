import { Component, OnInit } from '@angular/core';
import {environment} from "src/environments/environment";

@Component({
  selector: 'app-upload-utility',
  templateUrl: './upload-utility.component.html',
  styleUrls: ['./upload-utility.component.scss']
})
export class UploadUtilityComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  navigateToSimplifyBridge = () => {
    window.open(environment.PLATFORM_BRIDGE_URL);
  }

}
