import { Component, OnInit , Input } from '@angular/core';
import {JobsService} from '../../jobs.service';
@Component({
  selector: 'app-market-rate',
  templateUrl: './market-rate.component.html',
  styleUrls: ['./market-rate.component.scss']
})
export class MarketRateComponent implements OnInit {
  public rateCard: any;
  public rateDetails: any ;
  @Input() jobData;
 @Input() selectedTemplate;
//  @Input() rateCardData;
 @Input() set rateCardData(data: any) {
    if(data) {
      this.rateDetails = JSON.parse(JSON.stringify(data))
      this.rateCardDetails();
    }


  }
  constructor(private _jobService: JobsService) { }

  ngOnInit(): void {
    this.rateCardDetails();
  }

  rateCardDetails(){
    let url = `/job-manager/talentneuron${this.rateDetails?.id ? ('?ratecard_id=' + this.rateDetails?.id) : ''}`

    this._jobService.get(url).subscribe(data => {
      this.rateCard = data.results[0];
    })
  }
}

