import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreditDebitComponent } from './credit-debit.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreditDebitComponent', () => {
  let component: CreditDebitComponent;
  let fixture: ComponentFixture<CreditDebitComponent>;
  CommonTestingModule.setUpTestBed(CreditDebitComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreditDebitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditDebitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
