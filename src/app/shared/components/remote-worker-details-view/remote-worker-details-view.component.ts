import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-remote-worker-details-view',
  templateUrl: './remote-worker-details-view.component.html',
  styleUrls: ['./remote-worker-details-view.component.scss']
})
export class RemoteWorkerDetailsViewComponent implements OnInit {

  @Input() remoteWorkerDetails:any;
  @Input() showRemoteWorkerDetails:boolean = true;
  constructor() { }

  ngOnInit(): void {
  }

}
