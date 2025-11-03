import { Component, OnInit } from '@angular/core';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';

@Component({
  selector: 'app-no-program',
  templateUrl: './no-program.component.html',
  styleUrls: ['./no-program.component.scss']
})
export class NoProgramComponent implements OnInit {

  constructor(private router: SvmsRouterService) { }

  ngOnInit(): void {
  }
  onclickButton(){
    this.router.navigate(['programs', 'create']);
  }

}
