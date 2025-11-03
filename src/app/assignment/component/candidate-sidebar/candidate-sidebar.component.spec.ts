import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CandidateSidebarComponent } from './candidate-sidebar.component';

describe('CandidateSidebarComponent', () => {
  let component: CandidateSidebarComponent;
  let fixture: ComponentFixture<CandidateSidebarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
