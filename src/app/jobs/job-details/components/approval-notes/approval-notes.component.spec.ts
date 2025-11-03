import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ApprovalNotesComponent } from './approval-notes.component';

describe('ApprovalNotesComponent', () => {
  let component: ApprovalNotesComponent;
  let fixture: ComponentFixture<ApprovalNotesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ApprovalNotesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovalNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
