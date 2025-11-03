import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ContractEndingWidgetComponent } from './contract-ending-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ActiveHeadcountWidgetComponent', () => {
    let component: ContractEndingWidgetComponent;
    let fixture: ComponentFixture<ContractEndingWidgetComponent>;
    CommonTestingModule.setUpTestBed(ContractEndingWidgetComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(ContractEndingWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
