import { Component, Input} from '@angular/core';
import {IServerErrorItem} from '../../../../../program-setup/expense-configuration/models/add-expense-type.model';

@Component({
  selector: 'app-server-error',
  templateUrl: './server-error.component.html',
  styleUrls: ['./server-error.component.scss'],
})
export class ServerErrorComponent {
  @Input() data: Array<IServerErrorItem>;
  @Input() fieldName: string;
}
