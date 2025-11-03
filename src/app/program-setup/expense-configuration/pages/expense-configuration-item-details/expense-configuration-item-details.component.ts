import {Component, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ExpenseConfigurationRoutes } from '../../enums/expense-configuration.enums';

@Component({
  selector: 'app-expense-configuration-item-details',
  templateUrl: './expense-configuration-item-details.component.html',
  styleUrls: ['./expense-configuration-item-details.component.scss']
})
export class ExpenseConfigurationItemDetailsComponent implements OnInit {
  public configId: string;
  public viewStatus: string;
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: SvmsRouterService,
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(({ config_uuid, status }) => {
      this.configId = config_uuid;
      this.viewStatus = status;
    });
  }

  public navigateToList() {
    this.router.navigate([
      `${ExpenseConfigurationRoutes.Root}`,
      `${ExpenseConfigurationRoutes.List}`
    ]);
  }

}
