import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsDialogBodyComponent } from './svms-dialog-body.component';

describe('SvmsDialogBodyComponent', () => {
  let component: SvmsDialogBodyComponent;
  let fixture: ComponentFixture<SvmsDialogBodyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsDialogBodyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsDialogBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
