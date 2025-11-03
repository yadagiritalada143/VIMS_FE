import { Component, Input, OnInit } from '@angular/core';
import { CryptoService } from 'src/app/core/services/crypto.service';

@Component({
  selector: 'app-resume-details',
  templateUrl: './resume-details.component.html',
  styleUrls: ['./resume-details.component.scss']
})
export class ResumeDetailsComponent implements OnInit {

  candidateData: any;
  public isLoading: boolean = true;
  resumeURL:any;
  @Input() public set data(data: any) {
    this.candidateData = data.candidate;
    this.resumeURL = this.cryptoService?.decrypt(this.candidateData?.resume_url);
    if(this.candidateData){
      this.isLoading = false;
    }
  }
  constructor(
    private cryptoService: CryptoService
  ) { }

  ngOnInit(): void {
    if(this.candidateData){
      this.resumeURL = this.cryptoService?.decrypt(this.candidateData?.resume_url);
    }
  }

}
