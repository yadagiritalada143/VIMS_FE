import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsDialogComponent } from './svms-dialog.component';

describe('SvmsDialogComponent', () => {
  let component: SvmsDialogComponent;
  let fixture: ComponentFixture<SvmsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
