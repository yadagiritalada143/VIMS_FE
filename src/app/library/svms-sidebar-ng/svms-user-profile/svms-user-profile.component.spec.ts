import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsUserProfileComponent } from './svms-user-profile.component';

describe('SvmsUserProfileComponent', () => {
  let component: SvmsUserProfileComponent;
  let fixture: ComponentFixture<SvmsUserProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsUserProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsUserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
