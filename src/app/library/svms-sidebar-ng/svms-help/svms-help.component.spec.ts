import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsHelpComponent } from './svms-help.component';

describe('SvmsHelpComponent', () => {
  let component: SvmsHelpComponent;
  let fixture: ComponentFixture<SvmsHelpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsHelpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
