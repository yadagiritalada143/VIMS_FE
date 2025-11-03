import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReasonCodesComponent } from './reason-codes.component';

describe('ReasonCodesComponent', () => {
  let component: ReasonCodesComponent;
  let fixture: ComponentFixture<ReasonCodesComponent>;
  CommonTestingModule.setUpTestBed(ReasonCodesComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReasonCodesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReasonCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
