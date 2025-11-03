import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsDialogFooterComponent } from './svms-dialog-footer.component';

describe('SvmsDialogFooterComponent', () => {
  let component: SvmsDialogFooterComponent;
  let fixture: ComponentFixture<SvmsDialogFooterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsDialogFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsDialogFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
