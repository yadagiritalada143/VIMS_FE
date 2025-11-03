import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceDetailsPageComponent } from './invoice-details-page.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';

describe('InvoiceDetailsPageComponent', () => {
  let component: InvoiceDetailsPageComponent;
  let fixture: ComponentFixture<InvoiceDetailsPageComponent>;
  CommonTestingModule.setUpTestBed(InvoiceDetailsPageComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [DecimalPipe],
      declarations: [ InvoiceDetailsPageComponent, AccuracyPipe ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
