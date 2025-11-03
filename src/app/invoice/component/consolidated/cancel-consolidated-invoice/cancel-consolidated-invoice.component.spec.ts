import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelConsolidatedInvoiceComponent } from './cancel-consolidated-invoice.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CancelConsolidatedInvoiceComponent', () => {
  let component: CancelConsolidatedInvoiceComponent;
  let fixture: ComponentFixture<CancelConsolidatedInvoiceComponent>;
  CommonTestingModule.setUpTestBed(CancelConsolidatedInvoiceComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CancelConsolidatedInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
