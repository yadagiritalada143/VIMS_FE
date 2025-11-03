import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SubmittedDetailsComponent } from './submitted-details.component';

describe('SubmittedDetailsComponent', () => {
  let component: SubmittedDetailsComponent;
  let fixture: ComponentFixture<SubmittedDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmittedDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmittedDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
