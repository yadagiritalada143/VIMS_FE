import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceConfigurationComponent } from './invoice-configuration.component';

describe('InvoiceConfigurationComponent', () => {
  let component: InvoiceConfigurationComponent;
  let fixture: ComponentFixture<InvoiceConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
