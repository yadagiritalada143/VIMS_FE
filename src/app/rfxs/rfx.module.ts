import { NgModule } from '@angular/core';
import { RFxRoutingModule } from './rfx-routing.module'
import { ListRFxComponent } from './lists/rfx.component';
import { CreateRFxComponent } from './create-rfx/rfx.component';
import { BidListComponent } from './bid-list/bid-list.component';

@NgModule({
    declarations: [ListRFxComponent, CreateRFxComponent, BidListComponent],
    imports: [
        RFxRoutingModule
    ],
})
export class RFxModule { }