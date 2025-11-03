import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-no-data',
  templateUrl: './no-data.component.html',
  styleUrls: ['./no-data.component.scss'],
})
export class NoDataComponent implements OnInit {
  @Input() noDataJson;
  @Output() clickOnNext? = new EventEmitter();
  @Output() createOffer?: EventEmitter<any> = new EventEmitter();
  @Input() canCreateOffer?: boolean = true;
  @Input() jobStatus;
  constructor(private router: Router) {}

  ngOnInit(): void {}
  onClickNext() {
    this.clickOnNext.emit(true);
  }

  openCreateOfferSidebar() {
    this.createOffer.emit(true);
  }
  editProfileButton(candidate, job_id, reference_page) {
    if (job_id && reference_page) {
      this.router.navigate([`candidates/edit/${candidate}`], {
        queryParams: { job_id: job_id, reference_page: reference_page },
      });
    } else {
      this.router.navigate([`candidates/edit/${candidate}`]);
    }
  }
}
