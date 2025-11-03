import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateRateCardComponent } from './create-rate-card.component';

describe('CreateRateCardComponent', () => {
  let component: CreateRateCardComponent;
  let fixture: ComponentFixture<CreateRateCardComponent>;
  CommonTestingModule.setUpTestBed(CreateRateCardComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateRateCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateRateCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
