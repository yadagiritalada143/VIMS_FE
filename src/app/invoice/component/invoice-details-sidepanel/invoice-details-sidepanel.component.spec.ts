import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceDetailsSidepanelComponent } from './invoice-details-sidepanel.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';

describe('InvoiceDetailsSidepanelComponent', () => {
  let component: InvoiceDetailsSidepanelComponent;
  let fixture: ComponentFixture<InvoiceDetailsSidepanelComponent>;
  CommonTestingModule.setUpTestBed(InvoiceDetailsSidepanelComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [DecimalPipe],
      declarations: [ InvoiceDetailsSidepanelComponent, AccuracyPipe ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceDetailsSidepanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
