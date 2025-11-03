import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsDialogHeaderComponent } from './svms-dialog-header.component';

describe('SvmsDialogHeaderComponent', () => {
  let component: SvmsDialogHeaderComponent;
  let fixture: ComponentFixture<SvmsDialogHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsDialogHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsDialogHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
